/**
 * S2-06: building the review queue.
 *
 * Every test pins an explicit clock. Review is defined in days, so a test that
 * read the wall clock would pass or fail depending on when it ran — and would
 * quietly stop testing the boundary it was written for.
 */
import { describe, expect, it } from "vitest";
import {
  buildReviewPlan,
  categorise,
  daysOverdue,
  describeReviewPlan,
  pickQuestionForSkill
} from "../../src/core/spaced-repetition/review-queue";
import { DAY_MS } from "../../src/core/spaced-repetition/scheduler";
import { loadShippedContent } from "../../src/content";
import { createEmptySave, type ReviewItem, type SaveFile } from "../../src/shared/schemas";
import { createSkillState } from "../../src/core/mastery/engine";

const content = loadShippedContent();

/** A fixed instant, so "due" and "overdue" mean the same thing on every run. */
const NOW = new Date("2026-06-15T12:00:00.000Z");
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs);

function save(): SaveFile {
  return createEmptySave({
    id: "p.review",
    name: "Review Tester",
    createdAt: NOW.toISOString(),
    isGuest: false,
    avatarSeed: 0
  });
}

function item(skillId: string, dueOffsetMs: number): ReviewItem {
  return {
    skillId,
    dueAt: at(dueOffsetMs).toISOString(),
    intervalDays: 1,
    ease: 2.3,
    lapses: 0
  };
}

/** Marks a skill as met, which is what makes it eligible as `new`. */
function withSkillSeen(s: SaveFile, ...skillIds: string[]): SaveFile {
  const skillStates = { ...s.skillStates };
  for (const id of skillIds) skillStates[id] = createSkillState(id);
  return { ...s, skillStates };
}

describe("overdue arithmetic", () => {
  it("counts whole days late and never goes negative", () => {
    expect(daysOverdue(item("s", -3 * DAY_MS), NOW)).toBe(3);
    expect(daysOverdue(item("s", -1.5 * DAY_MS), NOW)).toBe(1);
    expect(daysOverdue(item("s", +DAY_MS), NOW)).toBe(0);
    expect(daysOverdue(item("s", 0), NOW)).toBe(0);
  });

  it("separates due from overdue at the one-day boundary", () => {
    expect(categorise(item("s", +1), NOW)).toBeNull(); // not yet due
    expect(categorise(item("s", 0), NOW)).toBe("due"); // due exactly now
    expect(categorise(item("s", -DAY_MS + 1), NOW)).toBe("due"); // just under a day late
    expect(categorise(item("s", -DAY_MS), NOW)).toBe("overdue"); // exactly a day late
    expect(categorise(item("s", -9 * DAY_MS), NOW)).toBe("overdue");
  });
});

describe("the review plan", () => {
  it("is empty for a learner with nothing scheduled and nothing practised", () => {
    const plan = buildReviewPlan(content.curriculum, save(), NOW);
    expect(plan.counts.total).toBe(0);
    expect(describeReviewPlan(plan)).toContain("Nothing is due");
  });

  it("excludes items that are not due yet", () => {
    const s = { ...save(), reviewQueue: [item("skill.mean", +2 * DAY_MS)] };
    expect(buildReviewPlan(content.curriculum, s, NOW).counts.total).toBe(0);
  });

  it("counts overdue, due and new separately", () => {
    let s = save();
    s = {
      ...s,
      reviewQueue: [
        item("skill.mean", -5 * DAY_MS), // overdue
        item("skill.median", -1 * DAY_MS), // overdue (exactly one day)
        item("skill.range", 0) // due
      ]
    };
    // A practised skill with no review record is "new"; an untouched one is not.
    s = withSkillSeen(s, "skill.mean", "skill.median", "skill.range", "skill.percent-fraction");

    const plan = buildReviewPlan(content.curriculum, s, NOW);
    expect(plan.counts.overdue).toBe(2);
    expect(plan.counts.due).toBe(1);
    expect(plan.counts.new).toBe(1);
    expect(plan.counts.total).toBe(4);
    expect(describeReviewPlan(plan)).toBe("2 overdue, 1 due, 1 not yet scheduled.");
  });

  it("never offers an untouched skill as new", () => {
    // skill.choose-measure exists in the curriculum but has never been met.
    const plan = buildReviewPlan(content.curriculum, save(), NOW);
    expect(plan.candidates.some((c) => c.skillId === "skill.choose-measure")).toBe(false);
  });

  it("puts the most overdue first, then due, then new", () => {
    let s = save();
    s = {
      ...s,
      reviewQueue: [
        item("skill.range", -2 * DAY_MS),
        item("skill.mean", -9 * DAY_MS),
        item("skill.median", 0)
      ]
    };
    s = withSkillSeen(s, "skill.mean", "skill.median", "skill.range", "skill.data-literacy");

    const plan = buildReviewPlan(content.curriculum, s, NOW);
    expect(plan.candidates.map((c) => c.skillId)).toEqual([
      "skill.mean", // 9 days late
      "skill.range", // 2 days late
      "skill.median", // due now
      "skill.data-literacy" // never scheduled
    ]);
    expect(plan.candidates.map((c) => c.category)).toEqual(["overdue", "overdue", "due", "new"]);
  });

  it("orders equally overdue items deterministically", () => {
    const s = {
      ...save(),
      reviewQueue: [item("skill.median", -3 * DAY_MS), item("skill.mean", -3 * DAY_MS)]
    };
    const first = buildReviewPlan(content.curriculum, s, NOW).candidates.map((c) => c.skillId);
    const second = buildReviewPlan(content.curriculum, s, NOW).candidates.map((c) => c.skillId);
    expect(first).toEqual(second);
    expect(first).toEqual(["skill.mean", "skill.median"]);
  });

  it("mixes topics rather than grouping one skill together", () => {
    const s = {
      ...save(),
      reviewQueue: [item("skill.mean", 0), item("skill.median", 0), item("skill.range", 0)]
    };
    const skills = buildReviewPlan(content.curriculum, s, NOW).candidates.map((c) => c.skillId);
    expect(new Set(skills).size).toBe(3);
    // No skill appears twice in a row.
    for (let i = 1; i < skills.length; i++) expect(skills[i]).not.toBe(skills[i - 1]);
  });
});

describe("choosing a question for a skill", () => {
  it("returns a question that actually teaches the skill", () => {
    const q = pickQuestionForSkill(content.questions, save(), "skill.mean");
    expect(q).not.toBeNull();
    expect(q!.skillIds).toContain("skill.mean");
  });

  it("returns null for a skill with no questions", () => {
    expect(pickQuestionForSkill(content.questions, save(), "skill.nonexistent")).toBeNull();
  });

  it("is deterministic for the same save", () => {
    const s = save();
    const a = pickQuestionForSkill(content.questions, s, "skill.mean");
    const b = pickQuestionForSkill(content.questions, s, "skill.mean");
    expect(a!.id).toBe(b!.id);
  });

  it("prefers a question the learner has answered least often", () => {
    const s = save();
    const first = pickQuestionForSkill(content.questions, s, "skill.mean")!;

    // Answer it twice; a different, less-seen question should now come up.
    const attemptLog = [1, 2].map(() => ({
      questionId: first.id,
      at: NOW.toISOString(),
      correct: true,
      responseMs: 1000,
      hintsUsed: 0,
      misconceptionId: null
    }));
    const next = pickQuestionForSkill(content.questions, { ...s, attemptLog }, "skill.mean")!;
    expect(next.id).not.toBe(first.id);
  });
});
