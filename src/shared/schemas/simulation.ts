import { z } from "zod";
import { IdSchema, NonEmptyString } from "./common";

/** Declarative spec for Statistics Laboratory simulations (built out in later stages). */
export const SimulationSchema = z.object({
  id: IdSchema,
  title: NonEmptyString,
  description: NonEmptyString,
  kind: z.enum(["coin-flip", "dice-roll", "sampling-distribution", "regression-playground", "custom"]),
  parameters: z.record(z.unknown()).default({}),
  skillIds: z.array(IdSchema).default([])
});
export type Simulation = z.infer<typeof SimulationSchema>;
