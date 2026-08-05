import type { Question } from "../../shared/schemas";

/** What the learner submitted, before normalization. */
export type RawResponse =
  | { kind: "choice"; choiceIds: string[] }
  | { kind: "numeric"; text: string }
  | { kind: "ordering"; order: string[] }
  | { kind: "matching"; pairs: Array<{ left: string; right: string }> }
  | { kind: "text"; text: string }
  | { kind: "steps"; steps: Array<{ stepId: string; text: string }> }
  | { kind: "point"; x: number; y?: number };

/** Canonical response after normalization. */
export type NormalizedResponse =
  | { kind: "choice"; choiceIds: string[] }
  | { kind: "numeric"; value: number | null; rawText: string }
  | { kind: "ordering"; order: string[] }
  | { kind: "matching"; pairs: Array<{ left: string; right: string }> }
  | { kind: "text"; text: string }
  | { kind: "steps"; steps: Array<{ stepId: string; value: number | null; rawText: string }> }
  | { kind: "point"; x: number; y: number | null };

export interface EvaluationResult {
  correct: boolean;
  /** True when correctness came from an accepted alternative rather than the primary answer. */
  viaAlternative: boolean;
  /** Machine-readable notes evaluators emit for the misconception layer. */
  signals: Record<string, unknown>;
}

export type Evaluator = (question: Question, response: NormalizedResponse) => EvaluationResult;
