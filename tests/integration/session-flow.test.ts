import { beforeAll, describe, expect, it } from "vitest";
import { loadShippedContent } from "../../src/content";
import { registerBuiltInDetectors, clearDetectors } from "../../src/core/misconceptions/detectors";
import { advance, startLesson, submitAnswer } from "../../src/renderer/state/session";
import { createEmptySave } from "../../src/shared/schemas";
import { isLessonUnlocked, isRegionUnlocked } from "../../src/core/curriculum/progress";

describe("end-to-end lesson session (headless)", () => {
  beforeAll(() => {
    clearDetectors();
    registerBuiltInDetectors();
  });

  const content = loadShippedContent();
  const freshSave = () =>
    createEmptySave({ id: "p.test", name: "Tester", createdAt: new Date().toISOString(), isGuest: false, avatarSeed: 0 });

  /**
   * Positions a session on a named question.
   *
   * The index used to be written in by hand, and it survived exactly as long as
   * the lesson's question list did: S2-12 redistributed the inherited Stage 1
   * questions, index 1 quietly became a different question, and the test then
   * failed on a missing misconception rather than on the move that caused it.
   */
  const sessionOn = (lessonId: string, questionId: string) => {
    const session = startLesson(content, lessonId, 0)!;
    const currentIndex = session.questionQueue.indexOf(questionId);
    expect(currentIndex, `${questionId} should be in ${lessonId}`).toBeGreaterThanOrEqual(0);
    return { ...session, currentIndex, questionShownAtMs: 0 };
  };

  it("wrong answer triggers targeted remediation and injects a follow-up", () => {
    const save = freshSave();
    const session = sessionOn("l.reading-tallies", "q.mean-fish-catch");
    const result = submitAnswer(content, save, session, { kind: "numeric", text: "4" }, 4000)!;
    expect(result.feedback.correct).toBe(false);
    expect(result.feedback.misconception?.id).toBe("mc.mean-median-confusion");
    expect(result.feedback.remediation?.id).toBe("rem.mean-vs-median");
    expect(result.session.pendingFollowUps).toContain("q.remed-mean-basic");
    // mastery updated
    expect(result.save.skillStates["skill.mean"]?.attempts).toBe(1);
    expect(result.save.skillStates["skill.mean"]?.misconceptionCounts["mc.mean-median-confusion"]).toBe(1);
    // review scheduled
    expect(result.save.reviewQueue.some((r) => r.skillId === "skill.mean")).toBe(true);

    // advancing injects the follow-up right after
    const adv = advance(content, result.save, result.session, 5000);
    expect(adv.session.questionQueue[adv.session.currentIndex]).toBe("q.remed-mean-basic");
  });

  it("correct answers raise mastery and grant XP + achievements", () => {
    const save = freshSave();
    const session = sessionOn("l.reading-tallies", "q.mean-fish-catch");
    const result = submitAnswer(content, save, session, { kind: "numeric", text: "5" }, 3000)!;
    expect(result.feedback.correct).toBe(true);
    expect(result.save.xp).toBe(10);
    expect(result.save.achievements).toContain("ach.first-cast");
    expect(result.save.skillStates["skill.mean"]?.correct).toBe(1);
  });

  it("completing every question marks the lesson complete and unlocks the next", () => {
    let save = freshSave();
    let session = startLesson(content, "l.middle-harbor", 0)!;
    expect(isLessonUnlocked(content.curriculum, save, "l.middle-harbor")).toBe(false); // locked until l.reading-tallies done

    // Simulate finishing l.reading-tallies by driving a full session with correct answers.
    session = startLesson(content, "l.reading-tallies", 0)!;
    // Every question the re-cut lesson asks, and nothing else. It used to also
    // hold answers for the percentage, proportion and data-literacy questions
    // this lesson inherited from Stage 1; S2-12 moved those to the Region 2
    // lessons whose topics they teach, so they are gone from here too.
    const answers: Record<string, Parameters<typeof submitAnswer>[3]> = {
      "q.step-mean-catch": {
        kind: "steps",
        steps: [
          { stepId: "st.mean.total", text: "25" },
          { stepId: "st.mean.count", text: "5" },
          { stepId: "st.mean.divide", text: "5" }
        ]
      },
      "q.r2-mean-independent": { kind: "numeric", text: "5.29" },
      "q.mean-fish-catch": { kind: "numeric", text: "5" },
      "q.point-approx-mean": { kind: "point", x: 5 },
      "q.dd-above-below-mean": {
        kind: "placement",
        zones: [
          { zoneId: "z.below", itemIds: ["it.mon", "it.tue", "it.wed"] },
          { zoneId: "z.above", itemIds: ["it.thu", "it.fri"] }
        ]
      },
      "q.r2-mean-application": { kind: "numeric", text: "3.5" },
      "q.r2-mean-teachback": { kind: "text", text: "the total shared across the days" },
      "q.r2-mean-mastery": { kind: "numeric", text: "29.63" }
    };
    let t = 1000;
    while (!session.finished) {
      const qid = session.questionQueue[session.currentIndex]!;
      // Answers are enumerated deliberately: adding a question to this lesson must
      // fail loudly here rather than being silently skipped in the playthrough.
      expect(answers[qid], `no answer defined for ${qid} — extend this playthrough`).toBeDefined();
      const submitted = submitAnswer(content, save, session, answers[qid]!, t)!;
      save = submitted.save;
      session = submitted.session;
      expect(submitted.feedback.correct).toBe(true);
      const adv = advance(content, save, session, t + 500);
      save = adv.save;
      session = adv.session;
      t += 1000;
    }
    expect(save.lessonProgress["l.reading-tallies"]?.status).toBe("completed");
    expect(save.achievements).toContain("ach.first-lesson");
    expect(isLessonUnlocked(content.curriculum, save, "l.middle-harbor")).toBe(true);
  });

  it("region unlock requires completing prerequisite regions", () => {
    const save = freshSave();
    expect(isRegionUnlocked(content.curriculum, save, "r.harbor-tallies")).toBe(true);
    expect(isRegionUnlocked(content.curriculum, save, "r.averages-atoll")).toBe(false);
  });
});
