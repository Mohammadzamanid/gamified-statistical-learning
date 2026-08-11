/**
 * S2-15: scope §7's centralisation rule, enforced rather than described.
 *
 * "All statistical computation is centralised in `src/core/statistics`;
 * important quantities are never recomputed inside React components." That has
 * been true by discipline since Stage 1 and checked by nothing. A probe proved
 * it: replacing the laboratory's mean with an inline fold over the readings
 * failed **no** test, and would have shipped a screen whose headline number came
 * from somewhere other than the engine the lessons grade with. Two conventions
 * live in this codebase on purpose (D-045); a second implementation is how they
 * quietly become three.
 *
 * The rule is enforced in the shape the defect actually takes:
 *
 *  - a **fold over an array** is what every hand-rolled sum, mean or variance
 *    is written as, so `.reduce(` has no business in a view;
 *  - `Math.sqrt` and `Math.pow` are the signatures of a standard deviation or a
 *    sum of squares;
 *  - **defining** a symbol named after a taught measure is claiming to be the
 *    implementation. Importing one is the intended path and is untouched.
 *
 * All three read zero across `src/renderer` today, so this pins current fact
 * rather than aspiring to it. If a view ever has an honest need for one of
 * these — a layout total, an animation curve — widen this deliberately and say
 * why in the same commit, as the audits before it have been widened. Do not
 * delete it to make a failure go away.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const RENDERER = join(__dirname, "..", "..", "src", "renderer");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

const files = sourceFiles(RENDERER).map((path) => ({
  path: path.slice(path.indexOf("src/renderer")),
  // Block comments carry prose about the very things being banned, so they are
  // stripped before the search. Otherwise this file's own subject matter would
  // fail it.
  text: readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")
}));

/** The measures `src/core/statistics` owns and the renderer may only import. */
const TAUGHT_MEASURES = [
  "sum", "mean", "weightedMean", "median", "mode", "range", "percentile",
  "quartiles", "quartilesByHalves", "interquartileRange", "interquartileRangeByHalves",
  "fiveNumberSummary", "variance", "standardDeviation", "zScore", "frequencyTable",
  "proportion", "percentage"
];

describe("statistics stay in one place", () => {
  it("finds renderer sources to check", () => {
    // Guards the walk itself: a path typo would make every check below pass
    // over an empty list.
    expect(files.length, "no renderer sources found — the walk is broken").toBeGreaterThan(20);
  });

  it("folds no array inside a view", () => {
    for (const file of files) {
      expect(
        file.text.includes(".reduce("),
        `${file.path} folds over an array — every hand-rolled sum, mean and variance is written this way. Ask src/core/statistics instead.`
      ).toBe(false);
    }
  });

  it("takes no roots or powers inside a view", () => {
    for (const file of files) {
      for (const call of ["Math.sqrt(", "Math.pow("]) {
        expect(
          file.text.includes(call),
          `${file.path} calls ${call} — the signature of a standard deviation or a sum of squares computed outside the core`
        ).toBe(false);
      }
    }
  });

  it("defines no function named after a measure the core owns", () => {
    for (const file of files) {
      for (const measure of TAUGHT_MEASURES) {
        const defined = new RegExp(`(function|const|let)\\s+${measure}\\b\\s*[=(<]`);
        expect(
          defined.test(file.text),
          `${file.path} defines its own ${measure}. Import it from src/core/statistics — a second implementation is how one convention becomes two (D-045).`
        ).toBe(false);
      }
    }
  });
});
