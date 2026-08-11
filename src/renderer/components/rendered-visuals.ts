/**
 * The visual kinds a question can declare and actually see drawn.
 *
 * The same device as `rendered-interactions.ts`, and added for the same reason:
 * `VisualSpecSchema` accepts eight kinds and `QuestionScreen` drew exactly one.
 * A question declaring `histogram` or `box-plot` passed every check in the
 * repository and then rendered **nothing** — no chart, and no text either, since
 * the accessible description is carried by the chart component. The learner
 * would have met a prompt referring to a graph that was not on the screen, and
 * a screen-reader user would not have been told it was missing.
 *
 * Nothing shipped in that state; the gap was found by S2-14 before writing the
 * graph lessons, which are the first content that would have walked into it.
 * The list below is what the screen can draw today, the screen consults it, and
 * `tests/audit/interaction-audit.test.ts` fails if shipped content declares a
 * kind that is not here. So a lesson cannot outrun the renderer silently: it
 * fails loudly, and the fix is to write the renderer.
 *
 * `none` is deliberately absent — it is the absence of a visual, not a drawable
 * kind, and `VisualSpecSchema` already refuses an accessible description for it.
 */
import type { VisualSpec } from "../../shared/schemas";

export type VisualKind = VisualSpec["kind"];

export const RENDERED_VISUAL_KINDS: ReadonlySet<VisualKind> = new Set<VisualKind>([
  "bar-chart",
  "histogram",
  "dot-plot",
  "box-plot",
  "scatter"
]);

export function hasVisualRenderer(kind: VisualKind): boolean {
  return kind !== "none" && RENDERED_VISUAL_KINDS.has(kind);
}
