import { z } from "zod";
import { IdSchema, IsoDateTime, NonEmptyString } from "./common";
import { MASTERY_LEVELS, SAVE_SCHEMA_VERSION } from "../constants/app";

export const SkillStateSchema = z.object({
  skillId: IdSchema,
  attempts: z.number().int().min(0).default(0),
  correct: z.number().int().min(0).default(0),
  consecutiveCorrect: z.number().int().min(0).default(0),
  totalResponseMs: z.number().min(0).default(0),
  hintsUsed: z.number().int().min(0).default(0),
  /** Learner self-reported confidence, exponential moving average in [0,1]. */
  confidence: z.number().min(0).max(1).default(0.5),
  recentMistakeQuestionIds: z.array(IdSchema).default([]),
  misconceptionCounts: z.record(z.number().int().min(0)).default({}),
  /** Retention estimate in [0,1], decayed over time. */
  retention: z.number().min(0).max(1).default(0),
  lastPracticedAt: IsoDateTime.nullable().default(null),
  difficultyLevel: z.number().int().min(1).max(5).default(1),
  transferCorrect: z.number().int().min(0).default(0),
  transferAttempts: z.number().int().min(0).default(0),
  masteryLevel: z.enum(MASTERY_LEVELS).default("unseen"),
  masteryConfidence: z.number().min(0).max(1).default(0)
});
export type SkillState = z.infer<typeof SkillStateSchema>;

export const ReviewItemSchema = z.object({
  skillId: IdSchema,
  dueAt: IsoDateTime,
  intervalDays: z.number().min(0),
  ease: z.number().min(1.3).max(3.0),
  lapses: z.number().int().min(0).default(0)
});
export type ReviewItem = z.infer<typeof ReviewItemSchema>;

/**
 * An in-flight review session, persisted so an interrupted session resumes
 * exactly where it stopped rather than rebuilding a different queue.
 *
 * The queue is frozen at `startedAt`: rebuilding it on resume would drop items
 * the learner had already been shown, or add ones that fell due meanwhile,
 * making "resume" mean something different each time.
 */
export const ReviewSessionStateSchema = z.object({
  startedAt: IsoDateTime,
  /** Skill ids in the order they will be asked, fixed when the session started. */
  skillQueue: z.array(IdSchema),
  /** Question chosen per skill, so resume shows the same question. */
  questionQueue: z.array(IdSchema),
  currentIndex: z.number().int().min(0),
  answeredCount: z.number().int().min(0).default(0),
  correctCount: z.number().int().min(0).default(0)
});
export type ReviewSessionState = z.infer<typeof ReviewSessionStateSchema>;

export const LessonProgressSchema = z.object({
  lessonId: IdSchema,
  status: z.enum(["locked", "available", "in-progress", "completed"]),
  bestAccuracy: z.number().min(0).max(1).default(0),
  completedAt: IsoDateTime.nullable().default(null)
});

/**
 * How far through a boss investigation a learner has got.
 *
 * The whole point of recording `currentStepIndex` is that a boss is long enough
 * to be interrupted. Resuming rebuilds the step from the curriculum and drops the
 * learner back at the step they had reached, with the accuracies of the steps
 * they already argued kept — restarting the case from the top would be the same
 * defect the frozen review queue exists to avoid.
 */
export const InvestigationProgressSchema = z.object({
  investigationId: IdSchema,
  status: z.enum(["locked", "available", "in-progress", "completed"]),
  /** The step the learner is on. Equals steps.length once the case is closed. */
  currentStepIndex: z.number().int().min(0).default(0),
  /** Accuracy of each step already argued, in step order. */
  stepAccuracy: z.array(z.number().min(0).max(1)).default([]),
  startedAt: IsoDateTime.nullable().default(null),
  completedAt: IsoDateTime.nullable().default(null)
});
export type InvestigationProgress = z.infer<typeof InvestigationProgressSchema>;

export const AttemptRecordSchema = z.object({
  questionId: IdSchema,
  at: IsoDateTime,
  correct: z.boolean(),
  responseMs: z.number().min(0),
  hintsUsed: z.number().int().min(0),
  misconceptionId: IdSchema.nullable().default(null)
});

export const UserProfileSchema = z.object({
  id: IdSchema,
  name: NonEmptyString.max(40),
  createdAt: IsoDateTime,
  isGuest: z.boolean().default(false),
  avatarSeed: z.number().int().default(0)
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const SettingsSchema = z.object({
  theme: z.enum(["dark", "light", "high-contrast"]).default("dark"),
  reducedMotion: z.boolean().default(false),
  textScale: z.enum(["s", "m", "l", "xl"]).default("m"),
  colorBlindSafe: z.boolean().default(false),
  soundEnabled: z.boolean().default(true),
  lastProfileId: z.string().nullable().default(null)
});
export type Settings = z.infer<typeof SettingsSchema>;

/**
 * One experiment kept on the laboratory shelf (S2-15 cycle 3).
 *
 * Readings, title, and how the learner had chosen to draw them — reloading an
 * experiment that came back as a different picture would lose half of what was
 * being explored. The edit log is deliberately **not** here: it is the trail of
 * one sitting at the bench, and a reloaded experiment has not had those edits
 * made to it. Saving it would let a learner reopen a set and be told what
 * "just" changed about it hours ago.
 */
export const SavedExperimentSchema = z.object({
  id: IdSchema,
  title: NonEmptyString,
  values: z.array(z.number().finite()),
  chartKind: z.enum(["histogram", "dot-plot", "box-plot"]),
  /** Absent means the histogram divides the range into five, as the chart does. */
  binWidth: z.number().positive().optional(),
  savedAt: IsoDateTime
});
export type SavedExperiment = z.infer<typeof SavedExperimentSchema>;

export const SaveFileSchema = z.object({
  schemaVersion: z.number().int().min(1),
  profile: UserProfileSchema,
  skillStates: z.record(SkillStateSchema).default({}),
  reviewQueue: z.array(ReviewItemSchema).default([]),
  lessonProgress: z.record(LessonProgressSchema).default({}),
  investigationProgress: z.record(InvestigationProgressSchema).default({}),
  attemptLog: z.array(AttemptRecordSchema).default([]),
  achievements: z.array(IdSchema).default([]),
  /** Null when no review session is in flight. */
  reviewSession: ReviewSessionStateSchema.nullable().default(null),
  /** The laboratory shelf. Bounded — see LABORATORY_SHELF_LIMIT. */
  savedExperiments: z.array(SavedExperimentSchema).default([]),
  xp: z.number().int().min(0).default(0),
  updatedAt: IsoDateTime
});
export type SaveFile = z.infer<typeof SaveFileSchema>;

export function createEmptySave(profile: UserProfile): SaveFile {
  return SaveFileSchema.parse({
    schemaVersion: SAVE_SCHEMA_VERSION,
    profile,
    updatedAt: new Date().toISOString()
  });
}
