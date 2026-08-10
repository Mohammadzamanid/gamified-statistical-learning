/**
 * S2-03: point placement driven through the real session engine.
 *
 * Proves the shipped point questions reach evaluation, misconception
 * classification, remediation, mastery and review like any other interaction,
 * and that every one of them is reachable using only keyboard movement.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { buildLibrary, runFeedbackPipeline } from "../../src/core/misconceptions/engine";
import { submitAnswer } from "../../src/renderer/state/session";
import { getInteraction, registerDefaultInteractions } from "../../src/core/questions/registry";
import {
  clampToField,
  isPlane,
  movePoint,
  pointFieldOf,
  startPosition,
  type PointPosition
} from "../../src/core/questions/point-placement";
import { startLesson } from "../../src/renderer/state/session";
import { createEmptySave, type SaveFile } from "../../src/shared/schemas";
import type { RawResponse } from "../../src/core/questions/types";

const content = loadShippedContent();
const library = buildLibrary(content.misconceptions, content.remediations);

beforeAll(() => {
  clearDetectors();
  registerBuiltInDetectors();
  registerDefaultInteractions();
});

function freshSave(): SaveFile {
  return createEmptySave({
    id: "p.points",
    name: "Point Tester",
    createdAt: new Date().toISOString(),
    isGuest: false,
    avatarSeed: 0
  });
}

function sessionOn(lessonId: string, questionId: string) {
  const session = startLesson(content, lessonId, 0)!;
  const index = session.questionQueue.indexOf(questionId);
  expect(index, `${questionId} should be in ${lessonId}`).toBeGreaterThanOrEqual(0);
  return { ...session, currentIndex: index, questionShownAtMs: 0 };
}

const pointQuestions = () =>
  [...content.questions.values()].filter((q) => q.interaction === "point-placement");

/**
 * The lesson a question can be met from.
 *
 * Usually the lesson that lists it. Some questions are deliberately reachable
 * only through a remediation follow-up — the learner meets them after getting
 * something wrong, never in the ordinary run of a lesson (audit finding F-4).
 * Those are legitimate, so this resolves them to the lesson whose misconception
 * routes there. Anything reachable from neither is orphaned content, and the
 * checks below still fail on it.
 */
function hostLessonFor(questionId: string): string | null {
  const direct = content.curriculum.lessons.find((l) => l.questionIds.includes(questionId));
  if (direct) return direct.id;

  const remediationIds = new Set(
    content.remediations.filter((r) => r.followUpQuestionIds.includes(questionId)).map((r) => r.id)
  );
  const misconceptionIds = new Set(
    content.misconceptions.filter((m) => remediationIds.has(m.remediationId)).map((m) => m.id)
  );
  if (misconceptionIds.size === 0) return null;

  const host = content.curriculum.lessons.find((l) =>
    l.questionIds.some((qid) => content.questions.get(qid)?.misconceptionIds.some((m) => misconceptionIds.has(m)))
  );
  return host?.id ?? null;
}

describe("point placement is a live interaction", () => {
  it("is registered as implemented and produces a point response", () => {
    const descriptor = getInteraction("point-placement");
    expect(descriptor?.implemented).toBe(true);
    expect(descriptor?.responseKind).toBe("point");
  });

  it("ships number-line, coordinate-plane and approximate examples, all reachable", () => {
    const qs = pointQuestions();
    expect(qs.length).toBeGreaterThanOrEqual(3);

    const kinds = new Set(qs.map((q) => pointFieldOf(q)!.kind));
    expect(kinds.has("number-line")).toBe(true);
    expect(kinds.has("coordinate-plane")).toBe(true);

    // At least one question asks for an approximate placement rather than an exact one.
    expect(qs.some((q) => q.answer.kind === "point" && q.answer.toleranceX > 0)).toBe(true);

    for (const q of qs) {
      // Updated in S2-08: a placement may live in a lesson OR be a remediation
      // follow-up. Both are reachable; neither is not.
      expect(hostLessonFor(q.id), `${q.id} is reachable from no lesson and no remediation`).not.toBeNull();
      expect(pointFieldOf(q)!.accessibleDescription.length).toBeGreaterThan(0);
    }
  });

  it("every declared point misconception resolves to a real remediation", () => {
    const byId = new Map(content.misconceptions.map((m) => [m.id, m]));
    const remediationIds = new Set(content.remediations.map((r) => r.id));
    for (const q of pointQuestions()) {
      if (q.answer.kind !== "point") continue;
      const ids = [
        ...q.answer.misconceptionPoints.map((p) => p.misconceptionId),
        ...(q.answer.swappedAxesMisconceptionId ? [q.answer.swappedAxesMisconceptionId] : [])
      ];
      for (const id of ids) {
        const mc = byId.get(id);
        expect(mc, `${q.id} -> ${id}`).toBeDefined();
        expect(remediationIds.has(mc!.remediationId)).toBe(true);
      }
    }
  });
});

describe("every shipped target is reachable by keyboard alone", () => {
  it("arrow-key stepping from the start position lands exactly on each answer", () => {
    for (const q of pointQuestions()) {
      if (q.answer.kind !== "point") continue;
      const field = pointFieldOf(q)!;
      let pos: PointPosition = startPosition(field);

      // Simulate pressing an arrow key one step at a time — no pointer involved.
      const xSteps = Math.round((q.answer.x - pos.x) / field.xStep);
      for (let i = 0; i < Math.abs(xSteps); i++) {
        pos = movePoint(field, pos, "x", Math.sign(xSteps));
      }
      if (isPlane(field) && q.answer.y !== undefined) {
        const ySteps = Math.round((q.answer.y - (pos.y ?? 0)) / (field.yStep ?? 1));
        for (let i = 0; i < Math.abs(ySteps); i++) {
          pos = movePoint(field, pos, "y", Math.sign(ySteps));
        }
      }

      expect(pos.x, `${q.id}: x not reachable by stepping`).toBeCloseTo(q.answer.x, 8);
      if (isPlane(field) && q.answer.y !== undefined) {
        expect(pos.y, `${q.id}: y not reachable by stepping`).toBeCloseTo(q.answer.y, 8);
      }

      // And that keyboard-produced placement is accepted by the real engine.
      const response: RawResponse = isPlane(field)
        ? { kind: "point", x: pos.x, y: pos.y ?? 0 }
        : { kind: "point", x: pos.x };
      // Remediation-only placements are not in any lesson queue, so they are
      // submitted through the engine directly rather than via a session.
      const owning = content.curriculum.lessons.find((l) => l.questionIds.includes(q.id));
      if (owning) {
        const result = submitAnswer(content, freshSave(), sessionOn(owning.id, q.id), response, 5000)!;
        expect(result.feedback.correct, `${q.id} rejected its keyboard-reachable answer`).toBe(true);
      } else {
        const plan = runFeedbackPipeline(q, response, library, 0);
        expect(plan.correct, `${q.id} rejected its keyboard-reachable answer`).toBe(true);
      }
    }
  });

  it("clamps rather than escaping the field when stepping past an end", () => {
    const q = pointQuestions()[0]!;
    const field = pointFieldOf(q)!;
    const far = movePoint(field, startPosition(field), "x", 10_000);
    expect(far.x).toBe(field.xMax);
    expect(clampToField(field, far)).toEqual(far);
  });
});

describe("wrong placements are diagnosed", () => {
  it("classifies swapped coordinates and offers the axis-order remediation", () => {
    const result = submitAnswer(
      content,
      freshSave(),
      sessionOn("l.r2-scatterplots", "q.point-thursday-catch"),
      { kind: "point", x: 6, y: 4 },
      5000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.axes-swapped");
    expect(result.feedback.remediation?.id).toBe("rem.axes-order");
  });

  it("classifies the mean placed where the median belongs", () => {
    const result = submitAnswer(
      content,
      freshSave(),
      sessionOn("l.middle-harbor", "q.point-median-line"),
      { kind: "point", x: 9 },
      5000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.mean-median-confusion");
  });

  it("accepts an approximate placement within tolerance and updates mastery", () => {
    // q.point-approx-mean targets 5 with tolerance 1: 4.5 is a good estimate.
    const result = submitAnswer(
      content,
      freshSave(),
      sessionOn("l.reading-tallies", "q.point-approx-mean"),
      { kind: "point", x: 4.5 },
      5000
    )!;
    expect(result.feedback.correct).toBe(true);
    expect(result.save.skillStates["skill.mean"]?.correct).toBe(1);
    expect(result.save.reviewQueue.some((r) => r.skillId === "skill.mean")).toBe(true);
  });

  it("rejects an estimate outside the tolerance and diagnoses the outlier pull", () => {
    const result = submitAnswer(
      content,
      freshSave(),
      sessionOn("l.reading-tallies", "q.point-approx-mean"),
      { kind: "point", x: 9 },
      5000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.outlier-mean");
  });
});
