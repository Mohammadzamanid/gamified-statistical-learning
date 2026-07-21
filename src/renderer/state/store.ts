/** Central zustand store: settings, profiles, save, navigation, lesson session. */
import { create } from "zustand";
import { loadShippedContent } from "../../content";
import type { ContentBundle } from "../../core/curriculum/loader";
import { registerBuiltInDetectors } from "../../core/misconceptions/detectors";
import { registerDefaultInteractions } from "../../core/questions/registry";
import { SettingsSchema, type SaveFile, type Settings, type UserProfile } from "../../shared/schemas";
import { applyToRoot } from "../../core/accessibility/apply";
import { createPersistenceClient, type PersistenceClient } from "./persistence-client";
import {
  advance,
  startLesson,
  submitAnswer,
  useHint,
  type LessonSession
} from "./session";
import type { RawResponse } from "../../core/questions/types";

registerBuiltInDetectors();
registerDefaultInteractions();

export type Screen =
  | { name: "welcome" }
  | { name: "profiles" }
  | { name: "world-map" }
  | { name: "region"; regionId: string }
  | { name: "lesson"; lessonId: string }
  | { name: "question" }
  | { name: "lab" }
  | { name: "progress" }
  | { name: "settings" }
  | { name: "about" };

interface StoreState {
  client: PersistenceClient;
  content: ContentBundle;
  settings: Settings;
  profiles: UserProfile[];
  save: SaveFile | null;
  screen: Screen;
  session: LessonSession | null;
  recoveredFromBackup: boolean;
  bootError: string | null;
  booted: boolean;

  boot(): Promise<void>;
  navigate(screen: Screen): void;
  refreshProfiles(): Promise<void>;
  createProfile(name: string, isGuest: boolean): Promise<void>;
  deleteProfile(id: string): Promise<void>;
  selectProfile(id: string): Promise<void>;
  updateSettings(patch: Partial<Settings>): Promise<void>;
  resetProgress(): Promise<void>;

  startLesson(lessonId: string): void;
  submit(raw: RawResponse): void;
  requestHint(): void;
  next(): void;
  exitLesson(): void;
}

function persistSave(client: PersistenceClient, save: SaveFile): void {
  void client.saveGame(save); // autosave; failures are logged, not fatal
}

export const useStore = create<StoreState>((set, get) => ({
  client: createPersistenceClient(),
  content: loadShippedContent(),
  settings: SettingsSchema.parse({}),
  profiles: [],
  save: null,
  screen: { name: "welcome" },
  session: null,
  recoveredFromBackup: false,
  bootError: null,
  booted: false,

  async boot() {
    const { client } = get();
    try {
      const settings = await client.loadSettings();
      applyToRoot(settings, document.documentElement);
      const profiles = await client.listProfiles();
      set({ settings, profiles, booted: true });
      if (settings.lastProfileId && profiles.some((p) => p.id === settings.lastProfileId)) {
        await get().selectProfile(settings.lastProfileId);
      } else if (profiles.length > 0) {
        set({ screen: { name: "profiles" } });
      }
    } catch (e) {
      set({ bootError: (e as Error).message, booted: true });
    }
  },

  navigate(screen) {
    set({ screen });
  },

  async refreshProfiles() {
    set({ profiles: await get().client.listProfiles() });
  },

  async createProfile(name, isGuest) {
    const { client } = get();
    const result = await client.createProfile(name, isGuest);
    if (result.ok) {
      await get().refreshProfiles();
      await get().selectProfile(result.value.id);
    }
  },

  async deleteProfile(id) {
    await get().client.deleteProfile(id);
    await get().refreshProfiles();
  },

  async selectProfile(id) {
    const { client, settings } = get();
    const loaded = await client.loadGame(id);
    if (!loaded.ok) {
      set({ bootError: loaded.error });
      return;
    }
    const nextSettings = { ...settings, lastProfileId: id };
    void client.saveSettings(nextSettings);
    set({
      save: loaded.value.save,
      recoveredFromBackup: loaded.value.recoveredFromBackup,
      settings: nextSettings,
      screen: { name: "world-map" }
    });
  },

  async updateSettings(patch) {
    const settings = { ...get().settings, ...patch };
    applyToRoot(settings, document.documentElement);
    set({ settings });
    await get().client.saveSettings(settings);
  },

  async resetProgress() {
    const { save, client } = get();
    if (!save) return;
    const result = await client.resetProgress(save.profile.id);
    if (result.ok) set({ save: result.value, session: null, screen: { name: "world-map" } });
  },

  startLesson(lessonId) {
    const session = startLesson(get().content, lessonId, Date.now());
    if (session) set({ session, screen: { name: "question" } });
  },

  submit(raw) {
    const { content, save, session, client } = get();
    if (!save || !session) return;
    const result = submitAnswer(content, save, session, raw, Date.now());
    if (!result) return;
    persistSave(client, result.save);
    set({ save: result.save, session: result.session });
  },

  requestHint() {
    const { session } = get();
    if (session) set({ session: useHint(session) });
  },

  next() {
    const { content, save, session, client } = get();
    if (!save || !session) return;
    const result = advance(content, save, session, Date.now());
    if (result.session.finished) persistSave(client, result.save);
    set({ save: result.save, session: result.session });
    if (result.session.finished) set({ screen: { name: "lesson", lessonId: session.lessonId } });
  },

  exitLesson() {
    set({ session: null, screen: { name: "world-map" } });
  }
}));
