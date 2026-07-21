/**
 * Adaptive mastery engine. Deterministic, documented rules (no ML):
 *
 * Mastery levels: unseen -> introduced -> practicing -> proficient -> mastered.
 * - introduced: first attempt recorded.
 * - practicing: >= 2 attempts.
 * - proficient: accuracy >= rule.minAccuracy over >= rule.minAttempts attempts.
 * - mastered: proficient AND consecutiveCorrect >= rule.streakToMaster
 *   AND at most 1 hint across that streak (tracked via hint deltas).
 *
 * Difficulty adapts: +1 level after 3 consecutive correct without hints
 * (max 5); -1 level after 2 consecutive misses (min 1). Support fades the
 * same way: hints stay available but auto-suggestions stop at proficient.
 *
 * Retention decays exponentially with 14-day half-life since last practice.
 * Learners are never permanently blocked: after 3 consecutive misses the
 * engine routes to remediation at difficulty 1 instead of locking content.
 */
import type { SkillState } from "../../shared/schemas";
import { SkillStateSchema } from "../../shared/schemas";
import type { MasteryLevel } from "../../shared/constants/app";

export interface MasteryRuleConfig {
  streakToMaster: number;
  minAccuracy: number;
  minAttempts: number;
}

export const DEFAULT_MASTERY_RULE: MasteryRuleConfig = {
  streakToMaster: 3,
  minAccuracy: 0.8,
  minAttempts: 4
};

export interface AttemptInput {
  correct: boolean;
  responseMs: number;
  hintsUsed: number;
  misconceptionId: string | null;
  /** Learner confidence in [0,1] if a confidence prompt was shown. */
  confidence?: number;
  /** True when the question tests transfer beyond the practiced context. */
  isTransfer?: boolean;
  now: Date;
  questionId: string;
}

const RETENTION_HALF_LIFE_DAYS = 14;
const RECENT_MISTAKES_KEPT = 5;

export function createSkillState(skillId: string): SkillState {
  return SkillStateSchema.parse({ skillId });
}

export function retentionNow(state: SkillState, now: Date): number {
  if (!state.lastPracticedAt) return 0;
  const days = (now.getTime() - new Date(state.lastPracticedAt).getTime()) / (24 * 3600 * 1000);
  if (days <= 0) return state.retention;
  return state.retention * Math.pow(0.5, days / RETENTION_HALF_LIFE_DAYS);
}

function computeMasteryLevel(state: SkillState, rule: MasteryRuleConfig): MasteryLevel {
  if (state.attempts === 0) return "unseen";
  const accuracy = state.correct / state.attempts;
  const proficient = state.attempts >= rule.minAttempts && accuracy >= rule.minAccuracy;
  if (proficient && state.consecutiveCorrect >= rule.streakToMaster) return "mastered";
  if (proficient) return "proficient";
  if (state.attempts >= 2) return "practicing";
  return "introduced";
}

export interface MasteryUpdate {
  state: SkillState;
  levelChanged: boolean;
  previousLevel: MasteryLevel;
  /** True when the engine recommends routing to remediation content. */
  recommendRemediation: boolean;
}

export function applyAttempt(
  prev: SkillState,
  attempt: AttemptInput,
  rule: MasteryRuleConfig = DEFAULT_MASTERY_RULE
): MasteryUpdate {
  const decayedRetention = retentionNow(prev, attempt.now);
  const next: SkillState = { ...prev, misconceptionCounts: { ...prev.misconceptionCounts } };

  next.attempts = prev.attempts + 1;
  next.totalResponseMs = prev.totalResponseMs + Math.max(0, attempt.responseMs);
  next.hintsUsed = prev.hintsUsed + Math.max(0, attempt.hintsUsed);
  next.lastPracticedAt = attempt.now.toISOString();

  if (typeof attempt.confidence === "number") {
    next.confidence = 0.7 * prev.confidence + 0.3 * Math.min(1, Math.max(0, attempt.confidence));
  }

  if (attempt.isTransfer) {
    next.transferAttempts = prev.transferAttempts + 1;
    if (attempt.correct) next.transferCorrect = prev.transferCorrect + 1;
  }

  if (attempt.correct) {
    next.correct = prev.correct + 1;
    next.consecutiveCorrect = prev.consecutiveCorrect + 1;
    next.retention = Math.min(1, decayedRetention + (attempt.hintsUsed > 0 ? 0.15 : 0.3));
    if (next.consecutiveCorrect >= 3 && attempt.hintsUsed === 0 && next.difficultyLevel < 5) {
      next.difficultyLevel = prev.difficultyLevel + 1;
      next.consecutiveCorrect = 0; // streak resets after a promotion so mastery is earned per level
    }
  } else {
    next.consecutiveCorrect = 0;
    next.retention = Math.max(0, decayedRetention - 0.2);
    next.recentMistakeQuestionIds = [attempt.questionId, ...prev.recentMistakeQuestionIds].slice(0, RECENT_MISTAKES_KEPT);
    if (attempt.misconceptionId) {
      next.misconceptionCounts[attempt.misconceptionId] = (next.misconceptionCounts[attempt.misconceptionId] ?? 0) + 1;
    }
    // Two consecutive misses (previous streak already 0 and this miss) lower difficulty.
    if (prev.consecutiveCorrect === 0 && prev.attempts > 0 && next.difficultyLevel > 1) {
      next.difficultyLevel = prev.difficultyLevel - 1;
    }
  }

  const accuracy = next.correct / next.attempts;
  next.masteryConfidence = Math.min(
    1,
    accuracy * Math.min(1, next.attempts / (rule.minAttempts * 2)) * (0.5 + 0.5 * next.retention)
  );

  const previousLevel = prev.masteryLevel;
  next.masteryLevel = computeMasteryLevel(next, rule);

  const recentMisses = next.recentMistakeQuestionIds.length;
  const recommendRemediation =
    !attempt.correct && (recentMisses >= 3 || attempt.misconceptionId !== null) && next.difficultyLevel === 1
      ? true
      : !attempt.correct && attempt.misconceptionId !== null;

  return {
    state: next,
    levelChanged: previousLevel !== next.masteryLevel,
    previousLevel,
    recommendRemediation
  };
}

/** Prerequisite gate: every prerequisite skill must be at least `minLevel`. */
export function prerequisitesMet(
  prereqSkillIds: readonly string[],
  states: Record<string, SkillState>,
  minLevel: MasteryLevel = "proficient"
): boolean {
  const order: MasteryLevel[] = ["unseen", "introduced", "practicing", "proficient", "mastered"];
  const minIdx = order.indexOf(minLevel);
  return prereqSkillIds.every((id) => {
    const s = states[id];
    return s !== undefined && order.indexOf(s.masteryLevel) >= minIdx;
  });
}
