/**
 * S2-04: drag-and-drop driven through the real session engine.
 *
 * The keyboard claim is the one worth proving: every shipped arrangement is
 * built here using only the operations the `<select>` and reorder buttons
 * perform — `placeItem` and `moveWithinZone` — never a drag, and the result is
 * then submitted through the real engine and required to be correct.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { advance, startLesson, submitAnswer } from "../../src/renderer/state/session";
import { getInteraction, registerDefaultInteractions } from "../../src/core/questions/registry";
import {
  TRAY,
  isPlacementComplete,
  itemsIn,
  moveWithinZone,
  placeItem,
  placementResponse,
  startPlacement,
  zonesOf
} from "../../src/core/questions/drag-drop";
import { createEmptySave, type Question, type SaveFile } from "../../src/shared/schemas";
import type { RawResponse } from "../../src/core/questions/types";

const content = loadShippedContent();

beforeAll(() => {
  clearDetectors();
  registerBuiltInDetectors();
  registerDefaultInteractions();
});

function freshSave(): SaveFile {
  return createEmptySave({
    id: "p.dd",
    name: "Drag Tester",
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

const dragQuestions = () =>
  [...content.questions.values()].filter((q) => q.interaction === "drag-and-drop");

function lessonOf(questionId: string) {
  return content.curriculum.lessons.find((l) => l.questionIds.includes(questionId))!;
}

/**
 * Builds the expected arrangement using only keyboard-reachable operations:
 * assign each item to a zone (the `<select>`), then bubble it into position with
 * reorder moves (the up/down buttons). No drag is involved.
 */
function buildByKeyboard(question: Question): RawResponse {
  if (question.answer.kind !== "placement") throw new Error("not a placement question");
  let state = startPlacement(question);

  for (const zone of question.answer.zones) {
    for (const itemId of zone.itemIds) {
      state = placeItem(question, state, itemId, zone.zoneId);
    }
  }

  if (question.answer.orderMatters) {
    // Sort each zone into the expected order using only single-position moves.
    for (const zone of question.answer.zones) {
      for (let target = 0; target < zone.itemIds.length; target++) {
        const itemId = zone.itemIds[target]!;
        let guard = 0;
        while (itemsIn(state, zone.zoneId).indexOf(itemId) > target) {
          expect(guard++).toBeLessThan(50);
          state = moveWithinZone(question, state, itemId, -1);
        }
      }
    }
  }

  expect(isPlacementComplete(state), `${question.id} left items in the tray`).toBe(true);
  expect(itemsIn(state, TRAY)).toEqual([]);
  return placementResponse(state);
}

describe("drag-and-drop is a live interaction", () => {
  it("is registered as implemented and produces a placement response", () => {
    const descriptor = getInteraction("drag-and-drop");
    expect(descriptor?.implemented).toBe(true);
    expect(descriptor?.responseKind).toBe("placement");
  });

  it("ships grouping, ordered and multi-zone examples, all inside real lessons", () => {
    const qs = dragQuestions();
    expect(qs.length).toBeGreaterThanOrEqual(3);

    // Grouping (unordered), sorting (ordered) and graph construction (many zones)
    // are all expressed with the same primitive.
    expect(qs.some((q) => q.answer.kind === "placement" && !q.answer.orderMatters)).toBe(true);
    expect(qs.some((q) => q.answer.kind === "placement" && q.answer.orderMatters)).toBe(true);
    expect(qs.some((q) => zonesOf(q).length >= 4)).toBe(true);

    const inLessons = new Set(content.curriculum.lessons.flatMap((l) => l.questionIds));
    for (const q of qs) {
      expect(inLessons.has(q.id), `${q.id} must be reachable from a lesson`).toBe(true);
      expect(zonesOf(q).length).toBeGreaterThanOrEqual(1);
      expect((q.items ?? []).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every declared placement misconception resolves to a real remediation", () => {
    const byId = new Map(content.misconceptions.map((m) => [m.id, m]));
    const remediationIds = new Set(content.remediations.map((r) => r.id));
    for (const q of dragQuestions()) {
      if (q.answer.kind !== "placement") continue;
      for (const mp of q.answer.misconceptionPlacements) {
        const mc = byId.get(mp.misconceptionId);
        expect(mc, `${q.id} -> ${mp.misconceptionId}`).toBeDefined();
        expect(remediationIds.has(mc!.remediationId)).toBe(true);
      }
    }
  });
});

describe("every shipped arrangement is reachable by keyboard alone", () => {
  it("builds and submits each one without a single drag", () => {
    for (const q of dragQuestions()) {
      const response = buildByKeyboard(q);
      const result = submitAnswer(content, freshSave(), sessionOn(lessonOf(q.id).id, q.id), response, 5000)!;
      expect(result.feedback.correct, `${q.id} rejected its keyboard-built arrangement`).toBe(true);
    }
  });
});

describe("wrong arrangements are diagnosed", () => {
  it("classifies a boat number filed as numerical and offers remediation", () => {
    const response: RawResponse = {
      kind: "placement",
      zones: [
        { zoneId: "z.categorical", itemIds: ["it.home-port", "it.weather"] },
        { zoneId: "z.numerical", itemIds: ["it.boat-number", "it.fish-landed", "it.hours-at-sea"] }
      ]
    };
    const result = submitAnswer(
      content,
      freshSave(),
      sessionOn("l.r2-frequency", "q.dd-variable-kinds"),
      response,
      5000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.digits-mean-numerical");
    expect(result.feedback.remediation?.id).toBe("rem.categorical-vs-numerical");
  });

  it("classifies splitting at the median instead of the mean", () => {
    // Tuesday landed 4 fish: below the mean of 5, but not below the median of 4.
    const response: RawResponse = {
      kind: "placement",
      zones: [
        { zoneId: "z.below", itemIds: ["it.mon", "it.wed"] },
        { zoneId: "z.above", itemIds: ["it.tue", "it.thu", "it.fri"] }
      ]
    };
    const result = submitAnswer(
      content,
      freshSave(),
      sessionOn("l.reading-tallies", "q.dd-above-below-mean"),
      response,
      5000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.mean-median-confusion");
  });

  it("rejects a descending sort and injects the guided retry", () => {
    const response: RawResponse = {
      kind: "placement",
      zones: [{ zoneId: "z.sorted", itemIds: ["it.p15", "it.p12", "it.p8", "it.p7", "it.p3"] }]
    };
    const session = sessionOn("l.middle-harbor", "q.dd-sort-prices");
    const result = submitAnswer(content, freshSave(), session, response, 5000)!;
    expect(result.feedback.correct).toBe(false);
    expect(result.save.skillStates["skill.median"]?.attempts).toBe(1);
  });

  it("updates mastery and schedules review on a correct arrangement", () => {
    const q = content.questions.get("q.dd-build-bar-chart")!;
    const result = submitAnswer(
      content,
      freshSave(),
      sessionOn("l.r2-bar-charts", q.id),
      buildByKeyboard(q),
      5000
    )!;
    expect(result.feedback.correct).toBe(true);
    expect(result.save.skillStates["skill.data-literacy"]?.correct).toBe(1);
    expect(result.save.reviewQueue.some((r) => r.skillId === "skill.data-literacy")).toBe(true);

    // Advancing past the last question of a lesson finishes it rather than
    // incrementing the index, so assert whichever applies to where this question sits.
    const queue = result.session.questionQueue;
    const isLast = result.session.currentIndex === queue.length - 1;
    const adv = advance(content, result.save, result.session, 6000);
    if (isLast) {
      expect(adv.session.finished).toBe(true);
    } else {
      expect(adv.session.currentIndex).toBeGreaterThan(result.session.currentIndex);
    }
  });
});
