/**
 * Descriptive statistics. Every function validates input, documents empty-data
 * behavior, and is covered by reference tests in tests/statistics.
 *
 * Convention: empty datasets throw RangeError (callers decide how to surface it);
 * invalid values throw TypeError.
 */
import { assertFiniteData } from "../../shared/utilities/numeric";

function requireNonEmpty(data: readonly number[], fnName: string): void {
  assertFiniteData(data, fnName);
  if (data.length === 0) throw new RangeError(`${fnName}: dataset is empty`);
}

export function sum(data: readonly number[]): number {
  assertFiniteData(data, "sum");
  // Kahan summation for numerical stability on long datasets.
  let total = 0;
  let c = 0;
  for (const v of data) {
    const y = v - c;
    const t = total + y;
    c = t - total - y;
    total = t;
  }
  return total;
}

export function mean(data: readonly number[]): number {
  requireNonEmpty(data, "mean");
  return sum(data) / data.length;
}

export function weightedMean(values: readonly number[], weights: readonly number[]): number {
  requireNonEmpty(values, "weightedMean");
  assertFiniteData(weights, "weightedMean");
  if (values.length !== weights.length) {
    throw new RangeError("weightedMean: values and weights must have the same length");
  }
  const wSum = sum(weights);
  if (wSum === 0) throw new RangeError("weightedMean: weights sum to zero");
  let acc = 0;
  for (let i = 0; i < values.length; i++) acc += values[i]! * weights[i]!;
  return acc / wSum;
}

export function median(data: readonly number[]): number {
  requireNonEmpty(data, "median");
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** All values sharing the highest frequency, ascending. Uniform data returns every value once. */
export function mode(data: readonly number[]): number[] {
  requireNonEmpty(data, "mode");
  const counts = new Map<number, number>();
  for (const v of data) counts.set(v, (counts.get(v) ?? 0) + 1);
  const max = Math.max(...counts.values());
  return [...counts.entries()].filter(([, c]) => c === max).map(([v]) => v).sort((a, b) => a - b);
}

export function min(data: readonly number[]): number {
  requireNonEmpty(data, "min");
  return Math.min(...data);
}

export function max(data: readonly number[]): number {
  requireNonEmpty(data, "max");
  return Math.max(...data);
}

export function range(data: readonly number[]): number {
  requireNonEmpty(data, "range");
  return max(data) - min(data);
}

/**
 * Percentile using linear interpolation between closest ranks
 * (R-7 / default of NumPy and spreadsheet software). p in [0, 100].
 */
export function percentile(data: readonly number[], p: number): number {
  requireNonEmpty(data, "percentile");
  if (!Number.isFinite(p) || p < 0 || p > 100) {
    throw new RangeError("percentile: p must be within [0, 100]");
  }
  const sorted = [...data].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0]!;
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  const frac = rank - lo;
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * frac;
}

/**
 * Quartiles by linear interpolation (R-7), matching NumPy and spreadsheets.
 *
 * **This is not the method the curriculum teaches.** `l.r2-quartiles` teaches
 * the median-of-halves rule, and the two disagree on ordinary data — for the
 * eight readings that lesson uses, this returns Q1 = 4.75 where the lesson
 * computes 4.5. Use `quartilesByHalves` for anything a learner will check by
 * hand; keep this for agreement with the tools they will meet outside.
 */
export function quartiles(data: readonly number[]): { q1: number; q2: number; q3: number } {
  return { q1: percentile(data, 25), q2: percentile(data, 50), q3: percentile(data, 75) };
}

/**
 * Quartiles by the median-of-halves rule, which is what the curriculum teaches.
 *
 * Sort, split at the median, and take the median of each half; with an odd
 * count the median itself belongs to neither half. This is the school method
 * `l.r2-quartiles` explains and `l.r2-iqr` builds on, so it is what the
 * laboratory reports and what the box plot draws — a bench that contradicts the
 * lesson a learner has just finished is worse than no bench.
 *
 * Both conventions are defensible and neither is a bug. What was a defect is
 * shipping one in the lessons and the other on the instrument panel (D-045).
 */
export function quartilesByHalves(data: readonly number[]): { q1: number; q2: number; q3: number } {
  requireNonEmpty(data, "quartilesByHalves");
  const sorted = [...data].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  const lower = sorted.slice(0, half);
  const upper = sorted.length % 2 === 1 ? sorted.slice(half + 1) : sorted.slice(half);
  return {
    q1: lower.length > 0 ? median(lower) : sorted[0]!,
    q2: median(sorted),
    q3: upper.length > 0 ? median(upper) : sorted[sorted.length - 1]!
  };
}

export function interquartileRange(data: readonly number[]): number {
  const { q1, q3 } = quartiles(data);
  return q3 - q1;
}

/** The interquartile range under the taught convention. See `quartilesByHalves`. */
export function interquartileRangeByHalves(data: readonly number[]): number {
  const { q1, q3 } = quartilesByHalves(data);
  return q3 - q1;
}

/**
 * The five numbers a box plot draws, all under the taught convention.
 *
 * Returned together because a box plot is one picture of one summary: computing
 * the pieces separately is how a chart ends up drawing a median from one rule
 * and hinges from another.
 */
export function fiveNumberSummary(data: readonly number[]): {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
} {
  const { q1, q2, q3 } = quartilesByHalves(data);
  return { min: min(data), q1, median: q2, q3, max: max(data) };
}

/** Variance. sample=true (default) divides by n-1; population divides by n. */
export function variance(data: readonly number[], sample = true): number {
  requireNonEmpty(data, "variance");
  if (sample && data.length < 2) {
    throw new RangeError("variance: sample variance requires at least 2 values");
  }
  const m = mean(data);
  const ss = sum(data.map((v) => (v - m) ** 2));
  return ss / (sample ? data.length - 1 : data.length);
}

export function standardDeviation(data: readonly number[], sample = true): number {
  return Math.sqrt(variance(data, sample));
}

export function zScore(value: number, data: readonly number[], sample = true): number {
  const sd = standardDeviation(data, sample);
  if (sd === 0) throw new RangeError("zScore: standard deviation is zero");
  return (value - mean(data)) / sd;
}

export function frequencyTable(data: readonly number[]): Map<number, number> {
  assertFiniteData(data, "frequencyTable");
  const counts = new Map<number, number>();
  for (const v of data) counts.set(v, (counts.get(v) ?? 0) + 1);
  return counts;
}

export function proportion(part: number, whole: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(whole)) throw new TypeError("proportion: non-finite input");
  if (whole === 0) throw new RangeError("proportion: whole must be non-zero");
  return part / whole;
}

export function percentage(part: number, whole: number): number {
  return proportion(part, whole) * 100;
}
