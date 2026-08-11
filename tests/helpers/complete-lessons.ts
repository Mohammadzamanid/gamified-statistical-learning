/**
 * The lessons that claim to be Complete under `STAGE2_RECONSTRUCTION_SCOPE.md` §5.
 *
 * One list, imported by both audits, so they cannot disagree about which lessons
 * are finished:
 *  - `tests/audit/lesson-structure.test.ts` holds every lesson here to all 18
 *    structure requirements;
 *  - `tests/audit/region1-architecture.test.ts` holds every Region 1 lesson NOT
 *    here to the skeleton shape S2-07 delivered.
 *
 * Adding an id here is therefore a claim that has to survive 18 checks, and
 * leaving one out is a claim that it is still a skeleton. There is no third
 * state a lesson can quietly sit in.
 */
export const COMPLETE_LESSONS: readonly string[] = [
  "l.r1-counting",
  "l.r1-addition",
  "l.r1-subtraction",
  "l.r1-multiplication",
  "l.r1-division",
  "l.r1-fractions",
  "l.r1-decimals",
  "l.r1-percentages",
  "l.r1-ratios",
  "l.r1-proportions",
  "l.r1-negatives",
  "l.r1-number-lines",
  "l.r1-coordinates",
  "l.r1-tables",
  "l.r1-variables",
  "l.r1-cases",
  "l.r1-variable-kinds",
  // Region 2, m.r2-counts — the first Region 2 module written to scope §5 (S2-12).
  "l.r2-frequency",
  "l.r2-proportion",
  "l.r2-percentage",
  // Region 2, m.r2-centre — written from their seeds (S2-12 cycle 2).
  "l.r2-mode",
  "l.r2-choosing-measures",
  // Region 2, m.r2-centre — the two Stage 1 lessons, re-cut (S2-12 cycle 3).
  //
  // These carried 17 and 14 inherited questions, and most of them taught
  // percentages, bar charts and data literacy rather than centre. Declaring
  // them Complete meant redistributing that content to the Region 2 lessons
  // whose topics it serves first; four questions had no such lesson yet and are
  // staged in the skeletons that will teach them — see
  // `tests/helpers/staged-inherited.ts`.
  "l.reading-tallies",
  "l.middle-harbor",
  // Region 2, m.r2-variation — the two lessons S2-12 owns in this module
  // (S2-12 cycle 4). Variance and standard deviation sit ahead of them in the
  // prerequisite chain and belong to S2-13, so this module is deliberately
  // half-written: spread before shape is the region's design, and the unit
  // boundary cuts across it.
  "l.r2-outliers",
  "l.r2-skew",
  // Region 2, m.r2-spread — written in module order (S2-13 cycle 1). l.spread-1
  // is the third Stage 1 lesson to be re-cut; it carried one inherited
  // question, which stayed where it was because range is what it teaches.
  "l.spread-1",
  "l.r2-quartiles",
  "l.r2-percentiles",
  "l.r2-iqr",
  // Region 2, m.r2-variation — the two lessons S2-13 owns in this module
  // (S2-13 cycle 3). With these, m.r2-variation is Complete entire and no stub
  // stands between a learner and the outlier and skew lessons.
  "l.r2-variance",
  "l.r2-standard-deviation",
  // Region 2, m.r2-pictures — the first two graph lessons (S2-14 cycle 1).
  // l.r2-bar-charts also absorbed the two questions staged in it since S2-12.
  "l.r2-bar-charts",
  "l.r2-histograms",
  "l.r2-dot-plots",
  "l.r2-box-plots",
  // With this, m.r2-pictures is Complete entire (S2-14 cycle 3), and the only
  // staged question left is q.error-id-causation in l.r2-misleading-graphs.
  "l.r2-scatterplots",
  // Region 2, m.r2-judgement (S2-14 cycle 4). l.r2-misleading-graphs absorbed
  // the last staged question, which empties STAGED_INHERITED entirely.
  "l.r2-choosing-graphs",
  "l.r2-misleading-graphs"
];
