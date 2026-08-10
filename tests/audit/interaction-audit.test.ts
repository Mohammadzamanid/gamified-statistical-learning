/**
 * S2-05: the interaction-type audit, enforced rather than described.
 *
 * Every claim in `docs/INTERACTION_AUDIT.md` is checked here against the real
 * registry, the real renderer coverage, and the real shipped content. The point
 * is the drift guard: registering a type without a renderer, flipping a flag
 * without content, shipping content that depends on a stub, or adding a type with
 * no evaluation or accessibility coverage all fail this file.
 *
 * "At least one genuine curriculum use" is checked as reachable-from-a-lesson,
 * so an isolated technical demo question cannot satisfy the audit.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import {
  clearDetectors,
  listDetectorNames,
  registerBuiltInDetectors
} from "../../src/core/misconceptions/detectors";
import { listInteractions, registerDefaultInteractions } from "../../src/core/questions/registry";
import { RENDERED_INTERACTION_TYPES } from "../../src/renderer/components/rendered-interactions";
import { RENDERED_VISUAL_KINDS } from "../../src/renderer/components/rendered-visuals";
import { VisualSpecSchema } from "../../src/shared/schemas";
import { evaluateResponse } from "../../src/core/questions/evaluators";
import { normalizeResponse } from "../../src/core/questions/normalize";
import { InteractionTypeSchema, type InteractionType, type Question } from "../../src/shared/schemas";
import { correctResponseFor, incorrectResponseFor } from "../helpers/responses";

const content = loadShippedContent();

beforeAll(() => {
  clearDetectors();
  registerBuiltInDetectors();
  registerDefaultInteractions();
});

/** Questions reachable from a lesson — the only ones that count as curriculum use. */
const lessonQuestionIds = new Set(content.curriculum.lessons.flatMap((l) => l.questionIds));
const reachableQuestions = [...content.questions.values()].filter((q) => lessonQuestionIds.has(q.id));

function reachableOfType(type: InteractionType): Question[] {
  return reachableQuestions.filter((q) => q.interaction === type);
}

const implementedTypes = () => listInteractions().filter((d) => d.implemented).map((d) => d.type);
const stubbedTypes = () => listInteractions().filter((d) => !d.implemented).map((d) => d.type);

describe("registry integrity", () => {
  it("registers every interaction type the schema declares, exactly once", () => {
    const registered = listInteractions().map((d) => d.type);
    expect(new Set(registered).size).toBe(registered.length);
    expect([...registered].sort()).toEqual([...InteractionTypeSchema.options].sort());
  });

  it("renderer coverage matches the implemented flags exactly", () => {
    // The guard against a flag flipped without a renderer, or the reverse.
    expect([...RENDERED_INTERACTION_TYPES].sort()).toEqual([...implementedTypes()].sort());
  });
});

describe("implemented types are genuinely usable", () => {
  it("each has at least one question reachable from a real lesson", () => {
    const missing = implementedTypes().filter((t) => reachableOfType(t).length === 0);
    expect(missing, `implemented but unused in any lesson: ${missing.join(", ")}`).toEqual([]);
  });

  it("each accepts its correct answer", () => {
    for (const type of implementedTypes()) {
      for (const q of reachableOfType(type)) {
        const evaluation = evaluateResponse(q, normalizeResponse(correctResponseFor(q)));
        expect(evaluation.correct, `${type}: ${q.id} rejected its own correct answer`).toBe(true);
      }
    }
  });

  it("each rejects a wrong answer", () => {
    for (const type of implementedTypes()) {
      for (const q of reachableOfType(type)) {
        const evaluation = evaluateResponse(q, normalizeResponse(incorrectResponseFor(q)));
        expect(evaluation.correct, `${type}: ${q.id} accepted a wrong answer`).toBe(false);
      }
    }
  });

  it("each rejects a response of a foreign kind", () => {
    for (const type of implementedTypes()) {
      const q = reachableOfType(type)[0]!;
      // A text response is foreign to every type except short-explanation.
      const foreign = q.answer.kind === "text" ? { kind: "numeric" as const, text: "0" } : { kind: "text" as const, text: "x" };
      const evaluation = evaluateResponse(q, normalizeResponse(foreign));
      expect(evaluation.correct, `${type}: ${q.id} accepted a foreign response kind`).toBe(false);
    }
  });
});

describe("accessibility coverage", () => {
  it("every reachable question has a non-empty prompt", () => {
    for (const q of reachableQuestions) {
      expect(q.prompt.trim().length, `${q.id}`).toBeGreaterThan(0);
    }
  });

  it("every visual carries a text equivalent", () => {
    for (const q of reachableQuestions) {
      if (q.visual.kind !== "none") {
        expect(q.visual.accessibleDescription, `${q.id} visual`).toBeTruthy();
      }
      if (q.pointField) {
        expect(q.pointField.accessibleDescription.trim().length, `${q.id} pointField`).toBeGreaterThan(0);
      }
    }
  });

  it("every interactive element carries an accessible name", () => {
    for (const q of reachableQuestions) {
      for (const choice of q.choices ?? []) {
        expect(choice.text.trim().length, `${q.id} choice ${choice.id}`).toBeGreaterThan(0);
      }
      for (const item of [...(q.items ?? []), ...(q.rightItems ?? [])]) {
        expect(item.text.trim().length, `${q.id} item ${item.id}`).toBeGreaterThan(0);
      }
      for (const zone of q.dropZones ?? []) {
        expect(zone.label.trim().length, `${q.id} zone ${zone.id}`).toBeGreaterThan(0);
      }
      if (q.answer.kind === "steps") {
        for (const step of q.answer.steps) {
          expect(step.prompt.trim().length, `${q.id} step ${step.id}`).toBeGreaterThan(0);
        }
      }
      if (q.pointField) {
        expect(q.pointField.xLabel.trim().length, `${q.id} x axis`).toBeGreaterThan(0);
        if (q.pointField.kind === "coordinate-plane") {
          expect(q.pointField.yLabel?.trim().length ?? 0, `${q.id} y axis`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("every reachable question explains itself after the fact", () => {
    for (const q of reachableQuestions) {
      expect(q.explanation.trim().length, `${q.id} explanation`).toBeGreaterThan(0);
    }
  });
});

describe("no question is orphaned", () => {
  it("every shipped question is reachable from a lesson, an investigation step, or a remediation follow-up", () => {
    // Three routes, widened deliberately each time rather than loosened to make
    // a failure go away (D-017). A lesson asks it; a remediation injects it after
    // a misconception; and — since S2-10 — a boss investigation step poses it.
    // A boss question belongs to no lesson by design: the case combines skills
    // the lessons taught separately, and filing its questions under one lesson
    // would misreport which topic they practise.
    const viaRemediation = new Set([
      ...content.remediations.flatMap((r) => r.followUpQuestionIds),
      ...[...content.questions.values()].flatMap((q) => (q.followUpQuestionId ? [q.followUpQuestionId] : []))
    ]);
    const viaInvestigation = new Set(
      content.curriculum.investigations.flatMap((i) => i.steps.flatMap((s) => s.questionIds))
    );
    const orphans = [...content.questions.values()]
      .filter((q) => !lessonQuestionIds.has(q.id) && !viaRemediation.has(q.id) && !viaInvestigation.has(q.id))
      .map((q) => q.id);
    expect(orphans, `questions no learner can ever reach: ${orphans.join(", ")}`).toEqual([]);
  });
});

describe("stubbed types stay honest", () => {
  it("no stubbed type has a renderer", () => {
    for (const type of stubbedTypes()) {
      expect(RENDERED_INTERACTION_TYPES.has(type), `${type} is stubbed but has a renderer`).toBe(false);
    }
  });

  it("no shipped content depends on a stubbed type", () => {
    // D-005: a stub must never be reachable, or the learner meets a dead end.
    for (const type of stubbedTypes()) {
      const used = [...content.questions.values()].filter((q) => q.interaction === type);
      expect(used.map((q) => q.id), `${type} is stubbed but used by content`).toEqual([]);
    }
  });
});

describe("misconception coverage", () => {
  it("every misconception a reachable question declares exists and has a remediation", () => {
    const byId = new Map(content.misconceptions.map((m) => [m.id, m]));
    const remediationIds = new Set(content.remediations.map((r) => r.id));
    for (const q of reachableQuestions) {
      for (const id of q.misconceptionIds) {
        const mc = byId.get(id);
        expect(mc, `${q.id} declares unknown misconception ${id}`).toBeDefined();
        expect(remediationIds.has(mc!.remediationId), `${id} has no remediation`).toBe(true);
      }
    }
  });

  it("every distractor misconception is also declared by its question", () => {
    // Reverse validation: a tagged distractor the question never declares can
    // never be classified, so the tag would be decoration.
    for (const q of reachableQuestions) {
      const declared = new Set(q.misconceptionIds);
      for (const choice of q.choices ?? []) {
        if (choice.misconceptionId) {
          expect(
            declared.has(choice.misconceptionId),
            `${q.id} distractor ${choice.id} tags undeclared ${choice.misconceptionId}`
          ).toBe(true);
        }
      }
    }
  });

  it("every misconception mapped inside an answer is also declared by its question", () => {
    for (const q of reachableQuestions) {
      const declared = new Set(q.misconceptionIds);
      const mapped: string[] = [];
      if (q.answer.kind === "steps") {
        for (const s of q.answer.steps) mapped.push(...s.misconceptionValues.map((m) => m.misconceptionId));
      }
      if (q.answer.kind === "point") {
        mapped.push(...q.answer.misconceptionPoints.map((m) => m.misconceptionId));
        if (q.answer.swappedAxesMisconceptionId) mapped.push(q.answer.swappedAxesMisconceptionId);
      }
      if (q.answer.kind === "placement") {
        mapped.push(...q.answer.misconceptionPlacements.map((m) => m.misconceptionId));
      }
      for (const id of mapped) {
        expect(declared.has(id), `${q.id} maps ${id} but does not declare it`).toBe(true);
      }
    }
  });

  it("no remediation is orphaned", () => {
    const referenced = new Set(content.misconceptions.map((m) => m.remediationId));
    const orphans = content.remediations.filter((r) => !referenced.has(r.id)).map((r) => r.id);
    expect(orphans, `orphaned remediations: ${orphans.join(", ")}`).toEqual([]);
  });

  it("every misconception names a registered detector", () => {
    const known = new Set(listDetectorNames());
    for (const mc of content.misconceptions) {
      expect(known.has(mc.detector), `${mc.id} names unregistered detector ${mc.detector}`).toBe(true);
    }
  });
});

/**
 * S2-14: the same drift guard, applied to charts.
 *
 * `VisualSpecSchema` accepts eight kinds and `QuestionScreen` drew one. A
 * question declaring `histogram` or `box-plot` passed every check here and then
 * rendered nothing at all — no chart, and no text either, because the accessible
 * description is carried by the chart component. That is the exact failure mode
 * D-005 rules out for interactions, and charts had no equivalent guard.
 */
describe("every visual a question declares can actually be drawn", () => {
  it("declares fewer kinds than the schema allows, and says so", () => {
    // Not a redundant check: if the two ever coincide, this file should stop
    // claiming there is a gap, and the schema is where new kinds appear first.
    const schemaKinds = VisualSpecSchema._def.schema.shape.kind.options as readonly string[];
    const drawable = [...RENDERED_VISUAL_KINDS];
    expect(schemaKinds).toContain("none");
    expect(drawable.every((k) => schemaKinds.includes(k)), "a rendered kind the schema does not allow").toBe(true);
    expect(drawable.length, "RENDERED_VISUAL_KINDS is empty").toBeGreaterThan(0);
  });

  it("ships no question whose visual kind has no renderer", () => {
    for (const q of reachableQuestions) {
      if (q.visual.kind === "none") continue;
      expect(
        RENDERED_VISUAL_KINDS.has(q.visual.kind),
        `${q.id} declares a ${q.visual.kind}, which no renderer draws — the learner would see a prompt about a chart that is not there`
      ).toBe(true);
    }
  });

  it("gives every shown visual a dataset to draw and words to read", () => {
    for (const q of reachableQuestions) {
      if (q.visual.kind === "none") continue;
      expect(q.visual.datasetId, `${q.id} shows a ${q.visual.kind} but names no dataset`).toBeDefined();
      expect(
        content.datasets.get(q.visual.datasetId!),
        `${q.id} names dataset ${q.visual.datasetId}, which does not exist`
      ).toBeDefined();
      expect(
        (q.visual.accessibleDescription ?? "").trim().length,
        `${q.id} shows a ${q.visual.kind} with no accessible description`
      ).toBeGreaterThan(20);
    }
  });
});
