/**
 * Stage 1 questions parked in the Region 2 skeleton that will teach them.
 *
 * Re-cutting `l.reading-tallies` and `l.middle-harbor` to scope §5 meant
 * accounting for every question they asked, and several of them taught bar
 * charts, scatterplots and misleading presentation rather than the mean or the
 * median. Most of the inherited questions had a Region 2 lesson to move to.
 * These four did not: their topics live in `m.r2-pictures` and
 * `m.r2-judgement`, whose lessons are still seeds.
 *
 * The alternatives were both worse. Leaving them in the centre lessons would
 * have meant declaring a scatterplot question part of a lesson about the mean.
 * Dropping them would have deleted playable Stage 1 content to make a cycle
 * close. So they are staged — filed under the lesson whose topic they serve,
 * reachable and playable today, and **declared here** so that
 * `tests/audit/region2-architecture.test.ts` can hold them to a rule instead of
 * letting a skeleton quietly accumulate content no audit inspects.
 *
 * What staging does **not** buy: a staged question is still held to the
 * presentation half of §5 — an accessible description and an explanation a
 * learner can read — because a learner meets it today. Only the lesson-level
 * structure (a role, a demonstration, a narrative) is deferred.
 *
 * S2-14 empties this map. The audit fails if a lesson named here is declared
 * Complete without its entry being cleared, and fails if a staged question is
 * added, removed or re-homed without this list changing to say so.
 */
export const STAGED_INHERITED: Readonly<Record<string, readonly string[]>> = {
  // `l.r2-bar-charts` (cycle 1) and `l.r2-scatterplots` (cycle 3) have both been
  // cleared: their staged questions were given roles when the lessons were
  // written, which is the whole shape of paying this debt off — the entry goes
  // at the same moment the questions stop being parked, and the audit fails on
  // either half done alone. Original note:
  // `l.r2-bar-charts` was cleared by S2-14 cycle 1: both of its staged questions
  // were given roles when the lesson was written, which is the whole shape of
  // paying this debt off — the entry goes at the same moment the questions stop
  // being parked, and the audit fails on either half done alone.
  "l.r2-misleading-graphs": ["q.error-id-causation"]
};

/** The unit that owes the work of emptying the map above. */
export const STAGING_OWNER = "S2-14";

/** Every staged question, across all staging lessons. */
export const STAGED_QUESTION_IDS: readonly string[] = Object.values(STAGED_INHERITED).flat();
