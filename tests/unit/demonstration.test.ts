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

function demo(overrides: Partial<Demonstration> = {}): Demonstration {
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
    const control = { id: "ctl.a", label: "A", min: 0, max: 1, step: 0.25, initial: 0.5 };
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
