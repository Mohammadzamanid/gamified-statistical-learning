/**
 * Wrong-answer pipeline:
 * response -> normalization -> evaluation -> misconception classification ->
 * targeted feedback -> hint/micro-lesson -> guided retry -> follow-up ->
 * mastery update -> scheduled review.
 *
 * This module owns classification and feedback assembly; mastery and review
 * updates are performed by the session layer using the returned outcome.
 */
import type { Misconception, Question, Remediation } from "../../shared/schemas";
import { normalizeResponse } from "../questions/normalize";
import { evaluateResponse } from "../questions/evaluators";
import type { RawResponse } from "../questions/types";
import { getDetector, type DetectorContext } from "./detectors";

export interface FeedbackPlan {
  correct: boolean;
  viaAlternative: boolean;
  misconception: Misconception | null;
  remediation: Remediation | null;
  /** Targeted message: misconception-specific when detected, generic otherwise. */
  message: string;
  /** Next hint to reveal, if any remain. */
  nextHint: string | null;
  hintLevelUsed: number;
  followUpQuestionId: string | null;
  explanation: string;
  solutionSteps: string[];
  signals: Record<string, unknown>;
}

export interface MisconceptionLibrary {
  misconceptions: Map<string, Misconception>;
  remediations: Map<string, Remediation>;
}

export function buildLibrary(misconceptions: Misconception[], remediations: Remediation[]): MisconceptionLibrary {
  return {
    misconceptions: new Map(misconceptions.map((m) => [m.id, m])),
    remediations: new Map(remediations.map((r) => [r.id, r]))
  };
}

export function classifyMisconception(
  question: Question,
  library: MisconceptionLibrary,
  ctxBase: Omit<DetectorContext, "params">
): Misconception | null {
  // Some interactions classify during evaluation because the question-level detectors
  // only understand a single scalar response and would decline theirs outright: a
  // step-by-step run classifies per step, a point placement classifies by position.
  // Honour those results before falling back to the detectors.
  const preClassified: unknown[] = [];
  for (const key of ["stepMisconceptionIds", "pointMisconceptionIds"]) {
    const value = ctxBase.evaluation.signals[key];
    if (Array.isArray(value)) preClassified.push(...value);
  }

  for (const id of question.misconceptionIds) {
    const mc = library.misconceptions.get(id);
    if (!mc) continue;
    if (preClassified.includes(id)) return mc;
    const detector = getDetector(mc.detector);
    if (!detector) continue;
    // Per-question overrides live under question.parameters[misconceptionId].
    const questionParams = ctxBase.question.parameters?.[mc.id];
    const perQuestion =
      questionParams && typeof questionParams === "object" ? (questionParams as Record<string, unknown>) : {};
    const params = { ...(mc.detectorParams ?? {}), ...perQuestion, misconceptionId: mc.id };
    if (detector({ ...ctxBase, params })) return mc;
  }
  return null;
}

export function runFeedbackPipeline(
  question: Question,
  raw: RawResponse,
  library: MisconceptionLibrary,
  hintsAlreadyUsed: number
): FeedbackPlan {
  const response = normalizeResponse(raw);
  const evaluation = evaluateResponse(question, response);

  if (evaluation.correct) {
    return {
      correct: true,
      viaAlternative: evaluation.viaAlternative,
      misconception: null,
      remediation: null,
      message: evaluation.viaAlternative
        ? "Correct — your answer is an accepted equivalent form."
        : "Correct.",
      nextHint: null,
      hintLevelUsed: hintsAlreadyUsed,
      followUpQuestionId: null,
      explanation: question.explanation,
      solutionSteps: question.solutionSteps,
      signals: evaluation.signals
    };
  }

  const misconception = classifyMisconception(question, library, { question, response, evaluation });
  const remediation = misconception ? library.remediations.get(misconception.remediationId) ?? null : null;

  const sortedHints = [...question.hints].sort((a, b) => a.level - b.level);
  const nextHint = sortedHints[hintsAlreadyUsed]?.text ?? null;

  return {
    correct: false,
    viaAlternative: false,
    misconception,
    remediation,
    message: remediation
      ? remediation.explanation
      : "Not quite. Compare your approach with the hint, then try again.",
    nextHint,
    hintLevelUsed: nextHint ? hintsAlreadyUsed + 1 : hintsAlreadyUsed,
    followUpQuestionId:
      remediation?.followUpQuestionIds[0] ?? question.followUpQuestionId ?? null,
    explanation: question.explanation,
    solutionSteps: question.solutionSteps,
    signals: evaluation.signals
  };
}
