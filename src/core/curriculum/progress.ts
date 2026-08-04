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

/**
 * The minimal curriculum shape region completion needs. `Curriculum` satisfies it
 * structurally, so callers keep passing the full curriculum, while tests can supply a
 * small graph without constructing an entire valid curriculum.
 */
export interface RegionGraph {
  regions: readonly { id: string; moduleIds: readonly string[] }[];
  modules: readonly { id: string; lessonIds: readonly string[] }[];
}

/**
 * A region is completed when every lesson of every one of its modules is completed.
 *
 * Deliberately conservative: it returns false rather than true whenever the graph
 * cannot be fully resolved, because a false positive here awards an achievement the
 * learner never earned. Guarded cases — unknown region, a region listing no modules,
 * a module id that does not resolve, and modules that between them hold no lessons.
 */
export function isRegionCompleted(graph: RegionGraph, save: SaveFile, regionId: string): boolean {
  const region = graph.regions.find((r) => r.id === regionId);
  if (!region || region.moduleIds.length === 0) return false;

  const lessonIds: string[] = [];
  for (const moduleId of region.moduleIds) {
    const mod = graph.modules.find((m) => m.id === moduleId);
    if (!mod) return false; // dangling module reference — never award on incomplete data
    lessonIds.push(...mod.lessonIds);
  }

  return lessonIds.length > 0 && lessonIds.every((l) => lessonStatus(save, l) === "completed");
}

export function isRegionUnlocked(curriculum: Curriculum, save: SaveFile, regionId: string): boolean {
  const region = curriculum.regions.find((r) => r.id === regionId);
  if (!region) return false;
  if (region.prerequisites.length === 0) return true;
  return region.prerequisites.every((p) => isRegionCompleted(curriculum, save, p));
}
