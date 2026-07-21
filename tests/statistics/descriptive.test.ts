import { describe, expect, it } from "vitest";
import * as s from "../../src/core/statistics";

describe("descriptive statistics — reference values", () => {
  const data = [2, 4, 4, 4, 5, 5, 7, 9]; // classic reference set

  it("sum, mean", () => {
    expect(s.sum(data)).toBe(40);
    expect(s.mean(data)).toBe(5);
    expect(s.mean([2, 4, 4, 6, 9])).toBe(5);
  });

  it("weighted mean", () => {
    expect(s.weightedMean([80, 90], [1, 3])).toBeCloseTo(87.5, 10);
    expect(() => s.weightedMean([1, 2], [0, 0])).toThrow(RangeError);
    expect(() => s.weightedMean([1, 2], [1])).toThrow(RangeError);
  });

  it("median odd and even", () => {
    expect(s.median([3, 15, 8, 7, 12])).toBe(8);
    expect(s.median([1, 2, 3, 4])).toBe(2.5);
    expect(s.median([7])).toBe(7);
  });

  it("mode single, multi, uniform", () => {
    expect(s.mode(data)).toEqual([4]);
    expect(s.mode([1, 1, 2, 2, 3])).toEqual([1, 2]);
    expect(s.mode([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("range, min, max", () => {
    expect(s.range(data)).toBe(7);
    expect(s.range([1.2, 2.8, 1.9, 3.4, 2.1])).toBeCloseTo(2.2, 10);
  });

  it("percentiles / quartiles (linear interpolation, R-7)", () => {
    expect(s.percentile([15, 20, 35, 40, 50], 50)).toBe(35);
    expect(s.percentile([1, 2, 3, 4], 25)).toBeCloseTo(1.75, 10);
    const q = s.quartiles([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(q.q2).toBe(4.5);
    expect(s.interquartileRange([1, 2, 3, 4, 5, 6, 7, 8])).toBeCloseTo(q.q3 - q.q1, 12);
  });

  it("variance and standard deviation (sample vs population)", () => {
    // Known reference: [2,4,4,4,5,5,7,9] population sd = 2
    expect(s.standardDeviation(data, false)).toBeCloseTo(2, 10);
    expect(s.variance(data, false)).toBeCloseTo(4, 10);
    expect(s.variance(data, true)).toBeCloseTo(32 / 7, 10);
    expect(() => s.variance([5], true)).toThrow(RangeError);
    expect(s.variance([5], false)).toBe(0);
  });

  it("z-score", () => {
    expect(s.zScore(9, data, false)).toBeCloseTo(2, 10);
    expect(() => s.zScore(1, [3, 3, 3])).toThrow(RangeError);
  });

  it("frequency, proportion, percentage", () => {
    const f = s.frequencyTable([1, 1, 2]);
    expect(f.get(1)).toBe(2);
    expect(s.proportion(12, 40)).toBeCloseTo(0.3, 12);
    expect(s.percentage(12, 40)).toBeCloseTo(30, 12);
    expect(() => s.proportion(1, 0)).toThrow(RangeError);
  });

  it("rejects invalid input and empty data", () => {
    expect(() => s.mean([])).toThrow(RangeError);
    expect(() => s.median([])).toThrow(RangeError);
    expect(() => s.mean([1, NaN])).toThrow(TypeError);
    expect(() => s.sum([1, Infinity])).toThrow(TypeError);
    // @ts-expect-error runtime guard
    expect(() => s.mean("nope")).toThrow(TypeError);
  });

  it("Kahan summation stays stable on long data", () => {
    const many = Array.from({ length: 100000 }, () => 0.1);
    expect(s.sum(many)).toBeCloseTo(10000, 6);
  });
});
