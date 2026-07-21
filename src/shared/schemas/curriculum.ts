import { z } from "zod";
import { DifficultySchema, IdSchema, NonEmptyString } from "./common";

export const LearningObjectiveSchema = z.object({
  id: IdSchema,
  text: NonEmptyString,
  skillIds: z.array(IdSchema).min(1)
});

export const ConceptSchema = z.object({
  id: IdSchema,
  title: NonEmptyString,
  summary: NonEmptyString,
  /** Plain-language body shown in the lesson before practice. */
  body: NonEmptyString
});

export const LessonSchema = z.object({
  id: IdSchema,
  moduleId: IdSchema,
  title: NonEmptyString,
  narrativeIntro: z.string().optional(),
  objectiveIds: z.array(IdSchema).min(1),
  concepts: z.array(ConceptSchema).min(1),
  questionIds: z.array(IdSchema).min(1),
  prerequisites: z.array(IdSchema).default([]),
  estimatedMinutes: z.number().int().positive().default(10)
});
export type Lesson = z.infer<typeof LessonSchema>;

export const ModuleSchema = z.object({
  id: IdSchema,
  regionId: IdSchema,
  title: NonEmptyString,
  description: NonEmptyString,
  lessonIds: z.array(IdSchema).min(1),
  prerequisites: z.array(IdSchema).default([]),
  difficulty: DifficultySchema
});
export type CurriculumModule = z.infer<typeof ModuleSchema>;

export const RegionSchema = z.object({
  id: IdSchema,
  worldId: IdSchema,
  title: NonEmptyString,
  tagline: NonEmptyString,
  description: NonEmptyString,
  moduleIds: z.array(IdSchema).min(1),
  prerequisites: z.array(IdSchema).default([]),
  /** Map placement (0..100 coordinate space on the world chart). */
  mapX: z.number().min(0).max(100),
  mapY: z.number().min(0).max(100)
});
export type Region = z.infer<typeof RegionSchema>;

export const WorldSchema = z.object({
  id: IdSchema,
  title: NonEmptyString,
  tagline: NonEmptyString,
  description: NonEmptyString,
  regionIds: z.array(IdSchema).min(1),
  order: z.number().int().min(0)
});
export type World = z.infer<typeof WorldSchema>;

export const SkillSchema = z.object({
  id: IdSchema,
  title: NonEmptyString,
  description: z.string().optional(),
  prerequisites: z.array(IdSchema).default([])
});
export type Skill = z.infer<typeof SkillSchema>;

export const MasteryRuleSchema = z.object({
  /** Consecutive correct answers required at or above target difficulty. */
  streakToMaster: z.number().int().min(2).default(3),
  minAccuracy: z.number().min(0).max(1).default(0.8),
  minAttempts: z.number().int().min(1).default(4)
});

export const CurriculumSchema = z.object({
  id: IdSchema,
  title: NonEmptyString,
  version: z.string(),
  worlds: z.array(WorldSchema).min(1),
  regions: z.array(RegionSchema).min(1),
  modules: z.array(ModuleSchema).min(1),
  lessons: z.array(LessonSchema).min(1),
  objectives: z.array(LearningObjectiveSchema).min(1),
  skills: z.array(SkillSchema).min(1),
  masteryRule: MasteryRuleSchema.default({ streakToMaster: 3, minAccuracy: 0.8, minAttempts: 4 })
});
export type Curriculum = z.infer<typeof CurriculumSchema>;
