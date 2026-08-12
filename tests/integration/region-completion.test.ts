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
import { createEmptySave, type SaveFile } from "../../src/shared/schemas";
import { correctResponseFor } from "../helpers/responses";
import { playInvestigation } from "../helpers/investigation-playthrough";
import { investigationForRegion, isInvestigationUnlocked } from "../../src/core/investigations/engine";

const REGION_1 = "r.harbor-tallies";
const REGION_1_ACHIEVEMENT = "ach.harbor-charted";
const REGION_2 = "r.averages-atoll";

const content = loadShippedContent();

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

/**
 * Everything Region 1 asks of a learner: every lesson, then the case.
 *
 * Since S2-10 the region is not complete until its boss investigation is closed,
 * so a helper that stopped at the lessons would be testing the old rule.
 */
function completeRegion1(startMs = 0): SaveFile {
  let save = freshSave();
  let clock = startMs;
  for (const lessonId of lessonIdsOfRegion(REGION_1)) {
    save = playLesson(save, lessonId, clock);
    clock += 100_000;
  }
  const boss = investigationForRegion(content.curriculum, REGION_1);
  expect(boss, "Region 1 must have a boss investigation").not.toBeNull();
  return playInvestigation(content, save, boss!.id, clock);
}

/**
 * Every lesson of a region, in module order, from whatever save is handed in.
 *
 * Region 2 is played on top of a completed Region 1 rather than from a fresh
 * save, because that is the order a learner meets them and because
 * `isRegionUnlocked` is the rule that says so.
 */
function playRegionLessons(save: SaveFile, regionId: string, startMs: number): SaveFile {
  let current = save;
  let clock = startMs;
  for (const lessonId of lessonIdsOfRegion(regionId)) {
    current = playLesson(current, lessonId, clock);
    clock += 100_000;
  }
  return current;
}

function completeRegion(save: SaveFile, regionId: string, startMs: number): SaveFile {
  const current = playRegionLessons(save, regionId, startMs);
  const boss = investigationForRegion(content.curriculum, regionId);
  expect(boss, `${regionId} must have a boss investigation`).not.toBeNull();
  return playInvestigation(content, current, boss!.id, startMs + 5_000_000);
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

  it("does not award the region achievement while the boss investigation is unclosed", () => {
    // The boss gates the region (S2-10). Every lesson finished used to be the
    // whole requirement; a region whose case is still open is not charted.
    let save = freshSave();
    let clock = 0;
    for (const lessonId of lessonIdsOfRegion(REGION_1)) {
      save = playLesson(save, lessonId, clock);
      clock += 100_000;
    }

    expect(isRegionCompleted(content.curriculum, save, REGION_1)).toBe(false);
    expect(save.achievements).not.toContain(REGION_1_ACHIEVEMENT);
  });

  it("awards the region achievement once every lesson is finished and the case is closed", () => {
    const save = completeRegion1();

    expect(isRegionCompleted(content.curriculum, save, REGION_1)).toBe(true);
    expect(save.achievements).toContain(REGION_1_ACHIEVEMENT);
  });

  it("does not award the achievement a second time once it is held", () => {
    const save = completeRegion1();
    const clock = 5_000_000;

    const occurrences = save.achievements.filter((id) => id === REGION_1_ACHIEVEMENT).length;
    expect(occurrences).toBe(1);

    // Re-evaluating against the same save must yield nothing new.
    expect(evaluateAchievements(save, content.achievements, content.curriculum)).toEqual([]);

    // Replaying a lesson in the completed region must not award it again either.
    const replayed = playLesson(save, lessonIdsOfRegion(REGION_1)[0]!, clock);
    expect(replayed.achievements.filter((id) => id === REGION_1_ACHIEVEMENT).length).toBe(1);
  });

  it("completing Region 1 unlocks Region 2, which stays unawarded", () => {
    expect(isRegionUnlocked(content.curriculum, freshSave(), REGION_2)).toBe(false);

    const save = completeRegion1();

    expect(isRegionUnlocked(content.curriculum, save, REGION_2)).toBe(true);
    expect(isRegionCompleted(content.curriculum, save, REGION_2)).toBe(false);
    expect(save.achievements).not.toContain("ach.atoll-charted");
  });
});

/**
 * S2-18: the same path through Region 2, now that it has a case of its own.
 *
 * `ach.atoll-charted` has shipped since Stage 1 and has been **unreachable**
 * since S2-10, because `isRegionCompleted` will not fire for a region whose
 * investigation is open and Region 2's investigation did not exist. Building
 * `inv.r2-atoll-approach` is what makes it earnable, so the thing to prove is
 * that it is now actually earned — through the engine, from a save that starts
 * with nothing.
 *
 * The whole run is one save rather than four independent ones, because
 * `STAGE2_RECONSTRUCTION_SCOPE.md` §7 asks for a playthrough completing every
 * required lesson **and both boss investigations**, and because playing Region 2
 * on a fresh save would quietly test a region the learner could not have reached.
 */
describe("Region 2's case, and the achievement it gates", () => {
  const REGION_2_ACHIEVEMENT = "ach.atoll-charted";

  it("ships a Region 2 achievement whose region and case both exist", () => {
    const ach = content.achievements.find((a) => a.id === REGION_2_ACHIEVEMENT);
    expect(ach, "Region 2 must have a configured completion achievement").toBeDefined();
    expect(ach!.trigger).toEqual({ kind: "region-completed", regionId: REGION_2 });
    expect(investigationForRegion(content.curriculum, REGION_2), "Region 2 must have a boss").not.toBeNull();
  });

  it("keeps the case locked until every Region 2 lesson is finished", () => {
    const boss = investigationForRegion(content.curriculum, REGION_2)!;
    const lessons = lessonIdsOfRegion(REGION_2);
    expect(lessons.length).toBeGreaterThan(1);

    expect(isInvestigationUnlocked(content.curriculum, freshSave(), boss.id)).toBe(false);

    // One lesson short is still short: the case argues across the whole region.
    let save = freshSave();
    let clock = 0;
    for (const lessonId of lessons.slice(0, -1)) {
      save = playLesson(save, lessonId, clock);
      clock += 100_000;
    }
    expect(isInvestigationUnlocked(content.curriculum, save, boss.id)).toBe(false);

    save = playLesson(save, lessons[lessons.length - 1]!, clock);
    expect(isInvestigationUnlocked(content.curriculum, save, boss.id)).toBe(true);
  });

  it("does not award the atoll achievement while the case is still open", () => {
    const save = playRegionLessons(freshSave(), REGION_2, 0);

    expect(isRegionCompleted(content.curriculum, save, REGION_2)).toBe(false);
    expect(save.achievements).not.toContain(REGION_2_ACHIEVEMENT);
  });

  it("charts the whole expedition: every lesson of both regions and both cases", () => {
    let save = completeRegion(freshSave(), REGION_1, 0);
    expect(isRegionCompleted(content.curriculum, save, REGION_1)).toBe(true);
    expect(isRegionUnlocked(content.curriculum, save, REGION_2)).toBe(true);

    save = completeRegion(save, REGION_2, 10_000_000);

    expect(isRegionCompleted(content.curriculum, save, REGION_2)).toBe(true);
    expect(save.achievements).toContain(REGION_1_ACHIEVEMENT);
    expect(save.achievements).toContain(REGION_2_ACHIEVEMENT);
    expect(save.achievements.filter((id) => id === REGION_2_ACHIEVEMENT).length).toBe(1);

    // Both cases closed, and recorded as closed rather than merely played.
    for (const regionId of [REGION_1, REGION_2]) {
      const boss = investigationForRegion(content.curriculum, regionId)!;
      expect(save.investigationProgress[boss.id]?.status, `${boss.id}`).toBe("completed");
    }

    // Nothing further is owed to a save that has finished everything shipped.
    expect(evaluateAchievements(save, content.achievements, content.curriculum)).toEqual([]);
  });

  it("credits every skill the case claims, so closing it counts as practice", () => {
    // A boss step declares `skillIds`, and the audit holds that claim to its
    // questions. This is the other half: the skills actually reach the save, so
    // mastery and the review queue see the case as the practice it is.
    //
    // Measured as the *difference* the case makes. Asserting the skill states
    // merely exist after the run would pass on the lessons alone — every one of
    // these skills is taught by a Region 2 lesson, which is the point of a boss —
    // so the check has to be what closing the case added.
    const boss = investigationForRegion(content.curriculum, REGION_2)!;
    const before = playRegionLessons(freshSave(), REGION_2, 0);
    const after = playInvestigation(content, before, boss.id, 5_000_000);
    const claimed = new Set(boss.steps.flatMap((s) => s.skillIds));

    expect(claimed.size).toBeGreaterThan(1);
    for (const skillId of claimed) {
      const attemptsBefore = before.skillStates[skillId]?.attempts ?? 0;
      const attemptsAfter = after.skillStates[skillId]?.attempts ?? 0;
      expect(
        attemptsAfter,
        `${skillId} is claimed by a step of ${boss.id} but gained no attempt when the case was argued`
      ).toBeGreaterThan(attemptsBefore);
    }
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
    const boss = investigationForRegion(content.curriculum, REGION_1)!;
    save = playInvestigation(content, save, boss.id, clock);
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
