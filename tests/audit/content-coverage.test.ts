/**
 * S2-09: the interaction-count rules of `STAGE2_RECONSTRUCTION_SCOPE.md` §4,
 * enforced.
 *
 * The scope is unusually specific about how this can be faked, so the checks
 * below are aimed at those failure modes rather than at the happy path:
 *
 *  - a topic with no generators **vanishing** from the report instead of failing
 *    in it;
 *  - the seven metrics being used interchangeably;
 *  - a hundred numeric variants of one reasoning pattern counting as a hundred
 *    interactions;
 *  - counted-but-unreachable questions padding a total.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadPlayableContent, loadShippedContent } from "../../src/content";
import { generatedRun, resetGenerated } from "../../src/content/generated";
import { PARTS_TOPICS, allGeneratorFamilies } from "../../src/content/generators";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { buildLibrary, classifyMisconception } from "../../src/core/misconceptions/engine";
import { evaluateResponse } from "../../src/core/questions/evaluators";
import { normalizeResponse } from "../../src/core/questions/normalize";
import type { RawResponse } from "../../src/core/questions/types";
import { partsFamilies } from "../../src/content/generators/parts";
import {
  MAX_SINGLE_SHAPE_SHARE,
  REQUIRED_INTERACTIONS_PER_TOPIC,
  REQUIRED_REASONING_FAMILIES,
  buildCoverageReport,
  topicsFromCurriculum
} from "../../src/core/generation/report";
import { REASONING_FAMILIES } from "../../src/core/generation/reasoning-families";
import { pickQuestionForSkill } from "../../src/core/spaced-repetition/review-queue";
import { createEmptySave, type Question } from "../../src/shared/schemas";
import { COMPLETE_TOPICS } from "../helpers/complete-topics";

const content = loadShippedContent();
const authored = [...content.questions.values()];
const families = allGeneratorFamilies();
const run = generatedRun(authored, content.misconceptions, content.remediations);
const reports = buildCoverageReport({
  curriculum: content.curriculum,
  authored,
  families,
  results: run.results,
  accepted: run.accepted
});
const byTopic = new Map(reports.map((r) => [r.skillId, r]));

/**
 * The answer a learner holding `id` would give, read from the question's own
 * declaration of where that misconception lives.
 *
 * Reading it from the question is safe here because the question is not the
 * thing under test — the *engine* is. The question says "this option means
 * axes-swapped"; the check is whether the engine agrees when someone picks it.
 * Returns null when the question gives a learner no way to express the
 * misconception at all, which is itself the failure.
 */
function misconceptionResponseFor(question: Question, id: string): RawResponse | null {
  const tagged = (question.choices ?? []).find((c) => c.misconceptionId === id);
  if (tagged) return { kind: "choice", choiceIds: [tagged.id] };
  if (question.answer.kind === "point") {
    const spot = question.answer.misconceptionPoints.find((p) => p.misconceptionId === id);
    if (spot) return spot.y === undefined ? { kind: "point", x: spot.x } : { kind: "point", x: spot.x, y: spot.y };
    if (question.answer.swappedAxesMisconceptionId === id && question.answer.y !== undefined) {
      return { kind: "point", x: question.answer.y, y: question.answer.x };
    }
  }
  return null;
}


describe("the report is built from the curriculum, not from the generators", () => {
  it("has a row for every topic the curriculum graph defines", () => {
    const expected = topicsFromCurriculum(content.curriculum).map((t) => t.skillId).sort();
    expect(reports.map((r) => r.skillId).sort()).toEqual(expected);
  });

  it("reports topics with zero generators as failures rather than omitting them", () => {
    // The scope names this exactly: "A topic with zero generators must appear in
    // the report as a failure, not vanish from it."
    const ungenerated = reports.filter((r) => r.generatorFamilies === 0);
    expect(ungenerated.length, "every topic now has a generator — update this check").toBeGreaterThan(0);
    for (const r of ungenerated) {
      expect(r.failures.join(" "), `${r.skillId} has no generators but does not say so`).toContain(
        "no generator families"
      );
    }
  });

  it("never lets a generator invent a topic the curriculum does not teach", () => {
    const known = new Set(topicsFromCurriculum(content.curriculum).map((t) => t.skillId));
    for (const family of families) {
      for (const skillId of family.skillIds) {
        expect(known.has(skillId), `${family.id} generates for ${skillId}, which no lesson teaches`).toBe(true);
      }
    }
  });

  it("declares a real reasoning family for every generator", () => {
    for (const family of families) {
      expect(
        (REASONING_FAMILIES as readonly string[]).includes(family.reasoningFamily),
        `${family.id} claims unknown reasoning family ${family.reasoningFamily}`
      ).toBe(true);
    }
  });
});

describe("the seven metrics stay distinct", () => {
  it("never reports more valid combinations than raw ones", () => {
    for (const r of reports) {
      expect(r.validCombinations, `${r.skillId}`).toBeLessThanOrEqual(r.rawCombinations);
    }
  });

  it("never reports more validated interactions than valid combinations", () => {
    for (const r of reports) {
      expect(r.validatedGenerated, `${r.skillId}`).toBeLessThanOrEqual(r.validCombinations);
    }
  });

  it("computes the total as authored plus validated generated, and nothing else", () => {
    for (const r of reports) {
      expect(r.totalAvailable, `${r.skillId}`).toBe(r.authoredRecords + r.validatedGenerated);
    }
  });

  it("accounts for every raw combination exactly once", () => {
    // Raw = invalid + (everything that reached validation). If these disagree,
    // some candidates are being counted twice or dropped from the report.
    for (const r of reports) {
      const x = r.rejections;
      const accountedAfterValidity =
        x.schemaFailures +
        x.answerFailures +
        x.missingAccessibility +
        x.missingMisconceptionMapping +
        x.exactDuplicates +
        x.nearDuplicates +
        r.validatedGenerated;
      expect(r.validCombinations, `${r.skillId} valid combinations`).toBe(accountedAfterValidity);
      expect(r.rawCombinations, `${r.skillId} raw combinations`).toBe(
        x.invalidCombinations + r.validCombinations
      );
    }
  });

  it("gives a reason for every invalid combination it counts", () => {
    for (const r of reports) {
      const summed = Object.values(r.rejections.invalidReasons).reduce((a, b) => a + b, 0);
      expect(summed, `${r.skillId} counts invalid combinations without reasons`).toBe(
        r.rejections.invalidCombinations
      );
    }
  });
});

describe("a rejection is a design decision or a defect, and they are not the same", () => {
  // `invalidCombinations` is a generator saying "that is not a question this
  // topic should ask" — design, and reported with a reason. The rest are the
  // pipeline saying "this generator is broken", and a shipped generator must
  // produce none of them.
  //
  // Nothing said so until a probe made one form's independent working repeat the
  // very mistake its own trap describes. Sixty-eight generated answers then
  // disagreed with their own keys, every one was silently dropped, and the topic
  // still reported **zero failures** — it had interactions to spare, so it
  // cleared all three §4 bars while shipping a broken generator.
  const DEFECTS = [
    "schemaFailures",
    "answerFailures",
    "missingAccessibility",
    "missingMisconceptionMapping",
    // A generator enumerating the same question twice is a bug in its own
    // enumeration. Near-duplicates are not on this list: different parameters
    // can legitimately land on the same question, and rejecting one is the gate
    // working.
    "exactDuplicates"
  ] as const;

  for (const kind of DEFECTS) {
    it(`no shipped generator produces ${kind}`, () => {
      for (const r of reports) {
        expect(r.rejections[kind], `${r.skillId} — fix the generator, not this check`).toBe(0);
      }
    });
  }
});

describe("a declared misconception is one the engine can actually report", () => {
  // Declaring a misconception is cheap; making one *reachable* is not. A tag
  // whose detector cannot fire for the question's answer kind inflates a mapping
  // count and does nothing for the learner, and reading the tag back off the
  // question would never catch it. So this drives the real evaluator and the real
  // classifier with the response a learner holding that misconception would give,
  // and requires the engine to name it.
  //
  // Scoped to generated questions on purpose. Several authored questions declare
  // misconceptions detected from the *typed value* rather than from a tag, so a
  // blanket "must be named inside the question" rule would be false for them —
  // see the open finding in the backlog.
  const library = buildLibrary([...content.misconceptions], [...content.remediations]);
  const declaring = run.accepted.filter((q) => q.misconceptionIds.length > 0);

  beforeAll(() => {
    clearDetectors();
    registerBuiltInDetectors();
  });

  it("generates questions that declare misconceptions at all", () => {
    // Until this cycle every shipped generator declared an empty list, so the
    // accepting side of the misconception gate had never been exercised.
    expect(declaring.length, "no generated question declares a misconception").toBeGreaterThan(0);
  });

  it("names the misconception when a learner gives exactly that wrong answer", () => {
    for (const question of declaring) {
      for (const id of question.misconceptionIds) {
        const wrong = misconceptionResponseFor(question, id);
        expect(wrong, `${question.id} declares ${id} but offers a learner no way to express it`).not.toBeNull();
        const evaluation = evaluateResponse(question, normalizeResponse(wrong!));
        expect(evaluation.correct, `${question.id}: the ${id} response is being marked correct`).toBe(false);
        const found = classifyMisconception(question, library, {
          question,
          response: normalizeResponse(wrong!),
          evaluation
        });
        expect(found?.id, `${question.id}: the engine did not report ${id} for its own wrong answer`).toBe(id);
      }
    }
  });
});

describe("the part/whole generators state a mistake that is actually a mistake", () => {
  it("never asks a learner to spot an error in a value that is correct", () => {
    // Each form invites one characteristic slip, and for some parts that slip
    // lands on the right answer anyway — a half is a half whichever side of the
    // hold you count. Those parts must be excluded, or the question has no
    // error in it and its stated answer is wrong.
    for (const [topic, form] of PARTS_TOPICS) {
      const errors = partsFamilies(topic, form).find((f) => f.reasoningFamily === "error-identification")!;
      for (const candidate of errors.enumerate()) {
        if (candidate.invalidReason !== null) continue;
        const [part, whole] = candidate.key.split("-").map(Number) as [number, number];
        expect(
          Math.abs(form.trap.wrong({ part, whole }) - form.value({ part, whole })),
          `${topic.slug}: the "mistake" shown for ${part} of ${whole} is the correct value`
        ).toBeGreaterThan(1e-9);
      }
    }
  });
});

describe("topics declared Complete under §4 genuinely meet it", () => {
  it("names only topics the curriculum defines", () => {
    for (const skillId of COMPLETE_TOPICS) {
      expect(byTopic.get(skillId), `${skillId} is declared Complete but is not a curriculum topic`).toBeDefined();
    }
    expect(new Set(COMPLETE_TOPICS).size).toBe(COMPLETE_TOPICS.length);
  });

  it(`has at least ${REQUIRED_INTERACTIONS_PER_TOPIC} validated available interactions each`, () => {
    for (const skillId of COMPLETE_TOPICS) {
      const r = byTopic.get(skillId)!;
      expect(r.totalAvailable, `${skillId}`).toBeGreaterThanOrEqual(REQUIRED_INTERACTIONS_PER_TOPIC);
    }
  });

  it(`spans at least ${REQUIRED_REASONING_FAMILIES} reasoning families each`, () => {
    for (const skillId of COMPLETE_TOPICS) {
      const r = byTopic.get(skillId)!;
      expect(r.reasoningFamilies.length, `${skillId}: ${r.reasoningFamilies.join(", ")}`).toBeGreaterThanOrEqual(
        REQUIRED_REASONING_FAMILIES
      );
    }
  });

  it("is not mostly one reasoning shape wearing different numbers", () => {
    for (const skillId of COMPLETE_TOPICS) {
      const r = byTopic.get(skillId)!;
      expect(r.largestShapeShare, `${skillId} is dominated by a single reasoning shape`).toBeLessThanOrEqual(
        MAX_SINGLE_SHAPE_SHARE
      );
    }
  });

  it("reports no failures at all for them", () => {
    for (const skillId of COMPLETE_TOPICS) {
      const r = byTopic.get(skillId)!;
      expect(r.failures, `${skillId}: ${r.failures.join("; ")}`).toEqual([]);
    }
  });

  it("shows every other topic as failing, so none is quietly claimed", () => {
    for (const r of reports) {
      if (COMPLETE_TOPICS.includes(r.skillId)) continue;
      expect(r.failures.length, `${r.skillId} passes §4 but is not declared Complete`).toBeGreaterThan(0);
    }
  });
});

describe("generated interactions are available, not merely counted", () => {
  it("puts every accepted question into the playable bundle", () => {
    resetGenerated();
    const playable = loadPlayableContent();
    const regenerated = generatedRun(authored, content.misconceptions, content.remediations);
    for (const q of regenerated.accepted) {
      expect(playable.questions.get(q.id), `${q.id} was validated but is not playable`).toBeDefined();
    }
    expect(playable.questions.size).toBe(content.questions.size + regenerated.accepted.length);
  });

  it("never collides with an authored id", () => {
    for (const q of run.accepted) {
      expect(q.id.startsWith("q.gen."), `${q.id} is generated but not marked as such`).toBe(true);
      expect(content.questions.has(q.id), `${q.id} collides with an authored question`).toBe(false);
    }
  });

  it("never smuggles a generated question into a lesson", () => {
    // Lessons stay hand-authored. A generated id appearing in a lesson would mean
    // the §5 structure audit was checking content nobody wrote.
    const generatedIds = new Set(run.accepted.map((q) => q.id));
    for (const lesson of content.curriculum.lessons) {
      for (const qid of lesson.questionIds) {
        expect(generatedIds.has(qid), `${lesson.id} asks generated question ${qid}`).toBe(false);
      }
    }
  });

  it("can be reached by the spaced-review queue", () => {
    // This is what makes them "available". If review could not pick one, they
    // would be a number in a report and nothing else.
    resetGenerated();
    const playable = loadPlayableContent();
    const save = createEmptySave({
      id: "p.coverage",
      name: "Coverage",
      createdAt: new Date().toISOString(),
      isGuest: false,
      avatarSeed: 0
    });
    for (const skillId of COMPLETE_TOPICS) {
      const picked = pickQuestionForSkill(playable.questions, save, skillId);
      expect(picked, `review can offer nothing for ${skillId}`).not.toBeNull();
      expect(picked!.skillIds).toContain(skillId);
    }
  });
});

describe("generation is deterministic", () => {
  it("produces the same questions every run", () => {
    resetGenerated();
    const first = generatedRun(authored, content.misconceptions, content.remediations);
    const firstIds = first.accepted.map((q) => q.id);
    resetGenerated();
    const second = generatedRun(authored, content.misconceptions, content.remediations);
    expect(second.accepted.map((q) => q.id)).toEqual(firstIds);
  });

  it("emits no duplicate ids", () => {
    const ids = run.accepted.map((q) => q.id);
    expect(new Set(ids).size, "two generated questions share an id").toBe(ids.length);
  });
});
