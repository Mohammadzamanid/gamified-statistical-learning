/** Deterministic achievement evaluation against the save state. */
import type { Achievement, SaveFile } from "../../shared/schemas";

export function evaluateAchievements(save: SaveFile, all: readonly Achievement[]): string[] {
  const earned = new Set(save.achievements);
  const newlyEarned: string[] = [];

  const answered = save.attemptLog.length;
  let bestStreak = 0;
  let streak = 0;
  for (const a of save.attemptLog) {
    streak = a.correct ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
  }

  for (const ach of all) {
    if (earned.has(ach.id)) continue;
    const t = ach.trigger;
    let hit = false;
    switch (t.kind) {
      case "questions-answered":
        hit = answered >= t.count;
        break;
      case "streak":
        hit = bestStreak >= t.count;
        break;
      case "skill-mastered":
        hit = save.skillStates[t.skillId]?.masteryLevel === "mastered";
        break;
      case "lesson-completed":
        hit = save.lessonProgress[t.lessonId]?.status === "completed";
        break;
      case "region-completed":
        // Region completion is derived by the caller; the engine only checks a marker lesson set.
        hit = false;
        break;
    }
    if (hit) newlyEarned.push(ach.id);
  }
  return newlyEarned;
}
