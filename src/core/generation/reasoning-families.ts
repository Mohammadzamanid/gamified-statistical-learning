/**
 * The reasoning families a topic's interactions must span.
 *
 * Taken verbatim from `STAGE2_RECONSTRUCTION_SCOPE.md` §4. The list is here, in
 * code, rather than only in the scope document because the coverage report and
 * its audit both have to agree on what "several reasoning families" means — and
 * because the scope is explicit that changing numbers, names, colours or object
 * labels does **not** create a new family. A family is a distinct *pattern of
 * thought* the learner has to perform.
 */
export const REASONING_FAMILIES = [
  /** Name or identify the thing without operating on it. */
  "recognition",
  /** Move the same quantity between forms: tally to number, fraction to decimal. */
  "representation-conversion",
  /** Carry out the procedure and report the result. */
  "calculation",
  /** Read a value or a relationship off something visual. */
  "visual-interpretation",
  /** Say what will happen before it happens. */
  "prediction",
  /** Find the wrong step in someone else's work. */
  "error-identification",
  /** Decide which of two or more is larger, smaller or equal. */
  "comparison",
  /** Arrange several values into the right sequence. */
  "ordering",
  /** Two or more chained operations, where an intermediate result is needed. */
  "multi-step-reasoning",
  /** The idea used in a situation outside the page. */
  "real-world-application",
  /** Reach the answer while ignoring a number that does not belong to it. */
  "irrelevant-information-filtering",
  /** Say why, in words. */
  "explanation",
  /** Teach the idea back to someone else. */
  "teach-it-back",
  /** The same idea in a context the learner has not met it in before. */
  "transfer"
] as const;

export type ReasoningFamily = (typeof REASONING_FAMILIES)[number];

/** For report tables and error messages. */
export const REASONING_FAMILY_LABELS: Readonly<Record<ReasoningFamily, string>> = {
  recognition: "Recognition",
  "representation-conversion": "Representation conversion",
  calculation: "Calculation",
  "visual-interpretation": "Visual interpretation",
  prediction: "Prediction",
  "error-identification": "Error identification",
  comparison: "Comparison",
  ordering: "Ordering",
  "multi-step-reasoning": "Multi-step reasoning",
  "real-world-application": "Real-world application",
  "irrelevant-information-filtering": "Irrelevant-information filtering",
  explanation: "Explanation",
  "teach-it-back": "Teach it back",
  transfer: "Transfer to an unfamiliar context"
};

export function isReasoningFamily(value: string): value is ReasoningFamily {
  return (REASONING_FAMILIES as readonly string[]).includes(value);
}
