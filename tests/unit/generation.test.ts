/**
 * The validation pipeline itself, driven by deliberately broken generators.
 *
 * Written because two probes against the shipped generators failed nothing:
 * turning off near-duplicate detection and turning off the answer check both
 * left every audit green, for the simple reason that no shipped generator
 * currently emits a clone or a wrong answer key. A stage nothing exercises is a
 * stage nobody knows works.
 *
 * So each check below builds a generator that fails exactly one way, and asserts
 * the pipeline catches it and says which way.
 */
import { describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import { validateFamilies, fingerprintAuthored, correctResponseFor } from "../../src/core/generation/validate";
import {
  exactFingerprint,
  nearDuplicateFingerprint,
  normalizeKeepingNumbers,
  normalizeText,
  reasoningShape
} from "../../src/core/generation/normalize";
import type { Candidate, GeneratorFamily, QuestionDraft } from "../../src/core/generation/types";
import type { RawResponse } from "../../src/core/questions/types";
import { QuestionSchema } from "../../src/shared/schemas";

const content = loadShippedContent();
const library = { misconceptions: content.misconceptions, remediations: content.remediations };

function draft(overrides: Partial<QuestionDraft> = {}): QuestionDraft {
  return {
    id: "q.gen.test.one",
    topicId: "t.r1-addition",
    objectiveId: "obj.r1-addition",
    skillIds: ["skill.r1-addition"],
    difficulty: 2,
    misconceptionIds: [],
    estimatedSeconds: 45,
    accessibilityDescription: "A numeric question used only by the generation pipeline tests.",
    interaction: "numeric-input",
    prompt: "The north jetty holds 12 crates and the south jetty holds 5. How many altogether?",
    answer: { kind: "numeric", value: 17, tolerance: 0 },
    explanation: "12 + 5 = 17.",
    ...overrides
  } as QuestionDraft;
}

function family(candidates: Candidate[], id = "gen.test"): GeneratorFamily {
  return {
    id,
    topicId: "t.r1-addition",
    skillIds: ["skill.r1-addition"],
    reasoningFamily: "calculation",
    description: "A test family.",
    enumerate: () => candidates
  };
}

function candidate(
  key: string,
  build: () => QuestionDraft,
  invalidReason: string | null = null,
  expectedResponse: () => RawResponse = () => ({ kind: "numeric", text: "17" })
): Candidate {
  return { key, invalidReason, build, expectedResponse };
}

describe("the pipeline rejects, and says why", () => {
  it("keeps a generator's own invalid reason instead of discarding the combination", () => {
    const run = validateFamilies([family([candidate("a", () => draft(), "the divisor would be zero")])], library);
    expect(run.results[0]!.outcome).toEqual({ status: "invalid", reason: "the divisor would be zero" });
    expect(run.accepted).toHaveLength(0);
  });

  it("catches an answer key that disagrees with the family's own working", () => {
    // The single most valuable check in the pipeline, and the one that only
    // works because the expectation is computed independently: deriving the
    // "correct" response from question.answer and evaluating it against
    // question.answer could never fail.
    const run = validateFamilies(
      [
        family([
          {
            key: "a",
            invalidReason: null,
            expectedResponse: () => ({ kind: "numeric", text: "17" }) as RawResponse,
            build: () => draft({ answer: { kind: "numeric", value: 99, tolerance: 0 } })
          }
        ])
      ],
      library
    );
    expect(run.results[0]!.outcome.status).toBe("answer-failure");
    expect(run.accepted).toHaveLength(0);
  });

  it("accepts when the independent working and the answer key agree", () => {
    const run = validateFamilies(
      [
        family([
          {
            key: "a",
            invalidReason: null,
            expectedResponse: () => ({ kind: "numeric", text: "17" }) as RawResponse,
            build: () => draft()
          }
        ])
      ],
      library
    );
    expect(run.results[0]!.outcome.status).toBe("accepted");
  });

  it("catches a structural answer naming something that is not on the list", () => {
    // An ordering whose answer names an item nobody can pick. The family states
    // the order it means; the question publishes a different one.
    const run = validateFamilies(
      [
        family([
          candidate(
            "a",
            () =>
              draft({
                interaction: "ordering",
                items: [
                  { id: "it.a", text: "first" },
                  { id: "it.b", text: "second" }
                ],
                answer: { kind: "ordering", correctOrder: ["it.a", "it.missing"] }
              }),
            null,
            () => ({ kind: "ordering", order: ["it.a", "it.b"] })
          )
        ])
      ],
      library
    );
    expect(run.results[0]!.outcome.status).toBe("answer-failure");
  });

  it("catches a question the schema will not accept", () => {
    const run = validateFamilies([family([candidate("a", () => draft({ prompt: "" }))])], library);
    expect(run.results[0]!.outcome.status).toBe("schema-failure");
  });

  it("catches a question with no usable text equivalent", () => {
    const run = validateFamilies([family([candidate("a", () => draft({ accessibilityDescription: "A sum." }))])], library);
    expect(run.results[0]!.outcome.status).toBe("missing-accessibility");
  });

  it("catches a misconception the content never declared", () => {
    const run = validateFamilies(
      [family([candidate("a", () => draft({ misconceptionIds: ["mc.invented"] }))])],
      library
    );
    expect(run.results[0]!.outcome.status).toBe("missing-misconception-mapping");
  });

  it("catches a distractor tagging a misconception its question does not declare", () => {
    // The tag would inflate a misconception count while the engine, which walks
    // question.misconceptionIds, never runs its detector.
    const run = validateFamilies(
      [
        family([
          candidate(
            "a",
            () =>
              draft({
                interaction: "multiple-choice",
                choices: [
                  { id: "ch.a", text: "17" },
                  { id: "ch.b", text: "7", misconceptionId: "mc.carry-dropped" }
                ],
                answer: { kind: "choice", correctChoiceIds: ["ch.a"] }
              }),
            null,
            () => ({ kind: "choice", choiceIds: ["ch.a"] })
          )
        ])
      ],
      library
    );
    expect(run.results[0]!.outcome.status).toBe("missing-misconception-mapping");
  });

  it("catches the same question emitted twice", () => {
    const run = validateFamilies(
      [family([candidate("a", () => draft()), candidate("b", () => draft({ id: "q.gen.test.two" }))])],
      library
    );
    expect(run.results[0]!.outcome.status).toBe("accepted");
    expect(run.results[1]!.outcome.status).toBe("exact-duplicate");
  });

  it("catches the same question with the nouns swapped and the wording changed", () => {
    // This is the renaming trick §4 names: identical numbers, identical task,
    // different scenery. It must not count twice.
    const run = validateFamilies(
      [
        family([
          candidate("a", () => draft()),
          candidate("b", () =>
            draft({
              id: "q.gen.test.two",
              prompt: "The morning barrel store holds 12 barrels and the evening barrel store holds 5. How many in total?"
            })
          )
        ])
      ],
      library
    );
    expect(run.results[0]!.outcome.status).toBe("accepted");
    expect(run.results[1]!.outcome.status).toBe("near-duplicate");
  });

  it("does not treat a genuinely different question as a duplicate", () => {
    const run = validateFamilies(
      [
        family([
          candidate("a", () => draft()),
          candidate(
            "b",
            () =>
              draft({
                id: "q.gen.test.two",
                prompt: "The north jetty holds 30 crates and the south jetty holds 8. How many altogether?",
                answer: { kind: "numeric", value: 38, tolerance: 0 },
                explanation: "30 + 8 = 38."
              }),
            null,
            () => ({ kind: "numeric", text: "38" })
          )
        ])
      ],
      library
    );
    expect(run.results.map((r) => r.outcome.status)).toEqual(["accepted", "accepted"]);
  });

  it("will not let a generator re-emit an authored question", () => {
    const authored = [...content.questions.values()];
    const clone = authored.find(
      (q) => q.interaction === "numeric-input" && (q.accessibilityDescription ?? "").length >= 20
    )!;
    const run = validateFamilies(
      [
        family([
          candidate(
            "a",
            () => ({ ...clone, id: "q.gen.test.clone" }),
            null,
            () => correctResponseFor(clone)!
          )
        ])
      ],
      { ...library, ...fingerprintAuthored(authored) }
    );
    expect(run.results[0]!.outcome.status).toBe("exact-duplicate");
  });
});

describe("the three fingerprints answer three different questions", () => {
  const first = QuestionSchema.parse(draft());
  const renamed = QuestionSchema.parse(
    draft({
      id: "q.b",
      prompt: "The morning barrel store holds 12 barrels and the evening barrel store holds 5. How many in total?"
    })
  );
  const renumbered = QuestionSchema.parse(
    draft({
      id: "q.c",
      prompt: "The north jetty holds 30 crates and the south jetty holds 8. How many altogether?",
      answer: { kind: "numeric", value: 38, tolerance: 0 }
    })
  );

  it("treats a renamed clone as a near duplicate but not an exact one", () => {
    expect(exactFingerprint(first)).not.toBe(exactFingerprint(renamed));
    expect(nearDuplicateFingerprint(first)).toBe(nearDuplicateFingerprint(renamed));
  });

  it("treats different numbers as a different question, not a duplicate", () => {
    expect(nearDuplicateFingerprint(first)).not.toBe(nearDuplicateFingerprint(renumbered));
  });

  it("treats different numbers as the same reasoning shape", () => {
    // Which is why shape is a diversity metric and not a rejection rule: these
    // two are legitimate variants, but a topic made only of them fails §4.
    expect(reasoningShape(first)).toBe(reasoningShape(renumbered));
  });

  it("keeps numbers when comparing wording, and drops them when comparing shape", () => {
    expect(normalizeKeepingNumbers("The quay held 12 crates")).toContain("#12");
    expect(normalizeText("The quay held 12 crates")).not.toContain("12");
  });

  it("reads 0.50 and 0.5 as the same number", () => {
    expect(normalizeKeepingNumbers("a share of 0.50")).toBe(normalizeKeepingNumbers("a share of 0.5"));
  });
});
