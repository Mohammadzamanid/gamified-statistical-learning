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
export const REGIONS_WITH_A_BOSS: readonly string[] = ["r.harbor-tallies", "r.averages-atoll"];

/**
 * Regions that still owe a boss.
 *
 * Empty since S2-18, which built `inv.r2-atoll-approach` and moved
 * `r.averages-atoll` across. The list stays because the debt device is what the
 * audit checks against — a region added to the curriculum without a case has to
 * land here rather than nowhere, and "every region appears in exactly one of the
 * two lists" is what makes forgetting it impossible.
 */
export const REGIONS_OWING_A_BOSS: readonly string[] = [];
