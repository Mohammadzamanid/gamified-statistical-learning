/** Covariance, correlation, and simple linear regression. */
import { assertFiniteData } from "../../shared/utilities/numeric";
import { mean, standardDeviation } from "./descriptive";

function requirePaired(x: readonly number[], y: readonly number[], fnName: string): void {
  assertFiniteData(x, fnName);
  assertFiniteData(y, fnName);
  if (x.length !== y.length) throw new RangeError(`${fnName}: x and y must have equal length`);
  if (x.length < 2) throw new RangeError(`${fnName}: requires at least 2 paired observations`);
}

export function covariance(x: readonly number[], y: readonly number[], sample = true): number {
  requirePaired(x, y, "covariance");
  const mx = mean(x);
  const my = mean(y);
  let acc = 0;
  for (let i = 0; i < x.length; i++) acc += (x[i]! - mx) * (y[i]! - my);
  return acc / (sample ? x.length - 1 : x.length);
}

export function pearsonCorrelation(x: readonly number[], y: readonly number[]): number {
  requirePaired(x, y, "pearsonCorrelation");
  const sdX = standardDeviation(x);
  const sdY = standardDeviation(y);
  if (sdX === 0 || sdY === 0) {
    throw new RangeError("pearsonCorrelation: undefined when a variable has zero variance");
  }
  const r = covariance(x, y) / (sdX * sdY);
  // Clamp floating error at the boundaries.
  return Math.min(1, Math.max(-1, r));
}

export interface LinearFit {
  slope: number;
  intercept: number;
  r: number;
  rSquared: number;
  predict: (x: number) => number;
}

export function linearRegression(x: readonly number[], y: readonly number[]): LinearFit {
  requirePaired(x, y, "linearRegression");
  const sdX = standardDeviation(x);
  if (sdX === 0) throw new RangeError("linearRegression: x has zero variance");
  const r = standardDeviation(y) === 0 ? 0 : pearsonCorrelation(x, y);
  const slope = covariance(x, y) / (sdX * sdX);
  const intercept = mean(y) - slope * mean(x);
  return {
    slope,
    intercept,
    r,
    rSquared: r * r,
    predict: (v: number) => slope * v + intercept
  };
}
