import { z } from "zod";
import { IdSchema, NonEmptyString } from "./common";

export const DatasetColumnSchema = z.object({
  name: NonEmptyString,
  kind: z.enum(["numeric", "categorical", "ordinal", "datetime"]),
  unit: z.string().optional(),
  description: z.string().optional()
});

export const DatasetSchema = z.object({
  id: IdSchema,
  title: NonEmptyString,
  description: z.string().optional(),
  source: z.string().optional(),
  columns: z.array(DatasetColumnSchema).min(1),
  rows: z.array(z.array(z.union([z.number(), z.string(), z.null()]))).min(1)
}).superRefine((ds, ctx) => {
  const width = ds.columns.length;
  ds.rows.forEach((row, i) => {
    if (row.length !== width) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `row ${i} has ${row.length} cells, expected ${width}`
      });
    }
  });
});
export type Dataset = z.infer<typeof DatasetSchema>;
