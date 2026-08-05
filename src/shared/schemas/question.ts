import { z } from "zod";
import { DifficultySchema, IdSchema, NonEmptyString } from "./common";

/** Interaction types the question engine must eventually support. */
export const InteractionTypeSchema = z.enum([
  "multiple-choice",
  "multiple-selection",
  "numeric-input",
  "percentage-input",
  "fraction-input",
  "ordering",
  "matching",
  "drag-and-drop",
  "graph-interpretation",
  "point-placement",
  "formula-construction",
  "simulation-prediction",
  "error-identification",
  "method-selection",
  "step-by-step-calculation",
  "short-explanation",
  "confidence-rating"
]);
export type InteractionType = z.infer<typeof InteractionTypeSchema>;

export const HintSchema = z.object({
  level: z.number().int().min(1).max(5),
  text: NonEmptyString
});

export const ChoiceSchema = z.object({
  id: IdSchema,
  text: NonEmptyString,
  /** Misconception triggered when this distractor is picked. */
  misconceptionId: IdSchema.optional()
});

export const NumericAnswerSchema = z.object({
  kind: z.literal("numeric"),
  value: z.number(),
  tolerance: z.number().min(0).default(0),
  /** e.g. "kg", "%", "points" — used for unit-error detection and display */
  unit: z.string().optional(),
  /** When true, value is a proportion in [0,1] and percentage entries are auto-converted for detection. */
  asProportion: z.boolean().optional()
});

export const ChoiceAnswerSchema = z.object({
  kind: z.literal("choice"),
  correctChoiceIds: z.array(IdSchema).min(1)
});

export const OrderingAnswerSchema = z.object({
  kind: z.literal("ordering"),
  correctOrder: z.array(IdSchema).min(2)
});

export const MatchingAnswerSchema = z.object({
  kind: z.literal("matching"),
  pairs: z.array(z.object({ left: IdSchema, right: IdSchema })).min(2)
});

export const TextAnswerSchema = z.object({
  kind: z.literal("text"),
  /** Simple keyword rubric for Stage 1 short-explanation questions. */
  requiredKeywords: z.array(NonEmptyString).min(1),
  forbiddenKeywords: z.array(NonEmptyString).default([])
});

/**
 * One numeric step of a step-by-step calculation.
 *
 * Steps are deliberately numeric: the learner carries out the procedure one
 * quantity at a time, so a wrong step is caught and explained where it happened
 * rather than only at the final answer.
 */
export const CalculationStepSchema = z.object({
  id: IdSchema,
  prompt: NonEmptyString,
  value: z.number(),
  tolerance: z.number().min(0).default(0),
  unit: z.string().optional(),
  /** Additional accepted values for equivalent forms, e.g. 0.3 alongside 30 on a percentage step. */
  acceptedValues: z.array(z.number()).default([]),
  /** Hints for this step only, revealed in order. */
  hints: z.array(NonEmptyString).default([]),
  /** Shown once the step has been answered correctly. */
  explanation: NonEmptyString,
  /** Wrong values that identify a specific misconception at this step, in priority order. */
  misconceptionValues: z
    .array(z.object({ value: z.number(), misconceptionId: IdSchema }))
    .default([])
});
export type CalculationStep = z.infer<typeof CalculationStepSchema>;

export const StepsAnswerSchema = z.object({
  kind: z.literal("steps"),
  steps: z.array(CalculationStepSchema).min(2)
});

export const AnswerSpecSchema = z.discriminatedUnion("kind", [
  NumericAnswerSchema,
  ChoiceAnswerSchema,
  OrderingAnswerSchema,
  MatchingAnswerSchema,
  TextAnswerSchema,
  StepsAnswerSchema
]);
export type AnswerSpec = z.infer<typeof AnswerSpecSchema>;

export const AcceptedAlternativeSchema = z.object({
  answer: AnswerSpecSchema,
  note: z.string().optional()
});

export const VisualSpecSchema = z.object({
  kind: z.enum(["none", "bar-chart", "dot-plot", "histogram", "scatter", "box-plot", "table", "image"]),
  datasetId: IdSchema.optional(),
  caption: z.string().optional(),
  /** Alt description required whenever a visual is shown. */
  accessibleDescription: z.string().optional()
}).superRefine((v, ctx) => {
  if (v.kind !== "none" && !v.accessibleDescription) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "visuals require accessibleDescription" });
  }
});

export const QuestionSchema = z.object({
  id: IdSchema,
  topicId: IdSchema,
  subtopicId: IdSchema.optional(),
  objectiveId: IdSchema,
  skillIds: z.array(IdSchema).min(1),
  prerequisites: z.array(IdSchema).default([]),
  difficulty: DifficultySchema,
  interaction: InteractionTypeSchema,
  prompt: NonEmptyString,
  visual: VisualSpecSchema.default({ kind: "none" }),
  datasetId: IdSchema.optional(),
  /** Free-form parameters for parameterized/variant questions. */
  parameters: z.record(z.unknown()).optional(),
  choices: z.array(ChoiceSchema).optional(),
  /** Items for ordering / matching / drag-drop interactions. */
  items: z.array(z.object({ id: IdSchema, text: NonEmptyString })).optional(),
  rightItems: z.array(z.object({ id: IdSchema, text: NonEmptyString })).optional(),
  answer: AnswerSpecSchema,
  acceptedAlternatives: z.array(AcceptedAlternativeSchema).default([]),
  hints: z.array(HintSchema).default([]),
  explanation: NonEmptyString,
  solutionSteps: z.array(NonEmptyString).default([]),
  /** Misconceptions checked for this question, in priority order. */
  misconceptionIds: z.array(IdSchema).default([]),
  followUpQuestionId: IdSchema.optional(),
  accessibilityDescription: z.string().optional(),
  estimatedSeconds: z.number().int().positive().default(60)
}).superRefine((q, ctx) => {
  const needsChoices = ["multiple-choice", "multiple-selection", "method-selection", "error-identification", "graph-interpretation"];
  if (needsChoices.includes(q.interaction) && (!q.choices || q.choices.length < 2)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${q.interaction} requires >= 2 choices` });
  }
  if ((q.interaction === "ordering" || q.interaction === "matching" || q.interaction === "drag-and-drop") && (!q.items || q.items.length < 2)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${q.interaction} requires >= 2 items` });
  }
  if (q.interaction === "matching" && (!q.rightItems || q.rightItems.length < 2)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "matching requires rightItems" });
  }
  if (q.answer.kind === "choice" && q.choices) {
    const ids = new Set(q.choices.map((c) => c.id));
    for (const cid of q.answer.correctChoiceIds) {
      if (!ids.has(cid)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `correct choice ${cid} not among choices` });
    }
  }
  // A steps answer and the step-by-step interaction imply each other. Either one
  // without the other would render or evaluate as the wrong kind of question.
  if (q.interaction === "step-by-step-calculation" && q.answer.kind !== "steps") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "step-by-step-calculation requires a steps answer" });
  }
  if (q.answer.kind === "steps" && q.interaction !== "step-by-step-calculation") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "a steps answer requires interaction step-by-step-calculation" });
  }
  if (q.answer.kind === "steps") {
    const seen = new Set<string>();
    for (const s of q.answer.steps) {
      if (seen.has(s.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate step id ${s.id}` });
      }
      seen.add(s.id);
    }
  }
});
export type Question = z.infer<typeof QuestionSchema>;

/** A variant binds a base question to concrete parameter values. */
export const QuestionVariantSchema = z.object({
  id: IdSchema,
  baseQuestionId: IdSchema,
  parameters: z.record(z.unknown())
});
export type QuestionVariant = z.infer<typeof QuestionVariantSchema>;
