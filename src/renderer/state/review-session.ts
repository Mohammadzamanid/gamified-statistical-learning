/**
 * The dedicated review session: a run through what is due, distinct from a lesson.
 *
 * Pure functions taking (content, save, now) and returning the next state, like
 * `session.ts`. Two things differ from a lesson:
 *
 * - **The clock is explicit everywhere.** Review is defined in days, so a hidden
 *   `Date.now()` would make the whole system untestable.
 * - **The session is persisted in the save.** A lesson can be restarted cheaply;
 *   an abandoned review would otherwise rebuild a *different* queue on return,
 *   dropping items already shown or adding ones that fell due meanwhile. The
 *   queue is therefore frozen when the session starts.
 */
import type { ContentBundle } from "../../core/curriculum/loader";
import { buildLibrary, runFeedbackPipeline, type FeedbackPlan } from "../../core/misconceptions/engine";
import type { RawResponse } from "../../core/questions/types";
import { applyAttempt, createSkillState } from "../../core/mastery/engine";
import { createReviewItem, updateReviewItem } from "../../core/spaced-repetition/scheduler";
import { buildReviewPlan, pickQuestionForSkill } from "../../core/spaced-repetition/review-queue";
import type { Question, ReviewSessionState, SaveFile } from "../../shared/schemas";

/** Cap so a long absence does not produce an unfinishable session. */
export const MAX_REVIEW_ITEMS = 20;

export interface ReviewSubmitResult {
  save: SaveFile;
  feedback: FeedbackPlan;
  /** The skill this answer rescheduled. */
  skillId: string;
}

/**
 * Starts a review session and writes it into the save.
 * Returns the save unchanged when nothing is due.
 */
export function startReviewSession(content: ContentBundle, save: SaveFile, now: Date): SaveFile {
  const plan = buildReviewPlan(content.curriculum, save, now);
  const skillQueue: string[] = [];
  const questionQueue: string[] = [];

  for (const candidate of plan.candidates) {
    if (skillQueue.length >= MAX_REVIEW_ITEMS) break;
    const question = pickQuestionForSkill(content.questions, save, candidate.skillId);
    // A skill with no question in the bank cannot be reviewed; skip rather than
    // stranding the session on an item it can never show.
    if (!question) continue;
    skillQueue.push(candidate.skillId);
    questionQueue.push(question.id);
  }

  if (skillQueue.length === 0) return save;

  const reviewSession: ReviewSessionState = {
    startedAt: now.toISOString(),
    skillQueue,
    questionQueue,
    currentIndex: 0,
    answeredCount: 0,
    correctCount: 0
  };
  return { ...save, reviewSession };
}

export function hasActiveReview(save: SaveFile): boolean {
  const s = save.reviewSession;
  return s !== null && s.currentIndex < s.questionQueue.length;
}

export function currentReviewQuestion(content: ContentBundle, save: SaveFile): Question | null {
  const s = save.reviewSession;
  if (!s) return null;
  const id = s.questionQueue[s.currentIndex];
  return id ? content.questions.get(id) ?? null : null;
}

export function currentReviewSkillId(save: SaveFile): string | null {
  const s = save.reviewSession;
  return s ? s.skillQueue[s.currentIndex] ?? null : null;
}

/**
 * Answers the current review item.
 *
 * Rescheduling is the point: a correct answer lengthens the interval, an
 * incorrect one resets it to a day and records a lapse. Mastery and the attempt
 * log update exactly as they do in a lesson, so review and practice are not two
 * different notions of progress.
 */
export function submitReviewAnswer(
  content: ContentBundle,
  save: SaveFile,
  raw: RawResponse,
  now: Date,
  responseMs: number,
  hintsUsed = 0
): ReviewSubmitResult | null {
  const session = save.reviewSession;
  const question = currentReviewQuestion(content, save);
  const skillId = currentReviewSkillId(save);
  if (!session || !question || !skillId) return null;

  const library = buildLibrary(content.misconceptions, content.remediations);
  const feedback = runFeedbackPipeline(question, raw, library, hintsUsed);

  // Mastery, for every skill the question exercises — the same call the lesson
  // session makes, so review and practice share one notion of progress.
  const nextStates = { ...save.skillStates };
  for (const id of question.skillIds) {
    const prev = nextStates[id] ?? createSkillState(id);
    nextStates[id] = applyAttempt(
      prev,
      {
        correct: feedback.correct,
        responseMs,
        hintsUsed,
        misconceptionId: feedback.misconception?.id ?? null,
        now,
        questionId: question.id
      },
      content.curriculum.masteryRule
    ).state;
  }

  // Reschedule the reviewed skill.
  const queue = [...save.reviewQueue];
  const index = queue.findIndex((i) => i.skillId === skillId);
  const outcome = {
    correct: feedback.correct,
    usedHints: hintsUsed > 0,
    fast: responseMs < question.estimatedSeconds * 1000
  };
  if (index === -1) queue.push(updateReviewItem(createReviewItem(skillId, now), outcome, now));
  else queue[index] = updateReviewItem(queue[index]!, outcome, now);

  const attemptLog = [
    ...save.attemptLog,
    {
      questionId: question.id,
      at: now.toISOString(),
      correct: feedback.correct,
      responseMs,
      hintsUsed,
      misconceptionId: feedback.misconception?.id ?? null
    }
  ].slice(-500);

  const nextSave: SaveFile = {
    ...save,
    skillStates: nextStates,
    reviewQueue: queue,
    attemptLog,
    xp: save.xp + (feedback.correct ? 5 : 1),
    reviewSession: {
      ...session,
      answeredCount: session.answeredCount + 1,
      correctCount: session.correctCount + (feedback.correct ? 1 : 0)
    }
  };

  return { save: nextSave, feedback, skillId };
}

/** Moves to the next review item, clearing the session once the queue is spent. */
export function advanceReview(save: SaveFile): SaveFile {
  const session = save.reviewSession;
  if (!session) return save;
  const nextIndex = session.currentIndex + 1;
  if (nextIndex >= session.questionQueue.length) {
    return { ...save, reviewSession: null };
  }
  return { ...save, reviewSession: { ...session, currentIndex: nextIndex } };
}

/** Abandons the session without rescheduling anything already answered. */
export function endReviewSession(save: SaveFile): SaveFile {
  return { ...save, reviewSession: null };
}

export function reviewProgress(save: SaveFile): { answered: number; correct: number; total: number } | null {
  const s = save.reviewSession;
  if (!s) return null;
  return { answered: s.answeredCount, correct: s.correctCount, total: s.questionQueue.length };
}
