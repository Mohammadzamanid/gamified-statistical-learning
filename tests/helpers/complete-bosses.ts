/**
 * Which regions have a boss investigation, and which still owe one.
 *
 * `STAGE2_RECONSTRUCTION_SCOPE.md` §10 makes a region that ends without a boss a
 * closure failure, so the debt has to be visible rather than implicit. The same
 * device as `complete-lessons.ts` and `complete-topics.ts`: the claim lives in a
 * list, and `tests/audit/investigation-structure.test.ts` holds the list to the
 * curriculum in both directions — every region appears in exactly one of them,
 * every region here has the boss it claims, and every region there has none.
 *
 * A region moves from the second list to the first when its case is built, and
 * the audit fails if a boss appears for a region still listed as owing one. That
 * is deliberate: it means the debt cannot be quietly paid off without the list
 * being updated to say so.
 */

/** Regions whose boss investigation exists and gates their achievement. */
export const REGIONS_WITH_A_BOSS: readonly string[] = ["r.harbor-tallies"];

/**
 * Regions that still owe a boss.
 *
 * `r.averages-atoll` is the Region 2 inheritance. Its case — dataset inspection,
 * summary and graph selection, misleading-presentation detection, outlier
 * reasoning — is **S2-18**, and it cannot be built before the Region 2 lessons
 * it would draw on exist (S2-11 through S2-17).
 */
export const REGIONS_OWING_A_BOSS: readonly string[] = ["r.averages-atoll"];
