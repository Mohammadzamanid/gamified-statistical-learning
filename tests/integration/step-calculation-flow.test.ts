/**
 * S2-02: step-by-step calculations driven through the real session engine.
 *
 * The unit tests cover the run state machine in isolation; this file proves the
 * completed run reaches the rest of the system — evaluation, misconception
 * classification, remediation, guided retry, mastery, and review scheduling —
 * exactly like every other interaction type.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { advance, startLesson, submitAnswer } from "../../src/renderer/state/session";
import { getInteraction, registerDefaultInteractions } from "../../src/core/questions/registry";
import {
  currentStep,
  finalResponse,
  startStepRun,
  stepsOf,
  submitStep
} from "../../src/core/questions/step-calculation";
import { createEmptySave, type Question, type SaveFile } from "../../src/shared/schemas";
import type { RawResponse } from "../../src/core/questions/types";

const content = loadShippedContent();

beforeAll(() => {
  clearDetectors();
  registerBuiltInDetectors();
  registerDefaultInteractions();
});

function freshSave(): SaveFile {
  return createEmptySave({
    id: "p.steps",
    name: "Steps Tester",
    createdAt: new Date().toISOString(),
    isGuest: false,
    avatarSeed: 0
  });
}

/** Positions a session on a specific question inside its lesson. */
function sessionOn(lessonId: string, questionId: string) {
  const session = startLesson(content, lessonId, 0)!;
  const index = session.questionQueue.indexOf(questionId);
  expect(index, `${questionId} should be in ${lessonId}`).toBeGreaterThanOrEqual(0);
  return { ...session, currentIndex: index, questionShownAtMs: 0 };
}

/** Plays a whole run through the pure state machine and returns its response. */
function playRun(question: Question, valueFor: (stepId: string) => string): RawResponse {
  let state = startStepRun(question);
  let guard = 0;
  while (state.status !== "complete") {
    expect(guard++).toBeLessThan(20);
    const step = currentStep(question, state)!;
    const result = submitStep(question, state, valueFor(step.id));
    // Only correct submissions advance; this helper is used with correct values.
    expect(result.attempt.correct, `step ${step.id} rejected "${valueFor(step.id)}"`).toBe(true);
    state = result.state;
  }
  return finalResponse(state);
}

describe("step-by-step calculation is a live interaction", () => {
  it("is registered as implemented and produces a steps response", () => {
    const descriptor = getInteraction("step-by-step-calculation");
    expect(descriptor?.implemented).toBe(true);
    expect(descriptor?.responseKind).toBe("steps");
  });

  it("ships at least three step questions, all inside real lessons", () => {
    const stepQuestions = [...content.questions.values()].filter(
      (q) => q.interaction === "step-by-step-calculation"
    );
    expect(stepQuestions.length).toBeGreaterThanOrEqual(3);

    const inLessons = new Set(content.curriculum.lessons.flatMap((l) => l.questionIds));
    for (const q of stepQuestions) {
      expect(inLessons.has(q.id), `${q.id} must be reachable from a lesson`).toBe(true);
      expect(stepsOf(q).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every declared step misconception resolves to a real remediation", () => {
    const byId = new Map(content.misconceptions.map((m) => [m.id, m]));
    const remediationIds = new Set(content.remediations.map((r) => r.id));
    for (const q of content.questions.values()) {
      for (const step of stepsOf(q)) {
        for (const mv of step.misconceptionValues) {
          const mc = byId.get(mv.misconceptionId);
          expect(mc, `${q.id}/${step.id} -> ${mv.misconceptionId}`).toBeDefined();
          expect(remediationIds.has(mc!.remediationId)).toBe(true);
        }
      }
    }
  });
});

describe("a completed run flows through the session engine", () => {
  it("scores a correct run correct and updates mastery and review", () => {
    const save = freshSave();
    const session = sessionOn("l.reading-tallies", "q.step-mean-catch");
    const question = content.questions.get("q.step-mean-catch")!;

    const response = playRun(question, (id) => {
      const step = stepsOf(question).find((s) => s.id === id)!;
      return String(step.value);
    });

    const result = submitAnswer(content, save, session, response, 9000)!;
    expect(result.feedback.correct).toBe(true);
    expect(result.save.skillStates["skill.mean"]?.correct).toBe(1);
    expect(result.save.reviewQueue.some((r) => r.skillId === "skill.mean")).toBe(true);
    expect(result.save.xp).toBeGreaterThan(0);
  });

  it("classifies a wrong final step, offers remediation, and injects the follow-up", () => {
    const save = freshSave();
    const session = sessionOn("l.reading-tallies", "q.step-mean-catch");

    // Correct total and count, then report the total again instead of dividing.
    const response: RawResponse = {
      kind: "steps",
      steps: [
        { stepId: "st.mean.total", text: "25" },
        { stepId: "st.mean.count", text: "5" },
        { stepId: "st.mean.divide", text: "25" }
      ]
    };

    const result = submitAnswer(content, save, session, response, 9000)!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.sum-not-mean");
    expect(result.feedback.remediation?.id).toBe("rem.divide-by-count");
    expect(result.save.skillStates["skill.mean"]?.misconceptionCounts["mc.sum-not-mean"]).toBe(1);

    // The guided retry is injected right after this question, as for any other type.
    expect(result.session.pendingFollowUps.length).toBeGreaterThan(0);
    const adv = advance(content, result.save, result.session, 10_000);
    expect(adv.session.questionQueue[adv.session.currentIndex]).toBe(result.session.pendingFollowUps[0]);
  });

  it("classifies a decimal left unscaled on the percentage question", () => {
    const save = freshSave();
    const session = sessionOn("l.reading-tallies", "q.step-percent-rainy");

    const response: RawResponse = {
      kind: "steps",
      steps: [
        { stepId: "st.pct.part", text: "12" },
        { stepId: "st.pct.proportion", text: "0.3" },
        { stepId: "st.pct.scale", text: "0.3" }
      ]
    };

    const result = submitAnswer(content, save, session, response, 9000)!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.decimal-vs-percent");
  });

  it("classifies the mean reported in place of the median", () => {
    const save = freshSave();
    const session = sessionOn("l.middle-harbor", "q.step-median-market");

    // 3 + 15 + 8 + 7 + 12 = 45, and 45 / 5 = 9 — the mean, not the median.
    const response: RawResponse = {
      kind: "steps",
      steps: [
        { stepId: "st.med.count", text: "5" },
        { stepId: "st.med.position", text: "3" },
        { stepId: "st.med.value", text: "9" }
      ]
    };

    const result = submitAnswer(content, save, session, response, 9000)!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.mean-median-confusion");
  });

  it("accepts a fraction typed for the proportion step", () => {
    const save = freshSave();
    const session = sessionOn("l.reading-tallies", "q.step-percent-rainy");

    const response: RawResponse = {
      kind: "steps",
      steps: [
        { stepId: "st.pct.part", text: "12" },
        { stepId: "st.pct.proportion", text: "12/40" },
        { stepId: "st.pct.scale", text: "30" }
      ]
    };

    expect(submitAnswer(content, save, session, response, 9000)!.feedback.correct).toBe(true);
  });
});
