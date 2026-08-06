/**
 * Driving a lesson through the real session engine.
 *
 * Shared by the per-module integration tests (`module1-lessons.test.ts`,
 * `module2-lessons.test.ts`, …) so each of those files carries only what is
 * genuinely specific to its module — the misconceptions it declares and the
 * exact wrong answer that triggers each one. The mechanics of playing a lesson
 * are identical everywhere and should not be re-typed per module, where they
 * would drift.
 *
 * Answers come from `correctResponseFor`, not a hand-written table, so a
 * question added to a lesson is exercised here automatically rather than
 * silently skipped.
 */
import { expect } from "vitest";
import type { ContentBundle } from "../../src/core/curriculum/loader";
import { advance, startLesson, submitAnswer } from "../../src/renderer/state/session";
import { createEmptySave, type SaveFile } from "../../src/shared/schemas";
import { correctResponseFor } from "./responses";

export function freshSave(id: string, name: string): SaveFile {
  return createEmptySave({
    id,
    name,
    createdAt: new Date().toISOString(),
    isGuest: false,
    avatarSeed: 0
  });
}

/** Answers every question of a lesson correctly, returning the resulting save. */
export function playLesson(
  content: ContentBundle,
  save: SaveFile,
  lessonId: string,
  startMs: number
): SaveFile {
  let current = save;
  let session = startLesson(content, lessonId, startMs)!;
  expect(session, `${lessonId} would not start`).toBeTruthy();
  let t = startMs;
  let guard = 0;

  while (!session.finished) {
    expect(guard++, `${lessonId} session did not terminate`).toBeLessThan(50);
    const qid = session.questionQueue[session.currentIndex]!;
    const question = content.questions.get(qid);
    expect(question, `${lessonId} asks missing question ${qid}`).toBeDefined();

    const submitted = submitAnswer(content, current, session, correctResponseFor(question!), t)!;
    expect(submitted.feedback.correct, `${qid} could not be answered correctly`).toBe(true);
    current = submitted.save;
    session = submitted.session;

    const adv = advance(content, current, session, t + 500);
    current = adv.save;
    session = adv.session;
    t += 1000;
  }

  expect(current.lessonProgress[lessonId]?.status, `${lessonId} did not complete`).toBe("completed");
  return current;
}

/** The distinct skills a lesson teaches, via its objectives. */
export function skillsOfLesson(content: ContentBundle, lessonId: string): string[] {
  const lesson = content.curriculum.lessons.find((l) => l.id === lessonId);
  if (!lesson) return [];
  return [
    ...new Set(
      lesson.objectiveIds.flatMap(
        (oid) => content.curriculum.objectives.find((o) => o.id === oid)?.skillIds ?? []
      )
    )
  ];
}
