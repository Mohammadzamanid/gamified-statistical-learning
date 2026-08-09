/**
 * S2-11: Region 2's architecture — that the shape exists, is reachable, and is
 * honest about being unfinished.
 *
 * The same job the Region 1 architecture audit did for S2-07, and the same
 * boundary: this checks *shape*, not teaching quality. A lesson passing here is
 * reachable and ordered; it is **not** Complete. Completeness means the 18
 * structure requirements of scope §5, and filling these lessons in is S2-12
 * through S2-14 — see the skeleton-honesty checks at the end, which assert these
 * lessons still look like skeletons so nobody can mistake one for finished work.
 */
import { describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import { isLaboratoryUnlocked, isLessonUnlocked, isRegionUnlocked } from "../../src/core/curriculum/progress";
import { createEmptySave, type SaveFile } from "../../src/shared/schemas";
import { COMPLETE_LESSONS } from "../helpers/complete-lessons";
import { REGION_2_TOPICS } from "../helpers/region2-topics";

const content = loadShippedContent();
const curriculum = content.curriculum;
const REGION_2 = "r.averages-atoll";
const REGION_1 = "r.harbor-tallies";

const region2 = curriculum.regions.find((r) => r.id === REGION_2)!;
const region2Modules = curriculum.modules.filter((m) => m.regionId === REGION_2);
const region2LessonIds = region2Modules.flatMap((m) => m.lessonIds);
const region2Lessons = region2LessonIds.map((id) => curriculum.lessons.find((l) => l.id === id)!);

function freshSave(): SaveFile {
  return createEmptySave({
    id: "p.r2",
    name: "Atoll Tester",
    createdAt: new Date().toISOString(),
    isGuest: false,
    avatarSeed: 0
  });
}

describe("every required Region 2 topic has exactly one lesson", () => {
  it("covers all 22 topics", () => {
    expect(REGION_2_TOPICS.length).toBe(22);
  });

  it("gives each topic a lesson that exists inside Region 2", () => {
    for (const { topic, lessonId } of REGION_2_TOPICS) {
      expect(region2LessonIds, `${topic} has no lesson in Region 2`).toContain(lessonId);
    }
  });

  it("gives each topic a skill the curriculum declares", () => {
    const skillIds = new Set(curriculum.skills.map((s) => s.id));
    for (const { topic, skillId } of REGION_2_TOPICS) {
      expect(skillIds.has(skillId), `${topic} names skill ${skillId}, which does not exist`).toBe(true);
    }
  });

  it("routes each topic's lesson to its skill through an objective", () => {
    // The link a coverage report walks: lesson -> objective -> skill. A lesson
    // whose objective does not reach its topic's skill is a lesson about
    // something else wearing the right title.
    for (const { topic, lessonId, skillId } of REGION_2_TOPICS) {
      const lesson = curriculum.lessons.find((l) => l.id === lessonId)!;
      const reached = new Set(
        lesson.objectiveIds.flatMap(
          (oid) => curriculum.objectives.find((o) => o.id === oid)?.skillIds ?? []
        )
      );
      expect(reached.has(skillId), `${topic}: ${lessonId} does not reach ${skillId} through any objective`).toBe(true);
    }
  });

  it("holds no Region 2 lesson that is not a declared topic lesson", () => {
    // The other direction: a lesson nobody declared is a lesson no audit checks.
    const declared = new Set(REGION_2_TOPICS.map((t) => t.lessonId));
    for (const lesson of region2Lessons) {
      expect(declared.has(lesson.id), `${lesson.id} is in Region 2 but is not a declared topic lesson`).toBe(true);
    }
  });
});

describe("the region is ordered and reachable", () => {
  it("is locked on a fresh save and unlocks behind Region 1", () => {
    expect(isRegionUnlocked(curriculum, freshSave(), REGION_2)).toBe(false);
    expect(region2.prerequisites).toEqual([REGION_1]);
  });

  it("gives every module a place in the sequence", () => {
    expect(region2.moduleIds.length).toBeGreaterThan(1);
    expect([...region2.moduleIds].sort()).toEqual(region2Modules.map((m) => m.id).sort());
  });

  it("has exactly one module with no prerequisite, so the region has one way in", () => {
    const entries = region2Modules.filter((m) => m.prerequisites.length === 0);
    expect(entries.map((m) => m.id)).toEqual(["m.r2-counts"]);
  });

  it("never names a module prerequisite outside its own region", () => {
    const ids = new Set(region2Modules.map((m) => m.id));
    for (const mod of region2Modules) {
      for (const prereq of mod.prerequisites) {
        expect(ids.has(prereq), `${mod.id} depends on ${prereq}, which is not a Region 2 module`).toBe(true);
      }
    }
  });

  it("has no cycle in its module graph", () => {
    // Depth-first, because a cycle here would deadlock the region rather than
    // fail loudly: every module would wait on another.
    const byId = new Map(region2Modules.map((m) => [m.id, m]));
    const state = new Map<string, "visiting" | "done">();
    const walk = (id: string, trail: string[]): void => {
      if (state.get(id) === "done") return;
      expect(state.get(id), `module cycle: ${[...trail, id].join(" -> ")}`).not.toBe("visiting");
      state.set(id, "visiting");
      for (const prereq of byId.get(id)?.prerequisites ?? []) walk(prereq, [...trail, id]);
      state.set(id, "done");
    };
    for (const mod of region2Modules) walk(mod.id, []);
  });

  it("makes exactly one lesson available the moment the region opens", () => {
    // A learner arriving at the atoll must find one door, not twenty-two and not
    // none. Computed through the real unlock rule, not by reading the JSON.
    const save = freshSave();
    const available = region2Lessons.filter((l) => isLessonUnlocked(curriculum, save, l.id));
    expect(available.map((l) => l.id)).toEqual(["l.r2-frequency"]);
  });

  it("chains every module's lessons so each opens the next", () => {
    // Unlocking is computed from *lesson* prerequisites, so a module's ordering
    // has to be expressed in them: within a module each lesson waits on the one
    // before, and a module's first lesson waits on the last lesson of every
    // module it depends on. Declaring module prerequisites alone would leave
    // every module's first lesson open from the start — which is exactly what
    // the check above caught on the first run.
    const byId = new Map(region2Modules.map((m) => [m.id, m]));
    for (const mod of region2Modules) {
      mod.lessonIds.forEach((lessonId, i) => {
        const lesson = curriculum.lessons.find((l) => l.id === lessonId)!;
        const expected =
          i === 0 ? mod.prerequisites.map((p) => byId.get(p)!.lessonIds.at(-1)!) : [mod.lessonIds[i - 1]];
        expect([...lesson.prerequisites].sort(), `${lessonId} is out of sequence in ${mod.id}`).toEqual(
          [...expected].sort()
        );
      });
    }
  });
});

describe("the laboratory has a declared gate", () => {
  it("declares which lesson opens the bench, and says so to the learner", () => {
    expect(curriculum.laboratoryUnlock, "no laboratory gate is declared").toBeDefined();
    const gate = curriculum.laboratoryUnlock!;
    expect(curriculum.lessons.some((l) => l.id === gate.lessonId), `${gate.lessonId} does not exist`).toBe(true);
    expect(gate.sealedNote.trim().length).toBeGreaterThan(20);
  });

  it("is sealed on a fresh save and open once that lesson is completed", () => {
    const save = freshSave();
    expect(isLaboratoryUnlocked(curriculum, save)).toBe(false);

    const gate = curriculum.laboratoryUnlock!;
    const opened: SaveFile = {
      ...save,
      lessonProgress: {
        ...save.lessonProgress,
        [gate.lessonId]: {
          lessonId: gate.lessonId,
          status: "completed",
          bestAccuracy: 1,
          completedAt: new Date().toISOString()
        }
      }
    };
    expect(isLaboratoryUnlocked(curriculum, opened)).toBe(true);
  });
});

describe("every skill says which stage owns it", () => {
  it("classifies every skill in the curriculum", () => {
    // Scope §10 makes an unclassified skill a closure failure. The field is
    // required with no default, so this check exists to catch a *wrong* stage
    // rather than a missing one.
    for (const skill of curriculum.skills) {
      expect(skill.stage, `${skill.id} has no stage`).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps every skill inside a stage that has begun", () => {
    // "A Stage 3 topic appears before Stage 3 begins" is its own closure guard.
    for (const skill of curriculum.skills) {
      expect(skill.stage, `${skill.id} is classified as Stage ${skill.stage}, which has not begun`).toBeLessThanOrEqual(2);
    }
  });

  it("marks the Stage 1 inheritance as Stage 1 and everything S2 wrote as Stage 2", () => {
    const inherited = new Set(["skill.data-literacy", "skill.mean", "skill.median", "skill.choose-measure", "skill.range", "skill.percent-fraction"]);
    for (const skill of curriculum.skills) {
      expect(skill.stage, `${skill.id}`).toBe(inherited.has(skill.id) ? 1 : 2);
    }
  });
});

describe("skeleton honesty", () => {
  // S2-11 delivers architecture only. Every Region 2 lesson is either inherited
  // from Stage 1 or a skeleton this unit seeded, and none is Complete — filling
  // them in is S2-12 through S2-14. The moment one is declared Complete it must
  // survive all 18 checks in tests/audit/lesson-structure.test.ts.
  it("declares no Region 2 lesson Complete yet", () => {
    for (const lesson of region2Lessons) {
      expect(COMPLETE_LESSONS.includes(lesson.id), `${lesson.id} is declared Complete but Region 2 lessons are not written yet`).toBe(false);
    }
  });

  it("leaves every seeded lesson looking like a skeleton", () => {
    // One seed question and no demonstration. A lesson that has grown past this
    // without being declared Complete is a lesson the structure audit never
    // checks, which is the failure mode this guard exists for.
    const seeded = region2Lessons.filter((l) => l.id.startsWith("l.r2-"));
    expect(seeded.length, "the seeded lessons and the topic list have diverged").toBe(19);
    for (const lesson of seeded) {
      expect(lesson.questionIds.length, `${lesson.id} has grown beyond its seed question — declare it Complete`).toBe(1);
      expect(lesson.demonstration, `${lesson.id} has a demonstration but is not declared Complete`).toBeUndefined();
      expect(lesson.concepts.length, `${lesson.id} has no concept`).toBeGreaterThan(0);
    }
  });

  it("names exactly the lessons inherited from Stage 1", () => {
    // The three lessons S2-11 moved rather than wrote. They carry real content
    // and more than one question, so the skeleton shape above does not apply to
    // them — and saying which they are stops that exemption spreading.
    const inherited = REGION_2_TOPICS.filter((t) => t.inherited).map((t) => t.lessonId).sort();
    expect(inherited).toEqual(["l.middle-harbor", "l.reading-tallies", "l.spread-1"]);
    for (const lessonId of inherited) {
      const lesson = curriculum.lessons.find((l) => l.id === lessonId)!;
      expect(lesson.id.startsWith("l.r2-"), `${lessonId} is not an inherited id`).toBe(false);
      expect(region2LessonIds, `${lessonId} was not moved into Region 2`).toContain(lessonId);
    }
  });
});
