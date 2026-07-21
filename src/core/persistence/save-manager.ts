/**
 * SaveManager: multiple local profiles, autosave, versioned saves, migration,
 * rotating backups, corruption recovery, import/export, settings, reset,
 * guest mode. Storage-agnostic; atomicity is the adapter's contract.
 */
import {
  SaveFileSchema,
  SettingsSchema,
  UserProfileSchema,
  createEmptySave,
  type SaveFile,
  type Settings,
  type UserProfile
} from "../../shared/schemas";
import {
  BACKUP_DIR_NAME,
  MAX_BACKUPS,
  PROFILES_INDEX_FILE,
  SAVE_FILE_PREFIX,
  SAVE_SCHEMA_VERSION,
  SETTINGS_FILE_NAME
} from "../../shared/constants/app";
import { createId } from "../../shared/utilities/id";
import { err, ok, type Result } from "../../shared/utilities/result";
import type { StorageAdapter } from "./adapter";
import { migrateToVersion } from "./migrations";

const saveFileName = (profileId: string) => `${SAVE_FILE_PREFIX}${profileId}.json`;
const backupFileName = (profileId: string, stamp: string) =>
  `${BACKUP_DIR_NAME}/${SAVE_FILE_PREFIX}${profileId}-${stamp}.json`;

export class SaveManager {
  constructor(private readonly storage: StorageAdapter, private readonly now: () => Date = () => new Date()) {}

  // ---- profiles ----

  async listProfiles(): Promise<UserProfile[]> {
    const raw = await this.storage.read(PROFILES_INDEX_FILE);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.flatMap((p) => {
        const r = UserProfileSchema.safeParse(p);
        return r.success ? [r.data] : [];
      });
    } catch {
      return [];
    }
  }

  async createProfile(name: string, isGuest = false): Promise<Result<UserProfile>> {
    const profile: UserProfile = {
      id: createId("profile"),
      name: name.trim() || (isGuest ? "Guest explorer" : "Explorer"),
      createdAt: this.now().toISOString(),
      isGuest,
      avatarSeed: Math.floor(Math.random() * 1_000_000)
    };
    const check = UserProfileSchema.safeParse(profile);
    if (!check.success) return err(check.error.message);

    const profiles = await this.listProfiles();
    profiles.push(check.data);
    await this.storage.writeAtomic(PROFILES_INDEX_FILE, JSON.stringify(profiles, null, 2));
    await this.saveGame(createEmptySave(check.data));
    return ok(check.data);
  }

  async deleteProfile(profileId: string): Promise<void> {
    const profiles = (await this.listProfiles()).filter((p) => p.id !== profileId);
    await this.storage.writeAtomic(PROFILES_INDEX_FILE, JSON.stringify(profiles, null, 2));
    await this.storage.delete(saveFileName(profileId));
  }

  // ---- saves ----

  async saveGame(save: SaveFile): Promise<Result<null>> {
    const stamped: SaveFile = { ...save, updatedAt: this.now().toISOString() };
    const check = SaveFileSchema.safeParse(stamped);
    if (!check.success) return err(`refusing to persist invalid save: ${check.error.message}`);

    const fileName = saveFileName(save.profile.id);
    const serialized = JSON.stringify(check.data, null, 2);

    // Backup the previous good save before overwriting, then rotate.
    const previous = await this.storage.read(fileName);
    if (previous !== null) {
      const stamp = this.now().toISOString().replace(/[:.]/g, "-");
      await this.storage.writeAtomic(backupFileName(save.profile.id, stamp), previous);
      await this.rotateBackups(save.profile.id);
    }

    await this.storage.writeAtomic(fileName, serialized);
    return ok(null);
  }

  private async rotateBackups(profileId: string): Promise<void> {
    const backups = await this.storage.list(`${BACKUP_DIR_NAME}/${SAVE_FILE_PREFIX}${profileId}-`);
    const excess = backups.sort().slice(0, Math.max(0, backups.length - MAX_BACKUPS));
    for (const f of excess) await this.storage.delete(f);
  }

  /**
   * Load with recovery: invalid or corrupt primary save falls back to the most
   * recent valid backup. Older-version saves are migrated forward.
   */
  async loadGame(profileId: string): Promise<Result<{ save: SaveFile; recoveredFromBackup: boolean }>> {
    const primary = await this.tryParseSave(await this.storage.read(saveFileName(profileId)));
    if (primary.ok) return ok({ save: primary.value, recoveredFromBackup: false });

    const backups = (await this.storage.list(`${BACKUP_DIR_NAME}/${SAVE_FILE_PREFIX}${profileId}-`)).sort().reverse();
    for (const backup of backups) {
      const restored = await this.tryParseSave(await this.storage.read(backup));
      if (restored.ok) {
        await this.storage.writeAtomic(saveFileName(profileId), JSON.stringify(restored.value, null, 2));
        return ok({ save: restored.value, recoveredFromBackup: true });
      }
    }
    return err(`no valid save or backup found for profile ${profileId}: ${primary.error}`);
  }

  private async tryParseSave(raw: string | null): Promise<Result<SaveFile>> {
    if (raw === null) return err("save file missing");
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return err(`corrupt JSON: ${(e as Error).message}`);
    }
    if (typeof data !== "object" || data === null) return err("save is not an object");

    const record = data as Record<string, unknown>;
    const version = typeof record["schemaVersion"] === "number" ? record["schemaVersion"] : null;
    if (version === null) return err("save missing schemaVersion");
    if (version > SAVE_SCHEMA_VERSION) return err(`save version ${version} is newer than this app supports`);

    let candidate = record;
    if (version < SAVE_SCHEMA_VERSION) {
      try {
        candidate = migrateToVersion(record, version, SAVE_SCHEMA_VERSION);
      } catch (e) {
        return err((e as Error).message);
      }
    }
    const parsed = SaveFileSchema.safeParse(candidate);
    return parsed.success ? ok(parsed.data) : err(parsed.error.message);
  }

  async resetProgress(profileId: string): Promise<Result<SaveFile>> {
    const profiles = await this.listProfiles();
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return err(`unknown profile ${profileId}`);
    const empty = createEmptySave(profile);
    const saved = await this.saveGame(empty);
    return saved.ok ? ok(empty) : err(saved.error);
  }

  // ---- import / export ----

  async exportSave(profileId: string): Promise<Result<string>> {
    const loaded = await this.loadGame(profileId);
    return loaded.ok ? ok(JSON.stringify(loaded.value.save, null, 2)) : err(loaded.error);
  }

  async importSave(serialized: string): Promise<Result<SaveFile>> {
    const parsed = await this.tryParseSave(serialized);
    if (!parsed.ok) return err(parsed.error);
    const profiles = await this.listProfiles();
    if (!profiles.some((p) => p.id === parsed.value.profile.id)) {
      profiles.push(parsed.value.profile);
      await this.storage.writeAtomic(PROFILES_INDEX_FILE, JSON.stringify(profiles, null, 2));
    }
    const saved = await this.saveGame(parsed.value);
    return saved.ok ? ok(parsed.value) : err(saved.error);
  }

  // ---- settings ----

  async loadSettings(): Promise<Settings> {
    const raw = await this.storage.read(SETTINGS_FILE_NAME);
    if (!raw) return SettingsSchema.parse({});
    try {
      const parsed = SettingsSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : SettingsSchema.parse({});
    } catch {
      return SettingsSchema.parse({});
    }
  }

  async saveSettings(settings: Settings): Promise<Result<null>> {
    const check = SettingsSchema.safeParse(settings);
    if (!check.success) return err(check.error.message);
    await this.storage.writeAtomic(SETTINGS_FILE_NAME, JSON.stringify(check.data, null, 2));
    return ok(null);
  }
}
