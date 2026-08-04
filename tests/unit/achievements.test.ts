import { describe, expect, it } from "vitest";
import { evaluateAchievements } from "../../src/core/achievements/engine";
import type { RegionGraph } from "../../src/core/curriculum/progress";
import { createEmptySave, type Achievement, type SaveFile } from "../../src/shared/schemas";

const achievements: Achievement[] = [
  { id: "ach.one", title: "One", description: "d", trigger: { kind: "questions-answered", count: 1 } },
  { id: "ach.streak", title: "S", description: "d", trigger: { kind: "streak", count: 2 } }
];

/** Two-lesson region, plus a second single-lesson region used for isolation checks. */
const graph: RegionGraph = {
  regions: [
    { id: "r.one", moduleIds: ["m.one"] },
    { id: "r.two", moduleIds: ["m.two"] }
  ],
  modules: [
    { id: "m.one", lessonIds: ["l.a", "l.b"] },
    { id: "m.two", lessonIds: ["l.c"] }
  ]
};

const regionAchievements: Achievement[] = [
  { id: "ach.region-one", title: "R1", description: "d", trigger: { kind: "region-completed", regionId: "r.one" } },
  { id: "ach.region-two", title: "R2", description: "d", trigger: { kind: "region-completed", regionId: "r.two" } }
];

const emptyGraph: RegionGraph = { regions: [], modules: [] };

function freshSave(): SaveFile {
  return createEmptySave({ id: "p", name: "T", createdAt: new Date().toISOString(), isGuest: false, avatarSeed: 0 });
}

function completeLessons(save: SaveFile, ...lessonIds: string[]): SaveFile {
  const lessonProgress = { ...save.lessonProgress };
  for (const lessonId of lessonIds) {
    lessonProgress[lessonId] = {
      lessonId,
      status: "completed",
      bestAccuracy: 1,
      completedAt: new Date().toISOString()
    };
  }
  return { ...save, lessonProgress };
}

describe("achievements engine", () => {
  it("awards question-count and streak triggers exactly once", () => {
    const save = freshSave();
    const at = new Date().toISOString();
    save.attemptLog.push(
      { questionId: "q1", at, correct: true, responseMs: 100, hintsUsed: 0, misconceptionId: null },
      { questionId: "q2", at, correct: true, responseMs: 100, hintsUsed: 0, misconceptionId: null }
    );
    const earned = evaluateAchievements(save, achievements, emptyGraph);
    expect(earned).toContain("ach.one");
    expect(earned).toContain("ach.streak");
    save.achievements.push(...earned);
    expect(evaluateAchievements(save, achievements, emptyGraph)).toEqual([]);
  });
});

describe("region-completed achievement trigger", () => {
  it("awards the region achievement when every lesson in the region is completed", () => {
    const save = completeLessons(freshSave(), "l.a", "l.b");
    expect(evaluateAchievements(save, regionAchievements, graph)).toEqual(["ach.region-one"]);
  });

  it("does not award while the region is only partly completed", () => {
    const save = completeLessons(freshSave(), "l.a");
    expect(evaluateAchievements(save, regionAchievements, graph)).toEqual([]);
  });

  it("does not award for a region with no completed lessons at all", () => {
    expect(evaluateAchievements(freshSave(), regionAchievements, graph)).toEqual([]);
  });

  it("does not award a region whose lessons are merely in progress", () => {
    const save = freshSave();
    save.lessonProgress["l.a"] = { lessonId: "l.a", status: "in-progress", bestAccuracy: 0.5, completedAt: null };
    save.lessonProgress["l.b"] = { lessonId: "l.b", status: "completed", bestAccuracy: 1, completedAt: null };
    expect(evaluateAchievements(save, regionAchievements, graph)).toEqual([]);
  });

  it("awards only the completed region, not its siblings", () => {
    const save = completeLessons(freshSave(), "l.c");
    expect(evaluateAchievements(save, regionAchievements, graph)).toEqual(["ach.region-two"]);
  });

  it("never awards the same region achievement twice", () => {
    let save = completeLessons(freshSave(), "l.a", "l.b");
    const first = evaluateAchievements(save, regionAchievements, graph);
    expect(first).toEqual(["ach.region-one"]);
    save = { ...save, achievements: [...save.achievements, ...first] };
    expect(evaluateAchievements(save, regionAchievements, graph)).toEqual([]);
  });

  it("awards only once even if the same achievement is listed twice in the catalogue", () => {
    const save = completeLessons(freshSave(), "l.a", "l.b");
    const duplicated = [regionAchievements[0]!, regionAchievements[0]!];
    expect(evaluateAchievements(save, duplicated, graph)).toEqual(["ach.region-one"]);
  });

  it("does not award an achievement pointing at an unknown region", () => {
    const save = completeLessons(freshSave(), "l.a", "l.b");
    const ghost: Achievement[] = [
      { id: "ach.ghost", title: "G", description: "d", trigger: { kind: "region-completed", regionId: "r.missing" } }
    ];
    expect(evaluateAchievements(save, ghost, graph)).toEqual([]);
  });

  it("does not award a region whose module reference is dangling", () => {
    const brokenGraph: RegionGraph = {
      regions: [{ id: "r.one", moduleIds: ["m.one", "m.gone"] }],
      modules: [{ id: "m.one", lessonIds: ["l.a"] }]
    };
    const save = completeLessons(freshSave(), "l.a");
    expect(evaluateAchievements(save, regionAchievements, brokenGraph)).toEqual([]);
  });

  it("does not vacuously award a region that contains no lessons", () => {
    const emptyRegion: RegionGraph = {
      regions: [{ id: "r.one", moduleIds: ["m.one"] }],
      modules: [{ id: "m.one", lessonIds: [] }]
    };
    expect(evaluateAchievements(freshSave(), regionAchievements, emptyRegion)).toEqual([]);
  });

  it("does not vacuously award a region that lists no modules", () => {
    const noModules: RegionGraph = { regions: [{ id: "r.one", moduleIds: [] }], modules: [] };
    expect(evaluateAchievements(freshSave(), regionAchievements, noModules)).toEqual([]);
  });
});
