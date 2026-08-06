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
  "l.r1-variable-kinds"
];
