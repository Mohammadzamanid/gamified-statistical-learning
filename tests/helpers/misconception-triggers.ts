/**
 * A response that should make the engine name a particular misconception.
 *
 * S2-16's "no count-inflating tags" criterion needs this. A question can declare
 * a misconception in `misconceptionIds` and offer nothing a learner could
 * actually do to express it — no tagged distractor, no wrong value, no wrong
 * placement — and the declaration still counts in every report. The only honest
 * way to check the claim is to build the wrong answer the declaration implies
 * and put it through the real pipeline: if nothing can be built, the tag is
 * decoration.
 *
 * The switch is over where a trigger can live, not over answer kinds, because
 * one question can carry several: a numeric question can hold both a tagged
 * distractor (it has choices) and a wrong value. Returning the first buildable
 * one is enough — the audit asks whether the misconception is reachable at all.
 */
import type { Question } from "../../src/shared/schemas";
import type { RawResponse } from "../../src/core/questions/types";

/** Merged detector parameters: the misconception's own, overridden per question. */
export function mergedParams(
  question: Question,
  misconceptionId: string,
  detectorParams: Record<string, unknown> | undefined
): Record<string, unknown> {
  const perQuestion = (question.parameters?.[misconceptionId] ?? {}) as Record<string, unknown>;
  return { ...(detectorParams ?? {}), ...perQuestion };
}

/**
 * The response a learner would give to express `misconceptionId` on this
 * question, or `null` when the question offers no way to express it.
 */
export function responseTriggering(
  question: Question,
  misconceptionId: string,
  detectorParams: Record<string, unknown> | undefined,
  detector?: string
): RawResponse | null {
  const tagged = (question.choices ?? []).find((c) => c.misconceptionId === misconceptionId);
  if (tagged) return { kind: "choice", choiceIds: [tagged.id] };

  const answer = question.answer;

  if (answer.kind === "point") {
    const point = answer.misconceptionPoints?.find((p) => p.misconceptionId === misconceptionId);
    if (point) {
      return point.y === undefined ? { kind: "point", x: point.x } : { kind: "point", x: point.x, y: point.y };
    }
    // The axes-swapped reading is geometry the evaluator owns: it is expressed
    // by giving the coordinates the other way round, not by a declared point.
    if (answer.y !== undefined && answer.swappedAxesMisconceptionId === misconceptionId) {
      return { kind: "point", x: answer.y, y: answer.x };
    }
  }

  if (answer.kind === "placement") {
    const wrong = answer.misconceptionPlacements?.find((p) => p.misconceptionId === misconceptionId);
    if (wrong) {
      const zones = answer.zones.map((z) => ({
        zoneId: z.zoneId,
        itemIds: z.itemIds.filter((id) => id !== wrong.itemId)
      }));
      const target = zones.find((z) => z.zoneId === wrong.zoneId);
      if (target) target.itemIds = [...target.itemIds, wrong.itemId];
      return { kind: "placement", zones };
    }
  }

  if (answer.kind === "steps") {
    const stepped = answer.steps.map((step) => {
      const wrong = step.misconceptionValues?.find((v) => v.misconceptionId === misconceptionId);
      return { stepId: step.id, text: String(wrong ? wrong.value : step.value) };
    });
    if (answer.steps.some((s) => s.misconceptionValues?.some((v) => v.misconceptionId === misconceptionId))) {
      return { kind: "steps", steps: stepped };
    }
  }

  // Value-derived detectors. Two shapes: a wrong number named in the merged
  // parameters, and a wrong number that is a *function of the right one* — the
  // detector itself defines the arithmetic, so the trigger is derived the same
  // way rather than declared anywhere in content.
  if (answer.kind === "numeric") {
    const params = mergedParams(question, misconceptionId, detectorParams);
    const wrongValue = params["wrongValue"];
    if (typeof wrongValue === "number") return { kind: "numeric", text: String(wrongValue) };

    const derived = DERIVED_TRIGGERS[detector ?? ""];
    if (derived) {
      const value = derived(answer.value);
      if (value !== null && Number.isFinite(value)) return { kind: "numeric", text: String(value) };
    }
  }

  return null;
}

/**
 * Wrong answers a detector recognises by their relationship to the right one.
 *
 * These misconceptions are not tagged anywhere in content and do not need to be:
 * "wrote 0.35 where 35 was asked" is a rule about arithmetic, not about this
 * question. Deriving the trigger the same way the detector does is what lets the
 * audit put every declaration through the real pipeline rather than exempting
 * the ones whose trigger is implicit.
 */
const DERIVED_TRIGGERS: Record<string, (expected: number) => number | null> = {
  "decimal-instead-of-percentage": (v) => v / 100,
  "percentage-instead-of-decimal": (v) => v * 100,
  "reversed-fraction": (v) => (v === 0 ? null : 1 / v),
  "sign-error": (v) => (v === 0 ? null : -v)
};
