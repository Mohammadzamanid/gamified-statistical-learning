/**
 * S2-08: Module 4 (`m.r1-data`) driven through the real session engine.
 *
 * The last module of Region 1, and the least numeric: a table, a variable and a
 * case are structures rather than quantities. Its demonstrations therefore index
 * a table instead of computing over one, which is a capability nothing before
 * this cycle used — so the checks below drive those table readouts directly as
 * well as playing the lessons.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import type { SaveFile } from "../../src/shared/schemas";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { isLessonUnlocked } from "../../src/core/curriculum/progress";
import { startLesson, submitAnswer, advance } from "../../src/renderer/state/session";
import type { RawResponse } from "../../src/core/questions/types";
import { demonstrationReadout, describeDemonstration, initialValues } from "../../src/core/curriculum/demonstration";
import { freshSave as makeSave, playLesson as play, skillsOfLesson } from "../helpers/lesson-playthrough";
import { COMPLETE_LESSONS } from "../helpers/complete-lessons";

const content = loadShippedContent();

const MODULE_1 = content.curriculum.modules.find((m) => m.id === "m.r1-counting")!;
const MODULE_4 = content.curriculum.modules.find((m) => m.id === "m.r1-data")!;

const freshSave = (): SaveFile => makeSave("p.module4", "Clerk");
const playLesson = (save: SaveFile, lessonId: string, startMs: number): SaveFile =>
  play(content, save, lessonId, startMs);

function saveWithModule1Done(): SaveFile {
  let save = freshSave();
  let t = 1000;
  for (const lessonId of MODULE_1.lessonIds) save = playLesson(save, lessonId, (t += 60_000));
  return save;
}

describe("Module 4 can be played once Module 1 is done", () => {
  beforeAll(() => {
    clearDetectors();
    registerBuiltInDetectors();
  });

  it("has every one of its lessons declared Complete", () => {
    const notDeclared = MODULE_4.lessonIds.filter((id) => !COMPLETE_LESSONS.includes(id));
    expect(notDeclared, `Module 4 lessons missing from COMPLETE_LESSONS: ${notDeclared.join(", ")}`).toEqual([]);
  });

  it("is locked to a brand-new learner", () => {
    const save = freshSave();
    for (const lessonId of MODULE_4.lessonIds) {
      expect(
        isLessonUnlocked(content.curriculum, save, lessonId),
        `${lessonId} is open before Module 1 has been touched`
      ).toBe(false);
    }
  });

  it("unlocks one lesson at a time, in the declared order", () => {
    let save = saveWithModule1Done();
    let t = 500_000;

    for (const [i, lessonId] of MODULE_4.lessonIds.entries()) {
      expect(isLessonUnlocked(content.curriculum, save, lessonId), `${lessonId} should be open by now`).toBe(true);
      const next = MODULE_4.lessonIds[i + 1];
      if (next) {
        expect(isLessonUnlocked(content.curriculum, save, next), `${next} unlocked before ${lessonId} was done`).toBe(
          false
        );
      }
      save = playLesson(save, lessonId, t);
      t += 60_000;
    }

    for (const lessonId of MODULE_4.lessonIds) {
      expect(save.lessonProgress[lessonId]?.status).toBe("completed");
    }
  });

  it("schedules every Module 4 skill for review once its lesson is played", () => {
    let save = saveWithModule1Done();
    let t = 500_000;
    for (const lessonId of MODULE_4.lessonIds) save = playLesson(save, lessonId, (t += 60_000));

    for (const skillId of new Set(MODULE_4.lessonIds.flatMap((id) => skillsOfLesson(content, id)))) {
      expect(save.skillStates[skillId]?.attempts, `${skillId} recorded no attempts`).toBeGreaterThan(0);
      expect(save.reviewQueue.some((r) => r.skillId === skillId), `${skillId} was never scheduled`).toBe(true);
    }
  });
});

describe("the table demonstrations read the ledger they claim to", () => {
  const tableDemos = MODULE_4.lessonIds
    .map((id) => content.curriculum.lessons.find((l) => l.id === id)!)
    .filter((l) => l.demonstration?.table);

  it("ships table-reading demonstrations", () => {
    expect(tableDemos.length, "Module 4 teaches tables but no demonstration reads one").toBeGreaterThan(0);
  });

  it("can reach every cell of every table it ships", () => {
    // A selector that cannot reach part of its own grid is a control with dead
    // positions behind it, and the readout would throw when the learner got there.
    for (const lesson of tableDemos) {
      const demo = lesson.demonstration!;
      const table = demo.table!;
      if (demo.formula !== "table-cell") continue;
      for (let row = 1; row <= table.rowLabels.length; row++) {
        for (let col = 1; col <= table.columnLabels.length; col++) {
          const value = demonstrationReadout(demo, [row, col]);
          expect(value, `${demo.id}: cell ${row},${col} is not a number`).toBe(table.cells[row - 1]![col - 1]);
        }
      }
    }
  });

  it("names rows and columns in words, never as indices", () => {
    for (const lesson of tableDemos) {
      const demo = lesson.demonstration!;
      const spoken = describeDemonstration(demo, initialValues(demo));
      demo.controls.forEach((control, i) => {
        // Not skipped when the labels are missing — an unlabelled table selector
        // is the defect this check exists to catch, so it fails here rather than
        // passing vacuously.
        expect(
          control.valueLabels.length,
          `${demo.id}/${control.id} selects from a table but names none of its positions`
        ).toBeGreaterThan(0);
        const expected = control.valueLabels[initialValues(demo)[i]! - 1]!;
        expect(spoken, `${demo.id}/${control.id} is spoken as a number, not a name`).toContain(expected);
      });
    }
  });

  it("proves the constant column really is constant", () => {
    // The variables lesson rests entirely on one column never changing. If the
    // content drifted and it started to vary, the lesson would teach nothing.
    const lesson = content.curriculum.lessons.find((l) => l.id === "l.r1-variables")!;
    const demo = lesson.demonstration!;
    const table = demo.table!;
    const constant = table.columnLabels.indexOf("Harbour code");
    expect(constant, "the variables demonstration has no constant column").toBeGreaterThanOrEqual(0);

    const values = table.cells.map((row) => row[constant]!);
    expect(new Set(values).size, "the harbour-code column varies, so the lesson's point collapses").toBe(1);

    // And at least one other column must vary, or the contrast is invisible.
    const varying = table.columnLabels.some(
      (_, c) => c !== constant && new Set(table.cells.map((row) => row[c]!)).size > 1
    );
    expect(varying, "no column varies, so there is nothing to contrast the constant with").toBe(true);
  });

  it("gives the meaningless total a real value, so the point lands", () => {
    // The variable-kinds demonstration argues that arithmetic runs happily on a
    // categorical column. That only works if the total actually computes.
    const lesson = content.curriculum.lessons.find((l) => l.id === "l.r1-variable-kinds")!;
    const demo = lesson.demonstration!;
    const table = demo.table!;
    const boatNumber = table.columnLabels.indexOf("Boat number");
    expect(boatNumber, "the demonstration has no categorical column to total").toBeGreaterThanOrEqual(0);

    const total = demonstrationReadout(demo, [boatNumber + 1]);
    expect(Number.isFinite(total), "totalling the categorical column failed instead of returning a number").toBe(true);
    expect(total).toBe(table.cells.reduce((sum, row) => sum + row[boatNumber]!, 0));
  });
});

describe("every misconception Module 4 declares is genuinely reachable", () => {
  beforeAll(() => {
    clearDetectors();
    registerBuiltInDetectors();
  });

  const SLIPS: ReadonlyArray<{
    lessonId: string;
    questionId: string;
    response: RawResponse;
    misconceptionId: string;
    remediationId: string;
  }> = [
    {
      lessonId: "l.r1-tables",
      questionId: "q.r1-tables-misconception",
      // Right row, wrong column: read Thursday's boats (4) when asked for hours (8).
      response: { kind: "numeric", text: "4" },
      misconceptionId: "mc.wrong-column-read",
      remediationId: "rem.row-then-column"
    },
    {
      lessonId: "l.r1-variables",
      questionId: "q.r1-variables-misconception",
      // Counted the constant column as a variable: 4 instead of 3.
      response: { kind: "numeric", text: "4" },
      misconceptionId: "mc.constant-counted-as-variable",
      remediationId: "rem.a-variable-must-vary"
    },
    {
      lessonId: "l.r1-cases",
      questionId: "q.r1-cases-misconception",
      // Answered the observation count (12 x 4) when asked for cases.
      response: { kind: "numeric", text: "48" },
      misconceptionId: "mc.cases-counted-as-observations",
      remediationId: "rem.one-row-one-case"
    },
    {
      lessonId: "l.r1-variable-kinds",
      questionId: "q.r1-variable-kinds-misconception",
      // Boat number sorted as numerical because it is written with digits.
      response: {
        kind: "placement",
        zones: [
          { zoneId: "z.categorical", itemIds: ["it.weather4"] },
          { zoneId: "z.numerical", itemIds: ["it.boat-no", "it.crates4", "it.hours4"] }
        ]
      },
      misconceptionId: "mc.digits-mean-numerical",
      remediationId: "rem.categorical-vs-numerical"
    }
  ];

  it("covers every misconception the Module 4 lessons declare", () => {
    const declared = new Set(
      MODULE_4.lessonIds
        .flatMap((id) => content.curriculum.lessons.find((l) => l.id === id)!.questionIds)
        .flatMap((qid) => content.questions.get(qid)!.misconceptionIds)
    );
    const exercised = new Set(SLIPS.map((s) => s.misconceptionId));
    const missing = [...declared].filter((m) => !exercised.has(m));
    expect(missing, `Module 4 declares misconceptions no test triggers: ${missing.join(", ")}`).toEqual([]);
  });

  for (const slip of SLIPS) {
    it(`${slip.misconceptionId} is detected and remediated on ${slip.questionId}`, () => {
      const save = freshSave();
      const lesson = content.curriculum.lessons.find((l) => l.id === slip.lessonId)!;
      const index = lesson.questionIds.indexOf(slip.questionId);
      expect(index, `${slip.questionId} is not asked by ${slip.lessonId}`).toBeGreaterThanOrEqual(0);

      const started = startLesson(content, slip.lessonId, 0)!;
      const result = submitAnswer(
        content,
        save,
        { ...started, currentIndex: index, questionShownAtMs: 0 },
        slip.response,
        4000
      )!;

      expect(result.feedback.correct, `${slip.questionId}: the "wrong" answer was accepted`).toBe(false);
      expect(result.feedback.misconception?.id).toBe(slip.misconceptionId);
      expect(result.feedback.remediation?.id).toBe(slip.remediationId);
      expect(result.feedback.message.length, "the learner is given no targeted message").toBeGreaterThan(20);

      const followUps = content.remediations.find((r) => r.id === slip.remediationId)!.followUpQuestionIds;
      expect(followUps.length, `${slip.remediationId} has no follow-up question`).toBeGreaterThan(0);
      for (const fid of followUps) {
        expect(result.session.pendingFollowUps, `${fid} was not queued`).toContain(fid);
      }

      const adv = advance(content, result.save, result.session, 5000);
      expect(adv.session.questionQueue[adv.session.currentIndex]).toBe(followUps[0]);
    });
  }

  it("catches cases-as-observations at the step it happens", () => {
    const save = freshSave();
    const lesson = content.curriculum.lessons.find((l) => l.id === "l.r1-cases")!;
    const index = lesson.questionIds.indexOf("q.r1-cases-mastery");
    const started = startLesson(content, "l.r1-cases", 0)!;
    const result = submitAnswer(
      content,
      save,
      { ...started, currentIndex: index, questionShownAtMs: 0 },
      {
        kind: "steps",
        steps: [
          { stepId: "st.cases", text: "45" },
          { stepId: "st.variables", text: "5" },
          { stepId: "st.observations", text: "45" }
        ]
      },
      4000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.cases-counted-as-observations");
  });

  it("does not cry misconception when the answer is merely wrong", () => {
    const save = freshSave();
    const lesson = content.curriculum.lessons.find((l) => l.id === "l.r1-cases")!;
    const index = lesson.questionIds.indexOf("q.r1-cases-misconception");
    const started = startLesson(content, "l.r1-cases", 0)!;
    const result = submitAnswer(
      content,
      save,
      { ...started, currentIndex: index, questionShownAtMs: 0 },
      { kind: "numeric", text: "16" },
      4000
    )!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception).toBeNull();
  });
});

describe("Region 1 is now fully authored", () => {
  const REGION_1 = "r.harbor-tallies";

  it("has every one of its topic lessons declared Complete", () => {
    const region = content.curriculum.regions.find((r) => r.id === REGION_1)!;
    const lessonIds = content.curriculum.modules
      .filter((m) => region.moduleIds.includes(m.id))
      .flatMap((m) => m.lessonIds)
      .filter((id) => id.startsWith("l.r1-"));

    expect(lessonIds.length, "Region 1 should hold 17 topic lessons").toBe(17);
    const notDeclared = lessonIds.filter((id) => !COMPLETE_LESSONS.includes(id));
    expect(notDeclared, `still skeletons: ${notDeclared.join(", ")}`).toEqual([]);
  });

  it("can be walked end to end from a fresh profile", () => {
    // The whole point of the region: a learner starting from nothing can reach
    // and finish every topic lesson, in the order the curriculum declares.
    const region = content.curriculum.regions.find((r) => r.id === REGION_1)!;
    const modules = content.curriculum.modules.filter((m) => region.moduleIds.includes(m.id));

    let save = freshSave();
    let t = 1000;
    for (const module of modules) {
      for (const lessonId of module.lessonIds) {
        expect(
          isLessonUnlocked(content.curriculum, save, lessonId),
          `${lessonId} is still locked when its turn came`
        ).toBe(true);
        save = playLesson(save, lessonId, t);
        t += 60_000;
      }
    }

    for (const module of modules) {
      for (const lessonId of module.lessonIds) {
        expect(save.lessonProgress[lessonId]?.status, `${lessonId} did not complete`).toBe("completed");
      }
    }
  });
});
