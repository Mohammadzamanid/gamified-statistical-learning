/** Deterministic achievement evaluation against the save state. */
import type { Achievement, SaveFile } from "../../shared/schemas";
import { isRegionCompleted, type RegionGraph } from "../curriculum/progress";

/**
 * Returns the ids of achievements newly earned by this save, in `all` order.
 *
 * Never returns an achievement already listed in `save.achievements`, and never
 * returns the same id twice within one call, so appending the result to the save
 * cannot duplicate an award.
 *
 * `graph` is required rather than optional on purpose: region-completed triggers
 * previously evaluated to a hard-coded `false`, which silently withheld every
 * region award. Making the curriculum a required argument means a caller that
 * forgets it fails to compile instead of silently reintroducing that defect.
 */
export function evaluateAchievements(save: SaveFile, all: readonly Achievement[], graph: RegionGraph): string[] {
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
        hit = isRegionCompleted(graph, save, t.regionId);
        break;
    }
    if (hit) {
      // Guard the id here too, so a duplicated entry in `all` awards only once.
      earned.add(ach.id);
      newlyEarned.push(ach.id);
    }
  }
  return newlyEarned;
}
