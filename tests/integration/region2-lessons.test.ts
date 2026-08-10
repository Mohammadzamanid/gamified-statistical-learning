/**
 * S2-12: every Region 2 lesson declared Complete, driven through the real
 * session engine.
 *
 * Region 1 has had this since S2-08, one file per module. Region 2 had none —
 * nine lessons were declared Complete across three cycles and not one of them
 * had ever been played end to end. Everything in
 * `tests/audit/lesson-structure.test.ts` reads the content; this runs it.
 *
 * The gap is closed here rather than by adding four more per-module files: the
 * mechanics are identical, and what varies between Region 2's modules is which
 * lessons happen to be written yet. So this file iterates the declared list
 * instead of naming lessons, which also means it picks up the next lesson S2-13
 * writes without being edited.
 *
 * **What this proves, stated exactly**, because a drift probe showed the obvious
 * reading of it is wrong. `correctResponseFor` builds each answer *from the
 * question's own declared answer*, so what is checked is that the content
 * round-trips through the real evaluator, session engine and save:
 *
 *  - the session starts, terminates, and records the lesson as completed;
 *  - each declared answer survives normalization and is accepted — which
 *    catches a question whose own rules contradict each other, such as a
 *    teach-back forbidding a word it also requires;
 *  - every skill the lesson claims gains a correct attempt and a review entry,
 *    which is the learner-visible form of the objective check (D-036);
 *  - the misconception question reports its misconception *through the session*,
 *    with the remediation a learner would be shown.
 *
 * What it does **not** prove is that a declared answer is mathematically right.
 * Changing `q.r2-skew-mastery`'s answer from 1 to any other number passes here,
 * because the helper would then submit that number. Authored answers have no
 * independent derivation to check against — that is exactly what D-020's
 * family-stated `expectedResponse` gives generated questions, and authored
 * content has no equivalent. Arithmetic in this file's content is checked by
 * reading it, and by the explanations having to state the working.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import { clearDetectors, registerBuiltInDetectors } from "../../src/core/misconceptions/detectors";
import { buildLibrary, classifyMisconception } from "../../src/core/misconceptions/engine";
import { evaluateResponse } from "../../src/core/questions/evaluators";
import { normalizeResponse } from "../../src/core/questions/normalize";
import { startLesson, submitAnswer } from "../../src/renderer/state/session";
import type { SaveFile } from "../../src/shared/schemas";
import { COMPLETE_LESSONS } from "../helpers/complete-lessons";
import { freshSave as makeSave, playLesson as play, skillsOfLesson } from "../helpers/lesson-playthrough";

const content = loadShippedContent();
const REGION_2 = "r.averages-atoll";
const misconceptionLibrary = buildLibrary([...content.misconceptions], [...content.remediations]);

const region2 = content.curriculum.regions.find((r) => r.id === REGION_2)!;
const region2LessonIds = content.curriculum.modules
  .filter((m) => region2.moduleIds.includes(m.id))
  .flatMap((m) => m.lessonIds);

/** The Region 2 lessons that claim to be finished, in curriculum order. */
const completeLessonIds = region2LessonIds.filter((id) => COMPLETE_LESSONS.includes(id));

const freshSave = (): SaveFile => makeSave("p.region2", "Atoll Cartographer");

describe("every Complete Region 2 lesson can actually be played", () => {
  beforeAll(() => {
    clearDetectors();
    registerBuiltInDetectors();
  });

  it("has lessons to play", () => {
    // Guards the iteration itself: a filter that silently matched nothing would
    // make every check below pass without running a single lesson.
    expect(completeLessonIds.length, "no Region 2 lesson is declared Complete").toBeGreaterThan(0);
  });

  it.each(completeLessonIds)("%s can be answered from start to finish", (lessonId) => {
    // playLesson asserts each declared answer is accepted and that the lesson
    // reaches "completed", so a question whose own rules no response can satisfy
    // fails here by lesson name. See the header for what this does not cover.
    const save = play(content, freshSave(), lessonId, 1000);
    expect(save.lessonProgress[lessonId]?.status).toBe("completed");
    expect(save.lessonProgress[lessonId]?.bestAccuracy).toBe(1);
  });

  it.each(completeLessonIds)("%s raises mastery in every skill it teaches", (lessonId) => {
    const save = play(content, freshSave(), lessonId, 1000);
    for (const skillId of skillsOfLesson(content, lessonId)) {
      const state = save.skillStates[skillId];
      expect(state, `${lessonId} teaches ${skillId} but playing it recorded no attempt`).toBeDefined();
      expect(state!.correct, `${lessonId}: ${skillId} gained no correct attempt`).toBeGreaterThan(0);
    }
  });

  it.each(completeLessonIds)("%s schedules review for every skill it teaches", (lessonId) => {
    const save = play(content, freshSave(), lessonId, 1000);
    for (const skillId of skillsOfLesson(content, lessonId)) {
      expect(
        save.reviewQueue.some((r) => r.skillId === skillId),
        `${lessonId} taught ${skillId} but nothing was queued for review`
      ).toBe(true);
    }
  });

  it("reports the misconception each lesson's misconception question targets", () => {
    // The structure audit proves the engine *can* name the misconception from a
    // synthesised response. This proves it does so through the session engine,
    // with the save and the remediation queue that a learner would see.
    for (const lessonId of completeLessonIds) {
      const lesson = content.curriculum.lessons.find((l) => l.id === lessonId)!;
      for (const qid of lesson.misconceptionQuestionIds) {
        const question = content.questions.get(qid)!;
        for (const mcId of question.misconceptionIds) {
          const wrong = wrongResponseFor(qid, mcId);
          if (!wrong) continue;
          const session = startLesson(content, lessonId, 0)!;
          const index = session.questionQueue.indexOf(qid);
          expect(index, `${qid} is not asked by ${lessonId}`).toBeGreaterThanOrEqual(0);
          const result = submitAnswer(
            content,
            freshSave(),
            { ...session, currentIndex: index, questionShownAtMs: 0 },
            wrong,
            5000
          )!;
          expect(result.feedback.correct, `${qid}: the ${mcId} answer was marked correct`).toBe(false);
          expect(result.feedback.misconception?.id, `${qid}: the session did not report ${mcId}`).toBe(mcId);
          expect(result.feedback.remediation, `${mcId} produced no remediation`).toBeDefined();
        }
      }
    }
  });
});

/**
 * The answer a learner holding `mcId` would give to `questionId`.
 *
 * Derived from the content rather than hand-written, so it stays right when the
 * content moves: a tagged choice, or the value declared under the question's
 * parameters. Returns null where neither route exists, which the caller skips —
 * requirement 13 in `tests/audit/lesson-structure.test.ts` is what forbids a
 * declared misconception from having no route at all, and duplicating that
 * judgement here would give two places to disagree.
 */
function wrongResponseFor(questionId: string, mcId: string) {
  const q = content.questions.get(questionId)!;
  const tagged = (q.choices ?? []).find((c) => c.misconceptionId === mcId);
  if (tagged) return { kind: "choice" as const, choiceIds: [tagged.id] };
  const declared = q.parameters?.[mcId];
  if (declared && typeof declared === "object" && typeof (declared as { wrongValue?: unknown }).wrongValue === "number") {
    return { kind: "numeric" as const, text: String((declared as { wrongValue: number }).wrongValue) };
  }
  return null;
}

// Kept honest: the helper above must have found a route for at least one
// question, or the check that uses it proves nothing.
describe("the misconception playthrough is exercising something", () => {
  it("finds a wrong answer for at least one Region 2 misconception question", () => {
    const routed = completeLessonIds.flatMap((lessonId) => {
      const lesson = content.curriculum.lessons.find((l) => l.id === lessonId)!;
      return lesson.misconceptionQuestionIds.flatMap((qid) =>
        content.questions
          .get(qid)!
          .misconceptionIds.filter((mcId) => wrongResponseFor(qid, mcId) !== null)
      );
    });
    expect(routed.length, "no Region 2 misconception question offered a wrong answer to send").toBeGreaterThan(0);
  });

  it("classifies those answers outside the session engine too", () => {
    // Same responses, straight through the evaluator and classifier. If these
    // agree and the session checks above fail, the defect is in the session
    // wiring rather than the content.
    for (const lessonId of completeLessonIds) {
      const lesson = content.curriculum.lessons.find((l) => l.id === lessonId)!;
      for (const qid of lesson.misconceptionQuestionIds) {
        const question = content.questions.get(qid)!;
        for (const mcId of question.misconceptionIds) {
          const wrong = wrongResponseFor(qid, mcId);
          if (!wrong) continue;
          const response = normalizeResponse(wrong);
          const evaluation = evaluateResponse(question, response);
          expect(evaluation.correct, `${qid}: the ${mcId} answer evaluates as correct`).toBe(false);
          const found = classifyMisconception(question, misconceptionLibrary, {
            question,
            response,
            evaluation
          });
          expect(found?.id, `${qid}: the classifier did not name ${mcId}`).toBe(mcId);
        }
      }
    }
  });
});
