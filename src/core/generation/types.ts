/**
 * The generator contract.
 *
 * A generator family enumerates every parameter combination it could emit —
 * including the ones it knows are invalid — and says why each invalid one is
 * rejected. That is deliberate: `STAGE2_RECONSTRUCTION_SCOPE.md` §4 requires
 * *raw* combinations and *valid* combinations to be reported as different
 * numbers, with reasons, so a family that quietly skipped its invalid cases
 * could not be reported honestly.
 *
 * Enumeration is deterministic and exhaustive — no random sampling. The same
 * repository always produces the same counts, so a coverage figure means
 * something when it is compared across commits.
 */
import type { z } from "zod";
import type { QuestionSchema, Question } from "../../shared/schemas";
import type { RawResponse } from "../questions/types";
import type { ReasoningFamily } from "./reasoning-families";

/**
 * What a generator hands back: schema *input*, not the parsed output.
 *
 * Generators should not have to restate every field the schema defaults
 * (`prerequisites`, `acceptedAlternatives`, `visual`, …). The validator parses,
 * so the defaults are applied in exactly one place.
 */
export type QuestionDraft = z.input<typeof QuestionSchema>;

/** One parameter combination a family could emit. */
export interface Candidate {
  /** Stable within its family; the generated question's id is derived from it. */
  key: string;
  /** Why this combination cannot be used, or null when it is valid. */
  invalidReason: string | null;
  /** Builds the question draft. Only called for valid combinations. */
  build: () => QuestionDraft;
  /**
   * The response a learner should give — stated by the family, **never** read
   * back out of the question it built.
   *
   * Required, and that is the whole point. Deriving the "correct" response from
   * `question.answer` and then evaluating it against `question.answer` can only
   * ever pass; it looks like verification and proves nothing. This was measured,
   * not assumed: a probe that deleted the answer check entirely failed no test
   * until this field existed.
   *
   * So the family says what it believes the answer is, `build()` constructs the
   * answer field separately, and the pipeline checks the two agree. Where an
   * independent *computation* is possible — repeated addition against a
   * multiplication — the operation supplies one; where the answer is structural
   * (a named choice), stating it here still catches a `build()` that names the
   * wrong option.
   */
  expectedResponse: () => RawResponse;
}

export interface GeneratorFamily {
  /** Stable id, e.g. `gen.r1-addition.comparison`. */
  id: string;
  /** The curriculum topic this produces questions for. */
  topicId: string;
  /** The skills a learner practises by answering these. */
  skillIds: readonly string[];
  /** The single reasoning pattern every question from this family requires. */
  reasoningFamily: ReasoningFamily;
  /** Human-readable, for the report. */
  description: string;
  /** Every combination, valid or not, in a deterministic order. */
  enumerate: () => Candidate[];
}

/** What happened to one candidate as it went through validation. */
export type CandidateOutcome =
  | { status: "invalid"; reason: string }
  | { status: "schema-failure"; reason: string }
  | { status: "answer-failure"; reason: string }
  | { status: "missing-accessibility"; reason: string }
  | { status: "missing-misconception-mapping"; reason: string }
  | { status: "exact-duplicate"; of: string }
  | { status: "near-duplicate"; of: string }
  | { status: "accepted"; question: Question };

export interface ValidatedCandidate {
  familyId: string;
  key: string;
  outcome: CandidateOutcome;
}
