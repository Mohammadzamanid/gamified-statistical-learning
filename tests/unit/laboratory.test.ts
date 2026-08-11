/**
 * S2-15: the laboratory core.
 *
 * The bench's claim is not that it computes correctly — `tests/statistics`
 * already holds that ground, and the bench recomputes nothing. Its claim is
 * that every edit reports what it moved and what it did not, which is the whole
 * difference between a learning environment and a calculator. So these tests
 * are mostly about the log: that sorting moves nothing and says so, that an
 * outlier drags the mean further than the median, and that a refusal is a
 * refusal rather than an invented number.
 */
import { describe, expect, it } from "vitest";
import {
  addOutlier,
  addValue,
  compareSummaries,
  createExperiment,
  describeChange,
  experimentFromDataset,
  removeValueAt,
  renameExperiment,
  replaceValueAt,
  resetExperiment,
  sortValues,
  suggestedOutlier,
  summarise
} from "../../src/core/laboratory";
import { loadShippedContent } from "../../src/content";

const BASE = [2, 4, 4, 6, 9];

describe("the summary the bench reports", () => {
  it("reports the quartile convention the lessons teach, not the interpolated one", () => {
    // Median of each half: for 2 4 4 6 9 the 4 in the middle belongs to neither,
    // so Q1 is the median of 2 and 4. R-7 would answer 4 and 6 (D-045).
    const s = summarise(BASE);
    expect(s.q1).toBeCloseTo(3, 10);
    expect(s.median).toBeCloseTo(4, 10);
    expect(s.q3).toBeCloseTo(7.5, 10);
    expect(s.iqr).toBeCloseTo(4.5, 10);
  });

  it("reports the denominator the lessons teach, not the sample one", () => {
    // 2 4 4 6 9, mean 5: squared distances 9, 1, 1, 1, 16 = 28. The average of
    // those is 28/5 = 5.6, which is what l.r2-variance teaches and what a
    // learner will do on paper. The sample form would answer 7, and the bench
    // reported exactly that until S2-17 (D-060).
    expect(summarise(BASE).variance).toBeCloseTo(5.6, 10);
    expect(summarise(BASE).standardDeviation).toBeCloseTo(Math.sqrt(5.6), 6);
    // One reading: zero, which is the definition's own answer rather than a
    // stand-in for a missing one.
    const one = summarise([5]);
    expect(one.variance).toBe(0);
    expect(one.standardDeviation).toBe(0);
    expect(one.median).toBe(5);
  });

  it("agrees with the figures l.r2-variance publishes", () => {
    // The lesson's own questions, so the bench cannot drift from the teaching
    // without this failing by name.
    expect(summarise([3, 5, 9, 11]).variance).toBeCloseTo(10, 10);
    expect(summarise([4, 6, 8, 10, 12]).variance).toBeCloseTo(8, 10);
    expect(summarise([4, 6, 8, 10, 12]).standardDeviation).toBeCloseTo(2.8284, 4);
  });

  it("reports an empty bench as empty rather than throwing", () => {
    const empty = summarise([]);
    expect(empty.count).toBe(0);
    expect(empty.mean).toBeNull();
    expect(empty.mode).toEqual([]);
  });

  it("lists every mode when a dataset has more than one", () => {
    expect(summarise([1, 1, 2, 2, 3]).mode).toEqual([1, 2]);
  });
});

describe("an edit says what it moved", () => {
  it("records the summary either side of an added reading", () => {
    const after = addValue(createExperiment("Soundings", BASE), 20);
    expect(after.values).toEqual([2, 4, 4, 6, 9, 20]);
    expect(after.log).toHaveLength(1);
    expect(after.log[0]!.before.mean).toBeCloseTo(5, 10);
    expect(after.log[0]!.after.mean).toBeCloseTo(7.5, 10);
  });

  it("names the measures that held still as well as the ones that moved", () => {
    const after = addValue(createExperiment("Soundings", BASE), 20);
    const line = describeChange(after.log[0]!);
    expect(line).toContain("mean 5 to 7.5");
    // The mode is 4 before and after, so it belongs in the unchanged half —
    // that is the observation the outlier lesson turns on.
    expect(line).toContain("Unchanged:");
    expect(line).toContain("mode");
  });

  it("keeps the log newest-first across several edits", () => {
    const exp = addValue(addValue(createExperiment("Soundings", BASE), 10), 11);
    expect(exp.log).toHaveLength(2);
    expect(exp.log[0]!.action).toBe("Added 11");
    expect(exp.log[1]!.action).toBe("Added 10");
  });
});

describe("sorting is the case where nothing moves", () => {
  it("reorders the readings", () => {
    const sorted = sortValues(createExperiment("Soundings", [9, 2, 6, 4, 4]));
    expect(sorted.values).toEqual([2, 4, 4, 6, 9]);
    expect(sortValues(createExperiment("s", [1, 3, 2]), "descending").values).toEqual([3, 2, 1]);
  });

  it("says out loud that no measure changed", () => {
    const sorted = sortValues(createExperiment("Soundings", [9, 2, 6, 4, 4]));
    const changes = compareSummaries(sorted.log[0]!.before, sorted.log[0]!.after);
    expect(changes.every((c) => !c.moved)).toBe(true);
    expect(describeChange(sorted.log[0]!)).toContain("No measure changed");
  });
});

describe("the outlier the bench offers comes from the data on the bench", () => {
  it("lands beyond the upper fence the outlier lesson teaches", () => {
    const value = suggestedOutlier(BASE)!;
    const s = summarise(BASE);
    expect(value).toBeGreaterThan(s.q3! + 1.5 * s.iqr!);
    expect(value).toBeCloseTo(18.75, 10);
  });

  it("drags the mean further than the median", () => {
    // The point of the exercise, and the reason it is a button rather than a
    // paragraph. Not "the median does not move" — with an even count it can —
    // but that one reading pulls the mean much harder.
    const after = addOutlier(createExperiment("Soundings", BASE));
    const { before: b, after: a } = after.log[0]!;
    const meanShift = Math.abs(a.mean! - b.mean!);
    const medianShift = Math.abs(a.median! - b.median!);
    expect(meanShift).toBeCloseTo(2.2916667, 6);
    expect(medianShift).toBeCloseTo(1, 10);
    expect(meanShift).toBeGreaterThan(medianShift);
  });

  it("offers nothing when there is nothing to compute a fence from", () => {
    expect(suggestedOutlier([])).toBeNull();
    expect(suggestedOutlier([7])).toBeNull();
    // A middle half of zero width makes the fence rule degenerate — it sits on
    // Q3, so every larger reading is already outside it — and the readings
    // cannot say how much further out to go. The first draft answered 10 here,
    // a number derived from nothing, and this line is why it no longer does.
    expect(suggestedOutlier([5, 5, 5])).toBeNull();
    expect(suggestedOutlier([1, 2, 2, 2, 2, 2, 2, 3])).toBeNull();
    const flat = createExperiment("Flat", [5, 5, 5]);
    expect(addOutlier(flat).log).toHaveLength(0);
    expect(addOutlier(flat)).toBe(flat);
  });
});

describe("edits that cannot be made are refused, not faked", () => {
  it("ignores an index that is not there", () => {
    const exp = createExperiment("Soundings", BASE);
    expect(removeValueAt(exp, 9)).toBe(exp);
    expect(replaceValueAt(exp, 9, 3)).toBe(exp);
  });

  it("ignores a non-finite reading", () => {
    const exp = createExperiment("Soundings", BASE);
    expect(addValue(exp, Number.NaN)).toBe(exp);
    expect(replaceValueAt(exp, 0, Number.POSITIVE_INFINITY)).toBe(exp);
  });

  it("ignores an edit that changes nothing", () => {
    const exp = createExperiment("Soundings", BASE);
    expect(replaceValueAt(exp, 0, 2)).toBe(exp);
  });

  it("removes and replaces by position", () => {
    const exp = createExperiment("Soundings", BASE);
    expect(removeValueAt(exp, 0).values).toEqual([4, 4, 6, 9]);
    expect(replaceValueAt(exp, 4, 90).values).toEqual([2, 4, 4, 6, 90]);
    expect(removeValueAt(exp, 0).log[0]!.action).toBe("Removed 2");
  });
});

describe("the bench can start from a shipped dataset", () => {
  const content = loadShippedContent();

  it("takes the first numeric column of one the lessons use", () => {
    const dataset = content.datasets.get("ds.channel-depths")!;
    const exp = experimentFromDataset(dataset)!;
    expect(exp.values).toHaveLength(dataset.rows.length);
    // The same five numbers l.r2-box-plots draws, so a learner can carry a
    // lesson's dataset onto the bench and recognise it.
    const s = summarise(exp.values);
    expect([s.min, s.q1, s.median, s.q3, s.max]).toEqual([2, 7, 10.5, 14.5, 22]);
  });

  it("refuses a dataset with no numeric column instead of inventing one", () => {
    expect(
      experimentFromDataset({
        id: "ds.test",
        title: "Ports",
        columns: [{ name: "Port", kind: "categorical" }],
        rows: [["Northport"], ["Eastquay"]]
      })
    ).toBeNull();
  });
});

describe("housekeeping", () => {
  it("resets to an empty bench and clears the trail", () => {
    const exp = addValue(createExperiment("Soundings", BASE), 20);
    const cleared = resetExperiment(exp);
    expect(cleared.values).toEqual([]);
    expect(cleared.log).toEqual([]);
    expect(cleared.title).toBe("Soundings");
  });

  it("renames without disturbing the readings or the trail", () => {
    const exp = addValue(createExperiment("Soundings", BASE), 20);
    const renamed = renameExperiment(exp, "Channel B");
    expect(renamed.title).toBe("Channel B");
    expect(renamed.values).toEqual(exp.values);
    expect(renamed.log).toEqual(exp.log);
  });
});
