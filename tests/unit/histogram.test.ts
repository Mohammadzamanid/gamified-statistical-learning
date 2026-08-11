/**
 * S2-14: the binning behind the histogram.
 *
 * Binning is arithmetic behind a taught picture, so it is checked directly
 * rather than inferred from rendered SVG — the same reasoning that put the
 * demonstration readout in `src/core` rather than in a component (D-001).
 * `l.r2-histograms` states specific bin contents in its questions and in its
 * accessible description, and those claims are only true if this function
 * produces them.
 */
import { describe, expect, it } from "vitest";
import { buildBins } from "../../src/core/statistics/binning";
import { loadShippedContent } from "../../src/content";

describe("histogram binning", () => {
  it("returns nothing for no readings", () => {
    expect(buildBins([])).toEqual([]);
  });

  it("collapses a set with no spread into one bin", () => {
    expect(buildBins([4, 4, 4])).toEqual([{ from: 4, to: 4, count: 3 }]);
  });

  it("puts every reading in exactly one bin", () => {
    const values = [2, 3, 5, 6, 7, 7, 8, 9, 9, 10, 11, 12, 12, 13, 14, 15, 16, 17, 20, 22];
    const bins = buildBins(values);
    expect(bins.reduce((n, b) => n + b.count, 0), "a reading was dropped or double-counted").toBe(values.length);
  });

  it("bins the shipped channel soundings the way the lesson says it does", () => {
    // The lesson's questions and its accessible description both assert these
    // five counts. If the binning changes, the content becomes wrong about its
    // own picture, and this is where that is caught.
    const content = loadShippedContent();
    const dataset = content.datasets.get("ds.channel-depths")!;
    const values = dataset.rows.map((r) => Number(r[0]));
    expect(buildBins(values).map((b) => [b.from, b.to, b.count])).toEqual([
      [2, 6, 3],
      [6, 10, 6],
      [10, 14, 5],
      [14, 18, 4],
      [18, 22, 2]
    ]);
  });

  it("halves the bar count when the bin width doubles", () => {
    // The claim dem.r2-histograms is built on.
    const values = [2, 3, 5, 6, 7, 7, 8, 9, 9, 10, 11, 12, 12, 13, 14, 15, 16, 17, 20, 22];
    expect(buildBins(values, 4).length).toBe(5);
    expect(buildBins(values, 8).length).toBe(3);
  });

  it("leaves the readings alone whatever the bin width", () => {
    const values = [2, 3, 5, 6, 7, 7, 8, 9, 9, 10, 11, 12, 12, 13, 14, 15, 16, 17, 20, 22];
    for (const width of [2, 4, 5, 8, 10]) {
      expect(buildBins(values, width).reduce((n, b) => n + b.count, 0), `bin width ${width}`).toBe(values.length);
    }
  });
});
