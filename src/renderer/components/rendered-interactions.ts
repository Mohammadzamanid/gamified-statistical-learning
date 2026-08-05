/**
 * The interaction types that have a real renderer.
 *
 * This is deliberately a plain module rather than a comment beside the switch in
 * `QuestionRenderers.tsx`: the switch consults it, and the interaction audit
 * (`tests/audit/interaction-audit.test.ts`) asserts it matches the registry's
 * `implemented` flags exactly. Flipping a registry flag without writing a
 * renderer, or writing one without flipping the flag, fails the audit instead of
 * shipping a question the learner cannot answer.
 */
import type { InteractionType } from "../../shared/schemas";

export const RENDERED_INTERACTION_TYPES: ReadonlySet<InteractionType> = new Set<InteractionType>([
  "multiple-choice",
  "multiple-selection",
  "numeric-input",
  "percentage-input",
  "fraction-input",
  "ordering",
  "matching",
  "graph-interpretation",
  "error-identification",
  "method-selection",
  "short-explanation",
  "step-by-step-calculation",
  "point-placement",
  "drag-and-drop"
]);

export function hasRenderer(type: InteractionType): boolean {
  return RENDERED_INTERACTION_TYPES.has(type);
}
