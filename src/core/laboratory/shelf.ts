/**
 * S2-15 cycle 3: keeping an experiment, and taking one away in words.
 *
 * Two criteria live here. **Save and reload** means an experiment survives the
 * app closing, so it goes in the save file — which makes it a schema change
 * with a migration behind it (`SAVE_SCHEMA_VERSION` 3 → 4), not a field quietly
 * appended. **Export a summary** means the learner can take the finding out of
 * the app, so it is plain text: every measure, the shape of the picture, and
 * the readings themselves, in something that survives a paste into a document
 * or a message.
 *
 * The shelf is bounded (`LABORATORY_SHELF_LIMIT`). A full shelf is reported and
 * refused rather than silently rotated: the learner chose to keep every one of
 * those, and a save file that grows without limit is a persistence defect
 * wearing a feature's clothes.
 */
import { LABORATORY_SHELF_LIMIT } from "../../shared/constants/app";
import { describeChart, type LabChartKind } from "./charts";
import { summarise, type LabExperiment } from "./experiment";
import type { SavedExperiment } from "../../shared/schemas";

export interface ShelfEntryInput {
  readonly experiment: LabExperiment;
  readonly chartKind: LabChartKind;
  readonly binWidth?: number;
}

export type ShelfResult =
  | { readonly ok: true; readonly experiments: readonly SavedExperiment[]; readonly saved: SavedExperiment }
  | { readonly ok: false; readonly reason: string };

/** A url-safe id for a shelf entry, derived from when it was saved. */
function shelfId(savedAt: string, existing: readonly SavedExperiment[]): string {
  const stem = `exp.${savedAt.replace(/[^0-9a-z]/gi, "")}`;
  if (!existing.some((e) => e.id === stem)) return stem;
  let n = 2;
  while (existing.some((e) => e.id === `${stem}-${n}`)) n += 1;
  return `${stem}-${n}`;
}

/**
 * Puts an experiment on the shelf.
 *
 * Refuses an empty bench — there is nothing to come back to — and refuses a
 * full shelf, naming the limit so the message is actionable rather than a flat
 * "cannot".
 */
export function saveExperiment(
  shelf: readonly SavedExperiment[],
  input: ShelfEntryInput,
  savedAt: string
): ShelfResult {
  if (input.experiment.values.length === 0) {
    return { ok: false, reason: "The bench is empty, so there is nothing to keep." };
  }
  if (shelf.length >= LABORATORY_SHELF_LIMIT) {
    return {
      ok: false,
      reason: `The shelf holds ${LABORATORY_SHELF_LIMIT} experiments and is full. Remove one to make room.`
    };
  }
  const saved: SavedExperiment = {
    id: shelfId(savedAt, shelf),
    title: input.experiment.title,
    values: [...input.experiment.values],
    chartKind: input.chartKind,
    ...(input.binWidth !== undefined && input.binWidth > 0 ? { binWidth: input.binWidth } : {}),
    savedAt
  };
  return { ok: true, experiments: [saved, ...shelf], saved };
}

export function removeExperiment(
  shelf: readonly SavedExperiment[],
  id: string
): readonly SavedExperiment[] {
  return shelf.filter((e) => e.id !== id);
}

/**
 * A shelf entry back as a bench experiment.
 *
 * The log comes back empty because it is: these edits were made in an earlier
 * sitting, and presenting them as what just happened would be a lie about the
 * readings in front of the learner.
 */
export function loadExperiment(saved: SavedExperiment): LabExperiment {
  return { title: saved.title, values: [...saved.values], log: [] };
}

function line(label: string, value: string): string {
  return `${label.padEnd(24, " ")}${value}`;
}

function readNumber(value: number | null): string {
  return value === null ? "not available" : String(Math.round(value * 10000) / 10000);
}

/**
 * The experiment as plain text, for taking out of the app.
 *
 * Everything on screen, in the order the screen shows it, including the chart's
 * description — a summary that omitted the picture would be exporting half the
 * finding, and the description is the only form of the picture that survives a
 * paste. The readings come last and in full, so the export can be checked
 * against, or reloaded by hand.
 */
export function exportSummary(input: ShelfEntryInput, exportedAt: string): string {
  const { experiment, chartKind, binWidth } = input;
  const s = summarise(experiment.values);
  const rows = [
    line("Count", String(s.count)),
    line("Sum", readNumber(s.sum)),
    line("Mean", readNumber(s.mean)),
    line("Median", readNumber(s.median)),
    line("Mode", s.mode.length === 0 ? "none" : s.mode.join(", ")),
    line("Range", readNumber(s.range)),
    line("Minimum", readNumber(s.min)),
    line("First quartile", readNumber(s.q1)),
    line("Third quartile", readNumber(s.q3)),
    line("Maximum", readNumber(s.max)),
    line("Interquartile range", readNumber(s.iqr)),
    line("Variance", readNumber(s.variance)),
    line("Standard deviation", readNumber(s.standardDeviation))
  ];
  return [
    experiment.title,
    `Exported from the Statlas descriptive bench, ${exportedAt}`,
    "",
    "Summary",
    ...rows,
    "",
    "Picture",
    describeChart(chartKind, experiment.values, binWidth),
    "",
    `Readings (${experiment.values.length})`,
    experiment.values.join(", "),
    "",
    "Quartiles use the median-of-halves convention and the variance divides by the number of readings —",
    "both the conventions the lessons teach."
  ]
    .filter((l, i, all) => !(l === "" && all[i - 1] === ""))
    .join("\n")
    .trimEnd();
}
