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

export const AnswerSpecSchema = z.discriminatedUnion("kind", [
  NumericAnswerSchema,
  ChoiceAnswerSchema,
  OrderingAnswerSchema,
  MatchingAnswerSchema,
  TextAnswerSchema
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
});
export type Question = z.infer<typeof QuestionSchema>;

/** A variant binds a base question to concrete parameter values. */
export const QuestionVariantSchema = z.object({
  id: IdSchema,
  baseQuestionId: IdSchema,
  parameters: z.record(z.unknown())
});
export type QuestionVariant = z.infer<typeof QuestionVariantSchema>;
