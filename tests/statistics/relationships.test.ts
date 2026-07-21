import { describe, expect, it } from "vitest";
import * as r from "../../src/core/statistics";

describe("covariance, correlation, regression — reference values", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10]; // perfect linear y = 2x

  it("covariance", () => {
    expect(r.covariance(x, y)).toBeCloseTo(5, 10);
    expect(r.covariance(x, y, false)).toBeCloseTo(4, 10);
  });

  it("pearson correlation on perfect and known data", () => {
    expect(r.pearsonCorrelation(x, y)).toBeCloseTo(1, 12);
    expect(r.pearsonCorrelation(x, [10, 8, 6, 4, 2])).toBeCloseTo(-1, 12);
    // Anscombe I reference: r ≈ 0.816
    const ax = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
    const ay = [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68];
    expect(r.pearsonCorrelation(ax, ay)).toBeCloseTo(0.8164, 3);
    expect(() => r.pearsonCorrelation(x, [3, 3, 3, 3, 3])).toThrow(RangeError);
  });

  it("linear regression slope/intercept/predict", () => {
    const fit = r.linearRegression(x, y);
    expect(fit.slope).toBeCloseTo(2, 12);
    expect(fit.intercept).toBeCloseTo(0, 12);
    expect(fit.rSquared).toBeCloseTo(1, 12);
    expect(fit.predict(10)).toBeCloseTo(20, 12);
    expect(() => r.linearRegression([1], [2])).toThrow(RangeError);
    expect(() => r.linearRegression([2, 2, 2], [1, 2, 3])).toThrow(RangeError);
  });
});
