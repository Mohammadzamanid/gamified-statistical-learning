/**
 * S2-15: the descriptive-statistics laboratory, as a pure core.
 *
 * The bench Stage 1 shipped was a calculator: paste numbers, read a table. The
 * scope asks for a learning environment instead, and the difference is not more
 * statistics — it is that every action reports **what it moved and what it did
 * not**. Adding one extreme reading drags the mean and leaves the median where
 * it was; sorting rearranges the whole picture and changes no measure at all.
 * Those are the facts `l.r2-outliers`, `l.r2-skew` and `l.r2-choosing-measures`
 * teach, and here a learner can do them rather than read them.
 *
 * So the model here is a value list plus a history of what each edit did to the
 * summary. Every operation is a pure function returning a new experiment, and
 * every number comes from `src/core/statistics` — nothing is recomputed here
 * (D-001, and scope §7's rule that statistics live in one place).
 */
import {
  fiveNumberSummary,
  interquartileRangeByHalves,
  mean,
  median,
  mode,
  range,
  standardDeviation,
  sum,
  variance
} from "../statistics/descriptive";
import type { Dataset } from "../../shared/schemas";

/** The measures the bench reports, in the order it reports them. */
export const LAB_MEASURES = [
  "count",
  "sum",
  "mean",
  "median",
  "mode",
  "range",
  "min",
  "q1",
  "q3",
  "max",
  "iqr",
  "variance",
  "standardDeviation"
] as const;

export type LabMeasure = (typeof LAB_MEASURES)[number];

/**
 * A summary of one value list.
 *
 * `mode` is a list because a dataset can have several.
 *
 * Variance and standard deviation use the **population** denominator — the
 * average of the squared distances — because that is what `l.r2-variance`
 * teaches and what a learner will do on paper. The bench reported the *sample*
 * forms until S2-17, so a learner checking their own working against it got a
 * different number every time: D-045's defect, in a second measure (D-060).
 * `variance(data, true)` keeps the sample form available for anything that
 * needs it.
 *
 * They are `null` only for an empty bench. One reading has a population
 * variance of zero, which is the definition's own answer rather than a stand-in
 * for a missing one.
 */
export interface LabSummary {
  readonly count: number;
  readonly sum: number | null;
  readonly mean: number | null;
  readonly median: number | null;
  readonly mode: readonly number[];
  readonly range: number | null;
  readonly min: number | null;
  readonly q1: number | null;
  readonly q3: number | null;
  readonly max: number | null;
  readonly iqr: number | null;
  readonly variance: number | null;
  readonly standardDeviation: number | null;
}

/** One entry in the bench's log: what was done, and what it moved. */
export interface LabEvent {
  readonly action: string;
  readonly before: LabSummary;
  readonly after: LabSummary;
}

export interface LabExperiment {
  readonly title: string;
  readonly values: readonly number[];
  /** Most recent first. The bench shows the latest; the rest are the trail. */
  readonly log: readonly LabEvent[];
}

/**
 * The summary of a value list.
 *
 * Quartiles use the taught convention — median of each half — because a learner
 * arriving from `l.r2-quartiles` must be able to check the bench against their
 * own paper working (D-045). `quartiles` (R-7) stays available for spreadsheet
 * agreement and is deliberately not what the bench shows.
 */
export function summarise(values: readonly number[]): LabSummary {
  if (values.length === 0) {
    return {
      count: 0, sum: null, mean: null, median: null, mode: [], range: null,
      min: null, q1: null, q3: null, max: null, iqr: null, variance: null, standardDeviation: null
    };
  }
  const five = fiveNumberSummary(values);
  return {
    count: values.length,
    sum: sum(values),
    mean: mean(values),
    median: median(values),
    mode: mode(values),
    range: range(values),
    min: five.min,
    q1: five.q1,
    q3: five.q3,
    max: five.max,
    iqr: interquartileRangeByHalves(values),
    variance: variance(values, false),
    standardDeviation: standardDeviation(values, false)
  };
}

/** A fresh experiment over the given values. */
export function createExperiment(title: string, values: readonly number[]): LabExperiment {
  return { title, values: [...values], log: [] };
}

/**
 * An experiment over a shipped dataset's first numeric column.
 *
 * Returns `null` when the dataset has no numeric column rather than inventing
 * one — the same refusal `numericPair` makes for scatterplots (D-046).
 */
export function experimentFromDataset(dataset: Dataset): LabExperiment | null {
  const column = dataset.columns.findIndex((c) => c.kind === "numeric");
  if (column === -1) return null;
  const values: number[] = [];
  for (const row of dataset.rows) {
    const cell = row[column];
    if (typeof cell === "number" && Number.isFinite(cell)) values.push(cell);
  }
  if (values.length === 0) return null;
  return createExperiment(dataset.title, values);
}

/** Applies an edit and records what it moved. */
function withValues(experiment: LabExperiment, action: string, values: readonly number[]): LabExperiment {
  const before = summarise(experiment.values);
  const after = summarise(values);
  return {
    title: experiment.title,
    values: [...values],
    log: [{ action, before, after }, ...experiment.log]
  };
}

export function addValue(experiment: LabExperiment, value: number): LabExperiment {
  if (!Number.isFinite(value)) return experiment;
  return withValues(experiment, `Added ${value}`, [...experiment.values, value]);
}

export function removeValueAt(experiment: LabExperiment, index: number): LabExperiment {
  const value = experiment.values[index];
  if (value === undefined) return experiment;
  const next = experiment.values.filter((_, i) => i !== index);
  return withValues(experiment, `Removed ${value}`, next);
}

export function replaceValueAt(experiment: LabExperiment, index: number, value: number): LabExperiment {
  const current = experiment.values[index];
  if (current === undefined || !Number.isFinite(value) || current === value) return experiment;
  const next = experiment.values.map((v, i) => (i === index ? value : v));
  return withValues(experiment, `Changed ${current} to ${value}`, next);
}

/**
 * Sorts the readings.
 *
 * Kept as a logged operation precisely because it moves nothing: every measure
 * in the summary is order-independent, so the log line reads "no measure
 * changed" and says out loud what the arithmetic already implies. A bench that
 * silently reordered would leave a learner guessing whether it mattered.
 */
export function sortValues(experiment: LabExperiment, direction: "ascending" | "descending" = "ascending"): LabExperiment {
  const next = [...experiment.values].sort((a, b) => (direction === "ascending" ? a - b : b - a));
  return withValues(experiment, `Sorted ${direction}`, next);
}

/**
 * The value that would sit just outside this data's own upper fence.
 *
 * 1.5 IQRs above Q3 is the rule `l.r2-outliers` teaches, so the bench's outlier
 * is derived from the readings on the bench rather than being a large number
 * chosen to look dramatic. A further interquartile range past the fence puts it
 * unambiguously outside.
 *
 * `null` when the readings cannot say how far out is far: fewer than two of
 * them, or a middle half of zero width. A flat middle makes the fence rule
 * degenerate — it sits on Q3, so every larger reading is already an outlier —
 * and any distance the bench picked from there would be its own invention
 * rather than this data's. The first draft did invent one, and the test below
 * caught it.
 */
export function suggestedOutlier(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  const iqr = interquartileRangeByHalves(values);
  if (iqr <= 0) return null;
  const five = fiveNumberSummary(values);
  const candidate = five.q3 + 1.5 * iqr + iqr;
  return candidate > five.max ? candidate : null;
}

export function addOutlier(experiment: LabExperiment): LabExperiment {
  const value = suggestedOutlier(experiment.values);
  if (value === null) return experiment;
  return withValues(experiment, `Added an outlier at ${value}`, [...experiment.values, value]);
}

/** Clears the readings and the log, keeping the title. */
export function resetExperiment(experiment: LabExperiment): LabExperiment {
  return { title: experiment.title, values: [], log: [] };
}

export function renameExperiment(experiment: LabExperiment, title: string): LabExperiment {
  return { ...experiment, title };
}

/** What one measure did across an edit. */
export interface LabMeasureChange {
  readonly measure: LabMeasure;
  readonly before: number | readonly number[] | null;
  readonly after: number | readonly number[] | null;
  readonly moved: boolean;
}

function sameValue(a: LabMeasureChange["before"], b: LabMeasureChange["after"]): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return a === b;
}

/** Every measure, with whether the edit moved it. */
export function compareSummaries(before: LabSummary, after: LabSummary): LabMeasureChange[] {
  return LAB_MEASURES.map((measure) => {
    const b = before[measure];
    const a = after[measure];
    return { measure, before: b, after: a, moved: !sameValue(b, a) };
  });
}

/** Reading names for the log and for the screen reader. */
const MEASURE_NAMES: Record<LabMeasure, string> = {
  count: "count",
  sum: "sum",
  mean: "mean",
  median: "median",
  mode: "mode",
  range: "range",
  min: "smallest value",
  q1: "first quartile",
  q3: "third quartile",
  max: "largest value",
  iqr: "interquartile range",
  variance: "sample variance",
  standardDeviation: "sample standard deviation"
};

function readValue(value: LabMeasureChange["before"]): string {
  if (value === null) return "not available";
  if (Array.isArray(value)) return value.length === 0 ? "none" : value.join(" and ");
  return String(Math.round((value as number) * 10000) / 10000);
}

/**
 * One sentence saying what an edit moved and what it left alone.
 *
 * This is the bench's teaching, and it is also its accessible output: the same
 * string goes to the live region, so a screen-reader user is told the thing a
 * sighted user reads off a changed table rather than being told a table exists
 * (scope §6). `count` is excluded from the "left alone" half — every added or
 * removed reading changes it, so listing it would bury the interesting part.
 */
export function describeChange(event: LabEvent): string {
  const changes = compareSummaries(event.before, event.after).filter((c) => c.measure !== "count");
  const moved = changes.filter((c) => c.moved);
  const held = changes.filter((c) => !c.moved && c.after !== null);

  if (moved.length === 0) {
    return `${event.action}. No measure changed — every one of them ignores the order of the readings.`;
  }
  const movedText = moved
    .map((c) => `${MEASURE_NAMES[c.measure]} ${readValue(c.before)} to ${readValue(c.after)}`)
    .join("; ");
  if (held.length === 0) return `${event.action}: ${movedText}.`;
  const heldText = held.map((c) => MEASURE_NAMES[c.measure]).join(", ");
  return `${event.action}: ${movedText}. Unchanged: ${heldText}.`;
}
