import type { AnswerSpec, Question } from "../../shared/schemas";
import { approxEqual } from "../../shared/utilities/numeric";
import type { EvaluationResult, NormalizedResponse } from "./types";

function evalAgainst(answer: AnswerSpec, response: NormalizedResponse): { correct: boolean; signals: Record<string, unknown> } {
  const signals: Record<string, unknown> = {};

  switch (answer.kind) {
    case "choice": {
      if (response.kind !== "choice") return { correct: false, signals: { responseKindMismatch: true } };
      const expected = [...answer.correctChoiceIds].sort();
      const got = response.choiceIds;
      signals.selectedChoiceIds = got;
      const correct = expected.length === got.length && expected.every((id, i) => id === got[i]);
      return { correct, signals };
    }
    case "numeric": {
      if (response.kind !== "numeric") return { correct: false, signals: { responseKindMismatch: true } };
      signals.parsedValue = response.value;
      signals.rawText = response.rawText;
      signals.expectedValue = answer.value;
      signals.expectedUnit = answer.unit ?? null;
      signals.asProportion = answer.asProportion ?? false;
      if (response.value === null) return { correct: false, signals: { ...signals, unparseable: true } };
      const tolerance = Math.max(answer.tolerance, 1e-9);
      return { correct: approxEqual(response.value, answer.value, tolerance), signals };
    }
    case "ordering": {
      if (response.kind !== "ordering") return { correct: false, signals: { responseKindMismatch: true } };
      signals.submittedOrder = response.order;
      signals.expectedOrder = answer.correctOrder;
      const correct =
        response.order.length === answer.correctOrder.length &&
        answer.correctOrder.every((id, i) => id === response.order[i]);
      return { correct, signals };
    }
    case "matching": {
      if (response.kind !== "matching") return { correct: false, signals: { responseKindMismatch: true } };
      const expected = new Map(answer.pairs.map((p) => [p.left, p.right]));
      signals.submittedPairs = response.pairs;
      let matched = 0;
      for (const p of response.pairs) {
        if (expected.get(p.left) === p.right) matched++;
      }
      signals.matchedCount = matched;
      return { correct: matched === expected.size && response.pairs.length === expected.size, signals };
    }
    case "text": {
      if (response.kind !== "text") return { correct: false, signals: { responseKindMismatch: true } };
      const text = response.text;
      signals.text = text;
      const missing = answer.requiredKeywords.filter((k) => !text.includes(k.toLowerCase()));
      const forbidden = answer.forbiddenKeywords.filter((k) => text.includes(k.toLowerCase()));
      signals.missingKeywords = missing;
      signals.forbiddenKeywordsHit = forbidden;
      return { correct: missing.length === 0 && forbidden.length === 0, signals };
    }
  }
}

/** Evaluate against the primary answer, then each accepted alternative. */
export function evaluateResponse(question: Question, response: NormalizedResponse): EvaluationResult {
  const primary = evalAgainst(question.answer, response);
  if (primary.correct) return { correct: true, viaAlternative: false, signals: primary.signals };

  for (const alt of question.acceptedAlternatives) {
    const r = evalAgainst(alt.answer, response);
    if (r.correct) {
      return { correct: true, viaAlternative: true, signals: { ...primary.signals, acceptedAlternativeNote: alt.note ?? null } };
    }
  }
  return { correct: false, viaAlternative: false, signals: primary.signals };
}
