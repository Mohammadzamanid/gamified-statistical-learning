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

  it("wrong answer triggers targeted remediation and injects a follow-up", () => {
    const save = freshSave();
    let session = startLesson(content, "l.reading-tallies", 0)!;
    // move to the mean question (index 1 in the lesson)
    session = { ...session, currentIndex: 1, questionShownAtMs: 0 };
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
    let session = startLesson(content, "l.reading-tallies", 0)!;
    session = { ...session, currentIndex: 1, questionShownAtMs: 0 };
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
    const answers: Record<string, Parameters<typeof submitAnswer>[3]> = {
      "q.multiselect-categorical": { kind: "choice", choiceIds: ["ch.boat-type", "ch.home-port"] },
      "q.mean-fish-catch": { kind: "numeric", text: "5" },
      "q.pct-rainy-days": { kind: "numeric", text: "30" },
      "q.fraction-quarter": { kind: "numeric", text: "3/12" },
      "q.ordering-data-cycle": { kind: "ordering", order: ["it.ask", "it.collect", "it.organize", "it.summarize", "it.interpret"] },
      "q.graph-tallest-bar": { kind: "choice", choiceIds: ["ch.fri"] },
      "q.step-mean-catch": {
        kind: "steps",
        steps: [
          { stepId: "st.mean.total", text: "25" },
          { stepId: "st.mean.count", text: "5" },
          { stepId: "st.mean.divide", text: "5" }
        ]
      },
      "q.step-percent-rainy": {
        kind: "steps",
        steps: [
          { stepId: "st.pct.part", text: "12" },
          { stepId: "st.pct.proportion", text: "0.3" },
          { stepId: "st.pct.scale", text: "30" }
        ]
      },
      "q.point-quarter-line": { kind: "point", x: 0.25 },
      "q.point-thursday-catch": { kind: "point", x: 4, y: 6 },
      "q.point-approx-mean": { kind: "point", x: 5 },
      "q.dd-variable-kinds": {
        kind: "placement",
        zones: [
          { zoneId: "z.categorical", itemIds: ["it.boat-number", "it.home-port", "it.weather"] },
          { zoneId: "z.numerical", itemIds: ["it.fish-landed", "it.hours-at-sea"] }
        ]
      },
      "q.dd-build-bar-chart": {
        kind: "placement",
        zones: [
          { zoneId: "z.bar2", itemIds: ["it.b-mon"] },
          { zoneId: "z.bar4", itemIds: ["it.b-tue", "it.b-wed"] },
          { zoneId: "z.bar6", itemIds: ["it.b-thu"] },
          { zoneId: "z.bar9", itemIds: ["it.b-fri"] }
        ]
      }
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
