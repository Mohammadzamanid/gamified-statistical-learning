/**
 * Lesson session logic: pure functions that take (content, save, session) and
 * an event, and return the next state. The store wires them to the UI.
 */
import type { ContentBundle } from "../../core/curriculum/loader";
import { buildLibrary, runFeedbackPipeline, type FeedbackPlan } from "../../core/misconceptions/engine";
import type { RawResponse } from "../../core/questions/types";
import { applyAttempt, createSkillState } from "../../core/mastery/engine";
import { createReviewItem, updateReviewItem } from "../../core/spaced-repetition/scheduler";
import { evaluateAchievements } from "../../core/achievements/engine";
import type { Question, SaveFile } from "../../shared/schemas";

export interface LessonSession {
  lessonId: string;
  questionQueue: string[];
  currentIndex: number;
  hintsUsedThisQuestion: number;
  correctCount: number;
  attemptedCount: number;
  startedAtMs: number;
  questionShownAtMs: number;
  /** Injected remediation follow-ups still pending. */
  pendingFollowUps: string[];
  lastFeedback: FeedbackPlan | null;
  answeredCurrent: boolean;
  finished: boolean;
  newAchievements: string[];
}

export function startLesson(content: ContentBundle, lessonId: string, nowMs: number): LessonSession | null {
  const lesson = content.curriculum.lessons.find((l) => l.id === lessonId);
  if (!lesson) return null;
  return {
    lessonId,
    questionQueue: [...lesson.questionIds],
    currentIndex: 0,
    hintsUsedThisQuestion: 0,
    correctCount: 0,
    attemptedCount: 0,
    startedAtMs: nowMs,
    questionShownAtMs: nowMs,
    pendingFollowUps: [],
    lastFeedback: null,
    answeredCurrent: false,
    finished: false,
    newAchievements: []
  };
}

export function currentQuestion(content: ContentBundle, session: LessonSession): Question | null {
  const id = session.questionQueue[session.currentIndex];
  return id ? content.questions.get(id) ?? null : null;
}

export interface SubmitResult {
  session: LessonSession;
  save: SaveFile;
  feedback: FeedbackPlan;
}

export function submitAnswer(
  content: ContentBundle,
  save: SaveFile,
  session: LessonSession,
  raw: RawResponse,
  nowMs: number
): SubmitResult | null {
  const question = currentQuestion(content, session);
  if (!question || session.answeredCurrent) return null;

  const library = buildLibrary(content.misconceptions, content.remediations);
  const feedback = runFeedbackPipeline(question, raw, library, session.hintsUsedThisQuestion);
  const now = new Date(nowMs);
  const responseMs = Math.max(0, nowMs - session.questionShownAtMs);

  // Mastery update per skill the question exercises.
  const nextStates = { ...save.skillStates };
  let recommendRemediation = false;
  for (const skillId of question.skillIds) {
    const prev = nextStates[skillId] ?? createSkillState(skillId);
    const update = applyAttempt(prev, {
      correct: feedback.correct,
      responseMs,
      hintsUsed: session.hintsUsedThisQuestion,
      misconceptionId: feedback.misconception?.id ?? null,
      now,
      questionId: question.id
    });
    nextStates[skillId] = update.state;
    recommendRemediation = recommendRemediation || update.recommendRemediation;
  }

  // Review scheduling: create or update one item per skill.
  const queue = [...save.reviewQueue];
  for (const skillId of question.skillIds) {
    const idx = queue.findIndex((r) => r.skillId === skillId);
    const outcome = {
      correct: feedback.correct,
      usedHints: session.hintsUsedThisQuestion > 0,
      fast: responseMs < question.estimatedSeconds * 1000
    };
    if (idx === -1) queue.push(createReviewItem(skillId, now));
    else queue[idx] = updateReviewItem(queue[idx]!, outcome, now);
  }

  const attemptLog = [
    ...save.attemptLog,
    {
      questionId: question.id,
      at: now.toISOString(),
      correct: feedback.correct,
      responseMs,
      hintsUsed: session.hintsUsedThisQuestion,
      misconceptionId: feedback.misconception?.id ?? null
    }
  ].slice(-500); // cap the log

  let nextSave: SaveFile = {
    ...save,
    skillStates: nextStates,
    reviewQueue: queue,
    attemptLog,
    xp: save.xp + (feedback.correct ? (session.hintsUsedThisQuestion > 0 ? 5 : 10) : 1)
  };

  const earned = evaluateAchievements(nextSave, content.achievements);
  if (earned.length > 0) nextSave = { ...nextSave, achievements: [...nextSave.achievements, ...earned] };

  // Guided retry: inject the remediation follow-up right after this question.
  const pendingFollowUps = [...session.pendingFollowUps];
  if (!feedback.correct && recommendRemediation && feedback.followUpQuestionId) {
    const fid = feedback.followUpQuestionId;
    if (content.questions.has(fid) && !session.questionQueue.includes(fid) && !pendingFollowUps.includes(fid)) {
      pendingFollowUps.push(fid);
    }
  }

  return {
    feedback,
    save: nextSave,
    session: {
      ...session,
      attemptedCount: session.attemptedCount + 1,
      correctCount: session.correctCount + (feedback.correct ? 1 : 0),
      lastFeedback: feedback,
      answeredCurrent: true,
      pendingFollowUps,
      newAchievements: [...session.newAchievements, ...earned]
    }
  };
}

export function useHint(session: LessonSession): LessonSession {
  return { ...session, hintsUsedThisQuestion: session.hintsUsedThisQuestion + 1 };
}

export function advance(content: ContentBundle, save: SaveFile, session: LessonSession, nowMs: number): { session: LessonSession; save: SaveFile } {
  // Inject pending follow-up questions immediately after the current one.
  const queue = [...session.questionQueue];
  let pending = session.pendingFollowUps;
  if (pending.length > 0) {
    queue.splice(session.currentIndex + 1, 0, ...pending);
    pending = [];
  }

  const nextIndex = session.currentIndex + 1;
  if (nextIndex >= queue.length) {
    const accuracy = session.attemptedCount > 0 ? session.correctCount / session.attemptedCount : 0;
    const prevProgress = save.lessonProgress[session.lessonId];
    let nextSave: SaveFile = {
      ...save,
      lessonProgress: {
        ...save.lessonProgress,
        [session.lessonId]: {
          lessonId: session.lessonId,
          status: "completed",
          bestAccuracy: Math.max(prevProgress?.bestAccuracy ?? 0, accuracy),
          completedAt: new Date(nowMs).toISOString()
        }
      }
    };
    const earnedOnCompletion = evaluateAchievements(nextSave, content.achievements);
    if (earnedOnCompletion.length > 0) {
      nextSave = { ...nextSave, achievements: [...nextSave.achievements, ...earnedOnCompletion] };
    }
    return {
      session: { ...session, finished: true, newAchievements: [...session.newAchievements, ...earnedOnCompletion] },
      save: nextSave
    };
  }

  return {
    save,
    session: {
      ...session,
      questionQueue: queue,
      pendingFollowUps: pending,
      currentIndex: nextIndex,
      hintsUsedThisQuestion: 0,
      questionShownAtMs: nowMs,
      lastFeedback: null,
      answeredCurrent: false
    }
  };
}
