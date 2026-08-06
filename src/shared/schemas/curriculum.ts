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
  /** a tenths plus b hundredths — the decimal point as place value. */
  "place-value",
  /** a percent of b */
  "percent-of",
  /** a out of b, as a percentage */
  "share-of",
  /**
   * The cell where row a meets column b of the demonstration's `table`.
   *
   * The data-structure topics are not arithmetic — a table, a variable and a case
   * are shapes rather than quantities — so they need a readout that indexes data
   * instead of computing over it. Rows and columns are 1-based, matching the
   * labels a learner reads off the screen.
   */
  "table-cell",
  /** The total of column a of the demonstration's `table`. */
  "column-total"
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
  "place-value": 2,
  "percent-of": 2,
  "share-of": 2,
  "table-cell": 2,
  "column-total": 1
};

/** Formulas that divide by the second control, so its range must exclude zero. */
const DIVIDES_BY_SECOND: ReadonlyArray<DemonstrationFormula> = ["quotient", "share-of"];

/** Formulas that read from the demonstration's `table` rather than computing. */
const READS_TABLE: ReadonlyArray<DemonstrationFormula> = ["table-cell", "column-total"];

export const DemonstrationControlSchema = z
  .object({
    id: IdSchema,
    label: NonEmptyString,
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    initial: z.number(),
    unit: z.string().optional(),
    /**
     * Names for the control's positions, when it selects a thing rather than a
     * quantity: a row, a column, a variable. Position 1 is `valueLabels[0]`.
     * The panel then shows "Thursday" where it would otherwise show "4", and the
     * spoken description says the same word.
     */
    valueLabels: z.array(NonEmptyString).default([])
  })
  .superRefine((c, ctx) => {
    if (c.max <= c.min) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `control ${c.id}: max must be greater than min` });
    }
    if (c.initial < c.min || c.initial > c.max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `control ${c.id}: initial ${c.initial} is outside its range` });
    }
    // A labelled control is a 1-based selector, so its range and its labels have
    // to agree exactly — otherwise some position on the slider has no name.
    if (c.valueLabels.length > 0) {
      if (c.min !== 1 || c.step !== 1 || c.max !== c.valueLabels.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `control ${c.id}: a labelled control must run 1..${c.valueLabels.length} in steps of 1`
        });
      }
      if (c.unit) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `control ${c.id}: a labelled control has no unit` });
      }
    }
  });
export type DemonstrationControl = z.infer<typeof DemonstrationControlSchema>;

/**
 * A small grid of numbers a demonstration reads from.
 *
 * Present only for the table formulas. The labels are what the learner sees and
 * hears; the cells are what the readout indexes.
 */
export const DemonstrationTableSchema = z
  .object({
    rowLabels: z.array(NonEmptyString).min(2),
    columnLabels: z.array(NonEmptyString).min(2),
    /** `cells[row][column]`, matching the label arrays. */
    cells: z.array(z.array(z.number()).min(2)).min(2)
  })
  .superRefine((t, ctx) => {
    if (t.cells.length !== t.rowLabels.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `table has ${t.cells.length} rows of cells but ${t.rowLabels.length} row labels`
      });
    }
    t.cells.forEach((row, i) => {
      if (row.length !== t.columnLabels.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `table row ${i + 1} has ${row.length} cells but there are ${t.columnLabels.length} column labels`
        });
      }
    });
  });
export type DemonstrationTable = z.infer<typeof DemonstrationTableSchema>;

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
    /** Required by the table formulas, forbidden otherwise. */
    table: DemonstrationTableSchema.optional(),
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

    // Table formulas index data rather than computing over it, so the controls
    // are selectors and their ranges must match the table exactly. A control that
    // can point outside the grid has positions with no cell behind them.
    const readsTable = READS_TABLE.includes(d.formula);
    if (readsTable && !d.table) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `formula ${d.formula} requires a table` });
    }
    if (!readsTable && d.table) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `formula ${d.formula} does not read a table` });
    }
    if (readsTable && d.table) {
      const expected =
        d.formula === "table-cell"
          ? [d.table.rowLabels, d.table.columnLabels]
          : [d.table.columnLabels];
      expected.forEach((labels, i) => {
        const control = d.controls[i];
        if (!control) return;
        if (control.min !== 1 || control.max !== labels.length || control.step !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `control ${control.id} selects from the table and must run 1..${labels.length} in steps of 1`
          });
        }
        // A table selector must name what it is selecting. Without labels the
        // learner drags a slider to "4" with nothing to say which row that is,
        // and the spoken description reads out an index instead of a day.
        if (control.valueLabels.join(" ") !== labels.join(" ")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `control ${control.id} must label its positions with the table's own labels: ${labels.join(", ")}`
          });
        }
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
