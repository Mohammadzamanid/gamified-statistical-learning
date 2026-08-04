/**
 * S2-01: region-completion achievements, exercised through the real systems.
 *
 * Nothing here hand-writes lesson progress: every lesson is finished by answering
 * its questions through the actual session engine, so the test fails if the award
 * path breaks anywhere between answering and persistence.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadShippedContent } from "../../src/content";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { advance, currentQuestion, startLesson, submitAnswer } from "../../src/renderer/state/session";
import { evaluateAchievements } from "../../src/core/achievements/engine";
import { isRegionCompleted, isRegionUnlocked } from "../../src/core/curriculum/progress";
import { NodeStorageAdapter } from "../../src/core/persistence/node-adapter";
import { SaveManager } from "../../src/core/persistence/save-manager";
import { createEmptySave, type Question, type SaveFile } from "../../src/shared/schemas";
import type { RawResponse } from "../../src/core/questions/types";

const REGION_1 = "r.harbor-tallies";
const REGION_1_ACHIEVEMENT = "ach.harbor-charted";
const REGION_2 = "r.averages-atoll";

const content = loadShippedContent();

/** Builds a response that satisfies the question's declared answer. */
function correctResponseFor(question: Question): RawResponse {
  const a = question.answer;
  switch (a.kind) {
    case "choice":
      return { kind: "choice", choiceIds: [...a.correctChoiceIds] };
    case "numeric":
      return { kind: "numeric", text: String(a.value) };
    case "ordering":
      return { kind: "ordering", order: [...a.correctOrder] };
    case "matching":
      return { kind: "matching", pairs: a.pairs.map((p) => ({ left: p.left, right: p.right })) };
    case "text":
      return { kind: "text", text: a.requiredKeywords.join(" ") };
  }
}

/** Answers every question in a lesson correctly through the real engine. */
function playLesson(save: SaveFile, lessonId: string, startMs: number): SaveFile {
  let session = startLesson(content, lessonId, startMs);
  expect(session, `lesson ${lessonId} should exist`).not.toBeNull();
  let current = save;
  let clock = startMs;
  let guard = 0;

  while (session && !session.finished) {
    expect(guard++, `lesson ${lessonId} did not terminate`).toBeLessThan(100);
    const question = currentQuestion(content, session);
    expect(question, `question missing in ${lessonId}`).not.toBeNull();

    clock += 1000;
    const result = submitAnswer(content, current, session, correctResponseFor(question!), clock);
    expect(result, `submitAnswer returned null in ${lessonId}`).not.toBeNull();
    expect(result!.feedback.correct, `expected a correct answer for ${question!.id}`).toBe(true);
    current = result!.save;

    clock += 1000;
    const next = advance(content, current, result!.session, clock);
    current = next.save;
    session = next.session;
  }

  expect(current.lessonProgress[lessonId]?.status).toBe("completed");
  return current;
}

function lessonIdsOfRegion(regionId: string): string[] {
  const region = content.curriculum.regions.find((r) => r.id === regionId)!;
  return content.curriculum.modules
    .filter((m) => region.moduleIds.includes(m.id))
    .flatMap((m) => m.lessonIds);
}

function freshSave(): SaveFile {
  return createEmptySave({
    id: "p.region",
    name: "Region Tester",
    createdAt: new Date().toISOString(),
    isGuest: false,
    avatarSeed: 0
  });
}

beforeAll(() => {
  clearDetectors();
  registerBuiltInDetectors();
});

describe("region-completion achievement through the real progression system", () => {
  it("ships a region achievement whose region actually exists", () => {
    const ach = content.achievements.find((a) => a.id === REGION_1_ACHIEVEMENT);
    expect(ach, "Region 1 must have a configured completion achievement").toBeDefined();
    expect(ach!.trigger).toEqual({ kind: "region-completed", regionId: REGION_1 });
    expect(content.curriculum.regions.some((r) => r.id === REGION_1)).toBe(true);
  });

  it("does not award the region achievement part-way through the region", () => {
    const lessons = lessonIdsOfRegion(REGION_1);
    expect(lessons.length).toBeGreaterThan(1); // otherwise "part-way" is untestable

    const save = playLesson(freshSave(), lessons[0]!, 0);

    expect(isRegionCompleted(content.curriculum, save, REGION_1)).toBe(false);
    expect(save.achievements).not.toContain(REGION_1_ACHIEVEMENT);
  });

  it("awards the region achievement once every lesson in the region is finished", () => {
    let save = freshSave();
    let clock = 0;
    for (const lessonId of lessonIdsOfRegion(REGION_1)) {
      save = playLesson(save, lessonId, clock);
      clock += 100_000;
    }

    expect(isRegionCompleted(content.curriculum, save, REGION_1)).toBe(true);
    expect(save.achievements).toContain(REGION_1_ACHIEVEMENT);
  });

  it("does not award the achievement a second time once it is held", () => {
    let save = freshSave();
    let clock = 0;
    for (const lessonId of lessonIdsOfRegion(REGION_1)) {
      save = playLesson(save, lessonId, clock);
      clock += 100_000;
    }

    const occurrences = save.achievements.filter((id) => id === REGION_1_ACHIEVEMENT).length;
    expect(occurrences).toBe(1);

    // Re-evaluating against the same save must yield nothing new.
    expect(evaluateAchievements(save, content.achievements, content.curriculum)).toEqual([]);

    // Replaying a lesson in the completed region must not award it again either.
    const replayed = playLesson(save, lessonIdsOfRegion(REGION_1)[0]!, clock);
    expect(replayed.achievements.filter((id) => id === REGION_1_ACHIEVEMENT).length).toBe(1);
  });

  it("completing Region 1 unlocks Region 2, which stays unawarded", () => {
    let save = freshSave();
    let clock = 0;
    expect(isRegionUnlocked(content.curriculum, save, REGION_2)).toBe(false);

    for (const lessonId of lessonIdsOfRegion(REGION_1)) {
      save = playLesson(save, lessonId, clock);
      clock += 100_000;
    }

    expect(isRegionUnlocked(content.curriculum, save, REGION_2)).toBe(true);
    expect(isRegionCompleted(content.curriculum, save, REGION_2)).toBe(false);
    expect(save.achievements).not.toContain("ach.atoll-charted");
  });
});

describe("region achievement survives save and reload", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "statlas-region-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("persists the award across a real save/load round trip and is not re-awarded", async () => {
    const mgr = new SaveManager(new NodeStorageAdapter(dir));
    const created = await mgr.createProfile("Region Tester", false);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const loaded = await mgr.loadGame(created.value.id);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    let save = loaded.value.save;
    let clock = 0;
    for (const lessonId of lessonIdsOfRegion(REGION_1)) {
      save = playLesson(save, lessonId, clock);
      clock += 100_000;
    }
    expect(save.achievements).toContain(REGION_1_ACHIEVEMENT);

    expect((await mgr.saveGame(save)).ok).toBe(true);

    const reloaded = await mgr.loadGame(created.value.id);
    expect(reloaded.ok).toBe(true);
    if (!reloaded.ok) return;

    const after = reloaded.value.save;
    expect(after.achievements).toContain(REGION_1_ACHIEVEMENT);
    expect(after.achievements.filter((id) => id === REGION_1_ACHIEVEMENT).length).toBe(1);
    expect(isRegionCompleted(content.curriculum, after, REGION_1)).toBe(true);

    // The reloaded save must not re-earn what it already holds.
    expect(evaluateAchievements(after, content.achievements, content.curriculum)).toEqual([]);
  });
});
