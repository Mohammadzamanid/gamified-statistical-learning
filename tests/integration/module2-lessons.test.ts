/**
 * S2-08: Module 2 (`m.r1-parts`) driven through the real session engine.
 *
 * Same contract as `module1-lessons.test.ts`: the structure audit checks the 18
 * requirements are present and honest, and this file checks they *work* —
 * the module can be walked from a fresh profile in curriculum order, every
 * question can actually be answered correctly, and each declared misconception
 * is reachable from the specific wrong answer a learner holding it would give.
 *
 * Module 2 carries one thing Module 1 did not: fractions, decimals, percentages
 * and proportions are four ways of writing the same kind of quantity, so the
 * mistakes here are mostly *misreadings across those forms*. Those are worth
 * exercising through the engine rather than trusting to content review.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import type { SaveFile } from "../../src/shared/schemas";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { isLessonUnlocked } from "../../src/core/curriculum/progress";
import { startLesson, submitAnswer, advance } from "../../src/renderer/state/session";
import type { RawResponse } from "../../src/core/questions/types";
import { freshSave as makeSave, playLesson as play, skillsOfLesson } from "../helpers/lesson-playthrough";
import { COMPLETE_LESSONS } from "../helpers/complete-lessons";

const content = loadShippedContent();

const MODULE_1 = content.curriculum.modules.find((m) => m.id === "m.r1-counting")!;
const MODULE_2 = content.curriculum.modules.find((m) => m.id === "m.r1-parts")!;

const freshSave = (): SaveFile => makeSave("p.module2", "Curer");
const playLesson = (save: SaveFile, lessonId: string, startMs: number): SaveFile =>
  play(content, save, lessonId, startMs);

/** Module 2 sits behind Module 1, so reaching it means finishing that first. */
function saveWithModule1Done(): SaveFile {
  let save = freshSave();
  let t = 1000;
  for (const lessonId of MODULE_1.lessonIds) save = playLesson(save, lessonId, (t += 60_000));
  return save;
}

describe("Module 2 can be played once Module 1 is done", () => {
  beforeAll(() => {
    clearDetectors();
    registerBuiltInDetectors();
  });

  it("has every one of its lessons declared Complete", () => {
    const notDeclared = MODULE_2.lessonIds.filter((id) => !COMPLETE_LESSONS.includes(id));
    expect(notDeclared, `Module 2 lessons missing from COMPLETE_LESSONS: ${notDeclared.join(", ")}`).toEqual([]);
  });

  it("is locked to a brand-new learner", () => {
    const save = freshSave();
    for (const lessonId of MODULE_2.lessonIds) {
      expect(
        isLessonUnlocked(content.curriculum, save, lessonId),
        `${lessonId} is open before Module 1 has been touched`
      ).toBe(false);
    }
  });

  it("unlocks one lesson at a time, in the declared order", () => {
    let save = saveWithModule1Done();
    let t = 500_000;

    for (const [i, lessonId] of MODULE_2.lessonIds.entries()) {
      expect(isLessonUnlocked(content.curriculum, save, lessonId), `${lessonId} should be open by now`).toBe(true);
      const next = MODULE_2.lessonIds[i + 1];
      if (next) {
        expect(isLessonUnlocked(content.curriculum, save, next), `${next} unlocked before ${lessonId} was done`).toBe(
          false
        );
      }
      save = playLesson(save, lessonId, t);
      t += 60_000;
    }

    for (const lessonId of MODULE_2.lessonIds) {
      expect(save.lessonProgress[lessonId]?.status).toBe("completed");
    }
  });

  it("schedules every Module 2 skill for review once its lesson is played", () => {
    let save = saveWithModule1Done();
    let t = 500_000;
    for (const lessonId of MODULE_2.lessonIds) save = playLesson(save, lessonId, (t += 60_000));

    for (const skillId of new Set(MODULE_2.lessonIds.flatMap((id) => skillsOfLesson(content, id)))) {
      expect(save.skillStates[skillId]?.attempts, `${skillId} recorded no attempts`).toBeGreaterThan(0);
      expect(save.reviewQueue.some((r) => r.skillId === skillId), `${skillId} was never scheduled`).toBe(true);
    }
  });
});

describe("every misconception Module 2 declares is genuinely reachable", () => {
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
      lessonId: "l.r1-fractions",
      questionId: "q.r1-fractions-independent",
      // 2 of 5 holds loaded, answered upside down as 5/2.
      response: { kind: "numeric", text: "2.5" },
      misconceptionId: "mc.reversed-fraction",
      remediationId: "rem.fraction-order"
    },
    {
      lessonId: "l.r1-fractions",
      questionId: "q.r1-fractions-misconception",
      response: { kind: "choice", choiceIds: ["ch.eighth"] },
      misconceptionId: "mc.bigger-denominator-bigger-fraction",
      remediationId: "rem.smaller-pieces"
    },
    {
      lessonId: "l.r1-decimals",
      questionId: "q.r1-decimals-misconception",
      response: { kind: "choice", choiceIds: ["ch.quarter"] },
      misconceptionId: "mc.longer-decimal-is-bigger",
      remediationId: "rem.line-up-the-point"
    },
    {
      lessonId: "l.r1-percentages",
      questionId: "q.r1-percentages-misconception",
      // The share is right, the scale is not: 0.2 where 20% was asked for.
      response: { kind: "numeric", text: "0.2" },
      misconceptionId: "mc.decimal-vs-percent",
      remediationId: "rem.percent-decimal"
    },
    {
      lessonId: "l.r1-ratios",
      questionId: "q.r1-ratios-misconception",
      // 3 parts salt to 5 water, read as 3/5 of the mix instead of 3/8.
      response: { kind: "numeric", text: "0.6" },
      misconceptionId: "mc.ratio-part-as-whole",
      remediationId: "rem.count-all-the-parts"
    },
    {
      lessonId: "l.r1-proportions",
      questionId: "q.r1-proportions-misconception",
      // 2 crates for 6 coins scaled to 6 crates by adding 4 to both.
      response: { kind: "numeric", text: "10" },
      misconceptionId: "mc.additive-scaling",
      remediationId: "rem.scale-both-together"
    }
  ];

  it("covers every misconception the Module 2 lessons declare", () => {
    const declared = new Set(
      MODULE_2.lessonIds
        .flatMap((id) => content.curriculum.lessons.find((l) => l.id === id)!.questionIds)
        .flatMap((qid) => content.questions.get(qid)!.misconceptionIds)
    );
    const exercised = new Set(SLIPS.map((s) => s.misconceptionId));
    const missing = [...declared].filter((m) => !exercised.has(m));
    expect(missing, `Module 2 declares misconceptions no test triggers: ${missing.join(", ")}`).toEqual([]);
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

  it("catches additive scaling at the step it happens, not only at the total", () => {
    // The proportions mastery check works through the rate explicitly. Answering
    // the scaled cost as 18 is the additive slip, and it must be named there.
    const save = freshSave();
    const lesson = content.curriculum.lessons.find((l) => l.id === "l.r1-proportions")!;
    const index = lesson.questionIds.indexOf("q.r1-proportions-mastery");
    const started = startLesson(content, "l.r1-proportions", 0)!;
    const result = submitAnswer(
      content,
      save,
      { ...started, currentIndex: index, questionShownAtMs: 0 },
      {
        kind: "steps",
        steps: [
          { stepId: "st.rate", text: "3" },
          { stepId: "st.scale", text: "18" },
          { stepId: "st.check", text: "3" }
        ]
      },
      4000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.additive-scaling");
  });

  it("names the scale slip when a percentage is answered as a share", () => {
    // The percentages mastery check asks for the 0-100 scale at its last step.
    const save = freshSave();
    const lesson = content.curriculum.lessons.find((l) => l.id === "l.r1-percentages")!;
    const index = lesson.questionIds.indexOf("q.r1-percentages-mastery");
    const started = startLesson(content, "l.r1-percentages", 0)!;
    const result = submitAnswer(
      content,
      save,
      { ...started, currentIndex: index, questionShownAtMs: 0 },
      {
        kind: "steps",
        steps: [
          { stepId: "st.part", text: "12" },
          { stepId: "st.share", text: "0.3" },
          { stepId: "st.scale", text: "0.3" }
        ]
      },
      4000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.decimal-vs-percent");
  });

  it("does not cry misconception when the answer is merely wrong", () => {
    const save = freshSave();
    const lesson = content.curriculum.lessons.find((l) => l.id === "l.r1-ratios")!;
    const index = lesson.questionIds.indexOf("q.r1-ratios-misconception");
    const started = startLesson(content, "l.r1-ratios", 0)!;
    const result = submitAnswer(
      content,
      save,
      { ...started, currentIndex: index, questionShownAtMs: 0 },
      { kind: "numeric", text: "0.9" },
      4000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception).toBeNull();
  });
});

describe("the four ways of writing a share stay consistent", () => {
  // Fractions, decimals, percentages and proportions are the same quantity in
  // different costumes. If the content ever disagrees with itself about that,
  // the lessons contradict each other rather than build on each other.
  it("teaches a quarter identically as a fraction, a decimal and a percentage", () => {
    const quarter = content.questions.get("q.r1-fractions")!;
    const percent = content.questions.get("q.r1-percentages")!;
    expect(quarter.answer.kind).toBe("numeric");
    expect(percent.answer.kind).toBe("numeric");
    if (quarter.answer.kind !== "numeric" || percent.answer.kind !== "numeric") return;

    // 3 of 4 holds full is 0.75; a quarter of the fleet in harbour is 25%.
    expect(quarter.answer.value).toBeCloseTo(0.75, 5);
    expect(percent.answer.value).toBeCloseTo(25, 5);
    expect(1 - quarter.answer.value).toBeCloseTo(percent.answer.value / 100, 5);
  });

  it("keeps every proportion answer inside 0 to 1 and every percentage inside 0 to 100", () => {
    const scaled: Array<[string, number, number]> = [
      ["l.r1-proportions", 0, 1],
      ["l.r1-percentages", 0, 100]
    ];
    for (const [lessonId, low, high] of scaled) {
      const lesson = content.curriculum.lessons.find((l) => l.id === lessonId)!;
      for (const qid of lesson.questionIds) {
        const q = content.questions.get(qid)!;
        if (q.answer.kind !== "numeric") continue;
        // Application questions count crates rather than reporting a share, so
        // only the ones carrying the scale's unit are held to its range.
        const reportsAShare = lessonId === "l.r1-proportions" ? q.answer.unit === undefined : q.answer.unit === "%";
        if (!reportsAShare) continue;
        expect(q.answer.value, `${qid} is outside the ${low} to ${high} scale`).toBeGreaterThanOrEqual(low);
        expect(q.answer.value, `${qid} is outside the ${low} to ${high} scale`).toBeLessThanOrEqual(high);
      }
    }
  });
});
