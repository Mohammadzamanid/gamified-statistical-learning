import { describe, expect, it } from "vitest";
import { evaluateAchievements } from "../../src/core/achievements/engine";
import { createEmptySave, type Achievement } from "../../src/shared/schemas";

const achievements: Achievement[] = [
  { id: "ach.one", title: "One", description: "d", trigger: { kind: "questions-answered", count: 1 } },
  { id: "ach.streak", title: "S", description: "d", trigger: { kind: "streak", count: 2 } }
];

describe("achievements engine", () => {
  it("awards question-count and streak triggers exactly once", () => {
    const save = createEmptySave({ id: "p", name: "T", createdAt: new Date().toISOString(), isGuest: false, avatarSeed: 0 });
    const at = new Date().toISOString();
    save.attemptLog.push(
      { questionId: "q1", at, correct: true, responseMs: 100, hintsUsed: 0, misconceptionId: null },
      { questionId: "q2", at, correct: true, responseMs: 100, hintsUsed: 0, misconceptionId: null }
    );
    const earned = evaluateAchievements(save, achievements);
    expect(earned).toContain("ach.one");
    expect(earned).toContain("ach.streak");
    save.achievements.push(...earned);
    expect(evaluateAchievements(save, achievements)).toEqual([]);
  });
});
