/**
 * Renderer persistence client. In Electron it talks to the preload bridge.
 * In browser-only dev (vite without Electron) it falls back to an in-memory
 * SaveManager so the app remains explorable; the UI labels this mode.
 */
import { MemoryStorageAdapter } from "../../core/persistence/adapter";
import { SaveManager } from "../../core/persistence/save-manager";
import type { SaveFile, Settings, UserProfile } from "../../shared/schemas";
import type { Result } from "../../shared/utilities/result";

export interface PersistenceClient {
  readonly mode: "electron" | "memory";
  listProfiles(): Promise<UserProfile[]>;
  createProfile(name: string, isGuest: boolean): Promise<Result<UserProfile>>;
  deleteProfile(id: string): Promise<void>;
  loadGame(profileId: string): Promise<Result<{ save: SaveFile; recoveredFromBackup: boolean }>>;
  saveGame(save: SaveFile): Promise<Result<null>>;
  resetProgress(profileId: string): Promise<Result<SaveFile>>;
  exportSave(profileId: string): Promise<Result<string>>;
  importSave(serialized: string): Promise<Result<SaveFile>>;
  loadSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<Result<null>>;
}

interface Bridge {
  profiles: {
    list(): Promise<UserProfile[]>;
    create(name: string, isGuest: boolean): Promise<Result<UserProfile>>;
    delete(id: string): Promise<void>;
  };
  save: {
    load(profileId: string): Promise<Result<{ save: SaveFile; recoveredFromBackup: boolean }>>;
    save(save: SaveFile): Promise<Result<null>>;
    reset(profileId: string): Promise<Result<SaveFile>>;
    export(profileId: string): Promise<Result<string>>;
    import(serialized: string): Promise<Result<SaveFile>>;
  };
  settings: {
    load(): Promise<Settings>;
    save(settings: Settings): Promise<Result<null>>;
  };
}

declare global {
  interface Window {
    statlas?: Bridge;
  }
}

class BridgeClient implements PersistenceClient {
  readonly mode = "electron" as const;
  constructor(private readonly bridge: Bridge) {}
  listProfiles() { return this.bridge.profiles.list(); }
  createProfile(name: string, isGuest: boolean) { return this.bridge.profiles.create(name, isGuest); }
  deleteProfile(id: string) { return this.bridge.profiles.delete(id); }
  loadGame(profileId: string) { return this.bridge.save.load(profileId); }
  saveGame(save: SaveFile) { return this.bridge.save.save(save); }
  resetProgress(profileId: string) { return this.bridge.save.reset(profileId); }
  exportSave(profileId: string) { return this.bridge.save.export(profileId); }
  importSave(serialized: string) { return this.bridge.save.import(serialized); }
  loadSettings() { return this.bridge.settings.load(); }
  saveSettings(settings: Settings) { return this.bridge.settings.save(settings); }
}

class MemoryClient implements PersistenceClient {
  readonly mode = "memory" as const;
  private manager = new SaveManager(new MemoryStorageAdapter());
  listProfiles() { return this.manager.listProfiles(); }
  createProfile(name: string, isGuest: boolean) { return this.manager.createProfile(name, isGuest); }
  deleteProfile(id: string) { return this.manager.deleteProfile(id); }
  loadGame(profileId: string) { return this.manager.loadGame(profileId); }
  saveGame(save: SaveFile) { return this.manager.saveGame(save); }
  resetProgress(profileId: string) { return this.manager.resetProgress(profileId); }
  exportSave(profileId: string) { return this.manager.exportSave(profileId); }
  importSave(serialized: string) { return this.manager.importSave(serialized); }
  loadSettings() { return this.manager.loadSettings(); }
  saveSettings(settings: Settings) { return this.manager.saveSettings(settings); }
}

export function createPersistenceClient(): PersistenceClient {
  return window.statlas ? new BridgeClient(window.statlas) : new MemoryClient();
}
