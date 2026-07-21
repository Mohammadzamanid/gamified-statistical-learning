import { z } from "zod";
import { IdSchema, NonEmptyString } from "./common";

/** A named, recurring error pattern with targeted remediation. */
export const RemediationSchema = z.object({
  id: IdSchema,
  title: NonEmptyString,
  /** Short targeted explanation shown immediately after detection. */
  explanation: NonEmptyString,
  /** Optional micro-lesson body (markdown-ish plain text). */
  microLesson: z.string().optional(),
  /** Question ids to route the learner to after remediation. */
  followUpQuestionIds: z.array(IdSchema).default([]),
  /** Skill ids this remediation reinforces. */
  skillIds: z.array(IdSchema).default([])
});
export type Remediation = z.infer<typeof RemediationSchema>;

export const MisconceptionSchema = z.object({
  id: IdSchema,
  title: NonEmptyString,
  description: NonEmptyString,
  /** Registered detector this misconception relies on (see core/misconceptions). */
  detector: z.string().min(1),
  /** Static parameters passed to the detector. */
  detectorParams: z.record(z.unknown()).optional(),
  remediationId: IdSchema
});
export type Misconception = z.infer<typeof MisconceptionSchema>;
