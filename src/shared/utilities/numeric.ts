/** Numeric helpers shared by the statistics engine and answer evaluation. */

export const DEFAULT_TOLERANCE = 1e-9;

export function approxEqual(a: number, b: number, tolerance = DEFAULT_TOLERANCE): boolean {
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
  const diff = Math.abs(a - b);
  if (diff <= tolerance) return true;
  const largest = Math.max(Math.abs(a), Math.abs(b));
  return diff <= tolerance * largest;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function assertFiniteData(data: readonly number[], fnName: string): void {
  if (!Array.isArray(data)) {
    throw new TypeError(`${fnName}: expected an array of numbers`);
  }
  for (const v of data) {
    if (!isFiniteNumber(v)) {
      throw new TypeError(`${fnName}: data contains a non-finite value (${String(v)})`);
    }
  }
}

export function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

/** Parse a user-entered number. Accepts "1,5" (comma decimal), "50%", "3/4", "1 234". */
export function parseUserNumber(raw: string): number | null {
  const text = raw.trim();
  if (text.length === 0) return null;

  const frac = text.match(/^(-?\d+(?:[.,]\d+)?)\s*\/\s*(-?\d+(?:[.,]\d+)?)$/);
  if (frac) {
    const num = Number(frac[1]!.replace(",", "."));
    const den = Number(frac[2]!.replace(",", "."));
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
    return num / den;
  }

  const isPercent = /%\s*$/.test(text);
  let cleaned = text.replace(/%\s*$/, "").replace(/\s+/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return isPercent ? n / 100 : n;
}
