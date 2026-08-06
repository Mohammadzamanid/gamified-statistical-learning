/**
 * The lesson demonstration core: the arithmetic the panel shows, and the text
 * equivalent a screen reader is given. Kept out of React so both are testable
 * and provably the same numbers.
 */
import { describe, expect, it } from "vitest";
import {
  clampToControl,
  demonstrationReadout,
  describeDemonstration,
  formatReadout,
  initialValues,
  setControlValue
} from "../../src/core/curriculum/demonstration";
import { DemonstrationSchema, type Demonstration } from "../../src/shared/schemas";
import type { z } from "zod";

type DemonstrationInput = z.input<typeof DemonstrationSchema>;

function demo(overrides: Partial<DemonstrationInput> = {}): Demonstration {
  return DemonstrationSchema.parse({
    id: "dem.test",
    title: "Test",
    experience: "A test situation.",
    accessibleDescription: "Two controls and a readout.",
    controls: [
      { id: "ctl.a", label: "First", min: 0, max: 10, step: 1, initial: 4 },
      { id: "ctl.b", label: "Second", min: 1, max: 10, step: 1, initial: 2 }
    ],
    formula: "sum",
    readoutLabel: "Total",
    prediction: {
      prompt: "What happens?",
      options: [
        { id: "opt.up", text: "Up" },
        { id: "opt.down", text: "Down" }
      ],
      correctOptionId: "opt.up",
      revealNote: "It goes up."
    },
    observation: "It moved.",
    ...overrides
  });
}

/** A 3-row, 2-column ledger used by the table-formula checks. */
function tableDemo(overrides: Partial<DemonstrationInput> = {}): Demonstration {
  return demo({
    formula: "table-cell",
    controls: [
      { id: "ctl.row", label: "Day", min: 1, max: 3, step: 1, initial: 1, valueLabels: ["Mon", "Tue", "Wed"] },
      { id: "ctl.col", label: "Column", min: 1, max: 2, step: 1, initial: 1, valueLabels: ["Crates", "Boats"] }
    ],
    table: {
      rowLabels: ["Mon", "Tue", "Wed"],
      columnLabels: ["Crates", "Boats"],
      cells: [
        [4, 2],
        [9, 7],
        [6, 3]
      ]
    },
    ...overrides
  });
}

describe("demonstration arithmetic", () => {
  it("computes each named formula", () => {
    expect(demonstrationReadout(demo({ formula: "sum" }), [4, 2])).toBe(6);
    expect(demonstrationReadout(demo({ formula: "difference" }), [4, 2])).toBe(2);
    expect(demonstrationReadout(demo({ formula: "product" }), [4, 2])).toBe(8);
    expect(demonstrationReadout(demo({ formula: "quotient" }), [4, 2])).toBe(2);
    expect(demonstrationReadout(demo({ formula: "tally" }), [4, 2])).toBe(22);
    expect(demonstrationReadout(demo({ formula: "percent-of" }), [25, 8])).toBe(2);
    expect(demonstrationReadout(demo({ formula: "share-of" }), [2, 8])).toBe(25);
  });

  it("gives each decimal column its own weight", () => {
    // place-value is what makes the decimals lesson honest: a step on the tenths
    // dial must outweigh nine steps on the hundredths one.
    const d = demo({ formula: "place-value", readoutPrecision: 2 });
    expect(demonstrationReadout(d, [5, 0])).toBeCloseTo(0.5, 10);
    expect(demonstrationReadout(d, [2, 5])).toBeCloseTo(0.25, 10);
    expect(demonstrationReadout(d, [0, 9])).toBeCloseTo(0.09, 10);
    expect(demonstrationReadout(d, [1, 0])).toBeGreaterThan(demonstrationReadout(d, [0, 9]));
  });

  it("computes a single-control formula", () => {
    const d = demo({
      formula: "negate",
      controls: [{ id: "ctl.a", label: "Depth", min: -10, max: 10, step: 1, initial: 3 }]
    });
    expect(demonstrationReadout(d, [3])).toBe(-3);
  });

  it("reads a cell where a row meets a column", () => {
    // The data-structure lessons index a table rather than computing over it.
    // Rows and columns are 1-based, matching the labels the learner reads.
    const d = tableDemo();
    expect(demonstrationReadout(d, [1, 1])).toBe(4);
    expect(demonstrationReadout(d, [2, 2])).toBe(7);
    expect(demonstrationReadout(d, [3, 1])).toBe(6);
  });

  it("totals a column", () => {
    const d = tableDemo({
      formula: "column-total",
      controls: [{ id: "ctl.col", label: "Column", min: 1, max: 2, step: 1, initial: 1, valueLabels: ["Crates", "Boats"] }]
    });
    expect(demonstrationReadout(d, [1])).toBe(4 + 9 + 6);
    expect(demonstrationReadout(d, [2])).toBe(2 + 7 + 3);
  });

  it("refuses a cell that is off the grid", () => {
    expect(() => demonstrationReadout(tableDemo(), [9, 1])).toThrow(/no cell at row 9/);
  });

  it("refuses the wrong number of values instead of computing with undefined", () => {
    expect(() => demonstrationReadout(demo(), [4])).toThrow(/needs 2 value/);
    expect(() => demonstrationReadout(demo(), [4, 2, 1])).toThrow(/needs 2 value/);
  });

  it("refuses non-finite values", () => {
    expect(() => demonstrationReadout(demo(), [Number.NaN, 2])).toThrow(/finite/);
  });
});

describe("control values", () => {
  it("starts at the declared initial values", () => {
    expect(initialValues(demo())).toEqual([4, 2]);
  });

  it("clamps to the control's range", () => {
    const control = demo().controls[0]!;
    expect(clampToControl(control, 99)).toBe(10);
    expect(clampToControl(control, -5)).toBe(0);
  });

  it("snaps to the control's step so keyboard and pointer agree", () => {
    const control = { id: "ctl.a", label: "A", min: 0, max: 1, step: 0.25, initial: 0.5, valueLabels: [] };
    expect(clampToControl(control, 0.3)).toBe(0.25);
    expect(clampToControl(control, 0.4)).toBe(0.5);
  });

  it("falls back to the initial value rather than storing NaN", () => {
    expect(clampToControl(demo().controls[0]!, Number.NaN)).toBe(4);
  });

  it("changes only the control that moved", () => {
    const d = demo();
    expect(setControlValue(d, [4, 2], 1, 7)).toEqual([4, 7]);
  });

  it("ignores a control index that does not exist", () => {
    const d = demo();
    expect(setControlValue(d, [4, 2], 5, 7)).toEqual([4, 2]);
  });
});

describe("what the learner is told", () => {
  it("formats the readout to the declared precision and unit", () => {
    const d = demo({ formula: "quotient", readoutPrecision: 2, readoutUnit: "crates" });
    expect(formatReadout(d, [5, 2])).toBe("2.50 crates");
  });

  it("describes every control and the readout in one sentence", () => {
    const spoken = describeDemonstration(demo(), [4, 2]);
    expect(spoken).toContain("First: 4");
    expect(spoken).toContain("Second: 2");
    expect(spoken).toContain("Total: 6");
  });

  it("names a labelled control's setting instead of its index", () => {
    // A learner picks "Tuesday", not "2" — and the spoken text must say the same
    // word the panel shows, or the two descriptions drift apart.
    const spoken = describeDemonstration(tableDemo(), [2, 1]);
    expect(spoken).toContain("Day: Tue");
    expect(spoken).not.toContain("Day: 2");
    expect(spoken).toContain("Column: Crates");
  });

  it("describes the state actually on screen, not the initial one", () => {
    expect(describeDemonstration(demo(), [9, 1])).toContain("Total: 10");
  });
});

describe("the schema refuses demonstrations that could not work", () => {
  it("rejects a formula given the wrong number of controls", () => {
    expect(() =>
      demo({ formula: "negate" })
    ).toThrow(/needs exactly 1 control/);
  });

  it("rejects a divisor range that reaches zero", () => {
    expect(() =>
      demo({
        formula: "quotient",
        controls: [
          { id: "ctl.a", label: "First", min: 0, max: 10, step: 1, initial: 4 },
          { id: "ctl.b", label: "Second", min: 0, max: 10, step: 1, initial: 2 }
        ]
      })
    ).toThrow(/greater than zero/);
  });

  it("rejects a prediction whose correct option is not on offer", () => {
    expect(() =>
      demo({
        prediction: {
          prompt: "What happens?",
          options: [
            { id: "opt.up", text: "Up" },
            { id: "opt.down", text: "Down" }
          ],
          correctOptionId: "opt.sideways",
          revealNote: "It goes up."
        }
      })
    ).toThrow(/not one of the options/);
  });

  it("rejects a table formula with no table", () => {
    expect(() => demo({ formula: "table-cell" })).toThrow(/requires a table/);
  });

  it("rejects a table on a formula that computes rather than indexes", () => {
    expect(() => tableDemo({ formula: "sum" })).toThrow(/does not read a table/);
  });

  it("rejects a selector whose range does not match the table", () => {
    expect(() =>
      tableDemo({
        controls: [
          { id: "ctl.row", label: "Day", min: 1, max: 9, step: 1, initial: 1 },
          { id: "ctl.col", label: "Column", min: 1, max: 2, step: 1, initial: 1 }
        ]
      })
    ).toThrow(/must run 1\.\.3/);
  });

  it("rejects a label list that does not match its control's range", () => {
    expect(() =>
      demo({
        controls: [
          { id: "ctl.a", label: "First", min: 0, max: 10, step: 1, initial: 4, valueLabels: ["one", "two"] },
          { id: "ctl.b", label: "Second", min: 1, max: 10, step: 1, initial: 2 }
        ]
      })
    ).toThrow(/labelled control must run 1\.\.2/);
  });

  it("rejects a table whose cells and labels disagree", () => {
    expect(() =>
      tableDemo({
        table: {
          rowLabels: ["Mon", "Tue", "Wed"],
          columnLabels: ["Crates", "Boats"],
          cells: [
            [4, 2],
            [9, 7]
          ]
        }
      })
    ).toThrow(/2 rows of cells but 3 row labels/);
  });

  it("rejects an initial value outside its own control's range", () => {
    expect(() =>
      demo({
        controls: [
          { id: "ctl.a", label: "First", min: 0, max: 10, step: 1, initial: 40 },
          { id: "ctl.b", label: "Second", min: 1, max: 10, step: 1, initial: 2 }
        ]
      })
    ).toThrow(/outside its range/);
  });
});
