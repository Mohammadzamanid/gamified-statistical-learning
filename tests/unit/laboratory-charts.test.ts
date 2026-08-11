/**
 * S2-15 cycle 2: the bench's pictures and its comparison.
 *
 * Two things are checked here that a chart component's own tests cannot. First,
 * that the words the bench generates describe the chart it actually drew —
 * on a bench the picture changes under the learner's hands, so a description
 * is a live claim rather than a caption written once. Second, that the
 * comparison answers `l.r2-comparing-distributions`'s three questions
 * separately, so two sets sharing a median are never reported as alike.
 */
import { describe, expect, it } from "vitest";
import {
  compareExperiments,
  createExperiment,
  describeChart,
  experimentToDataset,
  LAB_CHART_EXCLUSIONS,
  LAB_CHART_KINDS
} from "../../src/core/laboratory";
import { buildBins, stackDots } from "../../src/core/statistics/binning";
import { RENDERED_VISUAL_KINDS } from "../../src/renderer/components/rendered-visuals";
import { DatasetSchema } from "../../src/shared/schemas";

// Channel A and Channel B from l.r2-comparing-distributions: same median, very
// different middle halves. The lesson's whole argument, on the bench.
const CHANNEL_A = [9.85, 9.9, 10, 10, 10.1, 10.15];
const CHANNEL_B = [7, 8, 10, 10, 13, 15];

describe("what the bench offers to draw", () => {
  it("offers only kinds that genuinely draw", () => {
    for (const kind of LAB_CHART_KINDS) {
      expect(RENDERED_VISUAL_KINDS, `${kind} is offered by the bench`).toContain(kind);
    }
  });

  it("names what it does not offer, and why", () => {
    // The bench holds one column of numbers. A bar chart needs a name per bar
    // and a scatterplot a second measurement per reading, so offering either
    // would mean inventing data (D-046). Saying so is the honest alternative.
    const excluded = LAB_CHART_EXCLUSIONS.map((x) => x.kind);
    expect(excluded.sort()).toEqual(["bar-chart", "scatter"]);
    for (const kind of excluded) {
      expect(LAB_CHART_KINDS, `${kind} is both offered and excluded`).not.toContain(kind);
      expect(RENDERED_VISUAL_KINDS, `${kind} is excluded for the wrong reason`).toContain(kind);
    }
    for (const { reason } of LAB_CHART_EXCLUSIONS) {
      expect(reason.trim().length).toBeGreaterThan(20);
    }
  });

  it("hands the chart components a dataset they accept", () => {
    // The bench draws through the same components a lesson's visual uses, so
    // what it builds has to satisfy the same schema.
    const dataset = experimentToDataset(createExperiment("Bench", CHANNEL_B), "m");
    expect(() => DatasetSchema.parse(dataset)).not.toThrow();
    expect(dataset.columns[0]!.kind).toBe("numeric");
    expect(dataset.rows).toHaveLength(CHANNEL_B.length);
  });
});

describe("the words describe the chart that was drawn", () => {
  it("gives a box plot all five of its numbers", () => {
    // For a reader who cannot see it, the description *is* the box plot (D-049).
    // 7 8 10 10 13 15 — median of the halves, so Q1 is the median of 7, 8, 10.
    const words = describeChart("box-plot", CHANNEL_B);
    for (const n of [7, 8, 10, 13, 15]) {
      expect(words, `five-number summary component ${n} missing`).toContain(String(n));
    }
    expect(words).toContain("The box spans 8 to 13.");
  });

  it("states the bin width, which a finished histogram never shows", () => {
    // D-047's rule, kept here by construction: the setting that changes the
    // picture has to be in the words, because it is invisible in the picture.
    const words = describeChart("histogram", CHANNEL_B, 2);
    expect(words).toContain("width 2");
    const bins = buildBins(CHANNEL_B, 2);
    expect(words).toContain(`${bins.length} interval`);
  });

  it("follows the bin width rather than describing a fixed one", () => {
    const narrow = describeChart("histogram", CHANNEL_B, 1);
    const wide = describeChart("histogram", CHANNEL_B, 4);
    expect(narrow).not.toEqual(wide);
    expect(narrow).toContain("width 1");
    expect(wide).toContain("width 4");
  });

  it("reports the dot plot's tallest column from the same stacks it draws", () => {
    const values = [4, 5, 5, 6, 6, 6, 7];
    const words = describeChart("dot-plot", values);
    const tallest = Math.max(...stackDots(values).map((s) => s.height));
    expect(words).toContain(`${tallest} dots high`);
    expect(words).toContain("at 6");
    expect(words).toContain("4 distinct values");
  });

  it("says there is nothing to draw rather than describing an empty chart", () => {
    for (const kind of LAB_CHART_KINDS) {
      expect(describeChart(kind, [])).toContain("nothing to draw");
    }
  });
});

describe("comparing two sets asks three questions, not one", () => {
  it("refuses to call two sets alike because their centres agree", () => {
    const c = compareExperiments(CHANNEL_A, CHANNEL_B, { a: "Channel A", b: "Channel B" });
    const byQuestion = Object.fromEntries(c.findings.map((f) => [f.question, f]));
    expect(byQuestion.centre!.agree, "the medians do agree").toBe(true);
    expect(byQuestion.spread!.agree, "the middle halves do not").toBe(false);
    expect(c.verdict).toContain("agree on centre");
    expect(c.verdict).toContain("would have called them the same");
  });

  it("reads a tail the way the skew lesson reads one", () => {
    // Mean above median is a tail on the high side — the reading l.r2-skew
    // teaches and q.r2-comparing-distributions-mastery turns on.
    const right = compareExperiments([1, 2, 3, 4, 40], [1, 2, 3, 4, 5]);
    const shape = right.findings.find((f) => f.question === "shape")!;
    expect(shape.agree).toBe(false);
    expect(shape.reading).toContain("tail of high readings");
  });

  it("reports agreement on all three without claiming the sets are identical", () => {
    const c = compareExperiments([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]);
    expect(c.findings.every((f) => f.agree)).toBe(true);
    expect(c.verdict).toContain("statement about the three");
  });

  it("says all three differ when they do", () => {
    const c = compareExperiments([1, 2, 3, 4, 40], [10, 20, 30, 31, 32]);
    expect(c.findings.filter((f) => f.agree)).toHaveLength(0);
    expect(c.verdict).toContain("two different distributions");
  });

  it("compares nothing when a bench is empty", () => {
    const c = compareExperiments([], CHANNEL_B);
    expect(c.findings).toHaveLength(0);
    expect(c.verdict).toContain("need readings");
  });
});
