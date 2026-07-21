import { describe, expect, it } from "vitest";
import { QuestionSchema } from "../../src/shared/schemas";
import { normalizeResponse } from "../../src/core/questions/normalize";
import { evaluateResponse } from "../../src/core/questions/evaluators";
import { listInteractions, registerDefaultInteractions } from "../../src/core/questions/registry";

const numericQ = QuestionSchema.parse({
  id: "q.n", topicId: "t", objectiveId: "o", skillIds: ["s"], difficulty: 1,
  interaction: "numeric-input", prompt: "mean?",
  answer: { kind: "numeric", value: 5, tolerance: 0.001 },
  acceptedAlternatives: [{ answer: { kind: "numeric", value: 500, tolerance: 0.001 }, note: "percent form" }],
  explanation: "x"
});

describe("question engine", () => {
  it("evaluates numeric input incl. comma decimals and tolerance", () => {
    expect(evaluateResponse(numericQ, normalizeResponse({ kind: "numeric", text: "5" })).correct).toBe(true);
    expect(evaluateResponse(numericQ, normalizeResponse({ kind: "numeric", text: "5,0" })).correct).toBe(true);
    expect(evaluateResponse(numericQ, normalizeResponse({ kind: "numeric", text: "5.0009" })).correct).toBe(true);
    expect(evaluateResponse(numericQ, normalizeResponse({ kind: "numeric", text: "6" })).correct).toBe(false);
    const bad = evaluateResponse(numericQ, normalizeResponse({ kind: "numeric", text: "??" }));
    expect(bad.correct).toBe(false);
    expect(bad.signals["unparseable"]).toBe(true);
  });

  it("supports accepted alternatives", () => {
    const r = evaluateResponse(numericQ, normalizeResponse({ kind: "numeric", text: "500" }));
    expect(r.correct).toBe(true);
    expect(r.viaAlternative).toBe(true);
  });

  it("evaluates multi-selection as an exact set", () => {
    const q = QuestionSchema.parse({
      id: "q.m", topicId: "t", objectiveId: "o", skillIds: ["s"], difficulty: 1,
      interaction: "multiple-selection", prompt: "pick",
      choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }],
      answer: { kind: "choice", correctChoiceIds: ["a", "c"] },
      explanation: "x"
    });
    expect(evaluateResponse(q, normalizeResponse({ kind: "choice", choiceIds: ["c", "a"] })).correct).toBe(true);
    expect(evaluateResponse(q, normalizeResponse({ kind: "choice", choiceIds: ["a"] })).correct).toBe(false);
    expect(evaluateResponse(q, normalizeResponse({ kind: "choice", choiceIds: ["a", "b", "c"] })).correct).toBe(false);
  });

  it("evaluates ordering and matching", () => {
    const oq = QuestionSchema.parse({
      id: "q.o", topicId: "t", objectiveId: "o", skillIds: ["s"], difficulty: 1,
      interaction: "ordering", prompt: "order",
      items: [{ id: "i1", text: "1" }, { id: "i2", text: "2" }],
      answer: { kind: "ordering", correctOrder: ["i1", "i2"] },
      explanation: "x"
    });
    expect(evaluateResponse(oq, normalizeResponse({ kind: "ordering", order: ["i1", "i2"] })).correct).toBe(true);
    expect(evaluateResponse(oq, normalizeResponse({ kind: "ordering", order: ["i2", "i1"] })).correct).toBe(false);

    const mq = QuestionSchema.parse({
      id: "q.ma", topicId: "t", objectiveId: "o", skillIds: ["s"], difficulty: 1,
      interaction: "matching", prompt: "match",
      items: [{ id: "l1", text: "L1" }, { id: "l2", text: "L2" }],
      rightItems: [{ id: "r1", text: "R1" }, { id: "r2", text: "R2" }],
      answer: { kind: "matching", pairs: [{ left: "l1", right: "r1" }, { left: "l2", right: "r2" }] },
      explanation: "x"
    });
    expect(evaluateResponse(mq, normalizeResponse({ kind: "matching", pairs: [{ left: "l2", right: "r2" }, { left: "l1", right: "r1" }] })).correct).toBe(true);
    expect(evaluateResponse(mq, normalizeResponse({ kind: "matching", pairs: [{ left: "l1", right: "r2" }, { left: "l2", right: "r1" }] })).correct).toBe(false);
  });

  it("evaluates keyword-rubric text answers", () => {
    const tq = QuestionSchema.parse({
      id: "q.t", topicId: "t", objectiveId: "o", skillIds: ["s"], difficulty: 1,
      interaction: "short-explanation", prompt: "why",
      answer: { kind: "text", requiredKeywords: ["outlier"], forbiddenKeywords: ["always"] },
      explanation: "x"
    });
    expect(evaluateResponse(tq, normalizeResponse({ kind: "text", text: "An OUTLIER pulls the mean." })).correct).toBe(true);
    expect(evaluateResponse(tq, normalizeResponse({ kind: "text", text: "extreme values" })).correct).toBe(false);
    expect(evaluateResponse(tq, normalizeResponse({ kind: "text", text: "the outlier always wins" })).correct).toBe(false);
  });

  it("registry lists all 17 planned interactions", () => {
    registerDefaultInteractions();
    const all = listInteractions();
    expect(all.length).toBe(17);
    expect(all.filter((i) => i.implemented).length).toBeGreaterThanOrEqual(10);
  });
});
