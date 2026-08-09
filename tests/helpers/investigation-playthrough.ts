/**
 * Playing a boss investigation through the real session engine.
 *
 * Shared for the same reason `lesson-playthrough.ts` is shared: several suites
 * need a completed Region 1, and a completed Region 1 now means every lesson
 * **and** the case closed. A helper that hand-wrote `investigationProgress`
 * would prove nothing — it would assert that a record the test itself invented
 * satisfies a rule the test also invented. So every step is argued by answering
 * its questions, exactly as a learner would.
 */
import { expect } from "vitest";
import type { ContentBundle } from "../../src/core/curriculum/loader";
import { advance, currentQuestion, startInvestigationStep, submitAnswer } from "../../src/renderer/state/session";
import { beginInvestigation } from "../../src/core/investigations/engine";
import type { SaveFile } from "../../src/shared/schemas";
import { correctResponseFor } from "./responses";

/** Answers every question of one step correctly, through the real engine. */
export function playInvestigationStep(
  content: ContentBundle,
  save: SaveFile,
  investigationId: string,
  stepIndex: number,
  startMs: number
): SaveFile {
  let session = startInvestigationStep(content, investigationId, stepIndex, startMs);
  expect(session, `investigation ${investigationId} step ${stepIndex} should exist`).not.toBeNull();
  let current = save;
  let clock = startMs;
  let guard = 0;

  while (session && !session.finished) {
    expect(guard++, `investigation step ${stepIndex} did not terminate`).toBeLessThan(100);
    const question = currentQuestion(content, session);
    expect(question, `question missing in step ${stepIndex}`).not.toBeNull();

    clock += 1000;
    const result = submitAnswer(content, current, session, correctResponseFor(question!), clock);
    expect(result, `submitAnswer returned null in step ${stepIndex}`).not.toBeNull();
    expect(result!.feedback.correct, `expected a correct answer for ${question!.id}`).toBe(true);
    current = result!.save;

    clock += 1000;
    const next = advance(content, current, result!.session, clock);
    current = next.save;
    session = next.session;
  }
  return current;
}

/** Opens the case and argues every step in order. */
export function playInvestigation(
  content: ContentBundle,
  save: SaveFile,
  investigationId: string,
  startMs: number
): SaveFile {
  const investigation = content.curriculum.investigations.find((i) => i.id === investigationId);
  expect(investigation, `investigation ${investigationId} should exist`).toBeDefined();

  let current = beginInvestigation(save, investigation!, new Date(startMs));
  let clock = startMs;
  for (let i = 0; i < investigation!.steps.length; i++) {
    current = playInvestigationStep(content, current, investigationId, i, clock);
    clock += 100_000;
  }

  expect(current.investigationProgress[investigationId]?.status).toBe("completed");
  return current;
}
