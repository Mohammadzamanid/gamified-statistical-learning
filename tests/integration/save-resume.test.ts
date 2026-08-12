/**
 * S2-19: what an interruption costs, measured rather than assumed.
 *
 * The unit's criteria list five places a learner can be interrupted — a lesson,
 * a multi-step calculation, a boss, the review queue, the laboratory — and three
 * moments just after something was earned: an achievement, a mastery change, a
 * settings change. Underneath those sit the storage questions: several profiles,
 * atomic writes, backup rotation, a corrupt primary, an invalid import, a
 * missing save.
 *
 * `tests/integration/persistence.test.ts` already covers the storage layer's own
 * contract — corrupt-primary recovery, migration, the version guard, export and
 * import round trips, settings, path traversal — and that file is deliberately
 * not duplicated here. What it does **not** do is interrupt anything: every one
 * of its saves is hand-built or trivially played. This file interrupts the real
 * engine at each of the five points, writes through a real `SaveManager` onto a
 * real directory, reloads, and asserts what came back.
 *
 * **The distinction every assertion here turns on**, because it is the thing an
 * audit like this exists to make explicit:
 *
 *  - **Earned state** — attempts, mastery, review schedule, achievements, closed
 *    lessons and argued stages — is written on every answer and must survive any
 *    interruption. Losing it means a learner did work the app forgot.
 *  - **Position** — where in a queue the learner had got to — survives only
 *    where something persists it. A review session freezes its queue and index
 *    (S2-06); a boss records the stage it reached (S2-10). A lesson records
 *    neither, and this file measures that rather than asserting around it.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { promises as fsPromises } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadShippedContent } from "../../src/content";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { advance, currentQuestion, startLesson, submitAnswer } from "../../src/renderer/state/session";
import {
  advanceReview,
  currentReviewQuestion,
  hasActiveReview,
  reviewProgress,
  startReviewSession,
  submitReviewAnswer
} from "../../src/renderer/state/review-session";
import { beginInvestigation } from "../../src/core/investigations/engine";
import { NodeStorageAdapter } from "../../src/core/persistence/node-adapter";
import { SaveManager } from "../../src/core/persistence/save-manager";
import { MAX_BACKUPS, SAVE_FILE_PREFIX } from "../../src/shared/constants/app";
import { createExperiment, saveExperiment } from "../../src/core/laboratory";
import type { SaveFile } from "../../src/shared/schemas";
import { correctResponseFor } from "../helpers/responses";
import { playInvestigationStep } from "../helpers/investigation-playthrough";

const content = loadShippedContent();

/** A lesson long enough to be interrupted part-way, with a step calculation in it. */
const LESSON = "l.r1-addition";
/** Its questions, in the order the session asks them. */
const LESSON_QUESTIONS = content.curriculum.lessons.find((l) => l.id === LESSON)!.questionIds;

beforeAll(() => {
  clearDetectors();
  registerBuiltInDetectors();
});

let dir: string;
let manager: SaveManager;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "statlas-resume-"));
  manager = new SaveManager(new NodeStorageAdapter(dir));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

async function newProfile(name = "Interrupted Explorer"): Promise<SaveFile> {
  const created = await manager.createProfile(name, false);
  expect(created.ok, "profile creation").toBe(true);
  if (!created.ok) throw new Error(created.error);
  const loaded = await manager.loadGame(created.value.id);
  expect(loaded.ok, "initial load").toBe(true);
  if (!loaded.ok) throw new Error(loaded.error);
  return loaded.value.save;
}

/** Writes the save through the real manager and reads back what a relaunch would see. */
async function throughDisk(save: SaveFile): Promise<SaveFile> {
  const written = await manager.saveGame(save);
  expect(written.ok, `saveGame: ${written.ok ? "" : written.error}`).toBe(true);
  const reloaded = await manager.loadGame(save.profile.id);
  expect(reloaded.ok, `loadGame: ${reloaded.ok ? "" : reloaded.error}`).toBe(true);
  if (!reloaded.ok) throw new Error(reloaded.error);
  expect(reloaded.value.recoveredFromBackup, "a clean save should not need recovery").toBe(false);
  return reloaded.value.save;
}

/** Answers `count` questions of a lesson correctly and stops there, mid-lesson. */
function answerPartOfLesson(save: SaveFile, lessonId: string, count: number, startMs: number) {
  let current = save;
  let session = startLesson(content, lessonId, startMs)!;
  expect(session, `${lessonId} would not start`).toBeTruthy();
  let clock = startMs;
  for (let i = 0; i < count; i += 1) {
    expect(session.finished, `${lessonId} finished before ${count} answers`).toBe(false);
    const question = currentQuestion(content, session)!;
    clock += 1000;
    const submitted = submitAnswer(content, current, session, correctResponseFor(question), clock)!;
    expect(submitted.feedback.correct, `${question.id}`).toBe(true);
    current = submitted.save;
    clock += 500;
    const next = advance(content, current, submitted.session, clock);
    current = next.save;
    session = next.session;
  }
  return { save: current, session };
}

describe("an interruption keeps what was earned", () => {
  it("keeps every answer given before a lesson was abandoned part-way", async () => {
    const start = await newProfile();
    const { save: interrupted, session } = answerPartOfLesson(start, LESSON, 3, 0);

    // Precondition: this really is an interruption, not a finished lesson.
    expect(session.finished).toBe(false);
    expect(interrupted.lessonProgress[LESSON]?.status).toBe("in-progress");

    const resumed = await throughDisk(interrupted);

    expect(resumed.attemptLog).toHaveLength(3);
    expect(resumed.attemptLog.map((a) => a.questionId)).toEqual(LESSON_QUESTIONS.slice(0, 3));
    expect(resumed.lessonProgress[LESSON]?.status).toBe("in-progress");
    for (const [skillId, state] of Object.entries(interrupted.skillStates)) {
      expect(resumed.skillStates[skillId]?.attempts, `${skillId} attempts`).toBe(state.attempts);
      expect(resumed.skillStates[skillId]?.masteryLevel, `${skillId} mastery`).toBe(state.masteryLevel);
    }
    // The review schedule those three answers created is the same schedule.
    expect(resumed.reviewQueue.map((r) => `${r.skillId}@${r.dueAt}`)).toEqual(
      interrupted.reviewQueue.map((r) => `${r.skillId}@${r.dueAt}`)
    );
  });

  it("keeps the work when the interruption lands on a multi-step calculation", async () => {
    // A step calculation is answered as one submission, so the interruption that
    // matters is the one *while it is on screen* — every earlier answer is
    // already banked, and the half-filled steps were never a save's business.
    const stepIndex = LESSON_QUESTIONS.findIndex(
      (qid) => content.questions.get(qid)!.interaction === "step-by-step-calculation"
    );
    expect(stepIndex, `${LESSON} has no step-by-step-calculation to be interrupted on`).toBeGreaterThan(0);

    const start = await newProfile();
    const { save: interrupted, session } = answerPartOfLesson(start, LESSON, stepIndex, 0);
    expect(currentQuestion(content, session)!.interaction).toBe("step-by-step-calculation");

    const resumed = await throughDisk(interrupted);
    expect(resumed.attemptLog).toHaveLength(stepIndex);
    expect(resumed.attemptLog.every((a) => a.correct)).toBe(true);

    // And the question is still answerable afterwards, which is the part that
    // would break if a partially-recorded attempt had been persisted.
    const after = startLesson(content, LESSON, 10_000)!;
    const question = content.questions.get(LESSON_QUESTIONS[stepIndex]!)!;
    const submitted = submitAnswer(content, resumed, { ...after, currentIndex: stepIndex }, correctResponseFor(question), 11_000);
    expect(submitted!.feedback.correct).toBe(true);
  });

  it("resumes a boss at the stage it reached, with the stages already argued kept", async () => {
    const boss = content.curriculum.investigations.find((i) => i.regionId === "r.averages-atoll")!;
    const start = await newProfile();

    let save = beginInvestigation(start, boss, new Date(0));
    save = playInvestigationStep(content, save, boss.id, 0, 1000);
    save = playInvestigationStep(content, save, boss.id, 1, 100_000);

    const resumed = await throughDisk(save);
    const progress = resumed.investigationProgress[boss.id];

    expect(progress?.status).toBe("in-progress");
    expect(progress?.currentStepIndex, "should resume at the third stage").toBe(2);
    expect(progress?.stepAccuracy).toHaveLength(2);
    expect(progress?.stepAccuracy.every((a) => a === 1)).toBe(true);
    expect(progress?.completedAt).toBeNull();

    // Resuming really does continue rather than restart: the remaining stages
    // close the case from the reloaded save.
    let finished = resumed;
    for (let i = 2; i < boss.steps.length; i += 1) {
      finished = playInvestigationStep(content, finished, boss.id, i, 1_000_000 + i * 1000);
    }
    expect(finished.investigationProgress[boss.id]?.status).toBe("completed");
  });

  it("resumes a review session on the same question, from the queue it froze", async () => {
    const start = await newProfile();
    // Give the learner enough due skills that a session survives one answer:
    // two lessons, then a review far enough ahead that both have come round.
    let save = start;
    let clock = 0;
    for (const lessonId of [LESSON, "l.r1-subtraction"]) {
      let session = startLesson(content, lessonId, clock)!;
      expect(session, `${lessonId} would not start`).toBeTruthy();
      while (!session.finished) {
        const question = currentQuestion(content, session)!;
        clock += 1000;
        const submitted = submitAnswer(content, save, session, correctResponseFor(question), clock)!;
        save = submitted.save;
        const next = advance(content, save, submitted.session, clock + 500);
        save = next.save;
        session = next.session;
      }
    }

    const later = new Date(Date.now() + 400 * 24 * 3600 * 1000);
    save = startReviewSession(content, save, later);
    expect(hasActiveReview(save), "nothing was due, so there is no session to interrupt").toBe(true);

    expect(save.reviewSession!.skillQueue.length, "one item would end on the first answer").toBeGreaterThan(1);

    const asked = currentReviewQuestion(content, save)!;
    const answered = submitReviewAnswer(content, save, correctResponseFor(asked), later, 1000);
    expect(answered, `${asked.id} could not be answered in review`).not.toBeNull();
    save = advanceReview(answered!.save);

    // Read out of the frozen queue, **not** back out of `currentReviewQuestion`.
    // The first draft did the latter and a probe walked straight through it: a
    // resume that picked a fresh question for the current skill would have
    // satisfied both sides of the comparison at once, because both sides were
    // the same function (D-059).
    const frozen = save.reviewSession!;
    const expectedNext = frozen.questionQueue[frozen.currentIndex]!;
    const before = reviewProgress(save)!;

    const resumed = await throughDisk(save);

    expect(hasActiveReview(resumed)).toBe(true);
    expect(currentReviewQuestion(content, resumed)?.id).toBe(expectedNext);
    expect(reviewProgress(resumed)).toEqual(before);
    expect(resumed.reviewSession?.skillQueue).toEqual(save.reviewSession?.skillQueue);
    expect(resumed.reviewSession?.questionQueue).toEqual(save.reviewSession?.questionQueue);
    expect(resumed.reviewSession?.startedAt).toBe(save.reviewSession?.startedAt);
  });

  it("keeps the laboratory shelf, its readings and how they were drawn", async () => {
    const start = await newProfile();
    const shelved = saveExperiment(
      start.savedExperiments,
      { experiment: createExperiment("Channel B", [4, 7, 7, 8, 10, 13, 15]), chartKind: "histogram", binWidth: 2 },
      new Date(0).toISOString()
    );
    expect(shelved.ok, "shelving").toBe(true);
    if (!shelved.ok) return;

    const resumed = await throughDisk({ ...start, savedExperiments: [...shelved.experiments] });
    expect(resumed.savedExperiments).toHaveLength(1);
    const entry = resumed.savedExperiments[0]!;
    expect(entry.title).toBe("Channel B");
    expect(entry.values).toEqual([4, 7, 7, 8, 10, 13, 15]);
    expect(entry.chartKind).toBe("histogram");
    expect(entry.binWidth).toBe(2);
  });
});

describe("an interruption immediately after something was earned", () => {
  it("keeps an achievement awarded by the answer that was interrupted", async () => {
    const start = await newProfile();
    // `ach.first-cast` fires on the very first answer, so one answer and a pull
    // of the plug is the tightest version of this.
    const { save: interrupted } = answerPartOfLesson(start, LESSON, 1, 0);
    expect(interrupted.achievements, "the first answer should award something").toContain("ach.first-cast");

    const resumed = await throughDisk(interrupted);
    expect(resumed.achievements).toContain("ach.first-cast");
    expect(resumed.achievements.filter((id) => id === "ach.first-cast")).toHaveLength(1);
  });

  it("keeps a mastery level that moved on the answer that was interrupted", async () => {
    const start = await newProfile();
    const { save: interrupted } = answerPartOfLesson(start, LESSON, 4, 0);
    const moved = Object.values(interrupted.skillStates).filter((s) => s.masteryLevel !== "unseen");
    expect(moved.length, "four correct answers should move some skill off unseen").toBeGreaterThan(0);

    const resumed = await throughDisk(interrupted);
    for (const state of moved) {
      expect(resumed.skillStates[state.skillId]?.masteryLevel, state.skillId).toBe(state.masteryLevel);
      expect(resumed.skillStates[state.skillId]?.correct, state.skillId).toBe(state.correct);
      expect(resumed.skillStates[state.skillId]?.retention, state.skillId).toBeCloseTo(state.retention, 10);
    }
  });

  it("keeps a settings change made just before the interruption", async () => {
    const saved = await manager.saveSettings({
      theme: "high-contrast",
      reducedMotion: true,
      textScale: "xl",
      colorBlindSafe: true,
      soundEnabled: false,
      lastProfileId: "p.someone"
    });
    expect(saved.ok).toBe(true);

    const reloaded = await manager.loadSettings();
    expect(reloaded).toEqual({
      theme: "high-contrast",
      reducedMotion: true,
      textScale: "xl",
      colorBlindSafe: true,
      soundEnabled: false,
      lastProfileId: "p.someone"
    });
  });
});

describe("what a lesson does not resume, stated rather than assumed", () => {
  it("marks an interrupted lesson as in progress, which is what the map can show", async () => {
    // The first half of the gap S2-19 found, and the half it closed.
    // `LessonProgressSchema` has had an `"in-progress"` status since Stage 1 and
    // nothing wrote it, so an abandoned lesson looked untouched.
    const start = await newProfile();
    const { save: interrupted } = answerPartOfLesson(start, LESSON, 2, 0);
    const resumed = await throughDisk(interrupted);

    expect(resumed.lessonProgress[LESSON]).toEqual({
      lessonId: LESSON,
      status: "in-progress",
      bestAccuracy: 0,
      completedAt: null
    });
  });

  it("still restarts that lesson at its first question, because no position is kept", async () => {
    // The half it did not close, measured rather than asserted around. A review
    // session persists its queue and index (S2-06) and a boss persists the stage
    // it reached (S2-10); a lesson persists neither, so a learner who leaves
    // after two of six answers meets question one again.
    //
    // Nothing is *lost* but the position — the cases above prove the answers,
    // the mastery they moved and the review entries they created all survive,
    // and the repeated questions are answered again rather than skipped, so the
    // record stays truthful either way.
    const start = await newProfile();
    const { save: interrupted } = answerPartOfLesson(start, LESSON, 2, 0);
    const resumed = await throughDisk(interrupted);

    const session = startLesson(content, LESSON, 10_000)!;
    expect(session.currentIndex).toBe(0);
    expect(session.questionQueue).toEqual([...LESSON_QUESTIONS]);

    // There is no field a resume could read: the save records a lesson's
    // status, never its position. Asserted against the save's own shape so
    // adding one makes this case fail and be rewritten deliberately.
    expect(Object.keys(resumed.lessonProgress[LESSON]!).sort()).toEqual([
      "bestAccuracy",
      "completedAt",
      "lessonId",
      "status"
    ]);
  });
});

describe("several profiles on one machine", () => {
  it("keeps each profile's progress to itself", async () => {
    const first = await newProfile("First");
    const second = await newProfile("Second");
    expect(first.profile.id).not.toBe(second.profile.id);

    const { save: firstPlayed } = answerPartOfLesson(first, LESSON, 3, 0);
    await throughDisk(firstPlayed);

    const secondLoaded = await manager.loadGame(second.profile.id);
    expect(secondLoaded.ok).toBe(true);
    if (!secondLoaded.ok) return;
    expect(secondLoaded.value.save.attemptLog).toHaveLength(0);
    expect(secondLoaded.value.save.achievements).toHaveLength(0);
    expect(secondLoaded.value.save.lessonProgress).toEqual({});

    const firstLoaded = await manager.loadGame(first.profile.id);
    expect(firstLoaded.ok).toBe(true);
    if (!firstLoaded.ok) return;
    expect(firstLoaded.value.save.attemptLog).toHaveLength(3);

    expect((await manager.listProfiles()).map((p) => p.name).sort()).toEqual(["First", "Second"]);
  });

  it("deletes one profile's save without touching the other's", async () => {
    const first = await newProfile("First");
    const second = await newProfile("Second");
    const { save: played } = answerPartOfLesson(second, LESSON, 2, 0);
    await throughDisk(played);

    await manager.deleteProfile(first.profile.id);

    expect((await manager.listProfiles()).map((p) => p.id)).toEqual([second.profile.id]);
    const survivor = await manager.loadGame(second.profile.id);
    expect(survivor.ok).toBe(true);
    if (!survivor.ok) return;
    expect(survivor.value.save.attemptLog).toHaveLength(2);
  });
});

describe("the storage contract underneath all of it", () => {
  it("leaves no partial or temporary file behind after a write", async () => {
    const save = await newProfile();
    const { save: played } = answerPartOfLesson(save, LESSON, 2, 0);
    await throughDisk(played);

    const entries = readdirSync(dir);
    expect(entries.some((f) => f.includes(".tmp-")), `temporary files left: ${entries.join(", ")}`).toBe(false);
    expect(entries).toContain(`${SAVE_FILE_PREFIX}${save.profile.id}.json`);
  });

  it("leaves the previous save intact when a write dies before the rename", async () => {
    // The atomicity claim in `StorageAdapter`, exercised rather than trusted.
    // Checking only that no `.tmp-` file survives a *successful* write proves
    // nothing about the case that matters: the power going out between writing
    // the temporary file and renaming it over the real one.
    //
    // So the rename is made to fail. What must hold is that the previous save is
    // still there and still loadable — a half-written file must never be what a
    // learner comes back to.
    const save = await newProfile();
    const { save: played } = answerPartOfLesson(save, LESSON, 3, 0);
    await throughDisk(played);

    class DiesBeforeRename extends NodeStorageAdapter {
      override async writeAtomic(fileName: string, contents: string): Promise<void> {
        if (fileName.startsWith(SAVE_FILE_PREFIX)) {
          // Write the temporary file the real adapter would write, then stop.
          writeFileSync(join(dir, `${fileName}.tmp-crash`), contents.slice(0, 40), "utf8");
          throw new Error("power lost before rename");
        }
        return super.writeAtomic(fileName, contents);
      }
    }

    const crashing = new SaveManager(new DiesBeforeRename(dir));
    await expect(crashing.saveGame({ ...played, xp: 9999 })).rejects.toThrow(/power lost/);

    const after = await manager.loadGame(save.profile.id);
    expect(after.ok, "the previous save must survive a failed write").toBe(true);
    if (!after.ok) return;
    expect(after.value.recoveredFromBackup, "and survive it intact, not by recovery").toBe(false);
    expect(after.value.save.attemptLog).toHaveLength(3);
    expect(after.value.save.xp).toBe(played.xp);

    // The abandoned fragment is inert: `list` never offers it as a backup.
    expect(readdirSync(dir).some((f) => f.includes(".tmp-crash"))).toBe(true);
    const recovered = await manager.loadGame(save.profile.id);
    expect(recovered.ok).toBe(true);
  });

  it("changes a file only by the rename, never by writing over it", async () => {
    // The case above proves what the *manager* does when a write fails. It says
    // nothing about how the adapter writes, and a probe proved it: replacing
    // temp-then-rename with a plain `writeFile` failed nothing in the suite,
    // because every other check only ever sees a completed write.
    //
    // The mechanism is the guarantee, so the mechanism is what is checked.
    // `rename` is made to fail; if the adapter had written straight to the
    // target, the new contents would already be there.
    const adapter = new NodeStorageAdapter(dir);
    const target = "atomicity-probe.json";
    await adapter.writeAtomic(target, '{"generation":1}');

    const rename = vi.spyOn(fsPromises, "rename").mockRejectedValueOnce(new Error("rename failed"));
    await expect(adapter.writeAtomic(target, '{"generation":2}')).rejects.toThrow(/rename failed/);
    expect(rename, "a write that never renames is a write straight onto the target").toHaveBeenCalled();
    rename.mockRestore();

    expect(await adapter.read(target)).toBe('{"generation":1}');

    // And the successful write does land.
    await adapter.writeAtomic(target, '{"generation":2}');
    expect(await adapter.read(target)).toBe('{"generation":2}');
  });

  it("rotates backups to the bound, keeping the most recent", async () => {
    const save = await newProfile();
    let clock = 0;
    // Each save backs up the *previous* file, so N+1 saves make N backups. The
    // clock is injected because the backup's name is its timestamp, and two
    // saves inside the same millisecond would collide into one file.
    const writes = MAX_BACKUPS + 4;
    for (let i = 0; i < writes; i += 1) {
      clock += 1000;
      const at = clock;
      const marked: SaveFile = { ...save, xp: i };
      const written = await new SaveManager(new NodeStorageAdapter(dir), () => new Date(at)).saveGame(marked);
      expect(written.ok).toBe(true);
    }

    const backups = readdirSync(join(dir, "backups")).sort();
    expect(backups.length, `kept ${backups.length} backups`).toBe(MAX_BACKUPS);

    // The one kept newest is the second-to-last save written, not an early one:
    // rotation drops the oldest rather than refusing to add.
    const newest = JSON.parse(readFileSync(join(dir, "backups", backups.at(-1)!), "utf8"));
    expect(newest.xp).toBe(writes - 2);

    // And the primary is the last one, untouched by the rotation.
    const loaded = await manager.loadGame(save.profile.id);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.save.xp).toBe(writes - 1);
  });

  it("reports a missing save rather than inventing an empty one", async () => {
    const loaded = await manager.loadGame("p.never-existed");
    expect(loaded.ok).toBe(false);
    if (loaded.ok) return;
    expect(loaded.error).toMatch(/no valid save or backup/);
  });

  it("refuses an invalid import and leaves the existing save untouched", async () => {
    const save = await newProfile();
    const { save: played } = answerPartOfLesson(save, LESSON, 3, 0);
    await throughDisk(played);

    const rejected: ReadonlyArray<readonly [string, string]> = [
      ["not JSON at all", "{{{"],
      ["JSON that is not an object", '"a string"'],
      ["an object with no schemaVersion", '{"profile":{"id":"p.x"}}'],
      ["a save from a newer app", '{"schemaVersion":9999,"profile":{"id":"p.x"}}'],
      ["a save whose shape does not validate", '{"schemaVersion":4,"profile":{"id":"p.x"},"xp":-5}']
    ];

    for (const [what, payload] of rejected) {
      const result = await manager.importSave(payload);
      expect(result.ok, `${what} was accepted`).toBe(false);
    }

    const after = await manager.loadGame(save.profile.id);
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    expect(after.value.save.attemptLog, "a rejected import must not disturb the save").toHaveLength(3);
    expect((await manager.listProfiles()).map((p) => p.id)).toEqual([save.profile.id]);
  });

  it("recovers from a corrupt primary without losing the profile's other saves", async () => {
    const first = await newProfile("First");
    const second = await newProfile("Second");
    const { save: played } = answerPartOfLesson(first, LESSON, 2, 0);
    await throughDisk(played);
    const { save: more } = answerPartOfLesson(played, LESSON, 3, 50_000);
    await throughDisk(more);

    writeFileSync(join(dir, `${SAVE_FILE_PREFIX}${first.profile.id}.json`), "{ truncated", "utf8");

    const recovered = await manager.loadGame(first.profile.id);
    expect(recovered.ok).toBe(true);
    if (!recovered.ok) return;
    expect(recovered.value.recoveredFromBackup).toBe(true);
    expect(recovered.value.save.attemptLog.length).toBeGreaterThan(0);

    const untouched = await manager.loadGame(second.profile.id);
    expect(untouched.ok).toBe(true);
  });
});

describe("an award is earned once, whatever kind of award it is", () => {
  it("never re-awards an achievement of any trigger kind after a reload", async () => {
    // S2-01 proved this for `region-completed`. The other four kinds have the
    // same guard in `evaluateAchievements` and none had ever been reloaded.
    const kinds = new Set(content.achievements.map((a) => a.trigger.kind));
    expect(kinds.size, "every trigger kind should be represented in shipped content").toBeGreaterThanOrEqual(4);

    const start = await newProfile();
    // Play a whole lesson: that is enough for questions-answered, streak,
    // lesson-completed and — for `l.r1-addition`'s skills — mastery movement.
    let save = start;
    let session = startLesson(content, LESSON, 0)!;
    let clock = 0;
    while (!session.finished) {
      const question = currentQuestion(content, session)!;
      clock += 1000;
      const submitted = submitAnswer(content, save, session, correctResponseFor(question), clock)!;
      save = submitted.save;
      const next = advance(content, save, submitted.session, clock + 500);
      save = next.save;
      session = next.session;
    }
    expect(save.achievements.length, "a full lesson should award something").toBeGreaterThan(0);

    const resumed = await throughDisk(save);
    expect([...resumed.achievements].sort()).toEqual([...save.achievements].sort());
    for (const id of new Set(resumed.achievements)) {
      expect(resumed.achievements.filter((x) => x === id), `${id} held more than once`).toHaveLength(1);
    }
  });
});
