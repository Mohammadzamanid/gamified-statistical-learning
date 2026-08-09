/**
 * S2-10: what a boss investigation has to be, enforced.
 *
 * `STAGE2_RECONSTRUCTION_SCOPE.md` §10 makes "a region ends without a boss and a
 * completion achievement" a closure failure. That is a completeness claim, and
 * completeness claims here are declared lists defended by an audit rather than
 * schema rules (D-014) — a schema that *required* every region to have a boss
 * would simply refuse to load the Region 2 inheritance, whose case is owed to
 * S2-18, and the honest record of that debt would disappear into a passing test.
 *
 * The checks are aimed at the ways a boss can be a boss in name only: a case that
 * teaches its own material, one that quizzes a single skill, one whose steps
 * claim skills their questions never touch, or one whose questions are also a
 * lesson's, which would make "combining Region 1 skills" a relabelling exercise.
 */
import { describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import { investigationForRegion, regionLessonIds } from "../../src/core/investigations/engine";
import { REGIONS_WITH_A_BOSS, REGIONS_OWING_A_BOSS } from "../helpers/complete-bosses";

const content = loadShippedContent();
const curriculum = content.curriculum;

describe("the declared bosses account for every region", () => {
  it("names only regions the curriculum defines", () => {
    for (const regionId of [...REGIONS_WITH_A_BOSS, ...REGIONS_OWING_A_BOSS]) {
      expect(curriculum.regions.some((r) => r.id === regionId), `${regionId} is declared but is not a region`).toBe(true);
    }
  });

  it("splits every region into exactly one of the two lists", () => {
    // No region may be missing from both, which is how a boss debt would stop
    // being visible, and none may appear in both.
    const declared = [...REGIONS_WITH_A_BOSS, ...REGIONS_OWING_A_BOSS].sort();
    expect(new Set(declared).size).toBe(declared.length);
    expect(declared).toEqual(curriculum.regions.map((r) => r.id).sort());
  });

  it("gives every region that claims a boss one that exists", () => {
    for (const regionId of REGIONS_WITH_A_BOSS) {
      expect(investigationForRegion(curriculum, regionId), `${regionId} claims a boss but has none`).not.toBeNull();
    }
  });

  it("gives every region that owes a boss none yet, so the debt stays honest", () => {
    for (const regionId of REGIONS_OWING_A_BOSS) {
      expect(investigationForRegion(curriculum, regionId), `${regionId} has a boss and should be moved`).toBeNull();
    }
  });

  it("pairs every region with a completion achievement", () => {
    // The other half of the §10 closure rule, and it applies to every region,
    // boss or not.
    for (const region of curriculum.regions) {
      const ach = content.achievements.find(
        (a) => a.trigger.kind === "region-completed" && a.trigger.regionId === region.id
      );
      expect(ach, `${region.id} has no completion achievement`).toBeDefined();
    }
  });
});

describe("a boss combines what its region taught, and teaches nothing new", () => {
  const bosses = REGIONS_WITH_A_BOSS.map((regionId) => investigationForRegion(curriculum, regionId)!);

  it("runs in several stages", () => {
    for (const boss of bosses) {
      expect(boss.steps.length, `${boss.id} is not multi-step`).toBeGreaterThanOrEqual(3);
    }
  });

  it("spans skills from more than one module of its region", () => {
    // The point of a boss. A case drawing on one module is a longer lesson.
    for (const boss of bosses) {
      const modulesOfSkill = new Map<string, string>();
      const region = curriculum.regions.find((r) => r.id === boss.regionId)!;
      for (const moduleId of region.moduleIds) {
        const mod = curriculum.modules.find((m) => m.id === moduleId)!;
        for (const lessonId of mod.lessonIds) {
          const lesson = curriculum.lessons.find((l) => l.id === lessonId);
          for (const objectiveId of lesson?.objectiveIds ?? []) {
            const objective = curriculum.objectives.find((o) => o.id === objectiveId);
            for (const skillId of objective?.skillIds ?? []) modulesOfSkill.set(skillId, moduleId);
          }
        }
      }
      const touched = new Set(
        boss.steps.flatMap((s) => s.questionIds).flatMap((qid) => content.questions.get(qid)!.skillIds)
      );
      const modules = new Set([...touched].map((s) => modulesOfSkill.get(s)).filter(Boolean));
      expect(modules.size, `${boss.id} draws on only ${[...modules].join(", ")}`).toBeGreaterThan(1);
    }
  });

  it("asks only about skills its own region teaches", () => {
    // A case that reaches for a skill the region never taught is unanswerable,
    // and the learner has no way to know that is what happened.
    for (const boss of bosses) {
      const taught = new Set<string>();
      for (const lessonId of regionLessonIds(curriculum, boss.regionId)) {
        const lesson = curriculum.lessons.find((l) => l.id === lessonId);
        for (const objectiveId of lesson?.objectiveIds ?? []) {
          const objective = curriculum.objectives.find((o) => o.id === objectiveId);
          for (const skillId of objective?.skillIds ?? []) taught.add(skillId);
        }
      }
      for (const step of boss.steps) {
        for (const qid of step.questionIds) {
          for (const skillId of content.questions.get(qid)!.skillIds) {
            expect(taught.has(skillId), `${boss.id}: ${qid} needs ${skillId}, which ${boss.regionId} never teaches`).toBe(true);
          }
        }
      }
    }
  });

  it("holds every step to the skills it claims", () => {
    // `skillIds` on a step is a claim about its questions. Unchecked, it is a
    // comment; checked, it is the thing that stops a step drifting into a
    // different subject while its label says otherwise.
    for (const boss of bosses) {
      for (const step of boss.steps) {
        const actual = new Set(step.questionIds.flatMap((qid) => content.questions.get(qid)!.skillIds));
        for (const claimed of step.skillIds) {
          expect(actual.has(claimed), `${boss.id} step ${step.id} claims ${claimed}, which none of its questions exercises`).toBe(true);
        }
        for (const used of actual) {
          expect(step.skillIds.includes(used), `${boss.id} step ${step.id} exercises ${used} without declaring it`).toBe(true);
        }
      }
    }
  });

  it("never re-uses a question a lesson already asks", () => {
    // Sharing a question would make the boss a review round wearing a case's
    // clothes, and would double-count that question's practice.
    const lessonQuestionIds = new Set(curriculum.lessons.flatMap((l) => l.questionIds));
    for (const boss of bosses) {
      for (const step of boss.steps) {
        for (const qid of step.questionIds) {
          expect(lessonQuestionIds.has(qid), `${boss.id} re-uses lesson question ${qid}`).toBe(false);
        }
      }
    }
  });

  it("gives every stage a brief and every case a briefing and a debrief", () => {
    for (const boss of bosses) {
      expect(boss.briefing.trim().length, `${boss.id} briefing`).toBeGreaterThan(40);
      expect(boss.debrief.trim().length, `${boss.id} debrief`).toBeGreaterThan(40);
      for (const step of boss.steps) {
        expect(step.brief.trim().length, `${boss.id} step ${step.id} brief`).toBeGreaterThan(20);
        expect(step.questionIds.length, `${boss.id} step ${step.id} has no questions`).toBeGreaterThan(0);
      }
    }
  });

  it("gives every boss question a text equivalent and an explanation", () => {
    for (const boss of bosses) {
      for (const qid of boss.steps.flatMap((s) => s.questionIds)) {
        const q = content.questions.get(qid)!;
        expect((q.accessibilityDescription ?? "").trim().length, `${qid} accessibilityDescription`).toBeGreaterThan(20);
        expect(q.explanation.trim().length, `${qid} explanation`).toBeGreaterThan(20);
      }
    }
  });
});
