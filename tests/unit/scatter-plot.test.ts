/**
 * S2-14: the column pairing behind the scatterplot.
 *
 * Every other chart component in this build reads *the first* numeric column and
 * ignores the rest. A scatterplot is the first that needs two, and the failure
 * mode is silent: fall back to the first numeric column twice and the chart
 * draws a flawless diagonal that no reader could tell from a real finding.
 * `numericPair` returns null instead, and this file is what stops that being
 * "simplified" into a fallback later (D-044).
 */
import { describe, expect, it } from "vitest";
import { numericPair } from "../../src/renderer/components/ScatterPlot";
import { loadShippedContent } from "../../src/content";
import type { Dataset } from "../../src/shared/schemas";

const content = loadShippedContent();

function datasetOf(kinds: Array<Dataset["columns"][number]["kind"]>): Dataset {
  return {
    id: "ds.made-up",
    title: "Made up",
    columns: kinds.map((kind, i) => ({ name: `c${i}`, kind })),
    rows: [kinds.map(() => 1)]
  } as Dataset;
}

describe("choosing the two columns a scatterplot plots", () => {
  it("refuses a dataset with one numeric column rather than plotting it against itself", () => {
    expect(numericPair(datasetOf(["numeric"]))).toBeNull();
    expect(numericPair(datasetOf(["categorical", "numeric"]))).toBeNull();
  });

  it("refuses a dataset with no numeric columns", () => {
    expect(numericPair(datasetOf(["categorical", "categorical"]))).toBeNull();
  });

  it("takes the two numeric columns, skipping non-numeric ones between them", () => {
    expect(numericPair(datasetOf(["numeric", "categorical", "numeric"]))).toEqual({ xIndex: 0, yIndex: 2 });
  });

  it("pairs the shipped trip dataset as hours against crates", () => {
    const dataset = content.datasets.get("ds.trip-length-catch")!;
    const pair = numericPair(dataset)!;
    expect(pair).not.toBeNull();
    expect(dataset.columns[pair.xIndex]!.name).toBe("Hours at sea");
    expect(dataset.columns[pair.yIndex]!.name).toBe("Crates landed");
  });

  it("refuses every single-variable dataset the other charts use", () => {
    // The concrete reason the guard exists: three of the four shipped datasets
    // hold one numeric column, and each is the subject of some other chart.
    for (const id of ["ds.channel-depths", "ds.crew-sizes"]) {
      expect(numericPair(content.datasets.get(id)!), `${id} should not be plottable as a scatter`).toBeNull();
    }
  });

  it("keeps the readings the lesson quotes", () => {
    const dataset = content.datasets.get("ds.trip-length-catch")!;
    const rows = dataset.rows.map((r) => [Number(r[0]), Number(r[1])]);
    expect(rows).toContainEqual([9, 6]);
    expect(rows.filter(([, crates]) => crates! > 15).length, "boats landing more than 15 crates").toBe(3);
  });
});

/**
 * The port landings, which two lessons quote by value.
 *
 * `l.r2-misleading-graphs` states 48 and 53 in its prompts, its answers and its
 * accessible descriptions, and the whole truncated-axis argument is arithmetic
 * on those two numbers. Same reasoning as the histogram and dot-plot dataset
 * tests: the content asserts what the data is, so the data is checked (D-044).
 */
describe("the port landings the misleading-graphs lesson argues from", () => {
  it("holds the five figures the lesson quotes", () => {
    const dataset = content.datasets.get("ds.port-landings")!;
    expect(dataset.rows.map((r) => [String(r[0]), Number(r[1])])).toEqual([
      ["Northport", 48],
      ["Eastquay", 50],
      ["Southbar", 51],
      ["Westhead", 52],
      ["Midpier", 53]
    ]);
  });

  it("keeps the gap between the two named ports at 5 crates", () => {
    const dataset = content.datasets.get("ds.port-landings")!;
    const values = Object.fromEntries(dataset.rows.map((r) => [String(r[0]), Number(r[1])]));
    expect(values["Midpier"]! - values["Northport"]!, "the difference the independent question asks for").toBe(5);
    // Truncated at 47 the bars stand 6 and 1, which is the sixfold the lesson
    // contrasts with the real ratio of about 1.1.
    expect((values["Midpier"]! - 47) / (values["Northport"]! - 47)).toBeCloseTo(6, 10);
    expect(values["Midpier"]! / values["Northport"]!).toBeCloseTo(1.1042, 3);
  });
});
