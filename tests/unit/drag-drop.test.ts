/**
 * S2-04: the drag-and-drop placement engine.
 *
 * The pointer path and the keyboard path call these same functions, so testing
 * them here is what makes the keyboard claim real: any arrangement a drag can
 * produce, `placeItem`/`moveWithinZone` can produce too.
 *
 * The zone-configuration tests matter as much as the mechanics — they are the
 * evidence that one primitive genuinely covers sorting, matching, grouping and
 * simple graph construction rather than just the one shape content happens to use.
 */
import { describe, expect, it } from "vitest";
import {
  TRAY,
  classifyPlacement,
  describePlacement,
  isPlacementComplete,
  isZoneFull,
  itemsIn,
  misplacedItems,
  moveWithinZone,
  placeItem,
  placementMatches,
  placementResponse,
  returnToTray,
  startPlacement,
  toggleGrab,
  zoneContaining
} from "../../src/core/questions/drag-drop";
import { evaluateResponse } from "../../src/core/questions/evaluators";
import { normalizeResponse } from "../../src/core/questions/normalize";
import { QuestionSchema, type Question } from "../../src/shared/schemas";

/** Grouping: two unlimited zones. */
function groupingQuestion(): Question {
  return QuestionSchema.parse({
    id: "q.test-group",
    topicId: "t.read-data",
    objectiveId: "obj.read-data",
    skillIds: ["skill.data-literacy"],
    difficulty: 2,
    interaction: "drag-and-drop",
    prompt: "Sort these.",
    items: [
      { id: "it.a", text: "A" },
      { id: "it.b", text: "B" },
      { id: "it.c", text: "C" }
    ],
    dropZones: [
      { id: "z.left", label: "Left" },
      { id: "z.right", label: "Right" }
    ],
    answer: {
      kind: "placement",
      zones: [
        { zoneId: "z.left", itemIds: ["it.a", "it.b"] },
        { zoneId: "z.right", itemIds: ["it.c"] }
      ],
      orderMatters: false,
      misconceptionPlacements: [{ itemId: "it.a", zoneId: "z.right", misconceptionId: "mc.test" }]
    },
    explanation: "A and B go left."
  });
}

/** Sorting: a single ordered zone. */
function sortingQuestion(): Question {
  return QuestionSchema.parse({
    id: "q.test-sort",
    topicId: "t.center",
    objectiveId: "obj.compute-median",
    skillIds: ["skill.median"],
    difficulty: 2,
    interaction: "drag-and-drop",
    prompt: "Sort ascending.",
    items: [
      { id: "it.1", text: "1" },
      { id: "it.2", text: "2" },
      { id: "it.3", text: "3" }
    ],
    dropZones: [{ id: "z.sorted", label: "Sorted" }],
    answer: {
      kind: "placement",
      zones: [{ zoneId: "z.sorted", itemIds: ["it.1", "it.2", "it.3"] }],
      orderMatters: true
    },
    explanation: "Ascending."
  });
}

/** Matching: one capacity-1 zone per right-hand item. */
function matchingShapedQuestion(): Question {
  return QuestionSchema.parse({
    id: "q.test-match",
    topicId: "t.center",
    objectiveId: "obj.choose-measure",
    skillIds: ["skill.choose-measure"],
    difficulty: 2,
    interaction: "drag-and-drop",
    prompt: "Match each term to its meaning.",
    items: [
      { id: "it.mean", text: "Mean" },
      { id: "it.median", text: "Median" }
    ],
    dropZones: [
      { id: "z.balance", label: "The balance point", capacity: 1 },
      { id: "z.middle", label: "The middle value", capacity: 1 }
    ],
    answer: {
      kind: "placement",
      zones: [
        { zoneId: "z.balance", itemIds: ["it.mean"] },
        { zoneId: "z.middle", itemIds: ["it.median"] }
      ],
      orderMatters: false
    },
    explanation: "Mean balances; median is the middle."
  });
}

describe("starting a placement", () => {
  it("puts every item in the tray and leaves zones empty", () => {
    const q = groupingQuestion();
    const state = startPlacement(q);
    expect(itemsIn(state, TRAY)).toEqual(["it.a", "it.b", "it.c"]);
    expect(itemsIn(state, "z.left")).toEqual([]);
    expect(isPlacementComplete(state)).toBe(false);
  });

  it("reports which zone holds an item", () => {
    const q = groupingQuestion();
    const state = placeItem(q, startPlacement(q), "it.a", "z.left");
    expect(zoneContaining(state, "it.a")).toBe("z.left");
    expect(zoneContaining(state, "it.b")).toBe(TRAY);
    expect(zoneContaining(state, "it.nope")).toBeNull();
  });
});

describe("moving items", () => {
  it("moves an item between zones without duplicating it", () => {
    const q = groupingQuestion();
    let s = startPlacement(q);
    s = placeItem(q, s, "it.a", "z.left");
    s = placeItem(q, s, "it.a", "z.right");
    expect(itemsIn(s, "z.left")).toEqual([]);
    expect(itemsIn(s, "z.right")).toEqual(["it.a"]);
    expect(itemsIn(s, TRAY)).toEqual(["it.b", "it.c"]);
  });

  it("returns an item to the tray", () => {
    const q = groupingQuestion();
    let s = placeItem(q, startPlacement(q), "it.a", "z.left");
    s = returnToTray(q, s, "it.a");
    expect(itemsIn(s, TRAY)).toContain("it.a");
    expect(itemsIn(s, "z.left")).toEqual([]);
  });

  it("ignores an unknown item", () => {
    const q = groupingQuestion();
    const s = startPlacement(q);
    expect(placeItem(q, s, "it.ghost", "z.left")).toEqual(s);
  });

  it("refuses to overfill a capacity-limited zone rather than displacing work", () => {
    const q = matchingShapedQuestion();
    let s = placeItem(q, startPlacement(q), "it.mean", "z.balance");
    expect(isZoneFull(q, s, "z.balance")).toBe(true);
    s = placeItem(q, s, "it.median", "z.balance");
    // The second item is refused; the first placement survives.
    expect(itemsIn(s, "z.balance")).toEqual(["it.mean"]);
    expect(itemsIn(s, TRAY)).toEqual(["it.median"]);
  });

  it("allows reordering inside a zone that is already full", () => {
    const q = matchingShapedQuestion();
    const s = placeItem(q, startPlacement(q), "it.mean", "z.balance");
    // Re-placing into the same zone is a reorder, not an overfill.
    expect(itemsIn(placeItem(q, s, "it.mean", "z.balance"), "z.balance")).toEqual(["it.mean"]);
  });

  it("never treats the tray as full", () => {
    const q = matchingShapedQuestion();
    expect(isZoneFull(q, startPlacement(q), TRAY)).toBe(false);
  });
});

describe("ordering inside a zone (the keyboard reorder path)", () => {
  it("moves an item earlier and later, and stops at the ends", () => {
    const q = sortingQuestion();
    let s = startPlacement(q);
    for (const id of ["it.3", "it.2", "it.1"]) s = placeItem(q, s, id, "z.sorted");
    expect(itemsIn(s, "z.sorted")).toEqual(["it.3", "it.2", "it.1"]);

    s = moveWithinZone(q, s, "it.1", -1);
    expect(itemsIn(s, "z.sorted")).toEqual(["it.3", "it.1", "it.2"]);
    s = moveWithinZone(q, s, "it.1", -1);
    expect(itemsIn(s, "z.sorted")).toEqual(["it.1", "it.3", "it.2"]);
    // Already first: no further movement.
    expect(itemsIn(moveWithinZone(q, s, "it.1", -1), "z.sorted")).toEqual(["it.1", "it.3", "it.2"]);

    s = moveWithinZone(q, s, "it.2", 1);
    expect(itemsIn(s, "z.sorted")).toEqual(["it.1", "it.3", "it.2"]);
  });

  it("can reach the exact expected order using only reorder moves", () => {
    // This is the keyboard-reachability guarantee for sorting questions.
    const q = sortingQuestion();
    let s = startPlacement(q);
    for (const id of ["it.3", "it.2", "it.1"]) s = placeItem(q, s, id, "z.sorted");
    s = moveWithinZone(q, s, "it.1", -1);
    s = moveWithinZone(q, s, "it.1", -1);
    s = moveWithinZone(q, s, "it.2", -1);
    expect(itemsIn(s, "z.sorted")).toEqual(["it.1", "it.2", "it.3"]);

    const evaluation = evaluateResponse(q, normalizeResponse(placementResponse(s)));
    expect(evaluation.correct).toBe(true);
  });

  it("grabbing toggles and is per item", () => {
    const q = groupingQuestion();
    let s = startPlacement(q);
    s = toggleGrab(s, "it.a");
    expect(s.grabbed).toBe("it.a");
    s = toggleGrab(s, "it.a");
    expect(s.grabbed).toBeNull();
  });
});

describe("completion and response", () => {
  it("is incomplete while anything remains in the tray", () => {
    const q = groupingQuestion();
    const s = placeItem(q, startPlacement(q), "it.a", "z.left");
    expect(isPlacementComplete(s)).toBe(false);
    expect(() => placementResponse(s)).toThrow(/not complete/);
  });

  it("produces a response once every item is placed, excluding the tray", () => {
    const q = groupingQuestion();
    let s = startPlacement(q);
    s = placeItem(q, s, "it.a", "z.left");
    s = placeItem(q, s, "it.b", "z.left");
    s = placeItem(q, s, "it.c", "z.right");
    expect(isPlacementComplete(s)).toBe(true);

    const response = placementResponse(s);
    expect(response.zones.map((z) => z.zoneId).sort()).toEqual(["z.left", "z.right"]);
    expect(response.zones.some((z) => z.zoneId === TRAY)).toBe(false);
  });

  it("describes the arrangement in words", () => {
    const q = groupingQuestion();
    const s = placeItem(q, startPlacement(q), "it.a", "z.left");
    const text = describePlacement(q, s);
    expect(text).toContain("Left: A");
    expect(text).toContain("Right: empty");
    expect(text).toContain("Not yet placed: B, C");
  });
});

describe("matching a placement", () => {
  const spec = {
    zones: [
      { zoneId: "z.left", itemIds: ["it.a", "it.b"] },
      { zoneId: "z.right", itemIds: ["it.c"] }
    ],
    orderMatters: false,
    misconceptionPlacements: []
  };

  it("accepts the expected arrangement in any within-zone order", () => {
    expect(
      placementMatches(spec, [
        { zoneId: "z.left", itemIds: ["it.b", "it.a"] },
        { zoneId: "z.right", itemIds: ["it.c"] }
      ])
    ).toBe(true);
  });

  it("rejects a wrong grouping", () => {
    expect(
      placementMatches(spec, [
        { zoneId: "z.left", itemIds: ["it.a"] },
        { zoneId: "z.right", itemIds: ["it.b", "it.c"] }
      ])
    ).toBe(false);
  });

  it("respects within-zone order only when the question says order matters", () => {
    const ordered = { ...spec, orderMatters: true };
    const submitted = [
      { zoneId: "z.left", itemIds: ["it.b", "it.a"] },
      { zoneId: "z.right", itemIds: ["it.c"] }
    ];
    expect(placementMatches(spec, submitted)).toBe(true);
    expect(placementMatches(ordered, submitted)).toBe(false);
  });

  it("rejects items dropped into a zone the answer never mentions", () => {
    expect(
      placementMatches(spec, [
        { zoneId: "z.left", itemIds: ["it.a", "it.b"] },
        { zoneId: "z.right", itemIds: ["it.c"] },
        { zoneId: "z.rogue", itemIds: ["it.d"] }
      ])
    ).toBe(false);
  });

  it("names the misplaced items", () => {
    const misplaced = misplacedItems(spec, [
      { zoneId: "z.left", itemIds: ["it.a"] },
      { zoneId: "z.right", itemIds: ["it.b", "it.c"] }
    ]);
    expect(misplaced).toEqual(["it.b"]);
  });
});

describe("classification", () => {
  it("classifies a declared wrong placement", () => {
    const q = groupingQuestion();
    const spec = {
      zones: q.answer.kind === "placement" ? q.answer.zones : [],
      orderMatters: false,
      misconceptionPlacements:
        q.answer.kind === "placement" ? q.answer.misconceptionPlacements : []
    };
    expect(
      classifyPlacement(spec, [
        { zoneId: "z.left", itemIds: ["it.b"] },
        { zoneId: "z.right", itemIds: ["it.a", "it.c"] }
      ])
    ).toBe("mc.test");
  });

  it("returns null for an unremarkable wrong arrangement", () => {
    const q = groupingQuestion();
    const spec = {
      zones: q.answer.kind === "placement" ? q.answer.zones : [],
      orderMatters: false,
      misconceptionPlacements:
        q.answer.kind === "placement" ? q.answer.misconceptionPlacements : []
    };
    expect(
      classifyPlacement(spec, [
        { zoneId: "z.left", itemIds: ["it.a", "it.c"] },
        { zoneId: "z.right", itemIds: ["it.b"] }
      ])
    ).toBeNull();
  });
});

describe("placement evaluation", () => {
  it("scores a correct grouping and a wrong one", () => {
    const q = groupingQuestion();
    const good = normalizeResponse({
      kind: "placement",
      zones: [
        { zoneId: "z.left", itemIds: ["it.a", "it.b"] },
        { zoneId: "z.right", itemIds: ["it.c"] }
      ]
    });
    expect(evaluateResponse(q, good).correct).toBe(true);

    const bad = normalizeResponse({
      kind: "placement",
      zones: [
        { zoneId: "z.left", itemIds: ["it.b"] },
        { zoneId: "z.right", itemIds: ["it.a", "it.c"] }
      ]
    });
    const evaluation = evaluateResponse(q, bad);
    expect(evaluation.correct).toBe(false);
    expect(evaluation.signals["placementMisconceptionIds"]).toEqual(["mc.test"]);
    expect(evaluation.signals["misplacedItemIds"]).toContain("it.a");
  });

  it("rejects a response of the wrong kind", () => {
    const evaluation = evaluateResponse(groupingQuestion(), normalizeResponse({ kind: "numeric", text: "1" }));
    expect(evaluation.correct).toBe(false);
    expect(evaluation.signals["responseKindMismatch"]).toBe(true);
  });

  it("handles the matching-shaped configuration", () => {
    const q = matchingShapedQuestion();
    const response = normalizeResponse({
      kind: "placement",
      zones: [
        { zoneId: "z.balance", itemIds: ["it.mean"] },
        { zoneId: "z.middle", itemIds: ["it.median"] }
      ]
    });
    expect(evaluateResponse(q, response).correct).toBe(true);
  });
});

describe("placement schema", () => {
  it("rejects a placement answer on a non-drag interaction", () => {
    expect(QuestionSchema.safeParse({ ...groupingQuestion(), interaction: "ordering" }).success).toBe(false);
  });

  it("rejects a drag question with no zones", () => {
    const q: Record<string, unknown> = { ...groupingQuestion() };
    delete q["dropZones"];
    expect(QuestionSchema.safeParse(q).success).toBe(false);
  });

  it("rejects an answer referencing an unknown zone or item", () => {
    const q = groupingQuestion();
    expect(
      QuestionSchema.safeParse({
        ...q,
        answer: { kind: "placement", zones: [{ zoneId: "z.ghost", itemIds: ["it.a", "it.b", "it.c"] }] }
      }).success
    ).toBe(false);
  });

  it("rejects an item expected in two zones", () => {
    const q = groupingQuestion();
    expect(
      QuestionSchema.safeParse({
        ...q,
        answer: {
          kind: "placement",
          zones: [
            { zoneId: "z.left", itemIds: ["it.a", "it.b"] },
            { zoneId: "z.right", itemIds: ["it.a", "it.c"] }
          ]
        }
      }).success
    ).toBe(false);
  });

  it("rejects an item the answer never places", () => {
    const q = groupingQuestion();
    expect(
      QuestionSchema.safeParse({
        ...q,
        answer: { kind: "placement", zones: [{ zoneId: "z.left", itemIds: ["it.a", "it.b"] }] }
      }).success
    ).toBe(false);
  });

  it("rejects an expected arrangement that exceeds a zone's capacity", () => {
    const q = matchingShapedQuestion();
    expect(
      QuestionSchema.safeParse({
        ...q,
        answer: {
          kind: "placement",
          zones: [
            { zoneId: "z.balance", itemIds: ["it.mean", "it.median"] },
            { zoneId: "z.middle", itemIds: [] }
          ]
        }
      }).success
    ).toBe(false);
  });
});
