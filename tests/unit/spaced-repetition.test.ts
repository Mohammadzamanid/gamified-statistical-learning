import { describe, expect, it } from "vitest";
import { createReviewItem, dueItems, interleave, updateReviewItem, DAY_MS } from "../../src/core/spaced-repetition/scheduler";

describe("spaced repetition", () => {
  const now = new Date("2026-07-21T10:00:00Z");

  it("schedules 1 day, then 3 days, then ease-multiplied", () => {
    let item = createReviewItem("skill.a", now);
    expect(item.intervalDays).toBe(1);
    item = updateReviewItem(item, { correct: true, usedHints: false, fast: false }, now);
    expect(item.intervalDays).toBe(3);
    item = updateReviewItem(item, { correct: true, usedHints: false, fast: false }, now);
    expect(item.intervalDays).toBeCloseTo(3 * 2.3, 1);
  });

  it("lapses reset the interval and reduce ease, floored at 1.3", () => {
    let item = createReviewItem("skill.a", now);
    for (let i = 0; i < 10; i++) item = updateReviewItem(item, { correct: false, usedHints: false, fast: false }, now);
    expect(item.intervalDays).toBe(1);
    expect(item.ease).toBeCloseTo(1.3, 5);
    expect(item.lapses).toBe(10);
  });

  it("easy correct nudges ease up, capped at 3.0", () => {
    let item = createReviewItem("skill.a", now);
    for (let i = 0; i < 30; i++) item = updateReviewItem(item, { correct: true, usedHints: false, fast: true }, now);
    expect(item.ease).toBeLessThanOrEqual(3.0);
  });

  it("dueItems filters by dueAt", () => {
    const a = createReviewItem("skill.a", now); // due in 1 day
    const later = new Date(now.getTime() + 2 * DAY_MS);
    expect(dueItems([a], now).length).toBe(0);
    expect(dueItems([a], later).length).toBe(1);
  });

  it("interleave avoids back-to-back skills when possible", () => {
    const items = [
      { ...createReviewItem("a", now) },
      { ...createReviewItem("a", now) },
      { ...createReviewItem("b", now) },
      { ...createReviewItem("b", now) }
    ];
    const mixed = interleave(items);
    expect(mixed.length).toBe(4);
    expect(mixed[0]!.skillId).not.toBe(mixed[1]!.skillId);
  });
});
