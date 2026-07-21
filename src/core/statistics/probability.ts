/** Counting and basic probability. Reference tests in tests/statistics. */

function assertNonNegativeInt(n: number, fnName: string, label: string): void {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`${fnName}: ${label} must be a non-negative integer`);
  }
}

export function factorial(n: number): number {
  assertNonNegativeInt(n, "factorial", "n");
  if (n > 170) throw new RangeError("factorial: n > 170 overflows double precision");
  let acc = 1;
  for (let i = 2; i <= n; i++) acc *= i;
  return acc;
}

/** nPr computed multiplicatively to avoid factorial overflow where possible. */
export function permutations(n: number, r: number): number {
  assertNonNegativeInt(n, "permutations", "n");
  assertNonNegativeInt(r, "permutations", "r");
  if (r > n) return 0;
  let acc = 1;
  for (let i = 0; i < r; i++) acc *= n - i;
  return acc;
}

/** nCr computed with incremental division for numerical stability. */
export function combinations(n: number, r: number): number {
  assertNonNegativeInt(n, "combinations", "n");
  assertNonNegativeInt(r, "combinations", "r");
  if (r > n) return 0;
  const k = Math.min(r, n - r);
  let acc = 1;
  for (let i = 1; i <= k; i++) acc = (acc * (n - k + i)) / i;
  return Math.round(acc);
}

/** P(event) for equally likely outcomes. */
export function basicProbability(favorable: number, total: number): number {
  assertNonNegativeInt(favorable, "basicProbability", "favorable");
  if (!Number.isInteger(total) || total <= 0) {
    throw new RangeError("basicProbability: total must be a positive integer");
  }
  if (favorable > total) throw new RangeError("basicProbability: favorable exceeds total");
  return favorable / total;
}

export function complementProbability(p: number): number {
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError("complementProbability: p must be in [0,1]");
  return 1 - p;
}

/** P(A and B) for independent events. */
export function independentAnd(pA: number, pB: number): number {
  for (const p of [pA, pB]) {
    if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError("independentAnd: probabilities must be in [0,1]");
  }
  return pA * pB;
}

/** P(A or B) = P(A) + P(B) - P(A and B). */
export function unionProbability(pA: number, pB: number, pAandB: number): number {
  for (const p of [pA, pB, pAandB]) {
    if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError("unionProbability: probabilities must be in [0,1]");
  }
  const result = pA + pB - pAandB;
  if (result < -1e-12 || result > 1 + 1e-12) throw new RangeError("unionProbability: inconsistent inputs");
  return Math.min(1, Math.max(0, result));
}

/** P(A|B) = P(A and B) / P(B). */
export function conditionalProbability(pAandB: number, pB: number): number {
  for (const p of [pAandB, pB]) {
    if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError("conditionalProbability: probabilities must be in [0,1]");
  }
  if (pB === 0) throw new RangeError("conditionalProbability: P(B) must be > 0");
  if (pAandB > pB + 1e-12) throw new RangeError("conditionalProbability: P(A and B) cannot exceed P(B)");
  return pAandB / pB;
}
