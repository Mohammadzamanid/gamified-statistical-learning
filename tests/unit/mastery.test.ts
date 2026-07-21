import { describe, expect, it } from "vitest";
import { applyAttempt, createSkillState, prerequisitesMet, retentionNow } from "../../src/core/mastery/engine";

const base = (over = {}) => ({
  correct: true, responseMs: 5000, hintsUsed: 0, misconceptionId: null,
  now: new Date("2026-07-21T10:00:00Z"), questionId: "q.x", ...over
});

describe("adaptive mastery engine", () => {
  it("progresses unseen -> introduced -> practicing on attempts", () => {
    let s = createSkillState("skill.a");
    expect(s.masteryLevel).toBe("unseen");
    s = applyAttempt(s, base({ correct: false })).state;
    expect(s.masteryLevel).toBe("introduced");
    s = applyAttempt(s, base({ correct: false })).state;
    expect(s.masteryLevel).toBe("practicing");
  });

  it("reaches proficient/mastered under the documented rule", () => {
    let s = createSkillState("skill.a");
    for (let i = 0; i < 4; i++) s = applyAttempt(s, base()).state;
    // 4/4 correct, minAttempts met -> at least proficient
    expect(["proficient", "mastered"]).toContain(s.masteryLevel);
    for (let i = 0; i < 3; i++) s = applyAttempt(s, base()).state;
    expect(s.correct / s.attempts).toBeGreaterThanOrEqual(0.8);
  });

  it("adapts difficulty up on hint-free streaks and down on repeated misses", () => {
    let s = createSkillState("skill.a");
    for (let i = 0; i < 3; i++) s = applyAttempt(s, base()).state;
    expect(s.difficultyLevel).toBe(2);
    s = applyAttempt(s, base({ correct: false })).state;
    s = applyAttempt(s, base({ correct: false })).state;
    expect(s.difficultyLevel).toBe(1);
    // never below 1 — the learner is not blocked
    s = applyAttempt(s, base({ correct: false })).state;
    expect(s.difficultyLevel).toBe(1);
  });

  it("tracks misconception frequency and recent mistakes", () => {
    let s = createSkillState("skill.a");
    s = applyAttempt(s, base({ correct: false, misconceptionId: "mc.x" })).state;
    s = applyAttempt(s, base({ correct: false, misconceptionId: "mc.x", questionId: "q.y" })).state;
    expect(s.misconceptionCounts["mc.x"]).toBe(2);
    expect(s.recentMistakeQuestionIds[0]).toBe("q.y");
  });

  it("recommends remediation when a misconception fires", () => {
    const s = createSkillState("skill.a");
    const update = applyAttempt(s, base({ correct: false, misconceptionId: "mc.x" }));
    expect(update.recommendRemediation).toBe(true);
  });

  it("retention decays with a 14-day half-life", () => {
    let s = createSkillState("skill.a");
    s = applyAttempt(s, base()).state;
    const r0 = s.retention;
    const later = new Date("2026-08-04T10:00:00Z"); // +14 days
    expect(retentionNow(s, later)).toBeCloseTo(r0 / 2, 5);
  });

  it("gates prerequisites at the requested mastery level", () => {
    let a = createSkillState("skill.a");
    for (let i = 0; i < 5; i++) a = applyAttempt(a, base()).state;
    const states = { "skill.a": a };
    expect(prerequisitesMet(["skill.a"], states, "practicing")).toBe(true);
    expect(prerequisitesMet(["skill.missing"], states)).toBe(false);
  });
});
