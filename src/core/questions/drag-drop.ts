/**
 * Drag-and-drop placement: arranging items into zones.
 *
 * Pure, like the step and point engines (D-001). That is the whole reason the
 * keyboard path can be trusted here — dragging and keyboard placement call the
 * *same* functions, so "you can do it with a mouse but not a keyboard" is not a
 * reachable state. The renderer contributes pointer events and markup, nothing
 * more.
 *
 * One primitive serves every arrangement task, because only the zone
 * configuration changes: ordered slots of capacity 1 for sorting and matching,
 * unlimited category zones for grouping, one zone per bar for simple graph
 * construction.
 */
import type { DropZone, Question } from "../../shared/schemas";

/** The tray of not-yet-placed items. */
export const TRAY = "__tray__";

export interface PlacementState {
  questionId: string;
  /** Ordered item ids per zone id. The tray is a zone under the `TRAY` key. */
  zones: Record<string, string[]>;
  /** The item picked up for keyboard movement, if any. */
  grabbed: string | null;
}

export function zonesOf(question: Question): readonly DropZone[] {
  return question.dropZones ?? [];
}

export function itemIdsOf(question: Question): string[] {
  return (question.items ?? []).map((i) => i.id);
}

export function orderMattersFor(question: Question): boolean {
  return question.answer.kind === "placement" ? question.answer.orderMatters : false;
}

export function capacityOf(question: Question, zoneId: string): number | null {
  return zonesOf(question).find((z) => z.id === zoneId)?.capacity ?? null;
}

/** Every item starts in the tray, in the order the question declares them. */
export function startPlacement(question: Question): PlacementState {
  const zones: Record<string, string[]> = { [TRAY]: itemIdsOf(question) };
  for (const zone of zonesOf(question)) zones[zone.id] = [];
  return { questionId: question.id, zones, grabbed: null };
}

export function zoneContaining(state: PlacementState, itemId: string): string | null {
  for (const [zoneId, items] of Object.entries(state.zones)) {
    if (items.includes(itemId)) return zoneId;
  }
  return null;
}

export function itemsIn(state: PlacementState, zoneId: string): readonly string[] {
  return state.zones[zoneId] ?? [];
}

export function isZoneFull(question: Question, state: PlacementState, zoneId: string): boolean {
  if (zoneId === TRAY) return false;
  const capacity = capacityOf(question, zoneId);
  return capacity !== null && itemsIn(state, zoneId).length >= capacity;
}

/**
 * Moves an item into a zone, optionally at a position within it.
 *
 * A full zone rejects the move rather than silently displacing whatever is
 * already there — losing a placement the learner made would be worse than
 * refusing the new one. Moving an item to the zone it already occupies is a
 * reorder, not a rejection.
 */
export function placeItem(
  question: Question,
  state: PlacementState,
  itemId: string,
  zoneId: string,
  index?: number
): PlacementState {
  const from = zoneContaining(state, itemId);
  if (from === null) return state;
  if (from !== zoneId && isZoneFull(question, state, zoneId)) return state;

  const zones: Record<string, string[]> = {};
  for (const [id, items] of Object.entries(state.zones)) {
    zones[id] = items.filter((i) => i !== itemId);
  }
  const target = zones[zoneId] ?? [];
  const at = index === undefined ? target.length : Math.max(0, Math.min(index, target.length));
  target.splice(at, 0, itemId);
  zones[zoneId] = target;

  return { ...state, zones };
}

/** Sends an item back to the tray. */
export function returnToTray(question: Question, state: PlacementState, itemId: string): PlacementState {
  return placeItem(question, state, itemId, TRAY);
}

/** Reorders an item inside its current zone — the keyboard equivalent of dragging within a zone. */
export function moveWithinZone(
  question: Question,
  state: PlacementState,
  itemId: string,
  direction: -1 | 1
): PlacementState {
  const zoneId = zoneContaining(state, itemId);
  if (zoneId === null) return state;
  const items = itemsIn(state, zoneId);
  const index = items.indexOf(itemId);
  const next = index + direction;
  if (next < 0 || next >= items.length) return state;
  return placeItem(question, state, itemId, zoneId, next);
}

/** Picks an item up (or puts it down) for keyboard movement. */
export function toggleGrab(state: PlacementState, itemId: string): PlacementState {
  return { ...state, grabbed: state.grabbed === itemId ? null : itemId };
}

/** True once no item remains in the tray. */
export function isPlacementComplete(state: PlacementState): boolean {
  return itemsIn(state, TRAY).length === 0;
}

/**
 * The response handed to the session engine. Throws while items remain in the
 * tray, because submitting a partial arrangement would record a wrong answer for
 * work the learner has not finished.
 */
export function placementResponse(state: PlacementState): {
  kind: "placement";
  zones: Array<{ zoneId: string; itemIds: string[] }>;
} {
  if (!isPlacementComplete(state)) {
    throw new Error(`placement for ${state.questionId} is not complete`);
  }
  return {
    kind: "placement",
    zones: Object.entries(state.zones)
      .filter(([zoneId]) => zoneId !== TRAY)
      .map(([zoneId, itemIds]) => ({ zoneId, itemIds: [...itemIds] }))
  };
}

/** Spoken summary of the arrangement — the text equivalent of the visual layout. */
export function describePlacement(question: Question, state: PlacementState): string {
  const label = (id: string) => question.items?.find((i) => i.id === id)?.text ?? id;
  const parts = zonesOf(question).map((zone) => {
    const items = itemsIn(state, zone.id);
    return `${zone.label}: ${items.length === 0 ? "empty" : items.map(label).join(", ")}`;
  });
  const tray = itemsIn(state, TRAY);
  parts.push(`Not yet placed: ${tray.length === 0 ? "none" : tray.map(label).join(", ")}`);
  return parts.join(". ") + ".";
}

export interface PlacementSpec {
  zones: ReadonlyArray<{ zoneId: string; itemIds: readonly string[] }>;
  orderMatters: boolean;
  misconceptionPlacements: ReadonlyArray<{ itemId: string; zoneId: string; misconceptionId: string }>;
}

function sameItems(a: readonly string[], b: readonly string[], orderMatters: boolean): boolean {
  if (a.length !== b.length) return false;
  if (orderMatters) return a.every((id, i) => id === b[i]);
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}

/** Whether every zone holds exactly what the answer expects. */
export function placementMatches(
  spec: PlacementSpec,
  submitted: ReadonlyArray<{ zoneId: string; itemIds: readonly string[] }>
): boolean {
  const got = new Map(submitted.map((z) => [z.zoneId, z.itemIds]));
  // Any item dropped into a zone the answer never mentions is still wrong.
  const expectedZoneIds = new Set(spec.zones.map((z) => z.zoneId));
  for (const zone of submitted) {
    if (!expectedZoneIds.has(zone.zoneId) && zone.itemIds.length > 0) return false;
  }
  return spec.zones.every((zone) => sameItems(zone.itemIds, got.get(zone.zoneId) ?? [], spec.orderMatters));
}

/** Item ids that ended up somewhere other than where the answer expects them. */
export function misplacedItems(
  spec: PlacementSpec,
  submitted: ReadonlyArray<{ zoneId: string; itemIds: readonly string[] }>
): string[] {
  const expectedZoneOf = new Map<string, string>();
  for (const zone of spec.zones) {
    for (const itemId of zone.itemIds) expectedZoneOf.set(itemId, zone.zoneId);
  }
  const misplaced: string[] = [];
  for (const zone of submitted) {
    for (const itemId of zone.itemIds) {
      if (expectedZoneOf.get(itemId) !== zone.zoneId) misplaced.push(itemId);
    }
  }
  return misplaced;
}

/** The misconception a wrong arrangement identifies, if any. */
export function classifyPlacement(
  spec: PlacementSpec,
  submitted: ReadonlyArray<{ zoneId: string; itemIds: readonly string[] }>
): string | null {
  for (const candidate of spec.misconceptionPlacements) {
    const zone = submitted.find((z) => z.zoneId === candidate.zoneId);
    if (zone && zone.itemIds.includes(candidate.itemId)) return candidate.misconceptionId;
  }
  return null;
}
