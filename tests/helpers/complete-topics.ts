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
  "skill.r1-counting",
  "skill.r1-addition",
  "skill.r1-subtraction",
  "skill.r1-multiplication",
  "skill.r1-division"
];
