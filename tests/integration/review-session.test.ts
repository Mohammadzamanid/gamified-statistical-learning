/**
 * S2-06: the review session driven through the real engine, on a fixed clock.
 *
 * Covers the two things a review system is actually for — rescheduling by
 * outcome, and surviving an interruption — plus the persistence round trip that
 * makes resume meaningful rather than notional.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadShippedContent } from "../../src/content";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { registerDefaultInteractions } from "../../src/core/questions/registry";
import {
  advanceReview,
  currentReviewQuestion,
  currentReviewSkillId,
  endReviewSession,
  hasActiveReview,
  reviewProgress,
  startReviewSession,
  submitReviewAnswer
} from "../../src/renderer/state/review-session";
import { DAY_MS } from "../../src/core/spaced-repetition/scheduler";
import { NodeStorageAdapter } from "../../src/core/persistence/node-adapter";
import { SaveManager } from "../../src/core/persistence/save-manager";
import { createSkillState } from "../../src/core/mastery/engine";
import { createEmptySave, type ReviewItem, type SaveFile } from "../../src/shared/schemas";
import { correctResponseFor, incorrectResponseFor } from "../helpers/responses";

const content = loadShippedContent();

const NOW = new Date("2026-06-15T12:00:00.000Z");
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs);

beforeAll(() => {
  clearDetectors();
  registerBuiltInDetectors();
  registerDefaultInteractions();
});

function item(skillId: string, dueOffsetMs: number, overrides: Partial<ReviewItem> = {}): ReviewItem {
  return {
    skillId,
    dueAt: at(dueOffsetMs).toISOString(),
    intervalDays: 4,
    ease: 2.3,
    lapses: 0,
    ...overrides
  };
}

function saveWithDue(...items: ReviewItem[]): SaveFile {
  const base = createEmptySave({
    id: "p.rev",
    name: "Review Tester",
    createdAt: NOW.toISOString(),
    isGuest: false,
    avatarSeed: 0
  });
  const skillStates = { ...base.skillStates };
  for (const i of items) skillStates[i.skillId] = createSkillState(i.skillId);
  return { ...base, reviewQueue: items, skillStates };
}

describe("starting a review session", () => {
  it("does nothing when nothing is due", () => {
    const save = saveWithDue(item("skill.mean", +2 * DAY_MS));
    const started = startReviewSession(content, save, NOW);
    expect(started.reviewSession).toBeNull();
    expect(hasActiveReview(started)).toBe(false);
  });

  it("queues a question per due skill and starts at the first", () => {
    const save = saveWithDue(item("skill.mean", -DAY_MS), item("skill.median", 0));
    const started = startReviewSession(content, save, NOW);

    expect(hasActiveReview(started)).toBe(true);
    expect(started.reviewSession!.skillQueue).toEqual(["skill.mean", "skill.median"]);
    expect(started.reviewSession!.questionQueue).toHaveLength(2);
    expect(started.reviewSession!.currentIndex).toBe(0);
    expect(currentReviewSkillId(started)).toBe("skill.mean");
    expect(currentReviewQuestion(content, started)!.skillIds).toContain("skill.mean");
  });

  it("records when it started, so the queue can be frozen", () => {
    const save = saveWithDue(item("skill.mean", 0));
    expect(startReviewSession(content, save, NOW).reviewSession!.startedAt).toBe(NOW.toISOString());
  });
});

describe("rescheduling by outcome", () => {
  it("lengthens the interval after a correct review", () => {
    const save = startReviewSession(content, saveWithDue(item("skill.mean", 0)), NOW);
    const question = currentReviewQuestion(content, save)!;

    const result = submitReviewAnswer(content, save, correctResponseFor(question), NOW, 3000)!;
    expect(result.feedback.correct).toBe(true);

    const updated = result.save.reviewQueue.find((i) => i.skillId === "skill.mean")!;
    expect(updated.intervalDays).toBeGreaterThan(4);
    expect(new Date(updated.dueAt).getTime()).toBeGreaterThan(NOW.getTime() + 4 * DAY_MS);
    expect(updated.lapses).toBe(0);
  });

  it("shortens the interval and records a lapse after an incorrect review", () => {
    const save = startReviewSession(content, saveWithDue(item("skill.mean", 0)), NOW);
    const question = currentReviewQuestion(content, save)!;

    const result = submitReviewAnswer(content, save, incorrectResponseFor(question), NOW, 3000)!;
    expect(result.feedback.correct).toBe(false);

    const updated = result.save.reviewQueue.find((i) => i.skillId === "skill.mean")!;
    expect(updated.intervalDays).toBe(1);
    expect(updated.lapses).toBe(1);
    // Due again tomorrow, not in four days.
    expect(new Date(updated.dueAt).getTime()).toBe(NOW.getTime() + DAY_MS);
  });

  it("updates mastery and the attempt log like a lesson does", () => {
    const save = startReviewSession(content, saveWithDue(item("skill.mean", 0)), NOW);
    const question = currentReviewQuestion(content, save)!;
    const result = submitReviewAnswer(content, save, correctResponseFor(question), NOW, 3000)!;

    expect(result.save.skillStates["skill.mean"]!.attempts).toBe(1);
    expect(result.save.skillStates["skill.mean"]!.correct).toBe(1);
    expect(result.save.attemptLog.at(-1)!.questionId).toBe(question.id);
    expect(result.save.xp).toBeGreaterThan(save.xp);
  });

  it("counts answers and correct answers as the session runs", () => {
    let save = startReviewSession(content, saveWithDue(item("skill.mean", 0), item("skill.median", 0)), NOW);

    const q1 = currentReviewQuestion(content, save)!;
    save = submitReviewAnswer(content, save, correctResponseFor(q1), NOW, 3000)!.save;
    save = advanceReview(save);

    const q2 = currentReviewQuestion(content, save)!;
    save = submitReviewAnswer(content, save, incorrectResponseFor(q2), at(1000), 3000)!.save;

    expect(reviewProgress(save)).toEqual({ answered: 2, correct: 1, total: 2 });
  });

  it("clears the session once the last item is answered and advanced", () => {
    let save = startReviewSession(content, saveWithDue(item("skill.mean", 0)), NOW);
    const q = currentReviewQuestion(content, save)!;
    save = submitReviewAnswer(content, save, correctResponseFor(q), NOW, 3000)!.save;
    save = advanceReview(save);

    expect(save.reviewSession).toBeNull();
    expect(hasActiveReview(save)).toBe(false);
  });

  it("refuses to answer when no session is running", () => {
    const save = saveWithDue(item("skill.mean", 0));
    expect(submitReviewAnswer(content, save, { kind: "numeric", text: "1" }, NOW, 1000)).toBeNull();
  });
});

describe("interrupted-session resume", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "statlas-review-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("resumes on the same item, with the same question, after a save/load round trip", async () => {
    const mgr = new SaveManager(new NodeStorageAdapter(dir));
    const created = await mgr.createProfile("Review Tester", false);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const loaded = await mgr.loadGame(created.value.id);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    // Three due skills; answer one, then "close the app" mid-session.
    let save: SaveFile = {
      ...loaded.value.save,
      reviewQueue: [item("skill.mean", -2 * DAY_MS), item("skill.median", 0), item("skill.range", 0)],
      skillStates: {
        "skill.mean": createSkillState("skill.mean"),
        "skill.median": createSkillState("skill.median"),
        "skill.range": createSkillState("skill.range")
      }
    };
    save = startReviewSession(content, save, NOW);
    const plannedQuestions = [...save.reviewSession!.questionQueue];

    const first = currentReviewQuestion(content, save)!;
    save = submitReviewAnswer(content, save, correctResponseFor(first), NOW, 3000)!.save;
    save = advanceReview(save);
    const expectedNext = currentReviewQuestion(content, save)!.id;

    expect((await mgr.saveGame(save)).ok).toBe(true);

    // Reopen a day later: the frozen queue must be exactly what it was.
    const reloaded = await mgr.loadGame(created.value.id);
    expect(reloaded.ok).toBe(true);
    if (!reloaded.ok) return;
    const resumed = reloaded.value.save;

    expect(hasActiveReview(resumed)).toBe(true);
    expect(resumed.reviewSession!.questionQueue).toEqual(plannedQuestions);
    expect(resumed.reviewSession!.currentIndex).toBe(1);
    expect(resumed.reviewSession!.answeredCount).toBe(1);
    expect(currentReviewQuestion(content, resumed)!.id).toBe(expectedNext);

    // And it can be finished from there, a day later.
    const q = currentReviewQuestion(content, resumed)!;
    const after = submitReviewAnswer(content, resumed, correctResponseFor(q), at(DAY_MS), 3000)!;
    expect(after.feedback.correct).toBe(true);
    expect(after.save.reviewSession!.answeredCount).toBe(2);
  });

  it("keeps the frozen queue even when new items fall due meanwhile", () => {
    let save = saveWithDue(item("skill.mean", 0));
    save = startReviewSession(content, save, NOW);
    const frozen = [...save.reviewSession!.questionQueue];

    // A week later another skill is long overdue, but the running session is unchanged.
    const later = at(7 * DAY_MS);
    save = {
      ...save,
      reviewQueue: [...save.reviewQueue, item("skill.median", -3 * DAY_MS)]
    };
    expect(save.reviewSession!.questionQueue).toEqual(frozen);
    expect(currentReviewQuestion(content, save)!.id).toBe(frozen[0]);

    // Only after ending it does a fresh session pick the newly due work up.
    const restarted = startReviewSession(content, endReviewSession(save), later);
    expect(restarted.reviewSession!.skillQueue).toContain("skill.median");
  });

  it("abandoning a session keeps the answers already recorded", () => {
    let save = startReviewSession(content, saveWithDue(item("skill.mean", 0), item("skill.median", 0)), NOW);
    const q = currentReviewQuestion(content, save)!;
    save = submitReviewAnswer(content, save, correctResponseFor(q), NOW, 3000)!.save;

    const rescheduled = save.reviewQueue.find((i) => i.skillId === "skill.mean")!;
    const abandoned = endReviewSession(save);

    expect(abandoned.reviewSession).toBeNull();
    // The reschedule and the attempt survive; only the queue position is dropped.
    expect(abandoned.reviewQueue.find((i) => i.skillId === "skill.mean")).toEqual(rescheduled);
    expect(abandoned.attemptLog).toHaveLength(1);
  });
});
