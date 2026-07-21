/**
 * Spaced-repetition scheduler. Deterministic SM-2-style rules, documented here
 * rather than pretending to be machine learning:
 *
 * - First successful review: interval 1 day. Second: 3 days.
 * - Afterwards interval = previous interval * ease.
 * - Ease starts at 2.3, +0.05 on an easy correct (no hints, fast),
 *   -0.2 on a lapse, clamped to [1.3, 3.0].
 * - A lapse (incorrect review) resets interval to 1 day and increments lapses.
 */
import type { ReviewItem } from "../../shared/schemas";

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Reviews never schedule further out than a year. */
export const MAX_INTERVAL_DAYS = 365;

export interface ReviewOutcome {
  correct: boolean;
  usedHints: boolean;
  fast: boolean;
}

export function createReviewItem(skillId: string, now: Date): ReviewItem {
  return {
    skillId,
    dueAt: new Date(now.getTime() + DAY_MS).toISOString(),
    intervalDays: 1,
    ease: 2.3,
    lapses: 0
  };
}

export function updateReviewItem(item: ReviewItem, outcome: ReviewOutcome, now: Date): ReviewItem {
  let { intervalDays, ease, lapses } = item;

  if (!outcome.correct) {
    lapses += 1;
    ease = Math.max(1.3, ease - 0.2);
    intervalDays = 1;
  } else {
    if (!outcome.usedHints && outcome.fast) ease = Math.min(3.0, ease + 0.05);
    if (intervalDays < 1) intervalDays = 1;
    else if (intervalDays < 3) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * ease * 10) / 10;
    if (intervalDays > MAX_INTERVAL_DAYS) intervalDays = MAX_INTERVAL_DAYS;
  }

  return {
    ...item,
    intervalDays,
    ease,
    lapses,
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS).toISOString()
  };
}

export function dueItems(queue: readonly ReviewItem[], now: Date): ReviewItem[] {
  return queue.filter((i) => new Date(i.dueAt).getTime() <= now.getTime());
}

/** Interleave due reviews from different skills so the same skill never repeats back-to-back when avoidable. */
export function interleave(items: readonly ReviewItem[]): ReviewItem[] {
  const bySkill = new Map<string, ReviewItem[]>();
  for (const item of items) {
    const list = bySkill.get(item.skillId) ?? [];
    list.push(item);
    bySkill.set(item.skillId, list);
  }
  const buckets = [...bySkill.values()];
  const out: ReviewItem[] = [];
  let remaining = items.length;
  let i = 0;
  while (remaining > 0) {
    const bucket = buckets[i % buckets.length]!;
    const next = bucket.shift();
    if (next) {
      out.push(next);
      remaining--;
    }
    i++;
    if (i > items.length * buckets.length + buckets.length) break; // safety
  }
  return out;
}
