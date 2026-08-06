/**
 * The gate every generated question has to pass before it may be counted.
 *
 * `STAGE2_RECONSTRUCTION_SCOPE.md` §4 defines "final validated generated
 * interactions" as valid combinations that "also pass schema, answer, a11y, and
 * duplicate checks". Each of those is a separate stage here, and each rejection
 * is reported with its reason rather than silently dropped — a generator that
 * emits 500 candidates and 12 usable questions must say so.
 *
 * The answer check is the one that matters most: it builds the response the
 * question claims is correct and runs it through the **real evaluator**. A
 * generator whose arithmetic disagrees with its own answer key is caught here
 * rather than by a learner.
 */
import { QuestionSchema, type Misconception, type Question, type Remediation } from "../../shared/schemas";
import { evaluateResponse } from "../questions/evaluators";
import { normalizeResponse } from "../questions/normalize";
import type { RawResponse } from "../questions/types";
import { exactFingerprint, nearDuplicateFingerprint } from "./normalize";
import type { Candidate, CandidateOutcome, GeneratorFamily, QuestionDraft, ValidatedCandidate } from "./types";

export interface ValidationLibrary {
  misconceptions: readonly Misconception[];
  remediations: readonly Remediation[];
  /** Fingerprints already taken by authored content, so a generator cannot clone one. */
  seenExact?: Map<string, string>;
  seenReasoning?: Map<string, string>;
}

/**
 * The response a question's own answer key implies.
 *
 * Deliberately **not** used by the validation pipeline — see
 * `Candidate.expectedResponse` for why. Kept because tests and tooling that
 * simply need to answer a question correctly do want exactly this.
 */
export function correctResponseFor(question: Question): RawResponse | null {
  const a = question.answer;
  switch (a.kind) {
    case "choice":
      return { kind: "choice", choiceIds: [...a.correctChoiceIds] };
    case "numeric":
      return { kind: "numeric", text: String(a.value) };
    case "ordering":
      return { kind: "ordering", order: [...a.correctOrder] };
    case "matching":
      return { kind: "matching", pairs: a.pairs.map((p) => ({ left: p.left, right: p.right })) };
    case "text":
      return { kind: "text", text: a.requiredKeywords.join(" ") };
    case "steps":
      return { kind: "steps", steps: a.steps.map((s) => ({ stepId: s.id, text: String(s.value) })) };
    case "point":
      return a.y === undefined ? { kind: "point", x: a.x } : { kind: "point", x: a.x, y: a.y };
    case "placement":
      return { kind: "placement", zones: a.zones.map((z) => ({ zoneId: z.zoneId, itemIds: [...z.itemIds] })) };
  }
}

function checkOne(
  candidate: Candidate,
  library: ValidationLibrary,
  seenExact: Map<string, string>,
  seenReasoning: Map<string, string>
): CandidateOutcome {
  if (candidate.invalidReason !== null) {
    return { status: "invalid", reason: candidate.invalidReason };
  }

  let built: QuestionDraft;
  try {
    built = candidate.build();
  } catch (e) {
    return { status: "schema-failure", reason: e instanceof Error ? e.message : String(e) };
  }

  const parsed = QuestionSchema.safeParse(built);
  if (!parsed.success) {
    return { status: "schema-failure", reason: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const question = parsed.data;

  // A generated question with no text equivalent is unusable by a screen-reader
  // user, so it is never counted however correct its arithmetic is.
  if ((question.accessibilityDescription ?? "").trim().length < 20) {
    return { status: "missing-accessibility", reason: "no usable accessibilityDescription" };
  }

  const declared = question.misconceptionIds;
  for (const id of declared) {
    const mc = library.misconceptions.find((m) => m.id === id);
    if (!mc) return { status: "missing-misconception-mapping", reason: `undeclared misconception ${id}` };
    if (!library.remediations.some((r) => r.id === mc.remediationId)) {
      return { status: "missing-misconception-mapping", reason: `${id} has no remediation` };
    }
  }
  // A distractor may not name a misconception the question does not declare, or
  // the engine would never run its detector — the tag would inflate a count
  // while doing nothing for the learner.
  for (const choice of question.choices ?? []) {
    if (choice.misconceptionId && !declared.includes(choice.misconceptionId)) {
      return {
        status: "missing-misconception-mapping",
        reason: `choice ${choice.id} tags ${choice.misconceptionId}, which the question does not declare`
      };
    }
  }

  // The family states the answer; build() constructs the answer field separately;
  // the two have to agree. Reading the response back out of the question would
  // make this stage tautological — see the note on Candidate.expectedResponse.
  const evaluation = evaluateResponse(question, normalizeResponse(candidate.expectedResponse()));
  if (!evaluation.correct) {
    return {
      status: "answer-failure",
      reason: "the answer the family states disagrees with the answer the question publishes"
    };
  }

  const exact = exactFingerprint(question);
  const existingExact = seenExact.get(exact);
  if (existingExact) return { status: "exact-duplicate", of: existingExact };

  const reasoning = nearDuplicateFingerprint(question);
  const existingNear = seenReasoning.get(reasoning);
  if (existingNear) return { status: "near-duplicate", of: existingNear };

  seenExact.set(exact, question.id);
  seenReasoning.set(reasoning, question.id);
  return { status: "accepted", question };
}

export interface ValidationRun {
  results: ValidatedCandidate[];
  accepted: Question[];
}

/**
 * Runs every family's candidates through the gate.
 *
 * Duplicate state is shared across families on purpose: two families producing
 * the same question is exactly the overlap the count must not double.
 */
export function validateFamilies(families: readonly GeneratorFamily[], library: ValidationLibrary): ValidationRun {
  const seenExact = new Map(library.seenExact ?? []);
  const seenReasoning = new Map(library.seenReasoning ?? []);
  const results: ValidatedCandidate[] = [];
  const accepted: Question[] = [];

  for (const family of families) {
    for (const candidate of family.enumerate()) {
      const outcome = checkOne(candidate, library, seenExact, seenReasoning);
      results.push({ familyId: family.id, key: candidate.key, outcome });
      if (outcome.status === "accepted") accepted.push(outcome.question);
    }
  }

  return { results, accepted };
}

/** Fingerprints of the authored bank, so generators cannot re-emit an authored question. */
export function fingerprintAuthored(questions: readonly Question[]): {
  seenExact: Map<string, string>;
  seenReasoning: Map<string, string>;
} {
  const seenExact = new Map<string, string>();
  const seenReasoning = new Map<string, string>();
  for (const q of questions) {
    const exact = exactFingerprint(q);
    if (!seenExact.has(exact)) seenExact.set(exact, q.id);
    const reasoning = nearDuplicateFingerprint(q);
    if (!seenReasoning.has(reasoning)) seenReasoning.set(reasoning, q.id);
  }
  return { seenExact, seenReasoning };
}
