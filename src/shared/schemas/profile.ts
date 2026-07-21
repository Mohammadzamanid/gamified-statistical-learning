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

export const LessonProgressSchema = z.object({
  lessonId: IdSchema,
  status: z.enum(["locked", "available", "in-progress", "completed"]),
  bestAccuracy: z.number().min(0).max(1).default(0),
  completedAt: IsoDateTime.nullable().default(null)
});

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

export const SaveFileSchema = z.object({
  schemaVersion: z.number().int().min(1),
  profile: UserProfileSchema,
  skillStates: z.record(SkillStateSchema).default({}),
  reviewQueue: z.array(ReviewItemSchema).default([]),
  lessonProgress: z.record(LessonProgressSchema).default({}),
  attemptLog: z.array(AttemptRecordSchema).default([]),
  achievements: z.array(IdSchema).default([]),
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
