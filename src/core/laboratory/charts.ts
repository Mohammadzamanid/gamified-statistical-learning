/**
 * S2-15 cycle 2: what the bench can draw, and what it says about it.
 *
 * No drawing code lives here and none is added anywhere. The five chart
 * components S2-14 built take a `Dataset`, so the bench turns its readings into
 * one and hands it over — the bins come from `buildBins`, the box from
 * `fiveNumberSummary`, exactly as they do for a question's visual (D-043,
 * D-044, D-051). What this file owns is the two things a bench needs beyond a
 * lesson's fixed picture: which kinds a bare column of numbers can honestly
 * feed, and a description that follows the readings as they change.
 */
import { stackDots } from "../statistics/binning";
import { buildBins } from "../statistics/binning";
import { fiveNumberSummary } from "../statistics/descriptive";
import type { Dataset } from "../../shared/schemas";
import type { LabExperiment } from "./experiment";

/**
 * The kinds the bench offers.
 *
 * Deliberately three of the five that draw. A bar chart needs a category per
 * bar and a scatterplot needs a second variable per reading; the bench holds
 * one column of numbers and has neither, so offering them would mean inventing
 * labels or pairs. The bench says so on screen rather than presenting controls
 * that produce a wrong picture — the same refusal `numericPair` makes (D-046).
 */
export const LAB_CHART_KINDS = ["histogram", "dot-plot", "box-plot"] as const;
export type LabChartKind = (typeof LAB_CHART_KINDS)[number];

/** Why the other two are absent, in the words the bench shows. */
export const LAB_CHART_EXCLUSIONS: ReadonlyArray<{ kind: string; reason: string }> = [
  { kind: "bar-chart", reason: "needs a name for each bar, and the bench holds numbers without names" },
  { kind: "scatter", reason: "needs a second measurement per reading, and the bench holds one" }
];

/** The bench's readings as a one-column dataset the chart components can draw. */
export function experimentToDataset(experiment: LabExperiment, unit?: string): Dataset {
  return {
    id: "ds.laboratory-bench",
    title: experiment.title,
    description: "The readings currently on the laboratory bench.",
    columns: [{ name: "Reading", kind: "numeric", ...(unit ? { unit } : {}) }],
    rows: experiment.values.map((v) => [v])
  };
}

function say(value: number): string {
  return String(Math.round(value * 10000) / 10000);
}

/**
 * What the chart on screen shows, in words.
 *
 * Regenerated from the readings on every edit, because a bench's picture
 * changes under the learner's hands — a fixed caption would be describing the
 * chart it was written for rather than the one being shown. Two rules the
 * lessons' own visuals are held to are kept here by construction:
 *
 *  - a box plot's words carry all five of its numbers, since for a reader who
 *    cannot see it those words *are* the chart (D-049);
 *  - a histogram states its bin width, which is invisible in a finished
 *    histogram and is exactly what `l.r2-misleading-graphs` is about (D-047).
 */
export function describeChart(
  kind: LabChartKind,
  values: readonly number[],
  binWidth?: number
): string {
  if (values.length === 0) return "No readings on the bench, so there is nothing to draw.";

  if (kind === "box-plot") {
    const f = fiveNumberSummary(values);
    return (
      `Box plot of ${values.length} reading${values.length === 1 ? "" : "s"}: smallest ${say(f.min)}, ` +
      `first quartile ${say(f.q1)}, median ${say(f.median)}, third quartile ${say(f.q3)}, largest ${say(f.max)}. ` +
      `The box spans ${say(f.q1)} to ${say(f.q3)}.`
    );
  }

  if (kind === "histogram") {
    const bins = buildBins(values, binWidth);
    const width = bins.length > 0 ? bins[0]!.to - bins[0]!.from : 0;
    let tallest = bins[0]!;
    for (const bin of bins) if (bin.count > tallest.count) tallest = bin;
    return (
      `Histogram of ${values.length} readings in ${bins.length} interval${bins.length === 1 ? "" : "s"} ` +
      `of width ${say(width)}. The fullest interval runs ${say(tallest.from)} to ${say(tallest.to)} and holds ` +
      `${tallest.count} reading${tallest.count === 1 ? "" : "s"}.`
    );
  }

  // The same stacks the dot plot draws, from the same function, so the words and
  // the picture cannot disagree about how tall a column is.
  const stacks = stackDots(values);
  const tallest = Math.max(...stacks.map((s) => s.height));
  const peaks = stacks.filter((s) => s.height === tallest).map((s) => s.value);
  return (
    `Dot plot of ${values.length} readings over ${stacks.length} distinct value` +
    `${stacks.length === 1 ? "" : "s"} from ${say(stacks[0]!.value)} to ${say(stacks[stacks.length - 1]!.value)}. ` +
    `The tallest column${peaks.length === 1 ? " is" : "s are"} at ${peaks.map(say).join(" and ")}, ` +
    `${tallest} dot${tallest === 1 ? "" : "s"} high.`
  );
}
