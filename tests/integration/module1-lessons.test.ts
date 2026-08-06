/**
 * S2-08: Module 1 driven through the real session engine.
 *
 * `tests/audit/lesson-structure.test.ts` checks the 18 requirements are present
 * and honest. This file checks they *work*: a fresh learner can walk the module
 * in curriculum order, every question the lessons ask can actually be answered
 * correctly, each declared misconception is genuinely reachable from a wrong
 * answer, and the remediation the learner is handed is the one the content says
 * it should be.
 *
 * The playthrough is driven from the content itself rather than a hand-written
 * answer table, so a question added to any of these lessons is exercised here
 * automatically instead of being silently skipped.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import type { SaveFile } from "../../src/shared/schemas";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { isLessonUnlocked } from "../../src/core/curriculum/progress";
import { advance, startLesson, submitAnswer } from "../../src/renderer/state/session";
import type { RawResponse } from "../../src/core/questions/types";
import { freshSave as makeSave, playLesson as play, skillsOfLesson } from "../helpers/lesson-playthrough";
import { COMPLETE_LESSONS } from "../helpers/complete-lessons";

const content = loadShippedContent();

/** Module 1 in the order the curriculum declares, not source-array order. */
const MODULE_1 = content.curriculum.modules.find((m) => m.id === "m.r1-counting")!;

const freshSave = (): SaveFile => makeSave("p.module1", "Deckhand");
const playLesson = (save: SaveFile, lessonId: string, startMs: number): SaveFile =>
  play(content, save, lessonId, startMs);

describe("Module 1 can be played from a fresh profile", () => {
  beforeAll(() => {
    clearDetectors();
    registerBuiltInDetectors();
  });

  it("has every one of its lessons declared Complete", () => {
    // A module is only playable end to end here once all of its lessons claim
    // completeness. Other modules may also be Complete — this is a subset check,
    // not an equality one, so finishing a later module does not break this file.
    const notDeclared = MODULE_1.lessonIds.filter((id) => !COMPLETE_LESSONS.includes(id));
    expect(notDeclared, `Module 1 lessons missing from COMPLETE_LESSONS: ${notDeclared.join(", ")}`).toEqual([]);
  });

  it("unlocks one lesson at a time, in the declared order", () => {
    let save = freshSave();
    let t = 1000;
    for (const [i, lessonId] of MODULE_1.lessonIds.entries()) {
      expect(isLessonUnlocked(content.curriculum, save, lessonId), `${lessonId} should be open by now`).toBe(true);
      const next = MODULE_1.lessonIds[i + 1];
      if (next) {
        expect(isLessonUnlocked(content.curriculum, save, next), `${next} unlocked before ${lessonId} was done`).toBe(
          false
        );
      }
      save = playLesson(save, lessonId, t);
      t += 60_000;
    }

    for (const lessonId of MODULE_1.lessonIds) {
      expect(save.lessonProgress[lessonId]?.status).toBe("completed");
    }
  });

  it("schedules every Module 1 skill for review once its lesson is played", () => {
    let save = freshSave();
    let t = 1000;
    for (const lessonId of MODULE_1.lessonIds) save = playLesson(save, lessonId, (t += 60_000));

    const skills = MODULE_1.lessonIds.flatMap((id) => skillsOfLesson(content, id));

    for (const skillId of new Set(skills)) {
      expect(save.skillStates[skillId]?.attempts, `${skillId} recorded no attempts`).toBeGreaterThan(0);
      expect(save.reviewQueue.some((r) => r.skillId === skillId), `${skillId} was never scheduled`).toBe(true);
    }
  });
});

describe("every misconception Module 1 declares is genuinely reachable", () => {
  beforeAll(() => {
    clearDetectors();
    registerBuiltInDetectors();
  });

  /**
   * The wrong answer a learner holding each misconception would actually give.
   *
   * Hand-written on purpose: a generic wrong answer proves the question can be
   * failed, not that the *named* error is detected. Each entry is the specific
   * mistake the misconception describes.
   */
  const SLIPS: ReadonlyArray<{
    lessonId: string;
    questionId: string;
    response: RawResponse;
    misconceptionId: string;
    remediationId: string;
  }> = [
    {
      lessonId: "l.r1-counting",
      questionId: "q.r1-counting-misconception",
      response: { kind: "choice", choiceIds: ["ch.direction"] },
      misconceptionId: "mc.count-off-by-one",
      remediationId: "rem.count-in-groups"
    },
    {
      lessonId: "l.r1-addition",
      questionId: "q.r1-addition-misconception",
      // 47 + 38 with the carried ten thrown away.
      response: { kind: "numeric", text: "75" },
      misconceptionId: "mc.carry-dropped",
      remediationId: "rem.carry-the-ten"
    },
    {
      lessonId: "l.r1-subtraction",
      questionId: "q.r1-subtraction-misconception",
      response: { kind: "choice", choiceIds: ["ch.none"] },
      misconceptionId: "mc.subtract-smaller-from-larger",
      remediationId: "rem.borrow-not-flip"
    },
    {
      lessonId: "l.r1-multiplication",
      questionId: "q.r1-multiplication-misconception",
      // 7 x 4 answered as 7 + 4.
      response: { kind: "numeric", text: "11" },
      misconceptionId: "mc.multiply-as-add",
      remediationId: "rem.equal-groups"
    },
    {
      lessonId: "l.r1-division",
      questionId: "q.r1-division-misconception",
      response: { kind: "choice", choiceIds: ["ch.reversed"] },
      misconceptionId: "mc.divide-reversed",
      remediationId: "rem.who-is-shared"
    }
  ];

  it("covers every misconception the Module 1 lessons declare", () => {
    const declared = new Set(
      MODULE_1.lessonIds
        .flatMap((id) => content.curriculum.lessons.find((l) => l.id === id)!.questionIds)
        .flatMap((qid) => content.questions.get(qid)!.misconceptionIds)
    );
    const exercised = new Set(SLIPS.map((s) => s.misconceptionId));
    const missing = [...declared].filter((m) => !exercised.has(m));
    expect(missing, `Module 1 declares misconceptions no test triggers: ${missing.join(", ")}`).toEqual([]);
  });

  for (const slip of SLIPS) {
    it(`${slip.misconceptionId} is detected and remediated`, () => {
      const save = freshSave();
      const lesson = content.curriculum.lessons.find((l) => l.id === slip.lessonId)!;
      const index = lesson.questionIds.indexOf(slip.questionId);
      expect(index, `${slip.questionId} is not asked by ${slip.lessonId}`).toBeGreaterThanOrEqual(0);

      const started = startLesson(content, slip.lessonId, 0)!;
      const session = { ...started, currentIndex: index, questionShownAtMs: 0 };
      const result = submitAnswer(content, save, session, slip.response, 4000)!;

      expect(result.feedback.correct, `${slip.questionId}: the "wrong" answer was accepted`).toBe(false);
      expect(result.feedback.misconception?.id).toBe(slip.misconceptionId);
      expect(result.feedback.remediation?.id).toBe(slip.remediationId);
      expect(result.feedback.message.length, "the learner is given no targeted message").toBeGreaterThan(20);

      // The remediation's follow-up must be queued, or the pipeline stops at
      // "here is what you did wrong" without giving a second attempt.
      const followUps = content.remediations.find((r) => r.id === slip.remediationId)!.followUpQuestionIds;
      expect(followUps.length, `${slip.remediationId} has no follow-up question`).toBeGreaterThan(0);
      for (const fid of followUps) {
        expect(result.session.pendingFollowUps, `${fid} was not queued`).toContain(fid);
      }

      const adv = advance(content, result.save, result.session, 5000);
      expect(adv.session.questionQueue[adv.session.currentIndex]).toBe(followUps[0]);
    });
  }

  it("records the misconception against the skill, not just the answer", () => {
    const save = freshSave();
    const lesson = content.curriculum.lessons.find((l) => l.id === "l.r1-multiplication")!;
    const index = lesson.questionIds.indexOf("q.r1-multiplication-misconception");
    const started = startLesson(content, "l.r1-multiplication", 0)!;
    const result = submitAnswer(
      content,
      save,
      { ...started, currentIndex: index, questionShownAtMs: 0 },
      { kind: "numeric", text: "11" },
      4000
    )!;
    expect(result.save.skillStates["skill.r1-multiplication"]?.misconceptionCounts["mc.multiply-as-add"]).toBe(1);
  });

  it("does not cry misconception when the answer is merely wrong", () => {
    // A wrong number that is not the named slip must fall through to generic
    // feedback, otherwise the misconception counts mean nothing.
    const save = freshSave();
    const lesson = content.curriculum.lessons.find((l) => l.id === "l.r1-multiplication")!;
    const index = lesson.questionIds.indexOf("q.r1-multiplication-misconception");
    const started = startLesson(content, "l.r1-multiplication", 0)!;
    const result = submitAnswer(
      content,
      save,
      { ...started, currentIndex: index, questionShownAtMs: 0 },
      { kind: "numeric", text: "29" },
      4000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception).toBeNull();
  });

  it("catches a dropped carry at the step it happens, not only at the total", () => {
    // The step-by-step mastery check classifies per step: answering the tens
    // column as 7 is the dropped carry, and it must be named there and then.
    const save = freshSave();
    const lesson = content.curriculum.lessons.find((l) => l.id === "l.r1-addition")!;
    const index = lesson.questionIds.indexOf("q.r1-addition-mastery");
    const started = startLesson(content, "l.r1-addition", 0)!;
    const result = submitAnswer(
      content,
      save,
      { ...started, currentIndex: index, questionShownAtMs: 0 },
      {
        kind: "steps",
        steps: [
          { stepId: "st.units", text: "15" },
          { stepId: "st.tens", text: "7" },
          { stepId: "st.total", text: "75" }
        ]
      },
      4000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.carry-dropped");
  });
});
