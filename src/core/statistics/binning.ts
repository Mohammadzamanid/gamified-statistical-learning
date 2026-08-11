/**
 * The arithmetic behind the two charts that summarise rather than plot.
 *
 * Both functions were defined inside their chart components until S2-15 cycle
 * 2, and both are statistics: binning chooses the intervals a histogram's whole
 * argument turns on, and stacking is a frequency table wearing display clothes.
 * D-051's audit did not catch them — it knew the names `src/core/statistics`
 * already owned, and these two were not among them — so the rule "statistics
 * live in one place" had two exceptions nobody had declared.
 *
 * They moved here rather than being copied. The chart components import them,
 * the laboratory bench imports them, and no view computes either.
 */
import { frequencyTable } from "./descriptive";

export type Bin = { from: number; to: number; count: number };

/**
 * Groups values into adjacent equal-width intervals, each holding its lower
 * bound and excluding its upper — except the last, which includes both so the
 * largest reading has somewhere to go.
 */
export function buildBins(values: readonly number[], binWidth?: number): Bin[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ from: min, to: min, count: values.length }];

  const span = max - min;
  // Five bins is the default only because it reads well at chart size; any
  // question that cares about bin width says so, and the lesson on misleading
  // graphs exists because that choice changes what a reader sees.
  const rawWidth = binWidth && binWidth > 0 ? binWidth : span / 5;
  const count = Math.max(1, Math.ceil(span / rawWidth));

  const bins: Bin[] = [];
  for (let i = 0; i < count; i += 1) {
    const from = min + i * rawWidth;
    const to = i === count - 1 ? max : from + rawWidth;
    bins.push({ from, to, count: 0 });
  }
  for (const v of values) {
    const index = Math.min(count - 1, Math.floor((v - min) / rawWidth));
    bins[index]!.count += 1;
  }
  return bins;
}

/**
 * One entry per distinct value, with how many readings share it, ascending.
 *
 * A dot plot's claim is that the tallest stack is the mode and that every
 * reading is visible, and both are properties of this function rather than of
 * the SVG (D-044). Built on `frequencyTable` because that is what it is —
 * the version that lived in the component counted occurrences a second time.
 */
export function stackDots(values: readonly number[]): Array<{ value: number; height: number }> {
  return [...frequencyTable(values).entries()]
    .map(([value, height]) => ({ value, height }))
    .sort((a, b) => a.value - b.value);
}
