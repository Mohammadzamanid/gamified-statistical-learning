/**
 * S2-10: the boss investigation engine, and the save it writes.
 *
 * The checks are aimed at the ways a "saveable multi-step investigation" can be
 * saveable in name only — resuming that quietly restarts, a case that completes
 * itself after one step, a region achievement handed over before the case is
 * argued — rather than at the happy path, which the integration playthrough
 * already covers end to end.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import {
  beginInvestigation,
  currentStepIndex,
  investigationAccuracy,
  investigationForRegion,
  investigationStatus,
  isInvestigationCompleted,
  isInvestigationUnlocked,
  recordStepResult
} from "../../src/core/investigations/engine";
import { isRegionCompleted } from "../../src/core/curriculum/progress";
import { MIGRATIONS, migrateToVersion } from "../../src/core/persistence/migrations";
import { startInvestigationStep } from "../../src/renderer/state/session";
import { SAVE_SCHEMA_VERSION } from "../../src/shared/constants/app";
import { createEmptySave, SaveFileSchema, type SaveFile } from "../../src/shared/schemas";
import { playInvestigation, playInvestigationStep } from "../helpers/investigation-playthrough";

const content = loadShippedContent();
const REGION_1 = "r.harbor-tallies";
const boss = investigationForRegion(content.curriculum, REGION_1)!;
const NOW = new Date("2026-08-07T10:00:00.000Z");

function freshSave(): SaveFile {
  return createEmptySave({
    id: "p.boss",
    name: "Investigator",
    createdAt: NOW.toISOString(),
    isGuest: false,
    avatarSeed: 0
  });
}

/** Marks every lesson of Region 1 complete, without touching the case. */
function withRegionLessonsDone(save: SaveFile): SaveFile {
  const region = content.curriculum.regions.find((r) => r.id === REGION_1)!;
  const lessonIds = content.curriculum.modules
    .filter((m) => region.moduleIds.includes(m.id))
    .flatMap((m) => m.lessonIds);
  const lessonProgress = { ...save.lessonProgress };
  for (const lessonId of lessonIds) {
    lessonProgress[lessonId] = {
      lessonId,
      status: "completed",
      bestAccuracy: 1,
      completedAt: NOW.toISOString()
    };
  }
  return { ...save, lessonProgress };
}

beforeAll(() => {
  clearDetectors();
  registerBuiltInDetectors();
});

describe("the case is sealed until the region has taught it", () => {
  it("is locked on a fresh save", () => {
    expect(isInvestigationUnlocked(content.curriculum, freshSave(), boss.id)).toBe(false);
    expect(investigationStatus(freshSave(), boss.id)).toBe("locked");
  });

  it("stays locked while a single lesson of the region is unfinished", () => {
    const save = withRegionLessonsDone(freshSave());
    const someLesson = Object.keys(save.lessonProgress)[0]!;
    const held = {
      ...save,
      lessonProgress: {
        ...save.lessonProgress,
        [someLesson]: { ...save.lessonProgress[someLesson]!, status: "in-progress" as const }
      }
    };
    expect(isInvestigationUnlocked(content.curriculum, held, boss.id)).toBe(false);
  });

  it("unlocks once every lesson of the region is finished", () => {
    expect(isInvestigationUnlocked(content.curriculum, withRegionLessonsDone(freshSave()), boss.id)).toBe(true);
  });

  it("never unlocks an investigation the curriculum does not have", () => {
    expect(isInvestigationUnlocked(content.curriculum, withRegionLessonsDone(freshSave()), "inv.invented")).toBe(false);
  });
});

describe("a case is resumed, not restarted", () => {
  it("re-entering an investigation in progress does not rewind it", () => {
    // The defect this exists for: `beginInvestigation` writing a fresh record
    // every time the briefing is opened would cost a learner every stage they
    // had argued, and would look exactly like working code.
    let save = beginInvestigation(withRegionLessonsDone(freshSave()), boss, NOW);
    save = recordStepResult(save, boss, 0, 1, NOW);
    save = recordStepResult(save, boss, 1, 0.8, NOW);

    const reopened = beginInvestigation(save, boss, new Date(NOW.getTime() + 86_400_000));

    expect(reopened.investigationProgress[boss.id]!.currentStepIndex).toBe(2);
    expect(reopened.investigationProgress[boss.id]!.stepAccuracy).toEqual([1, 0.8]);
    expect(reopened.investigationProgress[boss.id]!.startedAt).toBe(NOW.toISOString());
  });

  it("drops a returning learner back at the stage they had reached", () => {
    let save = beginInvestigation(withRegionLessonsDone(freshSave()), boss, NOW);
    expect(currentStepIndex(save, boss)).toBe(0);
    save = recordStepResult(save, boss, 0, 1, NOW);
    expect(currentStepIndex(save, boss)).toBe(1);
  });

  it("reports no next stage once the case is closed", () => {
    let save = beginInvestigation(withRegionLessonsDone(freshSave()), boss, NOW);
    for (let i = 0; i < boss.steps.length; i++) save = recordStepResult(save, boss, i, 1, NOW);
    expect(currentStepIndex(save, boss)).toBeNull();
    expect(isInvestigationCompleted(save, boss.id)).toBe(true);
  });

  it("re-arguing an early stage updates its score without pushing the learner backwards", () => {
    let save = beginInvestigation(withRegionLessonsDone(freshSave()), boss, NOW);
    for (let i = 0; i < boss.steps.length; i++) save = recordStepResult(save, boss, i, 0.5, NOW);
    const closedAt = save.investigationProgress[boss.id]!.completedAt;

    const replayed = recordStepResult(save, boss, 0, 1, new Date(NOW.getTime() + 86_400_000));

    expect(replayed.investigationProgress[boss.id]!.currentStepIndex).toBe(boss.steps.length);
    expect(replayed.investigationProgress[boss.id]!.stepAccuracy[0]).toBe(1);
    expect(replayed.investigationProgress[boss.id]!.status).toBe("completed");
    expect(replayed.investigationProgress[boss.id]!.completedAt).toBe(closedAt);
  });
});

describe("one stage is not the whole case", () => {
  it("stays in progress after the first stage is argued", () => {
    const save = playInvestigationStep(content, beginInvestigation(withRegionLessonsDone(freshSave()), boss, NOW), boss.id, 0, 0);
    expect(investigationStatus(save, boss.id)).toBe("in-progress");
    expect(isInvestigationCompleted(save, boss.id)).toBe(false);
  });

  it("does not complete the region, or award it, after one stage", () => {
    const save = playInvestigationStep(content, beginInvestigation(withRegionLessonsDone(freshSave()), boss, NOW), boss.id, 0, 0);
    expect(isRegionCompleted(content.curriculum, save, REGION_1)).toBe(false);
  });

  it("writes a step result rather than a lesson completion", () => {
    // A boss step running through the shared session engine must not write
    // lessonProgress under the investigation's id — that would mark the case
    // complete after its first stage and hand over the region achievement.
    const save = playInvestigationStep(content, beginInvestigation(withRegionLessonsDone(freshSave()), boss, NOW), boss.id, 0, 0);
    expect(save.lessonProgress[boss.id]).toBeUndefined();
    expect(save.investigationProgress[boss.id]!.stepAccuracy).toHaveLength(1);
  });

  it("completes only when every stage has been argued", () => {
    const save = playInvestigation(content, withRegionLessonsDone(freshSave()), boss.id, 0);
    expect(isInvestigationCompleted(save, boss.id)).toBe(true);
    expect(save.investigationProgress[boss.id]!.stepAccuracy).toHaveLength(boss.steps.length);
    expect(investigationAccuracy(save, boss.id)).toBe(1);
    expect(isRegionCompleted(content.curriculum, save, REGION_1)).toBe(true);
  });
});

describe("the boss runs through the ordinary session engine", () => {
  it("builds a session over the step's own questions", () => {
    const session = startInvestigationStep(content, boss.id, 1, 0);
    expect(session).not.toBeNull();
    expect(session!.questionQueue).toEqual([...boss.steps[1]!.questionIds]);
    expect(session!.investigation).toEqual({ investigationId: boss.id, stepIndex: 1 });
  });

  it("returns null for a stage that does not exist", () => {
    expect(startInvestigationStep(content, boss.id, boss.steps.length, 0)).toBeNull();
    expect(startInvestigationStep(content, "inv.invented", 0, 0)).toBeNull();
  });

  it("schedules the boss's skills for review like any other practice", () => {
    // What "through the real session engine" has to mean: mastery and spaced
    // review move because the questions were answered, not because the case was
    // special-cased.
    const before = withRegionLessonsDone(freshSave());
    const after = playInvestigation(content, before, boss.id, 0);
    const practised = new Set(boss.steps.flatMap((s) => s.questionIds).flatMap((qid) => content.questions.get(qid)!.skillIds));
    for (const skillId of practised) {
      expect(after.skillStates[skillId], `${skillId} was practised but has no skill state`).toBeDefined();
      expect(after.reviewQueue.some((r) => r.skillId === skillId), `${skillId} was not scheduled for review`).toBe(true);
    }
    expect(after.attemptLog.length).toBeGreaterThanOrEqual(boss.steps.flatMap((s) => s.questionIds).length);
  });
});

describe("the save carries the case forward", () => {
  it("registers a migration for every version below the current one", () => {
    for (let v = 1; v < SAVE_SCHEMA_VERSION; v++) {
      expect(MIGRATIONS[v], `no migration from save version ${v}`).toBeDefined();
    }
  });

  it("lifts a version-2 save to a valid version-3 save with no case opened", () => {
    const v2 = { ...freshSave(), schemaVersion: 2 } as unknown as Record<string, unknown>;
    delete v2["investigationProgress"];

    const migrated = migrateToVersion(v2, 2, SAVE_SCHEMA_VERSION);
    const parsed = SaveFileSchema.safeParse(migrated);

    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues)).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    // Not "available": a version-2 save holds no evidence the case was unlocked.
    expect(parsed.data.investigationProgress).toEqual({});
    expect(investigationStatus(parsed.data, boss.id)).toBe("locked");
  });
});
