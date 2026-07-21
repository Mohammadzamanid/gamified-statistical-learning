import { describe, expect, it } from "vitest";
import { approxEqual, parseUserNumber, roundTo } from "../../src/shared/utilities/numeric";

describe("numeric utilities", () => {
  it("parses plain, comma-decimal, percent, and fraction input", () => {
    expect(parseUserNumber("5")).toBe(5);
    expect(parseUserNumber(" 2.5 ")).toBe(2.5);
    expect(parseUserNumber("1,5")).toBe(1.5);
    expect(parseUserNumber("30%")).toBe(0.3);
    expect(parseUserNumber("3/12")).toBe(0.25);
    expect(parseUserNumber("-3/4")).toBe(-0.75);
    expect(parseUserNumber("1,234.5")).toBe(1234.5);
    expect(parseUserNumber("")).toBeNull();
    expect(parseUserNumber("fish")).toBeNull();
    expect(parseUserNumber("1/0")).toBeNull();
  });

  it("approxEqual honors absolute and relative tolerance", () => {
    expect(approxEqual(0.1 + 0.2, 0.3)).toBe(true);
    expect(approxEqual(1e12, 1e12 + 1, 1e-9)).toBe(true);
    expect(approxEqual(1, 1.1)).toBe(false);
    expect(approxEqual(NaN, NaN)).toBe(false);
  });

  it("roundTo", () => {
    expect(roundTo(2.345, 2)).toBe(2.35);
    expect(roundTo(2.2, 1)).toBe(2.2);
  });
});
