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

/**
 * Placing a point answers "where is this value?" rather than "what is this value?".
 *
 * `y` is absent on a one-dimensional number line and present on a coordinate
 * plane. Tolerances are per axis because the two axes rarely share a scale, and
 * because some questions want an approximate placement ("about where is the
 * mean?") while others want an exact one.
 */
export const PointAnswerSchema = z.object({
  kind: z.literal("point"),
  x: z.number(),
  y: z.number().optional(),
  toleranceX: z.number().min(0).default(0),
  toleranceY: z.number().min(0).default(0),
  /** Specific wrong placements that identify a misconception, in priority order. */
  misconceptionPoints: z
    .array(z.object({ x: z.number(), y: z.number().optional(), misconceptionId: IdSchema }))
    .default([]),
  /** When set, a placement matching the target with the axes exchanged classifies as this. */
  swappedAxesMisconceptionId: IdSchema.optional()
});

/**
 * A place items can be dropped into.
 *
 * One primitive covers every arrangement task the curriculum needs, because the
 * zone configuration is what varies, not the mechanics:
 * - ordering / sorting — one zone per position, each with capacity 1
 * - matching — one zone per right-hand item, capacity 1
 * - grouping observations — one zone per category, unlimited capacity
 * - simple graph construction — one zone per bar or bin, unlimited capacity
 */
export const DropZoneSchema = z.object({
  id: IdSchema,
  label: NonEmptyString,
  /** Maximum items accepted. Omit for unlimited. */
  capacity: z.number().int().positive().optional(),
  description: z.string().optional()
});
export type DropZone = z.infer<typeof DropZoneSchema>;

export const PlacementAnswerSchema = z.object({
  kind: z.literal("placement"),
  /** The expected contents of each zone. Every declared item must appear exactly once. */
  zones: z.array(z.object({ zoneId: IdSchema, itemIds: z.array(IdSchema) })).min(1),
  /** When true the order of items inside a zone is part of the answer (sorting). */
  orderMatters: z.boolean().default(false),
  /** Specific wrong item→zone placements that identify a misconception. */
  misconceptionPlacements: z
    .array(z.object({ itemId: IdSchema, zoneId: IdSchema, misconceptionId: IdSchema }))
    .default([])
});

export const AnswerSpecSchema = z.discriminatedUnion("kind", [
  NumericAnswerSchema,
  ChoiceAnswerSchema,
  OrderingAnswerSchema,
  MatchingAnswerSchema,
  TextAnswerSchema,
  StepsAnswerSchema,
  PointAnswerSchema,
  PlacementAnswerSchema
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
export type VisualSpec = z.infer<typeof VisualSpecSchema>;

/**
 * The axis or plane a point is placed on.
 *
 * `step` is the granularity of keyboard movement and of snapping, so a learner
 * using arrow keys can always land exactly on a meaningful value rather than
 * being forced into pixel-accurate pointer work.
 */
export const PointFieldSchema = z
  .object({
    kind: z.enum(["number-line", "coordinate-plane"]),
    xMin: z.number(),
    xMax: z.number(),
    xStep: z.number().positive(),
    xLabel: NonEmptyString,
    xTicks: z.array(z.number()).default([]),
    yMin: z.number().optional(),
    yMax: z.number().optional(),
    yStep: z.number().positive().optional(),
    yLabel: NonEmptyString.optional(),
    yTicks: z.array(z.number()).default([]),
    /** Required: a point field is a visual, so it always needs a text equivalent. */
    accessibleDescription: NonEmptyString
  })
  .superRefine((f, ctx) => {
    if (f.xMax <= f.xMin) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "xMax must be greater than xMin" });
    }
    if (f.kind === "coordinate-plane") {
      if (f.yMin === undefined || f.yMax === undefined || f.yStep === undefined || !f.yLabel) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "coordinate-plane requires yMin, yMax, yStep and yLabel" });
      } else if (f.yMax <= f.yMin) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "yMax must be greater than yMin" });
      }
    }
  });
export type PointField = z.infer<typeof PointFieldSchema>;

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
  /** Axis or plane for point-placement questions. */
  pointField: PointFieldSchema.optional(),
  /** Zones items are dropped into, for drag-and-drop questions. */
  dropZones: z.array(DropZoneSchema).optional(),
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
  // Point placement, its answer, and its field all imply each other.
  if (q.interaction === "point-placement") {
    if (q.answer.kind !== "point") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "point-placement requires a point answer" });
    }
    if (!q.pointField) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "point-placement requires a pointField" });
    }
  }
  if (q.answer.kind === "point" && q.interaction !== "point-placement") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "a point answer requires interaction point-placement" });
  }
  if (q.answer.kind === "point" && q.pointField) {
    const f = q.pointField;
    const a = q.answer;
    // A target off the field could never be reached, and a plane needs a y target.
    if (a.x < f.xMin || a.x > f.xMax) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `point target x ${a.x} is outside the field` });
    }
    if (f.kind === "coordinate-plane") {
      if (a.y === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "coordinate-plane target requires y" });
      } else if (f.yMin !== undefined && f.yMax !== undefined && (a.y < f.yMin || a.y > f.yMax)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `point target y ${a.y} is outside the field` });
      }
    }
    if (f.kind === "number-line" && a.y !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "number-line target must not set y" });
    }
    if (a.swappedAxesMisconceptionId && f.kind !== "coordinate-plane") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "swappedAxesMisconceptionId only applies to a coordinate-plane"
      });
    }
  }
  // Drag-and-drop, its placement answer, and its zones all imply each other.
  if (q.interaction === "drag-and-drop") {
    if (q.answer.kind !== "placement") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "drag-and-drop requires a placement answer" });
    }
    if (!q.dropZones || q.dropZones.length < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "drag-and-drop requires at least one dropZone" });
    }
  }
  if (q.answer.kind === "placement" && q.interaction !== "drag-and-drop") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "a placement answer requires interaction drag-and-drop" });
  }
  if (q.answer.kind === "placement" && q.dropZones && q.items) {
    const zoneIds = new Set(q.dropZones.map((z) => z.id));
    const itemIds = new Set(q.items.map((i) => i.id));
    const capacityOf = new Map(q.dropZones.map((z) => [z.id, z.capacity]));
    const placed = new Set<string>();

    for (const zone of q.answer.zones) {
      if (!zoneIds.has(zone.zoneId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `answer references unknown zone ${zone.zoneId}` });
      }
      const capacity = capacityOf.get(zone.zoneId);
      if (capacity !== undefined && zone.itemIds.length > capacity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `zone ${zone.zoneId} expects ${zone.itemIds.length} items but has capacity ${capacity}`
        });
      }
      for (const itemId of zone.itemIds) {
        if (!itemIds.has(itemId)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `answer references unknown item ${itemId}` });
        }
        // An item in two zones has no reachable correct answer.
        if (placed.has(itemId)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `item ${itemId} is expected in more than one zone` });
        }
        placed.add(itemId);
      }
    }
    for (const itemId of itemIds) {
      if (!placed.has(itemId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `item ${itemId} is never placed by the answer` });
      }
    }
    for (const mp of q.answer.misconceptionPlacements) {
      if (!zoneIds.has(mp.zoneId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `misconception placement references unknown zone ${mp.zoneId}` });
      }
      if (!itemIds.has(mp.itemId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `misconception placement references unknown item ${mp.itemId}` });
      }
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
