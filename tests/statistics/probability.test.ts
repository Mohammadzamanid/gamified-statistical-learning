import { describe, expect, it } from "vitest";
import * as p from "../../src/core/statistics";

describe("probability and counting — reference values", () => {
  it("factorial", () => {
    expect(p.factorial(0)).toBe(1);
    expect(p.factorial(5)).toBe(120);
    expect(() => p.factorial(-1)).toThrow(RangeError);
    expect(() => p.factorial(2.5)).toThrow(RangeError);
    expect(() => p.factorial(171)).toThrow(RangeError);
  });

  it("permutations and combinations", () => {
    expect(p.permutations(5, 2)).toBe(20);
    expect(p.permutations(5, 0)).toBe(1);
    expect(p.permutations(3, 5)).toBe(0);
    expect(p.combinations(5, 2)).toBe(10);
    expect(p.combinations(52, 5)).toBe(2598960);
    expect(p.combinations(10, 10)).toBe(1);
    expect(p.combinations(4, 9)).toBe(0);
  });

  it("basic, complement, and compound probability", () => {
    expect(p.basicProbability(1, 6)).toBeCloseTo(1 / 6, 12);
    expect(() => p.basicProbability(7, 6)).toThrow(RangeError);
    expect(p.complementProbability(0.25)).toBeCloseTo(0.75, 12);
    expect(p.independentAnd(0.5, 0.5)).toBe(0.25);
    expect(p.unionProbability(0.5, 0.4, 0.2)).toBeCloseTo(0.7, 12);
    expect(() => p.unionProbability(0.1, 0.1, 0.9)).toThrow(RangeError);
  });

  it("conditional probability", () => {
    expect(p.conditionalProbability(0.2, 0.5)).toBeCloseTo(0.4, 12);
    expect(() => p.conditionalProbability(0.2, 0)).toThrow(RangeError);
    expect(() => p.conditionalProbability(0.6, 0.5)).toThrow(RangeError);
  });
});
