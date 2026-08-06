/**
 * S2-07: the Region 1 architecture, enforced.
 *
 * "Every required topic represented and reachable" is only meaningful if
 * something checks it, so the required topic list from
 * `STAGE2_RECONSTRUCTION_SCOPE.md` §2 lives here and the tests walk the real
 * prerequisite graph from a fresh save.
 *
 * This audit deliberately checks *shape*, not teaching quality. A lesson passing
 * here is reachable and ordered; it is **not** Complete. Completeness means the
 * 18 structure requirements in scope §5 and is S2-08's job — see the skeleton
 * check at the end, which asserts these lessons still look like skeletons so
 * nobody can mistake one for finished work.
 */
import { describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import { isLessonUnlocked } from "../../src/core/curriculum/progress";
import { createEmptySave, type SaveFile } from "../../src/shared/schemas";
import { COMPLETE_LESSONS } from "../helpers/complete-lessons";

const content = loadShippedContent();
const REGION_1 = "r.harbor-tallies";

/** The 17 Region 1 topics required by the scope document, as skill ids. */
const REQUIRED_TOPICS: ReadonlyArray<{ topic: string; skillId: string }> = [
  { topic: "Counting", skillId: "skill.r1-counting" },
  { topic: "Addition", skillId: "skill.r1-addition" },
  { topic: "Subtraction", skillId: "skill.r1-subtraction" },
  { topic: "Multiplication", skillId: "skill.r1-multiplication" },
  { topic: "Division", skillId: "skill.r1-division" },
  { topic: "Fractions", skillId: "skill.r1-fractions" },
  { topic: "Decimals", skillId: "skill.r1-decimals" },
  { topic: "Percentages", skillId: "skill.r1-percentages" },
  { topic: "Ratios", skillId: "skill.r1-ratios" },
  { topic: "Proportions", skillId: "skill.r1-proportions" },
  { topic: "Negative numbers", skillId: "skill.r1-negatives" },
  { topic: "Number lines", skillId: "skill.r1-number-lines" },
  { topic: "Coordinates", skillId: "skill.r1-coordinates" },
  { topic: "Reading tables", skillId: "skill.r1-tables" },
  { topic: "Variables", skillId: "skill.r1-variables" },
  { topic: "Data, cases and observations", skillId: "skill.r1-cases" },
  { topic: "Categorical and numerical variables", skillId: "skill.r1-variable-kinds" }
];

const region = content.curriculum.regions.find((r) => r.id === REGION_1)!;
const region1Modules = content.curriculum.modules.filter((m) => region.moduleIds.includes(m.id));
const region1LessonIds = region1Modules.flatMap((m) => m.lessonIds);
const region1Lessons = content.curriculum.lessons.filter((l) => region1LessonIds.includes(l.id));

/** The skills a lesson teaches, via its objectives. */
function skillsOfLesson(lessonId: string): string[] {
  const lesson = content.curriculum.lessons.find((l) => l.id === lessonId);
  if (!lesson) return [];
  return lesson.objectiveIds.flatMap(
    (oid) => content.curriculum.objectives.find((o) => o.id === oid)?.skillIds ?? []
  );
}

function completed(save: SaveFile, lessonIds: string[]): SaveFile {
  const lessonProgress = { ...save.lessonProgress };
  for (const id of lessonIds) {
    lessonProgress[id] = { lessonId: id, status: "completed", bestAccuracy: 1, completedAt: new Date().toISOString() };
  }
  return { ...save, lessonProgress };
}

function freshSave(): SaveFile {
  return createEmptySave({
    id: "p.arch",
    name: "Architect",
    createdAt: new Date().toISOString(),
    isGuest: false,
    avatarSeed: 0
  });
}

describe("Region 1 covers every required topic", () => {
  it("has a lesson for each of the 17 topics", () => {
    const covered = new Set(region1LessonIds.flatMap(skillsOfLesson));
    const missing = REQUIRED_TOPICS.filter((t) => !covered.has(t.skillId)).map((t) => t.topic);
    expect(missing, `Region 1 topics with no lesson: ${missing.join(", ")}`).toEqual([]);
  });

  it("declares a skill and an objective for each topic", () => {
    const skillIds = new Set(content.curriculum.skills.map((s) => s.id));
    const objectiveSkillIds = new Set(content.curriculum.objectives.flatMap((o) => o.skillIds));
    for (const t of REQUIRED_TOPICS) {
      expect(skillIds.has(t.skillId), `${t.topic}: no skill`).toBe(true);
      expect(objectiveSkillIds.has(t.skillId), `${t.topic}: no objective teaches it`).toBe(true);
    }
  });

  it("gives every topic at least one question", () => {
    const questionSkills = new Set([...content.questions.values()].flatMap((q) => q.skillIds));
    const unpractised = REQUIRED_TOPICS.filter((t) => !questionSkills.has(t.skillId)).map((t) => t.topic);
    expect(unpractised, `topics with no question: ${unpractised.join(", ")}`).toEqual([]);
  });
});

describe("the prerequisite graph is sound", () => {
  it("references only lessons that exist", () => {
    const lessonIds = new Set(content.curriculum.lessons.map((l) => l.id));
    for (const lesson of region1Lessons) {
      for (const p of lesson.prerequisites) {
        expect(lessonIds.has(p), `${lesson.id} requires missing lesson ${p}`).toBe(true);
      }
    }
  });

  it("has no cycles", () => {
    const prereqs = new Map(content.curriculum.lessons.map((l) => [l.id, l.prerequisites]));
    const state = new Map<string, "visiting" | "done">();
    const walk = (id: string, trail: string[]): void => {
      if (state.get(id) === "done") return;
      expect(state.get(id), `prerequisite cycle: ${[...trail, id].join(" -> ")}`).not.toBe("visiting");
      state.set(id, "visiting");
      for (const p of prereqs.get(id) ?? []) walk(p, [...trail, id]);
      state.set(id, "done");
    };
    for (const lesson of region1Lessons) walk(lesson.id, []);
  });

  it("has at least one lesson a brand-new learner can start", () => {
    const save = freshSave();
    const open = region1Lessons.filter((l) => isLessonUnlocked(content.curriculum, save, l.id));
    expect(open.length, "Region 1 has no entry point").toBeGreaterThan(0);
  });

  it("makes every lesson reachable by completing prerequisites in order", () => {
    // Walk the graph the way a learner would: repeatedly finish whatever is
    // unlocked. Anything still locked at the end is unreachable content.
    let save = freshSave();
    const done = new Set<string>();
    let guard = 0;

    for (;;) {
      expect(guard++, "unlock walk did not terminate").toBeLessThan(100);
      const newlyOpen = region1Lessons
        .filter((l) => !done.has(l.id))
        .filter((l) => isLessonUnlocked(content.curriculum, save, l.id))
        .map((l) => l.id);
      if (newlyOpen.length === 0) break;
      for (const id of newlyOpen) done.add(id);
      save = completed(save, [...done]);
    }

    const unreachable = region1Lessons.filter((l) => !done.has(l.id)).map((l) => l.id);
    expect(unreachable, `Region 1 lessons no learner can reach: ${unreachable.join(", ")}`).toEqual([]);
  });
});

describe("every Region 1 lesson is structurally valid", () => {
  it("belongs to a module of this region and has objectives, concepts and questions", () => {
    for (const lesson of region1Lessons) {
      expect(region1LessonIds).toContain(lesson.id);
      expect(lesson.objectiveIds.length, `${lesson.id} objectives`).toBeGreaterThan(0);
      expect(lesson.concepts.length, `${lesson.id} concepts`).toBeGreaterThan(0);
      expect(lesson.questionIds.length, `${lesson.id} questions`).toBeGreaterThan(0);
      for (const qid of lesson.questionIds) {
        expect(content.questions.get(qid), `${lesson.id} references missing question ${qid}`).toBeDefined();
      }
    }
  });

  it("gives every concept a title, summary and body", () => {
    for (const lesson of region1Lessons) {
      for (const concept of lesson.concepts) {
        expect(concept.title.trim().length, `${lesson.id}/${concept.id} title`).toBeGreaterThan(0);
        expect(concept.summary.trim().length, `${lesson.id}/${concept.id} summary`).toBeGreaterThan(0);
        expect(concept.body.trim().length, `${lesson.id}/${concept.id} body`).toBeGreaterThan(0);
      }
    }
  });
});

describe("skeleton honesty", () => {
  // S2-07 delivered architecture only; S2-08 fills the lessons in, a module at a
  // time. The guard is therefore no longer "every topic lesson is a skeleton" but
  // "every topic lesson is either a declared-Complete lesson or still a skeleton" —
  // updated deliberately as part of S2-08, not deleted to make the suite pass.
  // Anything in COMPLETE_LESSONS has to survive all 18 checks in
  // tests/audit/lesson-structure.test.ts.
  const seedLessons = region1Lessons.filter((l) => l.id.startsWith("l.r1-"));

  it("accounts for all 17 topic lessons", () => {
    expect(seedLessons.length).toBe(REQUIRED_TOPICS.length);
  });

  it("lessons not declared Complete still look like skeletons", () => {
    const skeletons = seedLessons.filter((l) => !COMPLETE_LESSONS.includes(l.id));
    // All 17 topics are now finished lessons, so nothing is left in skeleton
    // state. If this ever rises above zero, a lesson has been added without being
    // declared Complete — which the structure audit would then never check.
    expect(skeletons.length, "the Complete list and the content have diverged").toBe(0);
    for (const lesson of skeletons) {
      expect(
        lesson.questionIds.length,
        `${lesson.id} has grown beyond a seed question but is not in COMPLETE_LESSONS — declare it and let the structure audit check it.`
      ).toBe(1);
      expect(lesson.demonstration, `${lesson.id} has a demonstration but is not declared Complete`).toBeUndefined();
    }
  });

  it("lessons declared Complete have genuinely outgrown the skeleton", () => {
    // The mirror image: a lesson cannot be listed as Complete while still
    // carrying the single seed question S2-07 gave it.
    for (const id of COMPLETE_LESSONS) {
      const lesson = region1Lessons.find((l) => l.id === id);
      expect(lesson, `${id} is declared Complete but is not a Region 1 lesson`).toBeDefined();
      expect(lesson!.questionIds.length, `${id} is declared Complete but still has one seed question`).toBeGreaterThan(1);
    }
  });

  it("names the only Region 1 lessons that are not Complete, and why", () => {
    // S2-08 finished all 17 scope §2 topic lessons. Two lessons inherited from
    // Stage 1 still sit inside the Region 1 container and are NOT Complete: they
    // teach centre and tallies, which the Stage 2 scope places in Region 2, so
    // re-cutting them is S2-11's job rather than something S2-08 skipped.
    //
    // This is asserted rather than written in a doc so the exception cannot grow
    // quietly: a third un-Complete lesson appearing in Region 1 fails here.
    const INHERITED_FROM_STAGE_1 = ["l.reading-tallies", "l.middle-harbor"];
    const notComplete = region1Lessons.filter((l) => !COMPLETE_LESSONS.includes(l.id)).map((l) => l.id).sort();
    expect(
      notComplete,
      "Region 1 holds an un-Complete lesson that is not one of the two known Stage 1 inheritances"
    ).toEqual([...INHERITED_FROM_STAGE_1].sort());
  });
});
