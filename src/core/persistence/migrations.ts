/**
 * Save-file migrations. Each migration lifts version n to n+1.
 * Version 1 is current; the identity chain is in place so later stages add
 * migrations without touching the manager.
 */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

export const MIGRATIONS: Record<number, Migration> = {
  /**
   * 1 -> 2 (S2-06): adds `reviewSession`, the persisted in-flight review queue.
   *
   * A version-1 save has no review session in progress, so the correct lift is an
   * explicit null rather than relying on the schema default — a migration that
   * leans on defaults silently stops working the moment the default changes.
   */
  1: (data) => ({ ...data, reviewSession: null }),

  /**
   * 2 -> 3 (S2-10): adds `investigationProgress`, the per-boss resume record.
   *
   * A version-2 save predates boss investigations entirely, so the correct lift
   * is an empty record — not "available", which would claim the learner had
   * unlocked something the save has no evidence for. Written explicitly rather
   * than left to the schema default, for the reason the 1 -> 2 note gives.
   */
  2: (data) => ({ ...data, investigationProgress: {} }),

  /**
   * 3 -> 4 (S2-15): adds `savedExperiments`, the laboratory shelf.
   *
   * A version-3 save predates the shelf, so the correct lift is an empty array.
   * Written explicitly rather than left to the schema default, for the reason
   * the 1 -> 2 note gives.
   */
  3: (data) => ({ ...data, savedExperiments: [] }),

  /**
   * 4 -> 5 (S2-19): adds `lessonSession`, the persisted in-flight lesson.
   *
   * A version-4 save has no lesson position recorded — the field did not exist,
   * and the app it was written by restarted every interrupted lesson at its
   * first question. So the correct lift is an explicit null: no lesson in
   * flight, which is exactly what such a save can evidence. Written out rather
   * than left to the schema default, for the reason the 1 -> 2 note gives.
   */
  4: (data) => ({ ...data, lessonSession: null })
};

export function migrateToVersion(
  data: Record<string, unknown>,
  fromVersion: number,
  toVersion: number
): Record<string, unknown> {
  let current = data;
  for (let v = fromVersion; v < toVersion; v++) {
    const step = MIGRATIONS[v];
    if (!step) {
      throw new Error(`No migration registered from save version ${v} to ${v + 1}`);
    }
    current = step(current);
    current["schemaVersion"] = v + 1;
  }
  return current;
}
