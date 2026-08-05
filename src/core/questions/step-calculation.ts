/**
 * Step-by-step calculation runs.
 *
 * A multi-step question is worked one numeric step at a time so a mistake is
 * caught and explained where it happened, not just at the final answer. This
 * module is pure: it owns the whole run state machine so the renderer stays a
 * thin shell and the behaviour is testable without a DOM (D-001).
 *
 * The run produces a single `steps` response at the end, which the ordinary
 * session pipeline evaluates, so mastery, review scheduling, and achievements
 * all update exactly once per question, like every other interaction.
 */
import type { CalculationStep, Question } from "../../shared/schemas";
import { approxEqual, parseUserNumber } from "../../shared/utilities/numeric";
import type { RawResponse } from "./types";

/** A single submission against one step, right or wrong. */
export interface StepAttempt {
  stepId: string;
  rawText: string;
  value: number | null;
  correct: boolean;
  /** Set when a wrong value matches a declared misconception for this step. */
  misconceptionId: string | null;
  hintsUsed: number;
}

export interface StepRunState {
  questionId: string;
  /** Index of the step the learner is working on. */
  currentIndex: number;
  /** Accepted text per step, in step order. */
  accepted: Array<{ stepId: string; text: string }>;
  /** Every submission, including wrong ones, in order. */
  history: StepAttempt[];
  /** Hints revealed for the current step only. */
  hintsRevealedThisStep: number;
  /** Hints revealed across the whole run. */
  totalHintsUsed: number;
  /**
   * `awaiting-retry` means the last submission was wrong and the learner must
   * retry *this* step; earlier accepted steps are kept.
   */
  status: "in-progress" | "awaiting-retry" | "complete";
  lastAttempt: StepAttempt | null;
}

export function isStepQuestion(question: Question): boolean {
  return question.answer.kind === "steps";
}

/** The steps of a step question, or an empty list for any other question. */
export function stepsOf(question: Question): readonly CalculationStep[] {
  return question.answer.kind === "steps" ? question.answer.steps : [];
}

/**
 * Whether a learner value satisfies a step.
 *
 * Accepts equivalent numeric forms: `parseUserNumber` already handles fractions
 * ("3/12"), percent signs, comma decimals, and spaced thousands, and a step may
 * declare extra `acceptedValues` for forms that are equal in meaning but not in
 * number — 0.3 alongside 30 on a percentage step, for instance.
 */
export function stepValueMatches(step: CalculationStep, value: number | null): boolean {
  if (value === null) return false;
  const tolerance = Math.max(step.tolerance, 1e-9);
  if (approxEqual(value, step.value, tolerance)) return true;
  return step.acceptedValues.some((v) => approxEqual(value, v, tolerance));
}

/** The misconception a wrong value identifies at this step, if any. */
export function classifyStepValue(step: CalculationStep, value: number | null): string | null {
  if (value === null) return null;
  const tolerance = Math.max(step.tolerance, 1e-9);
  for (const candidate of step.misconceptionValues) {
    if (approxEqual(value, candidate.value, tolerance)) return candidate.misconceptionId;
  }
  return null;
}

export function startStepRun(question: Question): StepRunState {
  return {
    questionId: question.id,
    currentIndex: 0,
    accepted: [],
    history: [],
    hintsRevealedThisStep: 0,
    totalHintsUsed: 0,
    status: stepsOf(question).length === 0 ? "complete" : "in-progress",
    lastAttempt: null
  };
}

export function currentStep(question: Question, state: StepRunState): CalculationStep | null {
  return stepsOf(question)[state.currentIndex] ?? null;
}

/**
 * Reveals the next hint for the current step. Hints are per step, so a learner
 * stuck on step 3 is not shown step 1's hint.
 */
export function revealStepHint(
  question: Question,
  state: StepRunState
): { state: StepRunState; hint: string | null } {
  const step = currentStep(question, state);
  if (!step) return { state, hint: null };
  const hint = step.hints[state.hintsRevealedThisStep];
  if (hint === undefined) return { state, hint: null };
  return {
    state: {
      ...state,
      hintsRevealedThisStep: state.hintsRevealedThisStep + 1,
      totalHintsUsed: state.totalHintsUsed + 1
    },
    hint
  };
}

export interface StepSubmissionResult {
  state: StepRunState;
  attempt: StepAttempt;
  /** Explanation for the step, available only once it has been answered correctly. */
  explanation: string | null;
  /** True when this submission finished the final step. */
  runComplete: boolean;
}

/**
 * Submits an answer for the current step.
 *
 * A correct value advances to the next step and resets that step's hint counter.
 * A wrong value leaves `currentIndex` where it is and moves the run to
 * `awaiting-retry`, so the learner retries the failed step rather than losing
 * the work already accepted.
 */
export function submitStep(question: Question, state: StepRunState, rawText: string): StepSubmissionResult {
  const step = currentStep(question, state);
  if (!step || state.status === "complete") {
    return { state, attempt: state.lastAttempt!, explanation: null, runComplete: state.status === "complete" };
  }

  const value = parseUserNumber(rawText);
  const correct = stepValueMatches(step, value);
  const attempt: StepAttempt = {
    stepId: step.id,
    rawText: rawText.trim(),
    value,
    correct,
    misconceptionId: correct ? null : classifyStepValue(step, value),
    hintsUsed: state.hintsRevealedThisStep
  };

  const history = [...state.history, attempt];

  if (!correct) {
    return {
      state: { ...state, history, status: "awaiting-retry", lastAttempt: attempt },
      attempt,
      explanation: null,
      runComplete: false
    };
  }

  const accepted = [...state.accepted, { stepId: step.id, text: attempt.rawText }];
  const nextIndex = state.currentIndex + 1;
  const runComplete = nextIndex >= stepsOf(question).length;

  return {
    state: {
      ...state,
      currentIndex: nextIndex,
      accepted,
      history,
      hintsRevealedThisStep: 0,
      status: runComplete ? "complete" : "in-progress",
      lastAttempt: attempt
    },
    attempt,
    explanation: step.explanation,
    runComplete
  };
}

/** Clears a failed submission so the learner can retry the same step. */
export function retryCurrentStep(state: StepRunState): StepRunState {
  if (state.status !== "awaiting-retry") return state;
  return { ...state, status: "in-progress" };
}

/**
 * The response handed to the session engine once every step is accepted.
 * Throws if the run is unfinished — submitting a partial run would record a
 * wrong answer for work the learner has not actually finished.
 */
export function finalResponse(state: StepRunState): RawResponse {
  if (state.status !== "complete") {
    throw new Error(`step run for ${state.questionId} is not complete`);
  }
  return { kind: "steps", steps: state.accepted.map((a) => ({ stepId: a.stepId, text: a.text })) };
}

/** Misconceptions seen anywhere in the run, in first-seen order, de-duplicated. */
export function misconceptionsSeen(state: StepRunState): string[] {
  const seen: string[] = [];
  for (const attempt of state.history) {
    if (attempt.misconceptionId && !seen.includes(attempt.misconceptionId)) {
      seen.push(attempt.misconceptionId);
    }
  }
  return seen;
}
