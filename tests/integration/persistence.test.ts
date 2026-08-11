import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NodeStorageAdapter } from "../../src/core/persistence/node-adapter";
import { SaveManager } from "../../src/core/persistence/save-manager";
import { MemoryStorageAdapter } from "../../src/core/persistence/adapter";
import { MIGRATIONS } from "../../src/core/persistence/migrations";
import { createExperiment, loadExperiment, saveExperiment } from "../../src/core/laboratory";
import { createEmptySave } from "../../src/shared/schemas";
import { SAVE_SCHEMA_VERSION } from "../../src/shared/constants/app";

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
        // Assert against the current version rather than a literal, so a future
        // schema bump does not silently stop exercising the whole chain.
        expect(imported.value.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
        expect(imported.value.xp).toBe(999); // the temporary 0 -> 1 step ran
        expect(imported.value.reviewSession).toBeNull(); // the real 1 -> 2 step ran
        expect(imported.value.investigationProgress).toEqual({}); // the real 2 -> 3 step ran
        expect(imported.value.savedExperiments).toEqual([]); // the real 3 -> 4 step ran
      }
    } finally {
      delete MIGRATIONS[0];
    }
  });

  it("gives a save written before the laboratory shelf an empty shelf, not a missing one", async () => {
    // S2-15's 3 -> 4 step, exercised on a save that genuinely lacks the field
    // rather than on one built by the current schema and relabelled. A learner
    // upgrading has no experiments, and "none" has to arrive as [] — code that
    // reads `save.savedExperiments.length` must not meet undefined.
    const mgr = new SaveManager(new MemoryStorageAdapter());
    const save = createEmptySave({ id: "p3", name: "Before", createdAt: new Date().toISOString(), isGuest: false, avatarSeed: 0 });
    const { savedExperiments, ...withoutShelf } = save;
    expect(savedExperiments).toEqual([]);
    const imported = await mgr.importSave(JSON.stringify({ ...withoutShelf, schemaVersion: 3 }));
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.value.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(imported.value.savedExperiments).toEqual([]);
  });

  it("round-trips a shelved experiment through a real save file", async () => {
    const mgr = new SaveManager(new NodeStorageAdapter(dir));
    const created = await mgr.createProfile("Shelf", false);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const loaded = await mgr.loadGame(created.value.id);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const result = saveExperiment(
      loaded.value.save.savedExperiments,
      { experiment: createExperiment("Channel B", [7, 8, 10, 10, 13, 15]), chartKind: "box-plot" },
      new Date().toISOString()
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await mgr.saveGame({ ...loaded.value.save, savedExperiments: [...result.experiments] });

    const reopened = await mgr.loadGame(created.value.id);
    expect(reopened.ok).toBe(true);
    if (!reopened.ok) return;
    expect(reopened.value.save.savedExperiments).toHaveLength(1);
    const back = loadExperiment(reopened.value.save.savedExperiments[0]!);
    expect(back.values).toEqual([7, 8, 10, 10, 13, 15]);
    expect(back.title).toBe("Channel B");
    expect(reopened.value.save.savedExperiments[0]!.chartKind).toBe("box-plot");
  });

  it("registers exactly one migration per version step up to the current one", () => {
    // The contract in STAGE_HANDOFF §6 is that a save-shape change comes with a
    // migration. Nothing enforced the pairing, and a probe showed why that
    // matters in both directions: setting SAVE_SCHEMA_VERSION back to 3 with the
    // laboratory shelf still in the schema broke **no** test, because Zod's
    // default filled the field in. A defaultable field hides the omission today
    // and a non-defaultable one would corrupt a save tomorrow.
    //
    // So the chain is checked rather than the field: every step from 1 to the
    // current version has a migration, and no migration exists beyond it.
    const steps = Object.keys(MIGRATIONS).map(Number).sort((a, b) => a - b);
    expect(steps, "a version step has no migration").toEqual(
      Array.from({ length: SAVE_SCHEMA_VERSION - 1 }, (_, i) => i + 1)
    );
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
