/**
 * S2-14: the stacking behind the dot plot.
 *
 * `l.r2-dot-plots` states exact column heights in its questions and again in the
 * chart's accessible description, and its whole teaching point is that the mode
 * is the value under the tallest stack. Those are properties of this function,
 * not of the SVG, so they are checked here (D-044).
 */
import { describe, expect, it } from "vitest";
import { stackDots } from "../../src/renderer/components/DotPlot";
import { loadShippedContent } from "../../src/content";

describe("dot stacking", () => {
  it("returns nothing for no readings", () => {
    expect(stackDots([])).toEqual([]);
  });

  it("keeps every reading, so the heights total the count", () => {
    const values = [4, 5, 5, 6, 6, 6, 7, 7, 8, 12];
    expect(stackDots(values).reduce((n, s) => n + s.height, 0)).toBe(values.length);
  });

  it("stacks the shipped crew sizes the way the lesson says it does", () => {
    const content = loadShippedContent();
    const dataset = content.datasets.get("ds.crew-sizes")!;
    const values = dataset.rows.map((r) => Number(r[0]));
    expect(stackDots(values).map((s) => [s.value, s.height])).toEqual([
      [4, 1],
      [5, 2],
      [6, 3],
      [7, 2],
      [8, 1],
      [12, 1]
    ]);
  });

  it("puts the mode under the tallest stack, which is the lesson's claim", () => {
    const content = loadShippedContent();
    const values = content.datasets.get("ds.crew-sizes")!.rows.map((r) => Number(r[0]));
    const stacks = stackDots(values);
    const tallest = stacks.reduce((a, b) => (b.height > a.height ? b : a));
    expect(tallest.value, "the mode is not under the tallest column").toBe(6);
    expect(tallest.height).toBe(3);
  });

  it("orders the columns along the line", () => {
    const stacks = stackDots([12, 4, 7, 5, 7]);
    expect(stacks.map((s) => s.value)).toEqual([4, 5, 7, 12]);
  });
});
