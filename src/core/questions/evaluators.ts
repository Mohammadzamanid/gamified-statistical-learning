import type { AnswerSpec, Question } from "../../shared/schemas";
import { approxEqual } from "../../shared/utilities/numeric";
import { classifyStepValue, stepValueMatches } from "./step-calculation";
import { classifyPoint, isAxesSwapped, pointMatches } from "./point-placement";
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
    case "point": {
      if (response.kind !== "point") return { correct: false, signals: { responseKindMismatch: true } };
      const target = {
        x: answer.x,
        y: answer.y,
        toleranceX: answer.toleranceX,
        toleranceY: answer.toleranceY
      };
      const spec = {
        ...target,
        misconceptionPoints: answer.misconceptionPoints,
        swappedAxesMisconceptionId: answer.swappedAxesMisconceptionId
      };
      const misconceptionId = classifyPoint(spec, response);
      signals.placedX = response.x;
      signals.placedY = response.y;
      signals.targetX = answer.x;
      signals.targetY = answer.y ?? null;
      signals.offsetX = response.x - answer.x;
      signals.offsetY = answer.y === undefined || response.y === null ? null : response.y - answer.y;
      signals.axesSwapped = isAxesSwapped(target, response);
      signals.pointMisconceptionIds = misconceptionId ? [misconceptionId] : [];
      return { correct: pointMatches(target, response), signals };
    }
    case "steps": {
      if (response.kind !== "steps") return { correct: false, signals: { responseKindMismatch: true } };
      const submitted = new Map(response.steps.map((s) => [s.stepId, s]));
      const stepResults = answer.steps.map((step) => {
        const got = submitted.get(step.id);
        return {
          stepId: step.id,
          value: got?.value ?? null,
          correct: got !== undefined && stepValueMatches(step, got.value),
          misconceptionId: got ? classifyStepValue(step, got.value) : null
        };
      });
      signals.stepResults = stepResults;
      signals.firstFailedStepId = stepResults.find((r) => !r.correct)?.stepId ?? null;
      signals.stepMisconceptionIds = stepResults
        .map((r) => r.misconceptionId)
        .filter((id): id is string => id !== null);
      // Every step must be present and correct — a partially worked run is not a correct answer.
      const correct = stepResults.length === answer.steps.length && stepResults.every((r) => r.correct);
      return { correct, signals };
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
