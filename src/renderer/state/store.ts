/** Central zustand store: settings, profiles, save, navigation, lesson session. */
import { create } from "zustand";
import { loadShippedContent } from "../../content";
import type { FeedbackPlan } from "../../core/misconceptions/engine";
import {
  advanceReview,
  endReviewSession,
  startReviewSession,
  submitReviewAnswer
} from "./review-session";
import type { ContentBundle } from "../../core/curriculum/loader";
import { registerBuiltInDetectors } from "../../core/misconceptions/detectors";
import { registerDefaultInteractions } from "../../core/questions/registry";
import { SettingsSchema, type SaveFile, type SavedExperiment, type Settings, type UserProfile } from "../../shared/schemas";
import { applyToRoot } from "../../core/accessibility/apply";
import { createPersistenceClient, type PersistenceClient } from "./persistence-client";
import {
  advance,
  resumeLesson,
  startInvestigationStep,
  startLesson,
  submitAnswer,
  useHint,
  type LessonSession
} from "./session";
import { beginInvestigation } from "../../core/investigations/engine";
import type { RawResponse } from "../../core/questions/types";

registerBuiltInDetectors();
registerDefaultInteractions();

export type Screen =
  | { name: "welcome" }
  | { name: "profiles" }
  | { name: "world-map" }
  | { name: "region"; regionId: string }
  | { name: "lesson"; lessonId: string }
  | { name: "investigation"; investigationId: string }
  | { name: "question" }
  | { name: "lab" }
  | { name: "progress" }
  | { name: "settings" }
  | { name: "about" }
  | { name: "review" };

interface StoreState {
  client: PersistenceClient;
  content: ContentBundle;
  settings: Settings;
  profiles: UserProfile[];
  save: SaveFile | null;
  screen: Screen;
  session: LessonSession | null;
  /** Feedback for the review item just answered, or null while it is unanswered. */
  reviewFeedback: FeedbackPlan | null;
  /** When the current review question was shown, for response timing. */
  reviewShownAtMs: number;
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

  /** Opens a lesson, resuming the position a save kept for it. */
  startLesson(lessonId: string): void;
  /** Opens a lesson from its first question, discarding any kept position. */
  restartLesson(lessonId: string): void;
  /** Opens a boss investigation, marking the case in progress without rewinding it. */
  openInvestigation(investigationId: string): void;
  /** Plays one step of a boss investigation through the ordinary session engine. */
  startInvestigationStep(investigationId: string, stepIndex: number): void;
  /** Review actions. `now` is passed in so tests and the UI share one clock source. */
  beginReview(): void;
  submitReview(raw: RawResponse): void;
  nextReview(): void;
  exitReview(): void;
  /**
   * Laboratory shelf. Persisted immediately, like a review answer: a learner who
   * keeps an experiment and closes the app has made a decision, and an autosave
   * that waited for some later event would lose it.
   */
  shelveExperiment(entry: SavedExperiment): void;
  unshelveExperiment(id: string): void;
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
  reviewFeedback: null,
  reviewShownAtMs: Date.now(),
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
    // Resumes rather than restarts (S2-19 cycle 2). `startLesson` is still the
    // fresh start, and `restartLesson` below is the button that wants one.
    const { content, save } = get();
    const session = save
      ? resumeLesson(content, save, lessonId, Date.now())
      : startLesson(content, lessonId, Date.now());
    if (session) set({ session, screen: { name: "question" } });
  },

  restartLesson(lessonId) {
    const { content, save, client } = get();
    const session = startLesson(content, lessonId, Date.now());
    if (!session) return;
    // Starting over discards the kept position, and says so on disk: leaving the
    // old record would send the next resume back into the run just abandoned.
    if (save) {
      const cleared = { ...save, lessonSession: null };
      persistSave(client, cleared);
      set({ save: cleared });
    }
    set({ session, screen: { name: "question" } });
  },

  openInvestigation(investigationId) {
    const { content, save, client } = get();
    const investigation = content.curriculum.investigations.find((i) => i.id === investigationId);
    if (!investigation || !save) return;
    // Marking the case open is persisted immediately: a learner who reads the
    // briefing and closes the app has started it, and should come back to a case
    // in progress rather than to one that never opened.
    const next = beginInvestigation(save, investigation, new Date());
    if (next !== save) persistSave(client, next);
    set({ save: next, screen: { name: "investigation", investigationId } });
  },

  startInvestigationStep(investigationId, stepIndex) {
    const session = startInvestigationStep(get().content, investigationId, stepIndex, Date.now());
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
    // Persisted on every advance since S2-19 cycle 2, not only at the end: the
    // position is what moves here, and a position saved only on completion is
    // not a position at all.
    persistSave(client, result.save);
    set({ save: result.save, session: result.session });
    if (result.session.finished) {
      set({
        screen: session.investigation
          ? { name: "investigation", investigationId: session.investigation.investigationId }
          : { name: "lesson", lessonId: session.lessonId }
      });
    }
  },

  exitLesson() {
    set({ session: null, screen: { name: "world-map" } });
  },

  beginReview() {
    const { content, save, client } = get();
    if (!save) return;
    const next = startReviewSession(content, save, new Date());
    persistSave(client, next);
    set({ save: next });
  },

  submitReview(raw) {
    const { content, save, client, reviewShownAtMs } = get();
    if (!save) return;
    const now = new Date();
    const result = submitReviewAnswer(content, save, raw, now, Math.max(0, now.getTime() - reviewShownAtMs));
    if (!result) return;
    // Review answers reschedule, so they are persisted immediately rather than
    // at the end of a run: an interruption must not lose the reschedule.
    persistSave(client, result.save);
    set({ save: result.save, reviewFeedback: result.feedback });
  },

  nextReview() {
    const { save, client } = get();
    if (!save) return;
    const next = advanceReview(save);
    persistSave(client, next);
    set({ save: next, reviewFeedback: null, reviewShownAtMs: Date.now() });
  },

  shelveExperiment(entry) {
    const { save, client } = get();
    if (!save) return;
    const next = { ...save, savedExperiments: [entry, ...save.savedExperiments] };
    persistSave(client, next);
    set({ save: next });
  },

  unshelveExperiment(id) {
    const { save, client } = get();
    if (!save) return;
    const next = { ...save, savedExperiments: save.savedExperiments.filter((e) => e.id !== id) };
    persistSave(client, next);
    set({ save: next });
  },

  exitReview() {
    const { save, client } = get();
    if (save) {
      const next = endReviewSession(save);
      persistSave(client, next);
      set({ save: next });
    }
    set({ reviewFeedback: null, screen: { name: "world-map" } });
  }
}));
