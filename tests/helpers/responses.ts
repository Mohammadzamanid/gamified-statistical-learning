/**
 * Builds a correct and a deliberately incorrect response for any question,
 * whatever its answer kind.
 *
 * Shared so the interaction audit can drive **every** registered type through
 * evaluation from real shipped content, rather than each test hand-rolling
 * answers for the handful of types it happens to care about. The switches are
 * exhaustive, so adding an answer kind without teaching this helper about it is
 * a compile error.
 */
import type { Question } from "../../src/shared/schemas";
import type { RawResponse } from "../../src/core/questions/types";

/** A response the question should mark correct. */
export function correctResponseFor(question: Question): RawResponse {
  const a = question.answer;
  switch (a.kind) {
    case "choice":
      return { kind: "choice", choiceIds: [...a.correctChoiceIds] };
    case "numeric":
      return { kind: "numeric", text: String(a.value) };
    case "ordering":
      return { kind: "ordering", order: [...a.correctOrder] };
    case "matching":
      return { kind: "matching", pairs: a.pairs.map((p) => ({ left: p.left, right: p.right })) };
    case "text":
      return { kind: "text", text: a.requiredKeywords.join(" ") };
    case "steps":
      return { kind: "steps", steps: a.steps.map((s) => ({ stepId: s.id, text: String(s.value) })) };
    case "point":
      return a.y === undefined ? { kind: "point", x: a.x } : { kind: "point", x: a.x, y: a.y };
    case "placement":
      return {
        kind: "placement",
        zones: a.zones.map((z) => ({ zoneId: z.zoneId, itemIds: [...z.itemIds] }))
      };
  }
}

/**
 * A response the question should mark incorrect.
 *
 * Every branch has to actually be wrong for the audit to mean anything, so the
 * audit asserts `correct === false` on whatever comes back — which validates this
 * helper at the same time as the evaluators.
 */
export function incorrectResponseFor(question: Question): RawResponse {
  const a = question.answer;
  switch (a.kind) {
    case "choice": {
      const correct = new Set(a.correctChoiceIds);
      const wrong = (question.choices ?? []).map((c) => c.id).filter((id) => !correct.has(id));
      // If every choice is correct, submitting a strict subset is still wrong.
      if (wrong.length === 0) return { kind: "choice", choiceIds: [...a.correctChoiceIds].slice(1) };
      return { kind: "choice", choiceIds: [wrong[0]!] };
    }
    case "numeric":
      return { kind: "numeric", text: String(a.value + Math.max(a.tolerance, 0) + 1) };
    case "ordering": {
      const reversed = [...a.correctOrder].reverse();
      return { kind: "ordering", order: reversed };
    }
    case "matching": {
      // Rotate the right-hand sides so at least two pairs are wrong.
      const rights = a.pairs.map((p) => p.right);
      return {
        kind: "matching",
        pairs: a.pairs.map((p, i) => ({ left: p.left, right: rights[(i + 1) % rights.length]! }))
      };
    }
    case "text":
      return { kind: "text", text: "no idea" };
    case "steps": {
      const steps = a.steps.map((s) => ({ stepId: s.id, text: String(s.value) }));
      const last = steps[steps.length - 1]!;
      const lastSpec = a.steps[a.steps.length - 1]!;
      last.text = String(lastSpec.value + Math.max(lastSpec.tolerance, 0) + 1);
      return { kind: "steps", steps };
    }
    case "point": {
      const x = a.x + Math.max(a.toleranceX, 0) + 1;
      return a.y === undefined ? { kind: "point", x } : { kind: "point", x, y: a.y };
    }
    case "placement": {
      // Move one item into a different zone. Questions always declare >= 2 zones
      // or >= 2 items in one zone, so a wrong arrangement always exists.
      const zones = a.zones.map((z) => ({ zoneId: z.zoneId, itemIds: [...z.itemIds] }));
      const source = zones.find((z) => z.itemIds.length > 0)!;
      const moved = source.itemIds.pop()!;
      const target = zones.find((z) => z.zoneId !== source.zoneId);
      if (target) {
        target.itemIds.push(moved);
      } else {
        // Single-zone (ordered) question: reversing the order is the wrong answer.
        source.itemIds.push(moved);
        source.itemIds.reverse();
      }
      return { kind: "placement", zones };
    }
  }
}
