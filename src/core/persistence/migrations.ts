/**
 * Save-file migrations. Each migration lifts version n to n+1.
 * Version 1 is current; the identity chain is in place so later stages add
 * migrations without touching the manager.
 */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

export const MIGRATIONS: Record<number, Migration> = {
  // 1 -> 2 will be added when the schema changes.
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
