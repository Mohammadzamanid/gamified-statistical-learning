import { z } from "zod";

/** Shared schema primitives used across all content and save schemas. */

export const IdSchema = z.string().min(1).regex(/^[a-z0-9][a-z0-9_.:-]*$/i, "ids must be url-safe");
export const DifficultySchema = z.number().int().min(1).max(5);
export const NonEmptyString = z.string().trim().min(1);
export const IsoDateTime = z.string().datetime({ offset: true }).or(z.string().datetime());

export const LocalizedTextSchema = z.union([
  NonEmptyString,
  z.object({ en: NonEmptyString, fa: z.string().optional() })
]);
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

export function textOf(t: LocalizedText): string {
  return typeof t === "string" ? t : t.en;
}
