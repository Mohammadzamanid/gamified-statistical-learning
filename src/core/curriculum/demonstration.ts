/**
 * The arithmetic behind an interactive lesson demonstration.
 *
 * Pure, and deliberately outside React (D-001): the readout a learner reads off
 * the screen is a taught quantity, so it is computed once here and the panel
 * only displays it. That also makes the demonstration testable without a DOM,
 * and makes the spoken/screen-reader text and the visible text provably the
 * same string rather than two hand-written descriptions that can drift.
 */
import { DEMONSTRATION_ARITY, type Demonstration, type DemonstrationControl } from "../../shared/schemas";

/** The control values a demonstration starts at. */
export function initialValues(demo: Demonstration): number[] {
  return demo.controls.map((c) => c.initial);
}

/** Clamps to the control's range and snaps to its step, so keyboard and pointer agree. */
export function clampToControl(control: DemonstrationControl, value: number): number {
  if (!Number.isFinite(value)) return control.initial;
  const steps = Math.round((value - control.min) / control.step);
  const snapped = control.min + steps * control.step;
  const bounded = Math.min(control.max, Math.max(control.min, snapped));
  // Re-round to kill floating-point dust from the step arithmetic (0.30000000000000004).
  return Number(bounded.toFixed(6));
}

/** Replaces one control's value, clamped and snapped. */
export function setControlValue(demo: Demonstration, values: readonly number[], index: number, next: number): number[] {
  const control = demo.controls[index];
  if (!control) return [...values];
  const updated = [...values];
  updated[index] = clampToControl(control, next);
  return updated;
}

/** Reads `cells[row][column]` from a 1-based selection, or throws if it is off the grid. */
function cellAt(demo: Demonstration, row: number, column: number): number {
  const table = demo.table;
  if (!table) throw new Error(`demonstration ${demo.id}: formula ${demo.formula} needs a table`);
  const cell = table.cells[Math.round(row) - 1]?.[Math.round(column) - 1];
  if (cell === undefined) {
    throw new Error(`demonstration ${demo.id}: no cell at row ${row}, column ${column}`);
  }
  return cell;
}

function apply(demo: Demonstration, a: number, b: number): number {
  const formula = demo.formula;
  switch (formula) {
    case "tally":
      return a * 5 + b;
    case "sum":
      return a + b;
    case "difference":
      return a - b;
    case "product":
      return a * b;
    case "quotient":
      return a / b;
    case "negate":
      return -a;
    case "square-root":
      // The schema forbids a control range reaching below zero for this formula,
      // so this is never asked for a negative. Guarded anyway rather than
      // returning NaN: a readout is taught content, and content that quietly
      // becomes "NaN" on screen is worse than content that fails loudly here.
      if (a < 0) throw new Error(`demonstration ${demo.id}: square root of negative control value ${a}`);
      return Math.sqrt(a);
    case "place-value":
      // Deliberately not (10a + b) / 100: the learner is moving a tenths digit
      // and a hundredths digit, and each column's contribution should be
      // visible in the arithmetic that produces the readout.
      return a / 10 + b / 100;
    case "percent-of":
      return (a / 100) * b;
    case "share-of":
      return (a / b) * 100;
    case "table-cell":
      return cellAt(demo, a, b);
    case "column-total": {
      const table = demo.table;
      if (!table) throw new Error(`demonstration ${demo.id}: column-total needs a table`);
      const column = Math.round(a) - 1;
      return table.cells.reduce((total, row) => total + (row[column] ?? 0), 0);
    }
  }
}

/**
 * The readout for a set of control values.
 *
 * Throws on the wrong number of values rather than quietly computing with
 * `undefined`, because a mismatch means the content and the panel disagree
 * about the demonstration — a bug, not a learner action.
 */
export function demonstrationReadout(demo: Demonstration, values: readonly number[]): number {
  const arity = DEMONSTRATION_ARITY[demo.formula];
  if (values.length !== arity) {
    throw new Error(`demonstration ${demo.id}: formula ${demo.formula} needs ${arity} value(s), got ${values.length}`);
  }
  for (const v of values) {
    if (!Number.isFinite(v)) throw new Error(`demonstration ${demo.id}: control value is not a finite number`);
  }
  return apply(demo, values[0]!, values[1] ?? 0);
}

/** The readout rounded and suffixed exactly as the panel shows it. */
export function formatReadout(demo: Demonstration, values: readonly number[]): string {
  const raw = demonstrationReadout(demo, values);
  const shown = raw.toFixed(demo.readoutPrecision);
  return demo.readoutUnit ? `${shown} ${demo.readoutUnit}` : shown;
}

/**
 * What a control's current setting reads as.
 *
 * A labelled control selects a thing, not a quantity, so it shows the thing's
 * name — "Thursday", not "4". Exported because the panel must display exactly
 * what the spoken description says, and the two would drift if each formatted
 * the value itself.
 */
export function formatControlValue(control: DemonstrationControl, value: number): string {
  const label = control.valueLabels[Math.round(value) - 1];
  if (label !== undefined) return label;
  const decimals = Number.isInteger(control.step) ? 0 : String(control.step).split(".")[1]!.length;
  const shown = value.toFixed(decimals);
  return control.unit ? `${shown} ${control.unit}` : shown;
}

/**
 * The current state of the demonstration in words.
 *
 * This is the accessible equivalent required by requirement 18. It is generated
 * from the same values the visible readout uses, so it cannot describe a state
 * the learner is not looking at.
 */
export function describeDemonstration(demo: Demonstration, values: readonly number[]): string {
  const settings = demo.controls
    .map((c, i) => `${c.label}: ${formatControlValue(c, values[i] ?? c.initial)}`)
    .join(". ");
  return `${settings}. ${demo.readoutLabel}: ${formatReadout(demo, values)}.`;
}
