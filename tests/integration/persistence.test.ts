import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NodeStorageAdapter } from "../../src/core/persistence/node-adapter";
import { SaveManager } from "../../src/core/persistence/save-manager";
import { MemoryStorageAdapter } from "../../src/core/persistence/adapter";
import { MIGRATIONS } from "../../src/core/persistence/migrations";
import { createEmptySave } from "../../src/shared/schemas";

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "statlas-test-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe("persistence on the node adapter", () => {
  it("creates profiles, saves, reloads, and lists", async () => {
    const mgr = new SaveManager(new NodeStorageAdapter(dir));
    const created = await mgr.createProfile("Mo", false);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const loaded = await mgr.loadGame(created.value.id);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.save.profile.name).toBe("Mo");

    const withXp = { ...loaded.value.save, xp: 42 };
    expect((await mgr.saveGame(withXp)).ok).toBe(true);
    const again = await mgr.loadGame(created.value.id);
    expect(again.ok && again.value.save.xp === 42).toBe(true);

    const profiles = await mgr.listProfiles();
    expect(profiles.length).toBe(1);
  });

  it("supports guest mode and profile deletion", async () => {
    const mgr = new SaveManager(new NodeStorageAdapter(dir));
    const guest = await mgr.createProfile("", true);
    expect(guest.ok && guest.value.isGuest).toBe(true);
    if (!guest.ok) return;
    await mgr.deleteProfile(guest.value.id);
    expect((await mgr.listProfiles()).length).toBe(0);
    expect((await mgr.loadGame(guest.value.id)).ok).toBe(false);
  });

  it("recovers a corrupted save from the newest backup", async () => {
    const mgr = new SaveManager(new NodeStorageAdapter(dir));
    const created = await mgr.createProfile("Mo", false);
    if (!created.ok) throw new Error("setup failed");
    const loaded = await mgr.loadGame(created.value.id);
    if (!loaded.ok) throw new Error("setup failed");

    // Save twice so a backup of a good save exists.
    await mgr.saveGame({ ...loaded.value.save, xp: 10 });
    await mgr.saveGame({ ...loaded.value.save, xp: 20 });

    // Corrupt the primary file on disk.
    const saveFile = join(dir, `profile-${created.value.id}.json`);
    writeFileSync(saveFile, "{ this is not json", "utf8");

    const recovered = await mgr.loadGame(created.value.id);
    expect(recovered.ok).toBe(true);
    if (!recovered.ok) return;
    expect(recovered.value.recoveredFromBackup).toBe(true);
    expect([0, 10]).toContain(recovered.value.save.xp); // newest valid backup wins
    // primary was rewritten with the recovered content
    expect(() => JSON.parse(readFileSync(saveFile, "utf8"))).not.toThrow();
  });

  it("migrates older save versions forward", async () => {
    const mgr = new SaveManager(new MemoryStorageAdapter());
    // temporarily register a 0 -> 1 migration
    MIGRATIONS[0] = (data) => ({ ...data, xp: 999 });
    try {
      const save = createEmptySave({ id: "p0", name: "Old", createdAt: new Date().toISOString(), isGuest: false, avatarSeed: 0 });
      const oldSave = { ...save, schemaVersion: 0 };
      const imported = await mgr.importSave(JSON.stringify(oldSave));
      expect(imported.ok).toBe(true);
      if (imported.ok) {
        expect(imported.value.schemaVersion).toBe(1);
        expect(imported.value.xp).toBe(999);
      }
    } finally {
      delete MIGRATIONS[0];
    }
  });

  it("rejects saves from a newer app version instead of corrupting them", async () => {
    const mgr = new SaveManager(new MemoryStorageAdapter());
    const save = createEmptySave({ id: "p9", name: "Future", createdAt: new Date().toISOString(), isGuest: false, avatarSeed: 0 });
    const result = await mgr.importSave(JSON.stringify({ ...save, schemaVersion: 99 }));
    expect(result.ok).toBe(false);
  });

  it("export/import round-trips a save", async () => {
    const mgr = new SaveManager(new NodeStorageAdapter(dir));
    const created = await mgr.createProfile("Mo", false);
    if (!created.ok) throw new Error("setup failed");
    const exported = await mgr.exportSave(created.value.id);
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;

    const mgr2 = new SaveManager(new MemoryStorageAdapter());
    const imported = await mgr2.importSave(exported.value);
    expect(imported.ok && imported.value.profile.name === "Mo").toBe(true);
  });

  it("resetProgress produces a fresh valid save", async () => {
    const mgr = new SaveManager(new NodeStorageAdapter(dir));
    const created = await mgr.createProfile("Mo", false);
    if (!created.ok) throw new Error("setup failed");
    const loaded = await mgr.loadGame(created.value.id);
    if (!loaded.ok) throw new Error("setup failed");
    await mgr.saveGame({ ...loaded.value.save, xp: 500 });
    const reset = await mgr.resetProgress(created.value.id);
    expect(reset.ok && reset.value.xp === 0).toBe(true);
  });

  it("settings persist and survive corrupt files", async () => {
    const adapter = new NodeStorageAdapter(dir);
    const mgr = new SaveManager(adapter);
    await mgr.saveSettings({ theme: "light", reducedMotion: true, textScale: "l", colorBlindSafe: false, soundEnabled: true, lastProfileId: null });
    expect((await mgr.loadSettings()).theme).toBe("light");
    await adapter.writeAtomic("statlas-settings.json", "not json at all");
    expect((await mgr.loadSettings()).theme).toBe("dark"); // safe defaults
  });

  it("adapter refuses paths that escape the storage root", async () => {
    const adapter = new NodeStorageAdapter(dir);
    await expect(adapter.read("../outside.txt")).rejects.toThrow();
  });
});
