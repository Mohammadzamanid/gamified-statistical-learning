/**
 * S2-08: Module 3 (`m.r1-position`) driven through the real session engine.
 *
 * Same contract as the Module 1 and 2 files. What is particular here is that
 * position is taught almost entirely through `point-placement`, so this module
 * is the one place where "the learner can actually reach the answer" is a claim
 * about a *widget* rather than about arithmetic. The keyboard walk below is
 * therefore not decoration: it proves every shipped target can be reached with
 * arrow keys alone, on the real field, without a pointer.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import type { SaveFile } from "../../src/shared/schemas";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { isLessonUnlocked } from "../../src/core/curriculum/progress";
import { startLesson, submitAnswer, advance } from "../../src/renderer/state/session";
import type { RawResponse } from "../../src/core/questions/types";
import { movePoint, pointFieldOf, startPosition } from "../../src/core/questions/point-placement";
import { freshSave as makeSave, playLesson as play, skillsOfLesson } from "../helpers/lesson-playthrough";
import { COMPLETE_LESSONS } from "../helpers/complete-lessons";

const content = loadShippedContent();

const MODULE_1 = content.curriculum.modules.find((m) => m.id === "m.r1-counting")!;
const MODULE_3 = content.curriculum.modules.find((m) => m.id === "m.r1-position")!;

const freshSave = (): SaveFile => makeSave("p.module3", "Pilot");
const playLesson = (save: SaveFile, lessonId: string, startMs: number): SaveFile =>
  play(content, save, lessonId, startMs);

/** Module 3 sits behind Module 1, so reaching it means finishing that first. */
function saveWithModule1Done(): SaveFile {
  let save = freshSave();
  let t = 1000;
  for (const lessonId of MODULE_1.lessonIds) save = playLesson(save, lessonId, (t += 60_000));
  return save;
}

describe("Module 3 can be played once Module 1 is done", () => {
  beforeAll(() => {
    clearDetectors();
    registerBuiltInDetectors();
  });

  it("has every one of its lessons declared Complete", () => {
    const notDeclared = MODULE_3.lessonIds.filter((id) => !COMPLETE_LESSONS.includes(id));
    expect(notDeclared, `Module 3 lessons missing from COMPLETE_LESSONS: ${notDeclared.join(", ")}`).toEqual([]);
  });

  it("is locked to a brand-new learner", () => {
    const save = freshSave();
    for (const lessonId of MODULE_3.lessonIds) {
      expect(
        isLessonUnlocked(content.curriculum, save, lessonId),
        `${lessonId} is open before Module 1 has been touched`
      ).toBe(false);
    }
  });

  it("unlocks one lesson at a time, in the declared order", () => {
    let save = saveWithModule1Done();
    let t = 500_000;

    for (const [i, lessonId] of MODULE_3.lessonIds.entries()) {
      expect(isLessonUnlocked(content.curriculum, save, lessonId), `${lessonId} should be open by now`).toBe(true);
      const next = MODULE_3.lessonIds[i + 1];
      if (next) {
        expect(isLessonUnlocked(content.curriculum, save, next), `${next} unlocked before ${lessonId} was done`).toBe(
          false
        );
      }
      save = playLesson(save, lessonId, t);
      t += 60_000;
    }

    for (const lessonId of MODULE_3.lessonIds) {
      expect(save.lessonProgress[lessonId]?.status).toBe("completed");
    }
  });

  it("schedules every Module 3 skill for review once its lesson is played", () => {
    let save = saveWithModule1Done();
    let t = 500_000;
    for (const lessonId of MODULE_3.lessonIds) save = playLesson(save, lessonId, (t += 60_000));

    for (const skillId of new Set(MODULE_3.lessonIds.flatMap((id) => skillsOfLesson(content, id)))) {
      expect(save.skillStates[skillId]?.attempts, `${skillId} recorded no attempts`).toBeGreaterThan(0);
      expect(save.reviewQueue.some((r) => r.skillId === skillId), `${skillId} was never scheduled`).toBe(true);
    }
  });
});

describe("every position target is reachable by keyboard alone", () => {
  beforeAll(() => {
    clearDetectors();
    registerBuiltInDetectors();
  });

  const placementQuestions = MODULE_3.lessonIds
    .flatMap((id) => content.curriculum.lessons.find((l) => l.id === id)!.questionIds)
    .map((qid) => content.questions.get(qid)!)
    .filter((q) => q.interaction === "point-placement");

  it("has point-placement questions to check", () => {
    expect(placementQuestions.length, "Module 3 teaches position but ships no placements").toBeGreaterThan(0);
  });

  for (const question of placementQuestions) {
    it(`${question.id} can be stepped to with arrow keys and submitted`, () => {
      const field = pointFieldOf(question)!;
      expect(field, `${question.id} has no point field`).toBeDefined();
      if (question.answer.kind !== "point") throw new Error(`${question.id} is not a point answer`);
      const target = question.answer;

      // Walk there one step at a time, using only the operation the arrow keys
      // perform. No pointer, no direct assignment — if a target needs a mouse,
      // this loop cannot reach it.
      let position = startPosition(field);
      let guard = 0;
      while (Math.abs(position.x - target.x) > 1e-9) {
        expect(guard++, `${question.id}: could not step to x=${target.x}`).toBeLessThan(200);
        position = movePoint(field, position, "x", position.x < target.x ? 1 : -1);
      }
      if (target.y !== undefined) {
        while (Math.abs((position.y ?? 0) - target.y) > 1e-9) {
          expect(guard++, `${question.id}: could not step to y=${target.y}`).toBeLessThan(400);
          position = movePoint(field, position, "y", (position.y ?? 0) < target.y ? 1 : -1);
        }
      }

      const response: RawResponse =
        position.y === null
          ? { kind: "point", x: position.x }
          : { kind: "point", x: position.x, y: position.y };

      const save = freshSave();
      const lessonId = MODULE_3.lessonIds.find((id) =>
        content.curriculum.lessons.find((l) => l.id === id)!.questionIds.includes(question.id)
      )!;
      const lesson = content.curriculum.lessons.find((l) => l.id === lessonId)!;
      const started = startLesson(content, lessonId, 0)!;
      const result = submitAnswer(
        content,
        save,
        { ...started, currentIndex: lesson.questionIds.indexOf(question.id), questionShownAtMs: 0 },
        response,
        4000
      )!;
      expect(result.feedback.correct, `${question.id} was walked to by keyboard but marked wrong`).toBe(true);
    });
  }
});

describe("every misconception Module 3 declares is genuinely reachable", () => {
  beforeAll(() => {
    clearDetectors();
    registerBuiltInDetectors();
  });

  const SLIPS: ReadonlyArray<{
    lessonId: string;
    questionId: string;
    response: RawResponse;
    misconceptionId: string;
    remediationId: string;
  }> = [
    {
      lessonId: "l.r1-negatives",
      questionId: "q.r1-negatives-misconception",
      response: { kind: "choice", choiceIds: ["ch.n12"] },
      misconceptionId: "mc.negative-magnitude",
      remediationId: "rem.below-zero"
    },
    {
      lessonId: "l.r1-number-lines",
      questionId: "q.r1-number-lines-misconception",
      // Counted the 2-metre marks as if each were one metre: 14 became 7.
      response: { kind: "point", x: 7 },
      misconceptionId: "mc.tick-counted-not-scaled",
      remediationId: "rem.read-the-scale"
    },
    {
      lessonId: "l.r1-coordinates",
      questionId: "q.r1-coordinates-misconception",
      // (1, 5) plotted as (5, 1) — right pair, wrong axes.
      response: { kind: "point", x: 5, y: 1 },
      misconceptionId: "mc.axes-swapped",
      remediationId: "rem.axes-order"
    }
  ];

  it("covers every misconception the Module 3 lessons declare", () => {
    const declared = new Set(
      MODULE_3.lessonIds
        .flatMap((id) => content.curriculum.lessons.find((l) => l.id === id)!.questionIds)
        .flatMap((qid) => content.questions.get(qid)!.misconceptionIds)
    );
    const exercised = new Set(SLIPS.map((s) => s.misconceptionId));
    const missing = [...declared].filter((m) => !exercised.has(m));
    expect(missing, `Module 3 declares misconceptions no test triggers: ${missing.join(", ")}`).toEqual([]);
  });

  for (const slip of SLIPS) {
    it(`${slip.misconceptionId} is detected and remediated on ${slip.questionId}`, () => {
      const save = freshSave();
      const lesson = content.curriculum.lessons.find((l) => l.id === slip.lessonId)!;
      const index = lesson.questionIds.indexOf(slip.questionId);
      expect(index, `${slip.questionId} is not asked by ${slip.lessonId}`).toBeGreaterThanOrEqual(0);

      const started = startLesson(content, slip.lessonId, 0)!;
      const result = submitAnswer(
        content,
        save,
        { ...started, currentIndex: index, questionShownAtMs: 0 },
        slip.response,
        4000
      )!;

      expect(result.feedback.correct, `${slip.questionId}: the "wrong" answer was accepted`).toBe(false);
      expect(result.feedback.misconception?.id).toBe(slip.misconceptionId);
      expect(result.feedback.remediation?.id).toBe(slip.remediationId);
      expect(result.feedback.message.length, "the learner is given no targeted message").toBeGreaterThan(20);

      const followUps = content.remediations.find((r) => r.id === slip.remediationId)!.followUpQuestionIds;
      expect(followUps.length, `${slip.remediationId} has no follow-up question`).toBeGreaterThan(0);
      for (const fid of followUps) {
        expect(result.session.pendingFollowUps, `${fid} was not queued`).toContain(fid);
      }

      const adv = advance(content, result.save, result.session, 5000);
      expect(adv.session.questionQueue[adv.session.currentIndex]).toBe(followUps[0]);
    });
  }

  it("does not cry misconception when a placement is merely wrong", () => {
    const save = freshSave();
    const lesson = content.curriculum.lessons.find((l) => l.id === "l.r1-number-lines")!;
    const index = lesson.questionIds.indexOf("q.r1-number-lines-misconception");
    const started = startLesson(content, "l.r1-number-lines", 0)!;
    const result = submitAnswer(
      content,
      save,
      { ...started, currentIndex: index, questionShownAtMs: 0 },
      { kind: "point", x: 11 },
      4000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception).toBeNull();
  });

  it("distinguishes a swapped pair from a simply misplaced one", () => {
    // (1, 5) plotted at (2, 4) is wrong but is not the axes-swapped error, and
    // must not be reported as it — otherwise the misconception counts inflate.
    const save = freshSave();
    const lesson = content.curriculum.lessons.find((l) => l.id === "l.r1-coordinates")!;
    const index = lesson.questionIds.indexOf("q.r1-coordinates-misconception");
    const started = startLesson(content, "l.r1-coordinates", 0)!;
    const result = submitAnswer(
      content,
      save,
      { ...started, currentIndex: index, questionShownAtMs: 0 },
      { kind: "point", x: 2, y: 4 },
      4000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception).toBeNull();
  });
});

describe("position content agrees with itself about direction", () => {
  it("keeps every number-line target inside its own field", () => {
    for (const lessonId of MODULE_3.lessonIds) {
      const lesson = content.curriculum.lessons.find((l) => l.id === lessonId)!;
      for (const qid of lesson.questionIds) {
        const q = content.questions.get(qid)!;
        if (q.answer.kind !== "point" || !q.pointField) continue;
        expect(q.answer.x, `${qid} target is left of its field`).toBeGreaterThanOrEqual(q.pointField.xMin);
        expect(q.answer.x, `${qid} target is right of its field`).toBeLessThanOrEqual(q.pointField.xMax);
      }
    }
  });

  it("teaches at least one target below zero", () => {
    // A "negative numbers and number lines" module whose every placement sits on
    // the positive side would never exercise the thing it exists to teach.
    const targets = MODULE_3.lessonIds
      .flatMap((id) => content.curriculum.lessons.find((l) => l.id === id)!.questionIds)
      .map((qid) => content.questions.get(qid)!)
      .filter((q) => q.answer.kind === "point")
      .map((q) => (q.answer.kind === "point" ? q.answer.x : 0));
    expect(targets.some((x) => x < 0), "no Module 3 placement is below zero").toBe(true);
  });
});
