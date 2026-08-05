/**
 * Point placement: answering "where is this value?" on a number line or a
 * coordinate plane.
 *
 * Pure, like the step-calculation engine (D-001) — the renderer owns no rules.
 * That matters most for the keyboard path: arrow-key movement, snapping, and the
 * spoken description of a position are all decided here, so they are testable
 * without a DOM and cannot drift from what the pointer path does.
 *
 * Keyboard operation is a requirement of this interaction, not an enhancement.
 * Every placement reachable with a pointer is reachable with the keyboard,
 * because both go through `movePoint`/`clampToField` on the same `step` grid.
 */
import type { PointField, Question } from "../../shared/schemas";
import { approxEqual, roundTo } from "../../shared/utilities/numeric";

export interface PointPosition {
  x: number;
  /** null on a number line. */
  y: number | null;
}

export type PointAxis = "x" | "y";

export function pointFieldOf(question: Question): PointField | null {
  return question.pointField ?? null;
}

export function isPlane(field: PointField): boolean {
  return field.kind === "coordinate-plane";
}

function axisBounds(field: PointField, axis: PointAxis): { min: number; max: number; step: number } {
  if (axis === "x") return { min: field.xMin, max: field.xMax, step: field.xStep };
  return {
    min: field.yMin ?? 0,
    max: field.yMax ?? 0,
    step: field.yStep ?? 1
  };
}

/** Decimal places implied by a step, so snapped values do not carry float noise. */
function precisionFor(step: number): number {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : Math.min(text.length - dot - 1, 8);
}

/** Snaps a value onto the axis grid and clamps it inside the axis bounds. */
export function snapToAxis(field: PointField, axis: PointAxis, value: number): number {
  const { min, max, step } = axisBounds(field, axis);
  const clamped = Math.min(Math.max(value, min), max);
  const snapped = min + Math.round((clamped - min) / step) * step;
  return roundTo(Math.min(Math.max(snapped, min), max), precisionFor(step));
}

/** Snaps and clamps a whole position; drops y when the field is one-dimensional. */
export function clampToField(field: PointField, position: PointPosition): PointPosition {
  const x = snapToAxis(field, "x", position.x);
  if (!isPlane(field)) return { x, y: null };
  return { x, y: snapToAxis(field, "y", position.y ?? field.yMin ?? 0) };
}

/** The position a control starts at: the middle of the field, on the grid. */
export function startPosition(field: PointField): PointPosition {
  const x = (field.xMin + field.xMax) / 2;
  if (!isPlane(field)) return clampToField(field, { x, y: null });
  const y = ((field.yMin ?? 0) + (field.yMax ?? 0)) / 2;
  return clampToField(field, { x, y });
}

/**
 * Moves the point by whole steps along one axis — the keyboard path.
 * `steps` may be negative; a coarse jump is just a larger multiple.
 */
export function movePoint(
  field: PointField,
  position: PointPosition,
  axis: PointAxis,
  steps: number
): PointPosition {
  if (axis === "y" && !isPlane(field)) return position;
  const { step } = axisBounds(field, axis);
  const current = axis === "x" ? position.x : (position.y ?? 0);
  const moved = current + steps * step;
  return clampToField(field, axis === "x" ? { ...position, x: moved } : { ...position, y: moved });
}

/** Jumps to an axis end, used for Home/End. */
export function jumpToAxisEnd(field: PointField, position: PointPosition, axis: PointAxis, end: "min" | "max"): PointPosition {
  if (axis === "y" && !isPlane(field)) return position;
  const { min, max } = axisBounds(field, axis);
  const target = end === "min" ? min : max;
  return clampToField(field, axis === "x" ? { ...position, x: target } : { ...position, y: target });
}

/** Spoken description of a position — the text equivalent of the visual marker. */
export function describePoint(field: PointField, position: PointPosition): string {
  if (!isPlane(field)) return `${field.xLabel} ${position.x}`;
  return `${field.xLabel} ${position.x}, ${field.yLabel ?? "y"} ${position.y ?? 0}`;
}

function withinTolerance(got: number, target: number, tolerance: number): boolean {
  return Math.abs(got - target) <= Math.max(tolerance, 0) || approxEqual(got, target, 1e-9);
}

export interface PointTarget {
  x: number;
  y?: number;
  toleranceX: number;
  /** Optional because a number-line target has no second axis to tolerate. */
  toleranceY?: number;
}

/** Whether a placement is close enough on every axis the question uses. */
export function pointMatches(target: PointTarget, position: PointPosition): boolean {
  if (!withinTolerance(position.x, target.x, target.toleranceX)) return false;
  if (target.y === undefined) return true;
  if (position.y === null) return false;
  return withinTolerance(position.y, target.y, target.toleranceY ?? 0);
}

/** True when the learner placed the target's coordinates the wrong way round. */
export function isAxesSwapped(target: PointTarget, position: PointPosition): boolean {
  if (target.y === undefined || position.y === null) return false;
  // A symmetric target (x === y) can never evidence a swap.
  if (approxEqual(target.x, target.y, 1e-9)) return false;
  return (
    withinTolerance(position.x, target.y, target.toleranceX) &&
    withinTolerance(position.y, target.x, target.toleranceY ?? 0)
  );
}

export interface PointClassificationSpec extends PointTarget {
  misconceptionPoints: ReadonlyArray<{ x: number; y?: number; misconceptionId: string }>;
  swappedAxesMisconceptionId?: string;
}

/**
 * The misconception a wrong placement identifies, if any.
 *
 * Declared points are checked first so content can always override the generic
 * swap rule for a placement that means something more specific.
 */
export function classifyPoint(spec: PointClassificationSpec, position: PointPosition): string | null {
  for (const candidate of spec.misconceptionPoints) {
    const matches =
      withinTolerance(position.x, candidate.x, spec.toleranceX) &&
      (candidate.y === undefined
        ? true
        : position.y !== null && withinTolerance(position.y, candidate.y, spec.toleranceY ?? 0));
    if (matches) return candidate.misconceptionId;
  }
  if (spec.swappedAxesMisconceptionId && isAxesSwapped(spec, position)) {
    return spec.swappedAxesMisconceptionId;
  }
  return null;
}
