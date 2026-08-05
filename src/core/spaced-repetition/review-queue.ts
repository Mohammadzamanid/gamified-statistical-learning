/**
 * Building the review queue: deciding *what* is due and in what order.
 *
 * The clock is always an argument, never `Date.now()` read inside. Review is the
 * one system whose behaviour is defined in days, so a hidden clock would make it
 * untestable and would drift with the machine's timezone. Every function here
 * takes `now` and is a pure function of its inputs.
 *
 * Scheduling itself (intervals, ease, lapses) stays in `scheduler.ts`; this
 * module only selects and orders.
 */
import type { Curriculum, Question, ReviewItem, SaveFile } from "../../shared/schemas";
import { DAY_MS, interleave } from "./scheduler";

/**
 * Why an item is in today's queue.
 * - `overdue` — was due more than a full day ago
 * - `due` — due now, within the last day
 * - `new` — a skill the learner has practised that has no review item yet
 */
export type ReviewCategory = "overdue" | "due" | "new";

export interface ReviewCandidate {
  skillId: string;
  category: ReviewCategory;
  /** Whole days late; 0 for `due` and `new`. */
  daysOverdue: number;
  /** The scheduling record, absent for a `new` skill. */
  item: ReviewItem | null;
}

export interface ReviewPlan {
  candidates: ReviewCandidate[];
  counts: { overdue: number; due: number; new: number; total: number };
}

/** Whole days by which an item is late. Negative values clamp to 0. */
export function daysOverdue(item: ReviewItem, now: Date): number {
  const lateMs = now.getTime() - new Date(item.dueAt).getTime();
  return lateMs <= 0 ? 0 : Math.floor(lateMs / DAY_MS);
}

export function categorise(item: ReviewItem, now: Date): "overdue" | "due" | null {
  const dueMs = new Date(item.dueAt).getTime();
  if (dueMs > now.getTime()) return null;
  return daysOverdue(item, now) >= 1 ? "overdue" : "due";
}

/**
 * Everything worth reviewing right now.
 *
 * Overdue items lead, most-overdue first, because they are the ones closest to
 * being forgotten. Skills the learner has started but that have no review record
 * are offered last as `new`, so a fresh learner is never shown an empty queue
 * while unpractised skills exist.
 *
 * Within the due band the order is interleaved by skill, so a session never runs
 * several questions on one skill back to back when other skills are waiting.
 */
export function buildReviewPlan(curriculum: Curriculum, save: SaveFile, now: Date): ReviewPlan {
  const overdue: ReviewCandidate[] = [];
  const due: ReviewCandidate[] = [];

  const scheduled = new Set<string>();
  for (const item of save.reviewQueue) {
    scheduled.add(item.skillId);
    const category = categorise(item, now);
    if (category === null) continue;
    const candidate: ReviewCandidate = {
      skillId: item.skillId,
      category,
      daysOverdue: daysOverdue(item, now),
      item
    };
    if (category === "overdue") overdue.push(candidate);
    else due.push(candidate);
  }

  // Most overdue first; ties broken by skill id so the order is deterministic.
  overdue.sort((a, b) => b.daysOverdue - a.daysOverdue || a.skillId.localeCompare(b.skillId));

  const dueInterleaved = interleave(due.map((c) => c.item!)).map(
    (item) => due.find((c) => c.item === item)!
  );

  // A skill counts as "new" only once the learner has met it — an untouched skill
  // belongs to the lesson path, not to review.
  const fresh: ReviewCandidate[] = curriculum.skills
    .filter((s) => !scheduled.has(s.id) && save.skillStates[s.id] !== undefined)
    .map((s) => ({ skillId: s.id, category: "new" as const, daysOverdue: 0, item: null }));
  fresh.sort((a, b) => a.skillId.localeCompare(b.skillId));

  const candidates = [...overdue, ...dueInterleaved, ...fresh];
  return {
    candidates,
    counts: {
      overdue: overdue.length,
      due: dueInterleaved.length,
      new: fresh.length,
      total: candidates.length
    }
  };
}

/**
 * Picks the question to ask for a skill.
 *
 * Deterministic: the same save and skill always yield the same question, so a
 * resumed session shows what it showed before. Questions the learner has
 * answered least often are preferred, which spreads practice across the bank
 * instead of drilling the first entry forever.
 */
export function pickQuestionForSkill(
  questions: ReadonlyMap<string, Question>,
  save: SaveFile,
  skillId: string
): Question | null {
  const attemptsPerQuestion = new Map<string, number>();
  for (const attempt of save.attemptLog) {
    attemptsPerQuestion.set(attempt.questionId, (attemptsPerQuestion.get(attempt.questionId) ?? 0) + 1);
  }

  const candidates = [...questions.values()]
    .filter((q) => q.skillIds.includes(skillId))
    .sort((a, b) => {
      const seenA = attemptsPerQuestion.get(a.id) ?? 0;
      const seenB = attemptsPerQuestion.get(b.id) ?? 0;
      return seenA - seenB || a.difficulty - b.difficulty || a.id.localeCompare(b.id);
    });

  return candidates[0] ?? null;
}

/** Human summary of the plan, also used as the screen's live-region text. */
export function describeReviewPlan(plan: ReviewPlan): string {
  if (plan.counts.total === 0) return "Nothing is due for review right now.";
  const parts: string[] = [];
  if (plan.counts.overdue > 0) parts.push(`${plan.counts.overdue} overdue`);
  if (plan.counts.due > 0) parts.push(`${plan.counts.due} due`);
  if (plan.counts.new > 0) parts.push(`${plan.counts.new} not yet scheduled`);
  return `${parts.join(", ")}.`;
}
