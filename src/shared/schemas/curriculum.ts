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

/**
 * How a demonstration's readout is computed from its controls.
 *
 * Named rather than free-form: content declares *which* relationship it is
 * showing, and the arithmetic lives in `src/core/curriculum/demonstration.ts`.
 * A lesson therefore never carries an expression a component has to interpret.
 */
export const DemonstrationFormulaSchema = z.enum([
  /** 5a + b — marks tallied in groups of five plus the leftovers. */
  "tally",
  /** a + b */
  "sum",
  /** a - b */
  "difference",
  /** a * b */
  "product",
  /** a / b */
  "quotient",
  /** -a */
  "negate",
  /** a percent of b */
  "percent-of",
  /** a out of b, as a percentage */
  "share-of"
]);
export type DemonstrationFormula = z.infer<typeof DemonstrationFormulaSchema>;

/** How many controls each formula consumes, in order. */
export const DEMONSTRATION_ARITY: Readonly<Record<DemonstrationFormula, number>> = {
  tally: 2,
  sum: 2,
  difference: 2,
  product: 2,
  quotient: 2,
  negate: 1,
  "percent-of": 2,
  "share-of": 2
};

/** Formulas that divide by the second control, so its range must exclude zero. */
const DIVIDES_BY_SECOND: ReadonlyArray<DemonstrationFormula> = ["quotient", "share-of"];

export const DemonstrationControlSchema = z
  .object({
    id: IdSchema,
    label: NonEmptyString,
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    initial: z.number(),
    unit: z.string().optional()
  })
  .superRefine((c, ctx) => {
    if (c.max <= c.min) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `control ${c.id}: max must be greater than min` });
    }
    if (c.initial < c.min || c.initial > c.max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `control ${c.id}: initial ${c.initial} is outside its range` });
    }
  });
export type DemonstrationControl = z.infer<typeof DemonstrationControlSchema>;

/**
 * A manipulable the learner changes and watches respond.
 *
 * Deliberately data-driven rather than a bespoke component per lesson: the
 * controls and the named formula are content, so a new lesson needs no new
 * React. This is what makes requirement 4 (interactive visual demonstration)
 * achievable across 17 topics instead of 17 one-off widgets.
 */
export const DemonstrationSchema = z
  .object({
    id: IdSchema,
    title: NonEmptyString,
    /** Requirement 3: the concrete, everyday situation being manipulated. */
    experience: NonEmptyString,
    /** Requirement 18: the text equivalent of the whole widget. */
    accessibleDescription: NonEmptyString,
    controls: z.array(DemonstrationControlSchema).min(1).max(2),
    formula: DemonstrationFormulaSchema,
    readoutLabel: NonEmptyString,
    /** Decimal places the readout is shown to. */
    readoutPrecision: z.number().int().min(0).max(4).default(0),
    readoutUnit: z.string().optional(),
    /** Requirement 5: asked and answered BEFORE the learner is shown the result. */
    prediction: z.object({
      prompt: NonEmptyString,
      options: z.array(z.object({ id: IdSchema, text: NonEmptyString })).min(2),
      correctOptionId: IdSchema,
      /** Shown once the prediction is submitted — never before. */
      revealNote: NonEmptyString
    }),
    /** Requirement 6: what to notice once it has moved. */
    observation: NonEmptyString
  })
  .superRefine((d, ctx) => {
    if (!d.prediction.options.some((o) => o.id === d.prediction.correctOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `prediction correctOptionId ${d.prediction.correctOptionId} is not one of the options`
      });
    }
    const optionIds = new Set<string>();
    for (const o of d.prediction.options) {
      if (optionIds.has(o.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate prediction option ${o.id}` });
      }
      optionIds.add(o.id);
    }
    const arity = DEMONSTRATION_ARITY[d.formula];
    if (d.controls.length !== arity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `formula ${d.formula} needs exactly ${arity} control(s), got ${d.controls.length}`
      });
    }
    // A control range that reaches zero would let the learner drive the readout
    // to infinity; the content must not offer that setting at all.
    if (DIVIDES_BY_SECOND.includes(d.formula) && d.controls[1] && d.controls[1].min <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `formula ${d.formula} divides by ${d.controls[1].id}, whose minimum must be greater than zero`
      });
    }
  });
export type Demonstration = z.infer<typeof DemonstrationSchema>;

/** Requirement 8, and 9-10 when notation is introduced at all. */
export const FormalTermSchema = z
  .object({
    term: NonEmptyString,
    definition: NonEmptyString,
    /** Omit entirely when notation would not help a beginner. */
    notation: z.string().optional(),
    /** Every symbol in `notation` must be explained; enforced by the lesson audit. */
    symbols: z.array(z.object({ symbol: NonEmptyString, meaning: NonEmptyString })).default([])
  })
  .superRefine((t, ctx) => {
    // Requirement 10 in schema form: notation without explained symbols is
    // exactly the unexplained notation beginner safety forbids.
    if (t.notation && t.symbols.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${t.term}: notation "${t.notation}" explains no symbols` });
    }
    if (!t.notation && t.symbols.length > 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${t.term}: symbols explained but no notation is shown` });
    }
  });
export type FormalTerm = z.infer<typeof FormalTermSchema>;

export const LessonSchema = z.object({
  id: IdSchema,
  moduleId: IdSchema,
  title: NonEmptyString,
  narrativeIntro: z.string().optional(),
  objectiveIds: z.array(IdSchema).min(1),
  concepts: z.array(ConceptSchema).min(1),
  questionIds: z.array(IdSchema).min(1),
  prerequisites: z.array(IdSchema).default([]),
  estimatedMinutes: z.number().int().positive().default(10),

  /**
   * The structured teaching sections (scope section 5). All optional at the schema
   * level so the Region 1 skeletons stay valid while they are being filled in;
   * `tests/audit/lesson-structure.test.ts` is what decides whether a lesson is
   * Complete, and it requires every one of them.
   */
  demonstration: DemonstrationSchema.optional(),
  formalTerm: FormalTermSchema.optional(),
  /** Requirement 11: worked through with support. */
  guidedQuestionIds: z.array(IdSchema).default([]),
  /** Requirement 12: unsupported practice. */
  independentQuestionIds: z.array(IdSchema).default([]),
  /** Requirement 13: a question that targets a named misconception. */
  misconceptionQuestionIds: z.array(IdSchema).default([]),
  /** Requirement 14: the idea used somewhere real. */
  applicationQuestionIds: z.array(IdSchema).default([]),
  /** Requirement 15: explain it back in the learner's own words. */
  teachBackQuestionIds: z.array(IdSchema).default([]),
  /** Requirement 16: the check that decides mastery. */
  masteryCheckQuestionIds: z.array(IdSchema).default([])
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
