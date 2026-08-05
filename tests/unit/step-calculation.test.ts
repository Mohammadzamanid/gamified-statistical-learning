/**
 * S2-02: the step-by-step calculation run state machine and its evaluator.
 *
 * The run logic is pure, so everything below exercises real behaviour without a
 * DOM: per-step validation, equivalent numeric formats, per-step hints,
 * misconception classification, and retry from the failed step.
 */
import { describe, expect, it } from "vitest";
import {
  classifyStepValue,
  currentStep,
  finalResponse,
  misconceptionsSeen,
  retryCurrentStep,
  revealStepHint,
  startStepRun,
  stepValueMatches,
  stepsOf,
  submitStep
} from "../../src/core/questions/step-calculation";
import { evaluateResponse } from "../../src/core/questions/evaluators";
import { normalizeResponse } from "../../src/core/questions/normalize";
import { QuestionSchema, type Question } from "../../src/shared/schemas";

/** A three-step mean calculation, mirroring the shape used by shipped content. */
function stepQuestion(): Question {
  return QuestionSchema.parse({
    id: "q.test-steps",
    topicId: "t.center",
    objectiveId: "obj.compute-mean",
    skillIds: ["skill.mean"],
    difficulty: 2,
    interaction: "step-by-step-calculation",
    prompt: "Find the mean of 2, 4, 4, 6, 9 one step at a time.",
    answer: {
      kind: "steps",
      steps: [
        {
          id: "st.total",
          prompt: "Add the values.",
          value: 25,
          tolerance: 0.001,
          hints: ["Add them in any order.", "2 + 4 + 4 + 6 + 9."],
          explanation: "The total is 25."
        },
        {
          id: "st.count",
          prompt: "How many values?",
          value: 5,
          tolerance: 0.001,
          explanation: "There are 5 values."
        },
        {
          id: "st.divide",
          prompt: "Divide the total by the count.",
          value: 5,
          tolerance: 0.001,
          explanation: "25 / 5 = 5.",
          misconceptionValues: [{ value: 25, misconceptionId: "mc.sum-not-mean" }]
        }
      ]
    },
    explanation: "Mean = 25 / 5 = 5.",
    misconceptionIds: ["mc.sum-not-mean"]
  });
}

/** Answers the current step correctly, whatever it is. */
function answerCurrentCorrectly(question: Question, state: ReturnType<typeof startStepRun>) {
  const step = currentStep(question, state)!;
  return submitStep(question, state, String(step.value));
}

describe("step value matching", () => {
  const step = stepsOf(stepQuestion())[0]!;

  it("accepts the exact value", () => {
    expect(stepValueMatches(step, 25)).toBe(true);
  });

  it("rejects a wrong value and an unparseable one", () => {
    expect(stepValueMatches(step, 24)).toBe(false);
    expect(stepValueMatches(step, null)).toBe(false);
  });

  it("accepts declared equivalent values", () => {
    const withAlt = { ...step, value: 30, acceptedValues: [0.3] };
    expect(stepValueMatches(withAlt, 0.3)).toBe(true);
    expect(stepValueMatches(withAlt, 30)).toBe(true);
  });

  it("classifies a declared wrong value to its misconception", () => {
    const divide = stepsOf(stepQuestion())[2]!;
    expect(classifyStepValue(divide, 25)).toBe("mc.sum-not-mean");
    expect(classifyStepValue(divide, 7)).toBeNull();
  });
});

describe("step-by-step run", () => {
  it("advances one step at a time and completes only after the last step", () => {
    const q = stepQuestion();
    let state = startStepRun(q);
    expect(state.status).toBe("in-progress");
    expect(currentStep(q, state)?.id).toBe("st.total");

    let r = answerCurrentCorrectly(q, state);
    state = r.state;
    expect(r.runComplete).toBe(false);
    expect(r.explanation).toBe("The total is 25.");
    expect(currentStep(q, state)?.id).toBe("st.count");

    r = answerCurrentCorrectly(q, state);
    state = r.state;
    expect(r.runComplete).toBe(false);
    expect(currentStep(q, state)?.id).toBe("st.divide");

    r = answerCurrentCorrectly(q, state);
    state = r.state;
    expect(r.runComplete).toBe(true);
    expect(state.status).toBe("complete");
    expect(state.accepted.map((a) => a.stepId)).toEqual(["st.total", "st.count", "st.divide"]);
  });

  it("accepts equivalent numeric formats for a step", () => {
    const q = stepQuestion();
    const state = startStepRun(q);
    // "25.0", a spaced form, and a fraction that reduces to 25 are all the same quantity.
    for (const text of ["25", "25.0", " 25 ", "50/2"]) {
      const r = submitStep(q, state, text);
      expect(r.attempt.correct, `expected "${text}" to be accepted`).toBe(true);
    }
  });

  it("keeps the learner on the failed step and preserves earlier work", () => {
    const q = stepQuestion();
    let state = startStepRun(q);
    state = answerCurrentCorrectly(q, state).state; // st.total accepted

    const wrong = submitStep(q, state, "99");
    expect(wrong.attempt.correct).toBe(false);
    expect(wrong.state.status).toBe("awaiting-retry");
    // Still on st.count, and st.total is still banked.
    expect(currentStep(q, wrong.state)?.id).toBe("st.count");
    expect(wrong.state.accepted.map((a) => a.stepId)).toEqual(["st.total"]);

    const retried = retryCurrentStep(wrong.state);
    expect(retried.status).toBe("in-progress");
    const good = answerCurrentCorrectly(q, retried);
    expect(good.attempt.correct).toBe(true);
    expect(good.state.accepted.map((a) => a.stepId)).toEqual(["st.total", "st.count"]);
  });

  it("records a wrong step's misconception and surfaces it for the run", () => {
    const q = stepQuestion();
    let state = startStepRun(q);
    state = answerCurrentCorrectly(q, state).state;
    state = answerCurrentCorrectly(q, state).state;

    // Reporting the total again instead of dividing is the classic error here.
    const wrong = submitStep(q, state, "25");
    expect(wrong.attempt.correct).toBe(false);
    expect(wrong.attempt.misconceptionId).toBe("mc.sum-not-mean");
    expect(misconceptionsSeen(wrong.state)).toEqual(["mc.sum-not-mean"]);
  });

  it("reveals hints for the current step only and resets them on advance", () => {
    const q = stepQuestion();
    let state = startStepRun(q);

    const first = revealStepHint(q, state);
    expect(first.hint).toBe("Add them in any order.");
    const second = revealStepHint(q, first.state);
    expect(second.hint).toBe("2 + 4 + 4 + 6 + 9.");
    const exhausted = revealStepHint(q, second.state);
    expect(exhausted.hint).toBeNull();
    expect(second.state.totalHintsUsed).toBe(2);

    state = answerCurrentCorrectly(q, second.state).state;
    // st.count declares no hints, and the per-step counter restarts.
    expect(state.hintsRevealedThisStep).toBe(0);
    expect(revealStepHint(q, state).hint).toBeNull();
    expect(state.totalHintsUsed).toBe(2);
  });

  it("refuses to build a response from an unfinished run", () => {
    const q = stepQuestion();
    const state = startStepRun(q);
    expect(() => finalResponse(state)).toThrow(/not complete/);
  });
});

describe("steps evaluation", () => {
  it("marks a fully correct run correct", () => {
    const q = stepQuestion();
    let state = startStepRun(q);
    for (let i = 0; i < 3; i++) state = answerCurrentCorrectly(q, state).state;

    const evaluation = evaluateResponse(q, normalizeResponse(finalResponse(state)));
    expect(evaluation.correct).toBe(true);
  });

  it("marks a run with a wrong step incorrect and names the first failure", () => {
    const q = stepQuestion();
    const response = normalizeResponse({
      kind: "steps",
      steps: [
        { stepId: "st.total", text: "25" },
        { stepId: "st.count", text: "5" },
        { stepId: "st.divide", text: "25" }
      ]
    });
    const evaluation = evaluateResponse(q, response);
    expect(evaluation.correct).toBe(false);
    expect(evaluation.signals["firstFailedStepId"]).toBe("st.divide");
    expect(evaluation.signals["stepMisconceptionIds"]).toEqual(["mc.sum-not-mean"]);
  });

  it("rejects a partial run that omits a step", () => {
    const q = stepQuestion();
    const response = normalizeResponse({
      kind: "steps",
      steps: [
        { stepId: "st.total", text: "25" },
        { stepId: "st.count", text: "5" }
      ]
    });
    expect(evaluateResponse(q, response).correct).toBe(false);
  });

  it("rejects a response of the wrong kind", () => {
    const q = stepQuestion();
    const evaluation = evaluateResponse(q, normalizeResponse({ kind: "numeric", text: "5" }));
    expect(evaluation.correct).toBe(false);
    expect(evaluation.signals["responseKindMismatch"]).toBe(true);
  });
});

describe("steps schema", () => {
  it("rejects a steps answer on a non-step interaction", () => {
    const bad = QuestionSchema.safeParse({
      ...stepQuestion(),
      interaction: "numeric-input"
    });
    expect(bad.success).toBe(false);
  });

  it("rejects a step interaction without a steps answer", () => {
    const bad = QuestionSchema.safeParse({
      ...stepQuestion(),
      answer: { kind: "numeric", value: 5, tolerance: 0.001 }
    });
    expect(bad.success).toBe(false);
  });

  it("rejects duplicate step ids", () => {
    const q = stepQuestion();
    const steps = stepsOf(q);
    const bad = QuestionSchema.safeParse({
      ...q,
      answer: { kind: "steps", steps: [steps[0], { ...steps[1], id: steps[0]!.id }] }
    });
    expect(bad.success).toBe(false);
  });
});
