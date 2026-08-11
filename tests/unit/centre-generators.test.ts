/**
 * S2-17: the centre generators' own arithmetic, pinned to values worked out by
 * hand.
 *
 * Two probes in cycle 2 failed nothing, and both pointed here. Replacing the
 * family's independent route with the answer key made the two agree trivially,
 * and breaking `medianOf` so it never sorted turned its candidates into
 * *invalid* ones rather than answer failures — the topic still cleared 100 on
 * its other families, so the whole suite stayed green while the generator
 * computed the wrong thing.
 *
 * Both are the same hole: the generator's arithmetic was checked only against
 * itself. The validator compares two routes and reports when they disagree, but
 * agreement proves nothing if both routes are wrong, and a rejection path can
 * swallow the disagreement entirely.
 *
 * So this file pins the numbers to constants computed by hand from the shipped
 * lists. It cannot prove the two routes are *independent* — that is a property
 * of how the family is written, not something a test can see — but it does
 * prove both are right, which is what the independence was protecting.
 */
import { describe, expect, it } from "vitest";
import {
  LISTS,
  meanByRunningAverage,
  meanOf,
  medianByPeeling,
  medianOf,
  modeByScanning,
  modesOf
} from "../../src/content/generators/centre";
import {
  quartilesOf,
  rangeByWalking,
  rangeOf,
  varianceByMomentDifference,
  varianceOf
} from "../../src/content/generators/spread";

const byId = new Map(LISTS.map((l) => [l.id, l]));

/**
 * Worked by hand from the corpus, not read back out of it.
 *
 * Kittiwake  4 6 6 8 11        sum 35, n 5   mean 7,    median 6,   mode 6
 * Gannet     2 4 8 8 10 16     sum 48, n 6   mean 8,    median 8,   mode 8
 * Petrel     1 3 3 4 6 7 7 9   sum 40, n 8   mean 5,    median 5,   modes 3 and 7
 * Skua       10 12 12 14 32    sum 80, n 5   mean 16,   median 12,  mode 12
 * Tern       2 2 3 4 4 4 6 7 8 sum 40, n 9   mean 4.44, median 4,   mode 4
 */
const BY_HAND: ReadonlyArray<{
  id: string;
  mean: number;
  median: number;
  modes: number[];
}> = [
  { id: "kittiwake", mean: 7, median: 6, modes: [6] },
  { id: "gannet", mean: 8, median: 8, modes: [8] },
  { id: "petrel", mean: 5, median: 5, modes: [3, 7] },
  { id: "skua", mean: 16, median: 12, modes: [12] },
  { id: "tern", mean: 4.4444, median: 4, modes: [4] }
];

describe("the centre generators compute what they claim", () => {
  it.each(BY_HAND.map((c) => [c.id, c] as const))("gets %s right, both ways", (_id, expected) => {
    const list = byId.get(expected.id);
    expect(list, `${expected.id} is no longer in the corpus`).toBeDefined();
    const values = list!.values;

    expect(meanOf(values)).toBeCloseTo(expected.mean, 3);
    expect(meanByRunningAverage(values)).toBeCloseTo(expected.mean, 3);

    expect(medianOf(values)).toBe(expected.median);
    expect(medianByPeeling(values)).toBe(expected.median);

    expect(modesOf(values)).toEqual(expected.modes);
    // The scanning route returns one mode; where a list has several it returns
    // the smallest, and the families reject those candidates rather than asking
    // for a single answer.
    expect(expected.modes).toContain(modeByScanning(values));
  });

  it("agrees with itself on every list in the corpus", () => {
    // The validator already compares the two routes per candidate. This asserts
    // it across the whole corpus in one place, so a list added later that breaks
    // the agreement fails here by name rather than as a rejection count.
    for (const list of LISTS) {
      expect(meanByRunningAverage(list.values), `${list.id} mean`).toBeCloseTo(meanOf(list.values), 6);
      expect(medianByPeeling(list.values), `${list.id} median`).toBe(medianOf(list.values));
      expect(modesOf(list.values), `${list.id} mode`).toContain(modeByScanning(list.values));
    }
  });

  it("sorts before taking a median, on a list written out of order", () => {
    // The specific defect a probe walked through: a median that indexes the list
    // as written. Written as its own case so the failure names the cause.
    const outOfOrder = [11, 8, 6, 6, 4];
    expect(medianOf(outOfOrder)).toBe(6);
    expect(medianByPeeling(outOfOrder)).toBe(6);
    // The middle of the list as written is also 6 here, so a second list where
    // the two genuinely differ:
    expect(medianOf([9, 1, 2, 3, 4])).toBe(3);
    expect(medianByPeeling([9, 1, 2, 3, 4])).toBe(3);
  });

  it("averages an even-sized list by the two middle values", () => {
    expect(medianOf([2, 4, 8, 10])).toBe(6);
    expect(medianByPeeling([2, 4, 8, 10])).toBe(6);
  });

  it("keeps every corpus list usable: at least five figures, and a repeat to find", () => {
    for (const list of LISTS) {
      expect(list.values.length, `${list.id}`).toBeGreaterThanOrEqual(5);
      expect(new Set(list.values).size, `${list.id} has no repeated figure`).toBeLessThan(list.values.length);
    }
  });
});

/**
 * S2-17 cycle 3: the spread generators' arithmetic, pinned the same way.
 *
 * The conventions matter more here than anywhere. Quartiles are the median of
 * each half (D-045) and the variance divides by how many readings there are
 * (D-060), because those are what the lessons teach — and the laboratory was
 * corrected to the second of them in this same cycle, having reported the
 * sample form since S2-15.
 */
describe("the spread generators compute what the lessons teach", () => {
  it("takes quartiles as the median of each half, not by interpolation", () => {
    // 4 6 6 8 11: the middle 6 belongs to neither half, so Q1 is the median of
    // 4 and 6, and Q3 the median of 8 and 11. R-7 would answer 6 and 8.
    const q = quartilesOf([4, 6, 6, 8, 11]);
    expect(q.q1).toBe(5);
    expect(q.q2).toBe(6);
    expect(q.q3).toBe(9.5);
  });

  it("divides the squared distances by how many readings there are", () => {
    // The figures l.r2-variance publishes in its own questions. The sample form
    // would answer 13.33 and 10 respectively.
    expect(varianceOf([3, 5, 9, 11])).toBeCloseTo(10, 6);
    expect(varianceOf([4, 6, 8, 10, 12])).toBeCloseTo(8, 6);
    expect(varianceOf([2, 10])).toBeCloseTo(16, 6);
  });

  it("reaches the same variance by the moment difference", () => {
    for (const list of LISTS) {
      expect(varianceByMomentDifference(list.values), `${list.id}`).toBeCloseTo(varianceOf(list.values), 3);
    }
  });

  it("gets the range right, both ways", () => {
    expect(rangeOf([4, 6, 6, 8, 11])).toBe(7);
    for (const list of LISTS) {
      expect(rangeByWalking(list.values), `${list.id}`).toBe(rangeOf(list.values));
    }
  });
});
