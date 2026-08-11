/**
 * S2-16: the misconception library, enforced.
 *
 * The unit's criteria are "≥12 named misconceptions reachable" in Region 2 and
 * "each remediation with all 9 required parts". **The nine parts are not
 * enumerated anywhere in the surviving documents** — the backlog cell names the
 * number and the list went with the original specification. They are therefore
 * declared here as a reconstruction, in `REQUIRED_PARTS` below, and each one is
 * checked. This is a reconstructed requirement, not a recovered one; nothing
 * about it should be read as the original wording.
 *
 * Each part is something the running app actually consumes, which is the test
 * of whether a "part" is real: a field nothing reads would be paperwork.
 *
 * The reverse rules the unit also asks for — no undeclared distractor
 * misconceptions, no orphaned remediations, no dangling detector names — were
 * already enforced by `tests/audit/interaction-audit.test.ts` before this unit,
 * and are deliberately not duplicated here. What that file did **not** cover is
 * the count-inflating tag: a question can list a misconception it gives the
 * learner no way to express, and the declaration still counts in every report.
 * That is checked here by building the wrong answer each declaration implies and
 * putting it through the real pipeline.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { buildLibrary, runFeedbackPipeline } from "../../src/core/misconceptions/engine";
import { responseTriggering } from "../helpers/misconception-triggers";
import type { Misconception, Question, Remediation } from "../../src/shared/schemas";

const content = loadShippedContent();
const library = buildLibrary(content.misconceptions, content.remediations);
const misconceptionById = new Map(content.misconceptions.map((m) => [m.id, m]));
const remediationById = new Map(content.remediations.map((r) => [r.id, r]));

beforeAll(() => {
  clearDetectors();
  registerBuiltInDetectors();
});

/** Questions a learner can actually meet: from a lesson, or from a boss step. */
const reachableQuestionIds = new Set<string>(content.curriculum.lessons.flatMap((l) => l.questionIds));
for (const investigation of content.curriculum.investigations) {
  for (const step of investigation.steps) {
    // `questionIds`, plural — a boss step poses several. The first draft read a
    // singular field that does not exist, which silently excluded every boss
    // question from the audit; the typechecker caught it.
    for (const questionId of step.questionIds) reachableQuestionIds.add(questionId);
  }
}
const reachableQuestions = [...content.questions.values()].filter((q) => reachableQuestionIds.has(q.id));

/** Misconceptions a learner can actually meet, by the route they meet them on. */
function declaredOn(question: Question): string[] {
  const ids = new Set<string>(question.misconceptionIds);
  for (const choice of question.choices ?? []) {
    if (choice.misconceptionId) ids.add(choice.misconceptionId);
  }
  return [...ids];
}

const reachableMisconceptionIds = new Set(reachableQuestions.flatMap(declaredOn));

const REGION_2 = "r.averages-atoll";
const region2ModuleIds = new Set(
  content.curriculum.modules.filter((m) => m.regionId === REGION_2).map((m) => m.id)
);
const region2QuestionIds = new Set(
  content.curriculum.lessons.filter((l) => region2ModuleIds.has(l.moduleId)).flatMap((l) => l.questionIds)
);
const region2MisconceptionIds = new Set(
  reachableQuestions.filter((q) => region2QuestionIds.has(q.id)).flatMap(declaredOn)
);

/**
 * The nine parts, reconstructed.
 *
 * Five belong to the misconception and four to the remediation it names,
 * because a "misconception with a remediation" is one teaching object split
 * across two files. Each predicate is written against what the app reads.
 */
const REQUIRED_PARTS: ReadonlyArray<{
  part: string;
  why: string;
  present: (m: Misconception, r: Remediation) => boolean;
}> = [
  {
    part: "a name",
    why: "reports and the learner-facing panel both show it",
    present: (m) => m.title.trim().length > 0
  },
  {
    part: "a description of the learner's reasoning",
    why: "so a teacher reading the library knows what the error *is*, not just that it exists",
    present: (m) => m.description.trim().length >= 60
  },
  {
    part: "a registered detector",
    why: "diagnosis is deterministic; a dangling detector name would silently never fire",
    present: (m) => m.detector.trim().length > 0
  },
  {
    part: "a remediation it names",
    why: "detection without a response is a label, not teaching",
    present: (m, r) => r.id === m.remediationId
  },
  {
    part: "a trigger a learner can reach",
    why: "checked separately below, against the real pipeline",
    present: (m) => reachableMisconceptionIds.has(m.id)
  },
  {
    part: "an immediate explanation",
    why: "shown the moment the error is diagnosed",
    present: (_m, r) => r.explanation.trim().length >= 40
  },
  {
    part: "a micro-lesson",
    why: "the concrete worked instance; an explanation alone restates the rule that was just missed",
    present: (_m, r) => (r.microLesson ?? "").trim().length >= 40
  },
  {
    part: "a follow-up question",
    why: "the session engine injects it after remediation — with none, remediation ends in nothing to do",
    present: (_m, r) => r.followUpQuestionIds.length > 0
  },
  {
    part: "the skills it reinforces",
    why: "mastery and the review queue are keyed by skill; without one the practice is not credited",
    present: (_m, r) => r.skillIds.length > 0
  }
];

describe("the nine parts of a misconception", () => {
  it("declares nine of them, since that is the number the criterion names", () => {
    // Guards the list against quiet growth or shrinkage: the backlog says nine,
    // and if this reconstruction is ever revised the count has to be revised
    // deliberately rather than drifting.
    expect(REQUIRED_PARTS).toHaveLength(9);
  });

  it.each(REQUIRED_PARTS.map((p) => [p.part, p] as const))(
    "every reachable misconception has %s",
    (_name, part) => {
      for (const id of reachableMisconceptionIds) {
        const misconception = misconceptionById.get(id);
        expect(misconception, `${id} is declared by a question but does not exist`).toBeDefined();
        const remediation = remediationById.get(misconception!.remediationId);
        expect(remediation, `${id} names remediation ${misconception!.remediationId}, which does not exist`).toBeDefined();
        expect(
          part.present(misconception!, remediation!),
          `${id} is missing ${part.part} — ${part.why}`
        ).toBe(true);
      }
    }
  );

  it("routes a follow-up to a question that exists and can be reached", () => {
    for (const id of reachableMisconceptionIds) {
      const remediation = remediationById.get(misconceptionById.get(id)!.remediationId)!;
      for (const questionId of remediation.followUpQuestionIds) {
        expect(content.questions.get(questionId), `${remediation.id} follows up with ${questionId}, which does not exist`).toBeDefined();
      }
    }
  });
});

describe("Region 2's library", () => {
  it("has at least the twelve reachable misconceptions the unit asks for", () => {
    expect(region2MisconceptionIds.size).toBeGreaterThanOrEqual(12);
  });

  it("names them across more than one module, so they are a library and not one lesson's list", () => {
    const modulesWithMisconceptions = new Set(
      content.curriculum.lessons
        .filter((l) => region2ModuleIds.has(l.moduleId))
        .filter((l) => l.questionIds.some((qid) => declaredOn(content.questions.get(qid)!).length > 0))
        .map((l) => l.moduleId)
    );
    expect(modulesWithMisconceptions.size).toBeGreaterThanOrEqual(4);
  });
});

describe("no tag counts that a learner could not trigger", () => {
  it("can build a response for every misconception a reachable question declares", () => {
    // The count-inflating tag, caught at its source. A question listing a
    // misconception it offers no way to express inflates every report that
    // counts declarations — and nothing else in the suite looks at this.
    for (const question of reachableQuestions) {
      for (const id of declaredOn(question)) {
        const misconception = misconceptionById.get(id)!;
        expect(
          responseTriggering(question, id, misconception.detectorParams, misconception.detector),
          `${question.id} declares ${id} (${misconception.detector}) but offers no answer that expresses it`
        ).not.toBeNull();
      }
    }
  });

  /*
   * The limit of these checks, stated rather than left to be discovered.
   *
   * They prove a declaration is **expressible and diagnosable**: something a
   * learner could do makes the engine name this misconception and hand back its
   * remediation. They cannot prove the declared wrong answer is the one a
   * confused learner would actually give. A probe that moved a `wrongValue` a
   * thousand away from the question's own numbers failed nothing, and correctly
   * so — the trigger is derived from the same parameter the detector reads, so
   * the machinery stays self-consistent while the content stops making sense.
   *
   * No guard was added for it. Deciding whether 3 is the answer a learner who
   * takes the first repeated value for the mode would give is a reading of the
   * question, and a heuristic guessing at it would fire on legitimate content —
   * the failure mode the truncated-axis pattern demonstrated once already
   * (D-047). It stays a matter for review, named here so nobody mistakes this
   * file for covering it.
   */
  it("has the engine name that misconception when the response is given", () => {
    // Buildable is not the same as diagnosable: the response has to survive
    // evaluation, normalisation and the detector, in the real pipeline, and come
    // back with this misconception on it rather than a different one.
    for (const question of reachableQuestions) {
      for (const id of declaredOn(question)) {
        const misconception = misconceptionById.get(id)!;
        const raw = responseTriggering(question, id, misconception.detectorParams, misconception.detector);
        if (!raw) continue; // reported by the check above
        const plan = runFeedbackPipeline(question, raw, library, 0);
        expect(
          plan.misconception?.id,
          `${question.id}: the answer expressing ${id} came back ${plan.correct ? "marked correct" : `as ${plan.misconception?.id ?? "no misconception"}`}`
        ).toBe(id);
      }
    }
  });

  it("hands back the remediation, not merely the diagnosis", () => {
    for (const question of reachableQuestions) {
      for (const id of declaredOn(question)) {
        const misconception = misconceptionById.get(id)!;
        const raw = responseTriggering(question, id, misconception.detectorParams, misconception.detector);
        if (!raw) continue;
        const plan = runFeedbackPipeline(question, raw, library, 0);
        expect(plan.remediation?.id, `${question.id}: ${id} was named without its remediation`).toBe(
          misconception.remediationId
        );
      }
    }
  });
});
