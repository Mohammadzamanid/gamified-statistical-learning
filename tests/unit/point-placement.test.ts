/**
 * S2-03: the point-placement engine.
 *
 * Everything the renderer can do goes through these functions, so the keyboard
 * path and the pointer path are the same code. Testing them here proves keyboard
 * operability without needing a DOM: if `movePoint` can reach a placement, arrow
 * keys can reach it too.
 */
import { describe, expect, it } from "vitest";
import {
  classifyPoint,
  clampToField,
  describePoint,
  isAxesSwapped,
  isPlane,
  jumpToAxisEnd,
  movePoint,
  pointFieldOf,
  pointMatches,
  snapToAxis,
  startPosition
} from "../../src/core/questions/point-placement";
import { evaluateResponse } from "../../src/core/questions/evaluators";
import { normalizeResponse } from "../../src/core/questions/normalize";
import { PointFieldSchema, QuestionSchema, type PointField, type Question } from "../../src/shared/schemas";

const line: PointField = PointFieldSchema.parse({
  kind: "number-line",
  xMin: 0,
  xMax: 1,
  xStep: 0.05,
  xLabel: "Fraction",
  xTicks: [0, 0.5, 1],
  accessibleDescription: "A number line from 0 to 1."
});

const plane: PointField = PointFieldSchema.parse({
  kind: "coordinate-plane",
  xMin: 1,
  xMax: 5,
  xStep: 1,
  xLabel: "Day",
  yMin: 0,
  yMax: 10,
  yStep: 1,
  yLabel: "Fish",
  accessibleDescription: "A grid of day against fish."
});

function planeQuestion(): Question {
  return QuestionSchema.parse({
    id: "q.test-point",
    topicId: "t.read-data",
    objectiveId: "obj.read-data",
    skillIds: ["skill.data-literacy"],
    difficulty: 2,
    interaction: "point-placement",
    prompt: "Plot day 4 with 6 fish.",
    pointField: plane,
    answer: {
      kind: "point",
      x: 4,
      y: 6,
      toleranceX: 0,
      toleranceY: 0,
      swappedAxesMisconceptionId: "mc.axes-swapped"
    },
    explanation: "Across to 4, then up to 6.",
    misconceptionIds: ["mc.axes-swapped"]
  });
}

describe("field geometry", () => {
  it("snaps to the axis grid and clamps inside the bounds", () => {
    expect(snapToAxis(line, "x", 0.26)).toBe(0.25);
    expect(snapToAxis(line, "x", -5)).toBe(0);
    expect(snapToAxis(line, "x", 99)).toBe(1);
  });

  it("snaps without float noise", () => {
    // 0.05 steps are exactly the case where naive arithmetic yields 0.30000000000000004.
    expect(snapToAxis(line, "x", 0.3)).toBe(0.3);
    expect(snapToAxis(line, "x", 0.35)).toBe(0.35);
  });

  it("drops y on a number line and keeps it on a plane", () => {
    expect(clampToField(line, { x: 0.25, y: 7 })).toEqual({ x: 0.25, y: null });
    expect(clampToField(plane, { x: 4, y: 6 })).toEqual({ x: 4, y: 6 });
  });

  it("starts in the middle of the field", () => {
    expect(startPosition(line)).toEqual({ x: 0.5, y: null });
    expect(startPosition(plane)).toEqual({ x: 3, y: 5 });
    expect(isPlane(plane)).toBe(true);
    expect(isPlane(line)).toBe(false);
  });

  it("reads the field off a question, and null when there is none", () => {
    expect(pointFieldOf(planeQuestion())?.kind).toBe("coordinate-plane");
  });
});

describe("keyboard movement", () => {
  it("moves one step per press and clamps at the ends", () => {
    let pos = startPosition(line);
    pos = movePoint(line, pos, "x", 1);
    expect(pos.x).toBe(0.55);
    pos = movePoint(line, pos, "x", -2);
    expect(pos.x).toBe(0.45);
    pos = movePoint(line, pos, "x", -1000);
    expect(pos.x).toBe(0);
  });

  it("can reach any target on the grid using only steps", () => {
    // The keyboard path must be able to produce the exact answer, not just get near it.
    let pos = startPosition(line);
    const stepsNeeded = Math.round((0.25 - pos.x) / line.xStep);
    pos = movePoint(line, pos, "x", stepsNeeded);
    expect(pos.x).toBe(0.25);
  });

  it("ignores vertical movement on a number line", () => {
    const pos = startPosition(line);
    expect(movePoint(line, pos, "y", 3)).toEqual(pos);
  });

  it("moves both axes independently on a plane", () => {
    let pos = startPosition(plane);
    pos = movePoint(plane, pos, "x", 1);
    pos = movePoint(plane, pos, "y", 1);
    expect(pos).toEqual({ x: 4, y: 6 });
  });

  it("jumps to axis ends", () => {
    const pos = startPosition(plane);
    expect(jumpToAxisEnd(plane, pos, "x", "min").x).toBe(1);
    expect(jumpToAxisEnd(plane, pos, "x", "max").x).toBe(5);
    expect(jumpToAxisEnd(plane, pos, "y", "max").y).toBe(10);
    expect(jumpToAxisEnd(line, startPosition(line), "y", "max")).toEqual(startPosition(line));
  });
});

describe("accessible description", () => {
  it("names the axis and value on a number line", () => {
    expect(describePoint(line, { x: 0.25, y: null })).toBe("Fraction 0.25");
  });

  it("names both axes on a plane", () => {
    expect(describePoint(plane, { x: 4, y: 6 })).toBe("Day 4, Fish 6");
  });
});

describe("matching and tolerance", () => {
  const exact = { x: 4, y: 6, toleranceX: 0, toleranceY: 0 };
  const approx = { x: 5, toleranceX: 1 };

  it("accepts an exact placement and rejects a near one when tolerance is zero", () => {
    expect(pointMatches(exact, { x: 4, y: 6 })).toBe(true);
    expect(pointMatches(exact, { x: 4, y: 7 })).toBe(false);
    expect(pointMatches(exact, { x: 3, y: 6 })).toBe(false);
  });

  it("accepts anything inside an approximate tolerance, including the edges", () => {
    expect(pointMatches(approx, { x: 4, y: null })).toBe(true);
    expect(pointMatches(approx, { x: 6, y: null })).toBe(true);
    expect(pointMatches(approx, { x: 4.5, y: null })).toBe(true);
    expect(pointMatches(approx, { x: 6.5, y: null })).toBe(false);
  });

  it("requires a y placement when the target has one", () => {
    expect(pointMatches(exact, { x: 4, y: null })).toBe(false);
  });
});

describe("axes-swapped detection", () => {
  const target = { x: 4, y: 6, toleranceX: 0, toleranceY: 0 };

  it("detects the coordinates placed the wrong way round", () => {
    expect(isAxesSwapped(target, { x: 6, y: 4 })).toBe(true);
  });

  it("does not fire on a correct placement or an unrelated wrong one", () => {
    expect(isAxesSwapped(target, { x: 4, y: 6 })).toBe(false);
    expect(isAxesSwapped(target, { x: 2, y: 9 })).toBe(false);
  });

  it("never fires on a symmetric target, where a swap is unprovable", () => {
    const symmetric = { x: 3, y: 3, toleranceX: 0, toleranceY: 0 };
    expect(isAxesSwapped(symmetric, { x: 3, y: 3 })).toBe(false);
  });

  it("does not fire on a number line", () => {
    expect(isAxesSwapped({ x: 5, toleranceX: 0, toleranceY: 0 }, { x: 5, y: null })).toBe(false);
  });
});

describe("classification", () => {
  const spec = {
    x: 4,
    y: 6,
    toleranceX: 0,
    toleranceY: 0,
    misconceptionPoints: [{ x: 1, y: 1, misconceptionId: "mc.origin" }],
    swappedAxesMisconceptionId: "mc.axes-swapped"
  };

  it("prefers a declared placement over the generic swap rule", () => {
    expect(classifyPoint(spec, { x: 1, y: 1 })).toBe("mc.origin");
  });

  it("falls back to the swap rule", () => {
    expect(classifyPoint(spec, { x: 6, y: 4 })).toBe("mc.axes-swapped");
  });

  it("returns null for an unremarkable wrong placement", () => {
    expect(classifyPoint(spec, { x: 2, y: 9 })).toBeNull();
  });
});

describe("point evaluation", () => {
  it("scores a correct placement and reports zero offset", () => {
    const q = planeQuestion();
    const evaluation = evaluateResponse(q, normalizeResponse({ kind: "point", x: 4, y: 6 }));
    expect(evaluation.correct).toBe(true);
    expect(evaluation.signals["offsetX"]).toBe(0);
    expect(evaluation.signals["offsetY"]).toBe(0);
  });

  it("scores a swapped placement wrong and classifies it", () => {
    const q = planeQuestion();
    const evaluation = evaluateResponse(q, normalizeResponse({ kind: "point", x: 6, y: 4 }));
    expect(evaluation.correct).toBe(false);
    expect(evaluation.signals["axesSwapped"]).toBe(true);
    expect(evaluation.signals["pointMisconceptionIds"]).toEqual(["mc.axes-swapped"]);
  });

  it("rejects a response of the wrong kind", () => {
    const q = planeQuestion();
    const evaluation = evaluateResponse(q, normalizeResponse({ kind: "numeric", text: "4" }));
    expect(evaluation.correct).toBe(false);
    expect(evaluation.signals["responseKindMismatch"]).toBe(true);
  });
});

describe("point schema", () => {
  it("rejects a point answer on a non-point interaction", () => {
    expect(QuestionSchema.safeParse({ ...planeQuestion(), interaction: "numeric-input" }).success).toBe(false);
  });

  it("rejects a point-placement question with no field", () => {
    const withoutField: Record<string, unknown> = { ...planeQuestion() };
    delete withoutField["pointField"];
    expect(QuestionSchema.safeParse(withoutField).success).toBe(false);
  });

  it("rejects a target outside the field", () => {
    const q = planeQuestion();
    const bad = QuestionSchema.safeParse({ ...q, answer: { ...q.answer, x: 99 } });
    expect(bad.success).toBe(false);
  });

  it("rejects a plane target with no y, and a number-line target that sets one", () => {
    const q = planeQuestion();
    expect(QuestionSchema.safeParse({ ...q, answer: { kind: "point", x: 4, toleranceX: 0, toleranceY: 0 } }).success).toBe(false);
    expect(
      QuestionSchema.safeParse({
        ...q,
        pointField: line,
        answer: { kind: "point", x: 0.5, y: 1, toleranceX: 0, toleranceY: 0 }
      }).success
    ).toBe(false);
  });

  it("rejects a field whose axis bounds are inverted", () => {
    expect(PointFieldSchema.safeParse({ ...line, xMin: 1, xMax: 0 }).success).toBe(false);
  });

  it("rejects a coordinate-plane field missing its y axis", () => {
    expect(
      PointFieldSchema.safeParse({
        kind: "coordinate-plane",
        xMin: 0,
        xMax: 5,
        xStep: 1,
        xLabel: "Day",
        accessibleDescription: "Missing y."
      }).success
    ).toBe(false);
  });
});
