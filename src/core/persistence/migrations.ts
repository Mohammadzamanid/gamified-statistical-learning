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
  1: (data) => ({ ...data, reviewSession: null })
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
