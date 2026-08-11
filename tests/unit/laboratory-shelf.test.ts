/**
 * S2-15 cycle 3: the shelf and the export.
 *
 * Saving is a persistence change, so what matters is what comes back and what
 * deliberately does not: the readings, the title and the chart the learner had
 * chosen, but never the edit log, which belongs to the sitting it happened in.
 * Exporting is the other direction — the finding leaving the app — so the test
 * is that the text carries everything the screen shows, including the picture,
 * which only survives a paste as words.
 */
import { describe, expect, it } from "vitest";
import {
  addValue,
  createExperiment,
  exportSummary,
  loadExperiment,
  removeExperiment,
  saveExperiment
} from "../../src/core/laboratory";
import { LABORATORY_SHELF_LIMIT } from "../../src/shared/constants/app";
import { SavedExperimentSchema, type SavedExperiment } from "../../src/shared/schemas";

const WHEN = "2026-03-04T10:00:00.000Z";
const CHANNEL_B = [7, 8, 10, 10, 13, 15];

function shelfOf(n: number): SavedExperiment[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `exp.${i}`,
    title: `Set ${i}`,
    values: [1, 2, 3],
    chartKind: "dot-plot" as const,
    savedAt: WHEN
  }));
}

describe("keeping an experiment", () => {
  it("shelves the readings, the title and the chart it was drawn as", () => {
    const result = saveExperiment(
      [],
      { experiment: createExperiment("Channel B", CHANNEL_B), chartKind: "histogram", binWidth: 2 },
      WHEN
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.saved.values).toEqual(CHANNEL_B);
    expect(result.saved.title).toBe("Channel B");
    expect(result.saved.chartKind).toBe("histogram");
    expect(result.saved.binWidth).toBe(2);
    // It has to survive the save file, so it has to satisfy the save's schema.
    expect(() => SavedExperimentSchema.parse(result.saved)).not.toThrow();
  });

  it("puts the newest at the front and leaves the rest alone", () => {
    const existing = shelfOf(2);
    const result = saveExperiment(existing, { experiment: createExperiment("New", [4]), chartKind: "box-plot" }, WHEN);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.experiments).toHaveLength(3);
    expect(result.experiments[0]!.title).toBe("New");
    expect(result.experiments.slice(1)).toEqual(existing);
  });

  it("gives entries saved in the same instant distinct ids", () => {
    const first = saveExperiment([], { experiment: createExperiment("A", [1]), chartKind: "dot-plot" }, WHEN);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = saveExperiment(first.experiments, { experiment: createExperiment("B", [2]), chartKind: "dot-plot" }, WHEN);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.saved.id).not.toBe(first.saved.id);
    expect(new Set(second.experiments.map((e) => e.id)).size).toBe(2);
  });

  it("refuses an empty bench rather than shelving nothing", () => {
    const result = saveExperiment([], { experiment: createExperiment("Empty", []), chartKind: "dot-plot" }, WHEN);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("nothing to keep");
  });

  it("refuses a full shelf and names the limit", () => {
    // Not rotation: the learner chose to keep every one of those, and a save
    // file that grows without limit is a persistence defect in disguise.
    const full = shelfOf(LABORATORY_SHELF_LIMIT);
    const result = saveExperiment(full, { experiment: createExperiment("One more", [1, 2]), chartKind: "dot-plot" }, WHEN);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain(String(LABORATORY_SHELF_LIMIT));
    expect(result.reason).toContain("Remove one");
  });

  it("removes by id and leaves the others", () => {
    const shelf = shelfOf(3);
    expect(removeExperiment(shelf, "exp.1").map((e) => e.id)).toEqual(["exp.0", "exp.2"]);
    expect(removeExperiment(shelf, "exp.absent")).toEqual(shelf);
  });
});

describe("reloading an experiment", () => {
  it("brings back the readings and the title", () => {
    const saved = saveExperiment([], { experiment: createExperiment("Channel B", CHANNEL_B), chartKind: "box-plot" }, WHEN);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const back = loadExperiment(saved.saved);
    expect(back.values).toEqual(CHANNEL_B);
    expect(back.title).toBe("Channel B");
  });

  it("comes back with an empty log rather than yesterday's edits", () => {
    // The log is the trail of one sitting. Reopening a set and being told what
    // "just" changed about it hours ago would be a lie about the readings in
    // front of the learner.
    const edited = addValue(createExperiment("Channel B", CHANNEL_B), 40);
    expect(edited.log).toHaveLength(1);
    const saved = saveExperiment([], { experiment: edited, chartKind: "box-plot" }, WHEN);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.saved).not.toHaveProperty("log");
    expect(loadExperiment(saved.saved).log).toEqual([]);
  });

  it("hands back its own array rather than the shelf entry's", () => {
    // Asserted by identity, not by value. The first version of this test added
    // a reading and checked the shelf entry was unchanged — which passes either
    // way, because every bench operation allocates a new array. A probe pointing
    // `loadExperiment` straight at the stored array failed nothing, which is how
    // a test that names a property but does not check it gets found.
    const saved = saveExperiment([], { experiment: createExperiment("Channel B", CHANNEL_B), chartKind: "box-plot" }, WHEN);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const back = loadExperiment(saved.saved);
    expect(back.values).toEqual(saved.saved.values);
    expect(back.values).not.toBe(saved.saved.values);
    expect(addValue(back, 99).values).toHaveLength(CHANNEL_B.length + 1);
  });
});

describe("exporting a summary", () => {
  const text = exportSummary(
    { experiment: createExperiment("Channel B", CHANNEL_B), chartKind: "box-plot" },
    "2026-03-04"
  );

  it("carries every measure the screen shows", () => {
    for (const label of [
      "Count", "Sum", "Mean", "Median", "Mode", "Range", "Minimum", "First quartile",
      "Third quartile", "Maximum", "Interquartile range", "Sample variance", "Sample std. deviation"
    ]) {
      expect(text, `${label} missing from the export`).toContain(label);
    }
    expect(text).toMatch(/^Median\s+10$/m);
  });

  it("carries the picture, which only survives a paste as words", () => {
    expect(text).toContain("Box plot of 6 readings");
    expect(text).toContain("The box spans 8 to 13.");
  });

  it("carries the readings themselves, so the export can be checked", () => {
    expect(text).toContain("Readings (6)");
    expect(text).toContain(CHANNEL_B.join(", "));
  });

  it("names the quartile convention it used", () => {
    // Two conventions live in this codebase on purpose (D-045). An export that
    // travels without saying which one produced its numbers is unreadable by
    // anyone checking it against a spreadsheet.
    expect(text).toContain("median-of-halves");
  });

  it("says why variance is absent instead of leaving a blank", () => {
    const one = exportSummary(
      { experiment: createExperiment("Single", [5]), chartKind: "dot-plot" },
      "2026-03-04"
    );
    expect(one).toMatch(/^Sample variance\s+not available$/m);
    expect(one).toContain("need at least two readings");
  });

  it("states the bin width when the picture was a histogram", () => {
    const histogram = exportSummary(
      { experiment: createExperiment("Channel B", CHANNEL_B), chartKind: "histogram", binWidth: 2 },
      "2026-03-04"
    );
    expect(histogram).toContain("width 2");
  });
});
