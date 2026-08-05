/**
 * Misconception detectors. Each detector inspects the evaluated (incorrect)
 * response plus evaluator signals and reports whether a known error pattern
 * matches. New detectors register independently via registerDetector.
 */
import type { Question } from "../../shared/schemas";
import { approxEqual } from "../../shared/utilities/numeric";
import type { EvaluationResult, NormalizedResponse } from "../questions/types";

export interface DetectorContext {
  question: Question;
  response: NormalizedResponse;
  evaluation: EvaluationResult;
  params: Record<string, unknown>;
}

export type Detector = (ctx: DetectorContext) => boolean;

const detectors = new Map<string, Detector>();

export function registerDetector(name: string, fn: Detector): void {
  if (detectors.has(name)) throw new Error(`detector already registered: ${name}`);
  detectors.set(name, fn);
}

export function getDetector(name: string): Detector | undefined {
  return detectors.get(name);
}

export function listDetectorNames(): string[] {
  return [...detectors.keys()];
}

/** For tests. */
export function clearDetectors(): void {
  detectors.clear();
}

function numericContext(ctx: DetectorContext): { got: number; expected: number; tol: number } | null {
  if (ctx.response.kind !== "numeric" || ctx.response.value === null) return null;
  if (ctx.question.answer.kind !== "numeric") return null;
  return {
    got: ctx.response.value,
    expected: ctx.question.answer.value,
    tol: Math.max(ctx.question.answer.tolerance, 1e-9)
  };
}

/** A distractor choice explicitly tagged with a misconception was selected. */
function taggedDistractor(ctx: DetectorContext): boolean {
  if (ctx.response.kind !== "choice") return false;
  const target = ctx.params["misconceptionId"];
  if (typeof target !== "string") return false;
  const chosen = new Set(ctx.response.choiceIds);
  return (ctx.question.choices ?? []).some((c) => chosen.has(c.id) && c.misconceptionId === target);
}

/** Entered 0.35 when 35 (%) expected, or entered value / 100 of the expected. */
function decimalInsteadOfPercentage(ctx: DetectorContext): boolean {
  const n = numericContext(ctx);
  if (!n || n.expected === 0) return false;
  return approxEqual(n.got * 100, n.expected, Math.max(n.tol * 100, 1e-6));
}

/** Entered 35 when 0.35 expected. */
function percentageInsteadOfDecimal(ctx: DetectorContext): boolean {
  const n = numericContext(ctx);
  if (!n || n.expected === 0) return false;
  return approxEqual(n.got / 100, n.expected, n.tol);
}

/** Answered with the value of a different named statistic supplied by content (e.g. mean vs median). */
function confusedStatistic(ctx: DetectorContext): boolean {
  const n = numericContext(ctx);
  if (!n) return false;
  const wrongValue = ctx.params["wrongValue"];
  if (typeof wrongValue !== "number") return false;
  const tol = typeof ctx.params["tolerance"] === "number" ? (ctx.params["tolerance"] as number) : n.tol;
  return approxEqual(n.got, wrongValue, tol);
}

/** Fraction reversed: entered b/a instead of a/b. */
function reversedFraction(ctx: DetectorContext): boolean {
  const n = numericContext(ctx);
  if (!n || n.expected === 0 || n.got === 0) return false;
  return approxEqual(n.got, 1 / n.expected, Math.max(n.tol, 1e-6));
}

/** Sign error: magnitude right, sign wrong. */
function signError(ctx: DetectorContext): boolean {
  const n = numericContext(ctx);
  if (!n || n.expected === 0) return false;
  return approxEqual(n.got, -n.expected, n.tol);
}

/** Off by a supplied multiplicative unit factor (e.g. 1000 for kg vs g). */
function unitError(ctx: DetectorContext): boolean {
  const n = numericContext(ctx);
  if (!n || n.expected === 0) return false;
  const factor = typeof ctx.params["factor"] === "number" ? (ctx.params["factor"] as number) : null;
  if (!factor || factor === 0) return false;
  return (
    approxEqual(n.got, n.expected * factor, Math.max(n.tol * Math.abs(factor), 1e-9)) ||
    approxEqual(n.got, n.expected / factor, n.tol)
  );
}

/** Reversed conditional probability: entered P(B|A) (supplied by content) instead of P(A|B). */
function reversedConditional(ctx: DetectorContext): boolean {
  return confusedStatistic(ctx);
}

/**
 * A point placement the evaluator already classified geometrically.
 *
 * The evaluator owns the geometry — declared wrong placements, and the axes-swapped
 * rule — because only it holds the target and its per-axis tolerances. This detector
 * is the bridge that lets such a misconception name a registered detector like every
 * other one, instead of leaving a dangling name in content.
 */
function pointGeometry(ctx: DetectorContext): boolean {
  if (ctx.response.kind !== "point") return false;
  const target = ctx.params["misconceptionId"];
  if (typeof target !== "string") return false;
  const ids = ctx.evaluation.signals["pointMisconceptionIds"];
  return Array.isArray(ids) && ids.includes(target);
}

export function registerBuiltInDetectors(): void {
  registerDetector("tagged-distractor", taggedDistractor);
  registerDetector("point-geometry", pointGeometry);
  registerDetector("decimal-instead-of-percentage", decimalInsteadOfPercentage);
  registerDetector("percentage-instead-of-decimal", percentageInsteadOfDecimal);
  registerDetector("confused-statistic", confusedStatistic);
  registerDetector("reversed-fraction", reversedFraction);
  registerDetector("sign-error", signError);
  registerDetector("unit-error", unitError);
  registerDetector("reversed-conditional", reversedConditional);
}
