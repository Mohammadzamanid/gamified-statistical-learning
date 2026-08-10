/**
 * S2-14: the two quartile conventions, pinned apart.
 *
 * `src/core/statistics` computes quartiles two ways, and the difference is not
 * an accident to be tidied up. `quartiles` interpolates (R-7), matching NumPy
 * and spreadsheets; `quartilesByHalves` takes the median of each half, which is
 * what `l.r2-quartiles` teaches and what a learner will do on paper.
 *
 * Until S2-14 the laboratory reported the interpolated numbers to learners who
 * had just been taught the other rule, so the bench contradicted the lesson on
 * every dataset those lessons use (D-045). This file exists so that neither
 * function can be quietly "fixed" into the other: it asserts each convention's
 * own answers, and asserts they disagree where they genuinely do.
 */
import { describe, expect, it } from "vitest";
import * as s from "../../src/core/statistics/descriptive";

// The eight readings l.r2-quartiles works through in its guided question.
const LESSON_SET = [2, 4, 5, 7, 9, 11, 12, 15];
// The twelve l.r2-iqr uses for its misconception question.
const IQR_SET = [3, 5, 6, 8, 9, 11, 14, 16, 18, 21, 24, 30];

describe("quartiles under the convention the curriculum teaches", () => {
  it("gives the numbers l.r2-quartiles states", () => {
    const q = s.quartilesByHalves(LESSON_SET);
    expect(q.q1).toBeCloseTo(4.5, 10);
    expect(q.q2).toBeCloseTo(8, 10);
    expect(q.q3).toBeCloseTo(11.5, 10);
  });

  it("gives the numbers l.r2-iqr states", () => {
    const q = s.quartilesByHalves(IQR_SET);
    expect(q.q1).toBeCloseTo(7, 10);
    expect(q.q3).toBeCloseTo(19.5, 10);
    expect(s.interquartileRangeByHalves(IQR_SET)).toBeCloseTo(12.5, 10);
  });

  it("leaves the middle value out of both halves when the count is odd", () => {
    // 1 2 3 4 5 — the 3 belongs to neither half, so Q1 is the median of 1,2.
    const q = s.quartilesByHalves([1, 2, 3, 4, 5]);
    expect(q.q1).toBeCloseTo(1.5, 10);
    expect(q.q2).toBeCloseTo(3, 10);
    expect(q.q3).toBeCloseTo(4.5, 10);
  });

  it("survives a set too small to have halves", () => {
    expect(s.quartilesByHalves([7])).toEqual({ q1: 7, q2: 7, q3: 7 });
  });
});

describe("the two conventions are different on purpose", () => {
  it("disagrees with the interpolated rule on the data the lessons use", () => {
    // If this ever passes as equal, one of the two implementations has been
    // changed into the other and some lesson or the laboratory is now wrong.
    const taught = s.quartilesByHalves(LESSON_SET);
    const interpolated = s.quartiles(LESSON_SET);
    expect(taught.q1).not.toBeCloseTo(interpolated.q1, 6);
    expect(taught.q3).not.toBeCloseTo(interpolated.q3, 6);
    expect(interpolated.q1).toBeCloseTo(4.75, 10);
    expect(interpolated.q3).toBeCloseTo(11.25, 10);
  });

  it("agrees on the median, which has only one definition", () => {
    for (const data of [LESSON_SET, IQR_SET, [1, 2, 3, 4, 5]]) {
      expect(s.quartilesByHalves(data).q2).toBeCloseTo(s.quartiles(data).q2, 10);
      expect(s.quartilesByHalves(data).q2).toBeCloseTo(s.median(data), 10);
    }
  });
});

describe("the five numbers a box plot draws", () => {
  it("uses the taught convention throughout", () => {
    expect(s.fiveNumberSummary(LESSON_SET)).toEqual({ min: 2, q1: 4.5, median: 8, q3: 11.5, max: 15 });
  });

  it("orders its five numbers", () => {
    for (const data of [LESSON_SET, IQR_SET, [5, 5, 5, 5], [1, 100]]) {
      const f = s.fiveNumberSummary(data);
      expect(f.min <= f.q1 && f.q1 <= f.median && f.median <= f.q3 && f.q3 <= f.max, JSON.stringify(f)).toBe(true);
    }
  });
});
