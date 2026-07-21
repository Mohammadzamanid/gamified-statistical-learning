/**
 * Unlock rules. Deterministic:
 * - The first region of the first world is always available.
 * - A region unlocks when all its listed prerequisite regions are completed.
 * - A lesson unlocks when its prerequisite lessons are completed.
 * - A lesson/region is completed when its lessonProgress says so.
 * Learners can always revisit completed content.
 */
import type { Curriculum } from "../../shared/schemas";
import type { SaveFile } from "../../shared/schemas";

export function lessonStatus(save: SaveFile, lessonId: string): "locked" | "available" | "in-progress" | "completed" {
  return save.lessonProgress[lessonId]?.status ?? "locked";
}

export function isLessonUnlocked(curriculum: Curriculum, save: SaveFile, lessonId: string): boolean {
  const lesson = curriculum.lessons.find((l) => l.id === lessonId);
  if (!lesson) return false;
  return lesson.prerequisites.every((p) => lessonStatus(save, p) === "completed");
}

export function isRegionCompleted(curriculum: Curriculum, save: SaveFile, regionId: string): boolean {
  const region = curriculum.regions.find((r) => r.id === regionId);
  if (!region) return false;
  const lessonIds = curriculum.modules
    .filter((m) => region.moduleIds.includes(m.id))
    .flatMap((m) => m.lessonIds);
  return lessonIds.length > 0 && lessonIds.every((l) => lessonStatus(save, l) === "completed");
}

export function isRegionUnlocked(curriculum: Curriculum, save: SaveFile, regionId: string): boolean {
  const region = curriculum.regions.find((r) => r.id === regionId);
  if (!region) return false;
  if (region.prerequisites.length === 0) return true;
  return region.prerequisites.every((p) => isRegionCompleted(curriculum, save, p));
}
