/**
 * The topics that claim to meet `STAGE2_RECONSTRUCTION_SCOPE.md` §4.
 *
 * The same device as `complete-lessons.ts`, for a different requirement. §5 is
 * about a lesson's *structure*; §4 is about a topic's *interaction coverage* —
 * at least 100 validated available interactions, spanning several reasoning
 * families, with no single reasoning shape dominating. A lesson can be Complete
 * under §5 while its topic is nowhere near Complete under §4, and conflating the
 * two is the failure mode this list exists to prevent.
 *
 * `tests/audit/content-coverage.test.ts` holds every id here to the full §4 bar,
 * and separately requires that every topic *not* here is reported as failing —
 * so a topic can never quietly disappear from the report instead of failing in
 * it, which the scope calls out by name.
 */
export const COMPLETE_TOPICS: readonly string[] = [
  // Module 1 — the four operations and the counting that precedes them.
  "skill.r1-counting",
  "skill.r1-addition",
  "skill.r1-subtraction",
  "skill.r1-multiplication",
  "skill.r1-division",
  // Module 2 — parts of a whole. Added when the measured report said they met
  // the bar, not before; the guard above had already failed on them being
  // undeclared, which is the direction of that check nobody writes tests for.
  "skill.r1-fractions",
  "skill.r1-decimals",
  "skill.r1-percentages",
  "skill.r1-proportions",
  // Ratios, and the position group. Added on the measured report, and again
  // only after the guard above had failed on them being undeclared.
  "skill.r1-ratios",
  "skill.r1-negatives",
  "skill.r1-number-lines",
  "skill.r1-coordinates",
  // The data group. With these, every Region 1 topic meets §4; the six topics
  // still failing are the Region 2 inheritance, which belongs to S2-17.
  "skill.r1-tables",
  "skill.r1-cases",
  "skill.r1-variables",
  "skill.r1-variable-kinds",
  // Region 2's counts module — the first Region 2 topics to get generators
  // (S2-17 cycle 1). One corpus of season logs feeds all three, because a
  // frequency, a proportion and a percentage are three readings of the same
  // tally.
  "skill.r2-frequency",
  "skill.r2-proportion",
  "skill.r2-percentage",
  // Region 2's centre module (S2-17 cycle 2). One corpus of catch lists again:
  // a list has a mean, a median and a mode, and choosing between them is the
  // fourth topic rather than a fourth corpus.
  "skill.mean",
  "skill.median",
  "skill.r2-mode",
  "skill.choose-measure"
];
