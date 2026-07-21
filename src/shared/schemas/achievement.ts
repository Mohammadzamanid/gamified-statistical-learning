import { z } from "zod";
import { IdSchema, NonEmptyString } from "./common";

export const AchievementSchema = z.object({
  id: IdSchema,
  title: NonEmptyString,
  description: NonEmptyString,
  /** Deterministic trigger evaluated by the achievements engine. */
  trigger: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("questions-answered"), count: z.number().int().positive() }),
    z.object({ kind: z.literal("streak"), count: z.number().int().positive() }),
    z.object({ kind: z.literal("skill-mastered"), skillId: IdSchema }),
    z.object({ kind: z.literal("lesson-completed"), lessonId: IdSchema }),
    z.object({ kind: z.literal("region-completed"), regionId: IdSchema })
  ]),
  icon: z.string().optional()
});
export type Achievement = z.infer<typeof AchievementSchema>;
