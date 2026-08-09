/**
 * Boss investigations: unlock rules and step progress. Pure, like the rest of
 * `src/core` (D-001).
 *
 * A boss is not a lesson and the difference is worth stating, because it is what
 * every rule below follows from:
 *
 *  - it **gates** its region rather than sitting inside a module, so a region is
 *    not complete — and its achievement is not awarded — until the case is closed;
 *  - it unlocks only when every lesson of that region is done, because a case
 *    that combines the region's skills cannot be argued before they are taught;
 *  - it is **resumed a step at a time**, because it is long enough to be
 *    interrupted, and restarting from the top on every return would make "resume"
 *    a word the save does not honour.
 *
 * The questions inside a step are played by the ordinary session engine, so
 * mastery, spaced review, misconception detection and achievements all behave
 * exactly as they do in a lesson. Only the progress record differs.
 */
import type { Curriculum, Investigation, SaveFile } from "../../shared/schemas";
import { lessonStatus } from "../curriculum/progress";

export type InvestigationStatus = "locked" | "available" | "in-progress" | "completed";

/** The region's boss, or null where a region has none yet. */
export function investigationForRegion(curriculum: Curriculum, regionId: string): Investigation | null {
  return curriculum.investigations.find((i) => i.regionId === regionId) ?? null;
}

/** Every lesson the region teaches, in module order. */
export function regionLessonIds(curriculum: Curriculum, regionId: string): string[] {
  const region = curriculum.regions.find((r) => r.id === regionId);
  if (!region) return [];
  const out: string[] = [];
  for (const moduleId of region.moduleIds) {
    const mod = curriculum.modules.find((m) => m.id === moduleId);
    if (!mod) return []; // dangling reference — never claim readiness on broken data
    out.push(...mod.lessonIds);
  }
  return out;
}

/**
 * A boss unlocks once every lesson in its region is completed.
 *
 * Conservative in the same way `isRegionCompleted` is: an unresolvable graph
 * returns false, because a false positive here hands the learner a case built on
 * skills they have not met.
 */
export function isInvestigationUnlocked(curriculum: Curriculum, save: SaveFile, investigationId: string): boolean {
  const investigation = curriculum.investigations.find((i) => i.id === investigationId);
  if (!investigation) return false;
  const lessonIds = regionLessonIds(curriculum, investigation.regionId);
  return lessonIds.length > 0 && lessonIds.every((id) => lessonStatus(save, id) === "completed");
}

/**
 * The recorded status, which is not the same question as whether it is unlocked.
 *
 * A save records what the learner has *done*; unlocking is computed from the
 * curriculum. Keeping them apart means a curriculum change cannot silently
 * un-complete a case someone already closed.
 */
export function investigationStatus(save: SaveFile, investigationId: string): InvestigationStatus {
  return save.investigationProgress[investigationId]?.status ?? "locked";
}

export function isInvestigationCompleted(save: SaveFile, investigationId: string): boolean {
  return investigationStatus(save, investigationId) === "completed";
}

/** The step a resuming learner should be dropped back at, or null when finished. */
export function currentStepIndex(save: SaveFile, investigation: Investigation): number | null {
  const progress = save.investigationProgress[investigation.id];
  const index = progress?.currentStepIndex ?? 0;
  return index >= investigation.steps.length ? null : index;
}

/**
 * Marks the case opened. Idempotent: re-entering an investigation already in
 * progress must not rewind it, or leaving and returning would cost the learner
 * every step they had argued.
 */
export function beginInvestigation(save: SaveFile, investigation: Investigation, now: Date): SaveFile {
  const existing = save.investigationProgress[investigation.id];
  if (existing && existing.status !== "locked") return save;
  return {
    ...save,
    investigationProgress: {
      ...save.investigationProgress,
      [investigation.id]: {
        investigationId: investigation.id,
        status: "in-progress",
        currentStepIndex: existing?.currentStepIndex ?? 0,
        stepAccuracy: existing?.stepAccuracy ?? [],
        startedAt: existing?.startedAt ?? now.toISOString(),
        completedAt: null
      }
    }
  };
}

/**
 * Records a finished step and advances.
 *
 * Re-arguing a step that was already recorded overwrites that step's accuracy
 * and leaves the index alone, so replaying an early step out of curiosity cannot
 * push a learner backwards through a case they had nearly closed.
 */
export function recordStepResult(
  save: SaveFile,
  investigation: Investigation,
  stepIndex: number,
  accuracy: number,
  now: Date
): SaveFile {
  const existing = save.investigationProgress[investigation.id];
  const stepAccuracy = [...(existing?.stepAccuracy ?? [])];
  stepAccuracy[stepIndex] = Math.max(0, Math.min(1, accuracy));

  const reached = Math.max(existing?.currentStepIndex ?? 0, stepIndex + 1);
  const finished = reached >= investigation.steps.length;

  return {
    ...save,
    investigationProgress: {
      ...save.investigationProgress,
      [investigation.id]: {
        investigationId: investigation.id,
        status: finished ? "completed" : "in-progress",
        currentStepIndex: reached,
        stepAccuracy,
        startedAt: existing?.startedAt ?? now.toISOString(),
        completedAt: finished ? (existing?.completedAt ?? now.toISOString()) : null
      }
    }
  };
}

/** Mean accuracy across the steps argued so far; 0 before any have been. */
export function investigationAccuracy(save: SaveFile, investigationId: string): number {
  const recorded = save.investigationProgress[investigationId]?.stepAccuracy ?? [];
  if (recorded.length === 0) return 0;
  return recorded.reduce((a, b) => a + b, 0) / recorded.length;
}
