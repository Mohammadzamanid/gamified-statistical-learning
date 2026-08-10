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
import { STAGED_INHERITED, STAGED_QUESTION_IDS, STAGING_OWNER } from "../helpers/staged-inherited";

const content = loadShippedContent();
const curriculum = content.curriculum;
const REGION_2 = "r.averages-atoll";
const REGION_1 = "r.harbor-tallies";

const region2 = curriculum.regions.find((r) => r.id === REGION_2)!;
const region2Modules = curriculum.modules.filter((m) => m.regionId === REGION_2);
const region2LessonIds = region2Modules.flatMap((m) => m.lessonIds);
const region2Lessons = region2LessonIds.map((id) => curriculum.lessons.find((l) => l.id === id)!);

/** Every Region 1 lesson marked complete, which is what opens the atoll. */
function withRegion1Complete(save: SaveFile): SaveFile {
  const region1 = curriculum.regions.find((r) => r.id === REGION_1)!;
  const lessonIds = curriculum.modules
    .filter((m) => region1.moduleIds.includes(m.id))
    .flatMap((m) => m.lessonIds);
  const lessonProgress = { ...save.lessonProgress };
  for (const lessonId of lessonIds) {
    lessonProgress[lessonId] = { lessonId, status: "completed", bestAccuracy: 1, completedAt: new Date().toISOString() };
  }
  return { ...save, lessonProgress };
}

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
  it("covers all 23 topics", () => {
    expect(REGION_2_TOPICS.length).toBe(23);
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

  it("opens nothing at all until Region 1 is charted", () => {
    // The region prerequisite gates the *region*, but every lesson-level rule in
    // this repository walks lesson prerequisites — unlocking, and the
    // beginner-safety notation check among them. So the region's entry lesson
    // has to depend on Region 1's lessons in that currency too, or a learner
    // would inherit nothing from Region 1 as far as any check can tell. The
    // notation guard caught exactly that on the first Region 2 lesson written.
    const save = freshSave();
    const open = region2Lessons.filter((l) => isLessonUnlocked(curriculum, save, l.id));
    expect(open.map((l) => l.id), "a Region 2 lesson is reachable before Region 1 is done").toEqual([]);
  });

  it("makes exactly one lesson available the moment the region opens", () => {
    // A learner arriving at the atoll must find one door, not twenty-two. "The
    // moment the region opens" means Region 1 complete, so that is the save this
    // is computed against — through the real unlock rule, not by reading JSON.
    const save = withRegion1Complete(freshSave());
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
          i === 0
            ? mod.prerequisites.length > 0
              ? mod.prerequisites.map((p) => byId.get(p)!.lessonIds.at(-1)!)
              : // The region's entry module: its first lesson reaches back to the
                // last lesson of every module of the region this one follows.
                curriculum.modules
                  .filter((m) => region2.prerequisites.includes(m.regionId))
                  .map((m) => m.lessonIds.at(-1)!)
            : [mod.lessonIds[i - 1]];
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
  it("accounts for all 20 seeded lessons", () => {
    const seeded = region2Lessons.filter((l) => l.id.startsWith("l.r2-"));
    expect(seeded.length, "the seeded lessons and the topic list have diverged").toBe(20);
  });

  it("leaves every lesson not declared Complete looking like a skeleton", () => {
    // S2-11 delivered architecture only; S2-12 onward fills the lessons in, a
    // module at a time. So the guard is no longer "every Region 2 lesson is a
    // skeleton" but "every one not declared Complete still is" — updated
    // deliberately as part of S2-12, not deleted to make the suite pass.
    // Anything in COMPLETE_LESSONS is held to all 18 checks in
    // tests/audit/lesson-structure.test.ts instead.
    //
    // The one thing a skeleton may hold beyond its seed is inherited Stage 1
    // content staged for it, and only what STAGED_INHERITED declares — see the
    // block below, which is what stops "staged" becoming a hiding place.
    const seeded = region2Lessons.filter((l) => l.id.startsWith("l.r2-") && !COMPLETE_LESSONS.includes(l.id));
    for (const lesson of seeded) {
      const staged = STAGED_INHERITED[lesson.id] ?? [];
      expect(
        lesson.questionIds.length,
        `${lesson.id} has grown beyond its seed question and what STAGED_INHERITED declares — declare it Complete`
      ).toBe(1 + staged.length);
      expect(lesson.demonstration, `${lesson.id} has a demonstration but is not declared Complete`).toBeUndefined();
      expect(lesson.concepts.length, `${lesson.id} has no concept`).toBeGreaterThan(0);
    }
  });

  it("lessons declared Complete have genuinely outgrown the skeleton", () => {
    // The mirror image, and the reason the list is worth having: a lesson cannot
    // be declared Complete while still carrying its single seed question.
    for (const lesson of region2Lessons.filter((l) => COMPLETE_LESSONS.includes(l.id))) {
      expect(lesson.questionIds.length, `${lesson.id} is declared Complete but still has one seed question`).toBeGreaterThan(1);
      expect(lesson.demonstration, `${lesson.id} is declared Complete but has no demonstration`).toBeDefined();
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

/**
 * S2-12: staged inheritance.
 *
 * Re-cutting the two Stage 1 centre lessons left four inherited questions whose
 * topics belong to modules nobody has written yet. They are parked in the
 * lessons that will teach them and declared in `STAGED_INHERITED`. The checks
 * below are the price of that exemption: a staged question is visible, singly
 * homed, still playable, and cannot be joined by an undeclared one.
 */
describe("staged inheritance is declared, bounded and temporary", () => {
  const lessonsById = new Map(curriculum.lessons.map((l) => [l.id, l]));

  it("stages only into Region 2 skeletons that are not declared Complete", () => {
    for (const lessonId of Object.keys(STAGED_INHERITED)) {
      const lesson = lessonsById.get(lessonId);
      expect(lesson, `${lessonId} is staged into but does not exist`).toBeDefined();
      expect(region2LessonIds, `${lessonId} is staged into but is not a Region 2 lesson`).toContain(lessonId);
      expect(lesson!.id.startsWith("l.r2-"), `${lessonId} is not a seeded lesson`).toBe(true);
      expect(
        COMPLETE_LESSONS.includes(lessonId),
        `${lessonId} is declared Complete, so its staged questions must be given roles and removed from STAGED_INHERITED`
      ).toBe(false);
    }
  });

  it("puts exactly the declared questions in each staging lesson, after its seed", () => {
    // Both directions. An undeclared question appearing in a skeleton is the
    // silent accumulation this whole mechanism exists to prevent; a declared one
    // that is not actually there is a list describing a repository that no
    // longer exists.
    for (const [lessonId, staged] of Object.entries(STAGED_INHERITED)) {
      const lesson = lessonsById.get(lessonId)!;
      expect(lesson.questionIds[0], `${lessonId} no longer leads with its seed question`).toBe(
        `q.seed.${lessonId.slice("l.".length)}`
      );
      expect([...lesson.questionIds.slice(1)].sort(), `${lessonId} staged questions`).toEqual([...staged].sort());
    }
  });

  it("stages inherited questions only, never newly authored ones", () => {
    // Staging is a holding pattern for content Stage 1 already had. Something
    // written this stage has a lesson to be written into, so allowing new
    // authorship here would turn the exemption into a way of shipping
    // unstructured content.
    for (const qid of STAGED_QUESTION_IDS) {
      const q = content.questions.get(qid);
      expect(q, `staged question ${qid} does not exist`).toBeDefined();
      expect(qid.startsWith("q.r2-") || qid.startsWith("q.seed."), `${qid} is not inherited Stage 1 content`).toBe(false);
      const stages = new Set(
        q!.skillIds.map((sid) => curriculum.skills.find((s) => s.id === sid)?.stage)
      );
      expect([...stages], `${qid} carries a skill this stage introduced`).toEqual([1]);
    }
  });

  it("gives every staged question exactly one home", () => {
    for (const qid of STAGED_QUESTION_IDS) {
      const homes = curriculum.lessons.filter((l) => l.questionIds.includes(qid)).map((l) => l.id);
      expect(homes.length, `${qid} is asked by ${homes.length} lessons: ${homes.join(", ")}`).toBe(1);
      expect(Object.keys(STAGED_INHERITED)).toContain(homes[0]);
    }
  });

  it("holds staged questions to the presentation half of scope §5", () => {
    // A learner meets these today, so what is deferred is the lesson structure
    // around them — a role, a demonstration, a narrative — not whether they can
    // be read or understood. Requirements 12, 14 and 18, applied question by
    // question.
    for (const qid of STAGED_QUESTION_IDS) {
      const q = content.questions.get(qid)!;
      expect(q.prompt.trim().length, `${qid} prompt is a stub`).toBeGreaterThan(30);
      expect(q.explanation.trim().length, `${qid} explains nothing`).toBeGreaterThan(40);
      expect(
        (q.accessibilityDescription ?? "").trim().length,
        `${qid} is staged but has no accessibility description`
      ).toBeGreaterThan(20);
      if (q.visual.kind !== "none") {
        expect((q.visual.accessibleDescription ?? "").trim().length, `${qid} visual`).toBeGreaterThan(0);
      }
    }
  });

  it("records the unit that owes the work", () => {
    expect(STAGING_OWNER).toBe("S2-14");
    // Staging is meant to shrink. If the map is ever empty the mechanism has
    // done its job and this whole block should be deleted rather than kept as
    // scaffolding nothing uses.
    expect(STAGED_QUESTION_IDS.length, "STAGED_INHERITED is empty — delete the staging mechanism").toBeGreaterThan(0);
    expect(STAGED_QUESTION_IDS.length, "staging is growing rather than shrinking").toBeLessThanOrEqual(2);
  });
});
