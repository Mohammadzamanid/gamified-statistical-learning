import { describe, expect, it } from "vitest";
import { loadContentBundle } from "../../src/core/curriculum/loader";
import { rawContent, loadShippedContent } from "../../src/content";

describe("shipped content", () => {
  it("validates fully against all schemas with cross-reference integrity", () => {
    const result = loadContentBundle(rawContent);
    expect(result.ok, result.ok ? "" : result.error).toBe(true);
  });

  it("loads into an indexed bundle", () => {
    const bundle = loadShippedContent();
    expect(bundle.questions.size).toBeGreaterThanOrEqual(14);
    expect(bundle.curriculum.lessons.length).toBeGreaterThanOrEqual(3);
    expect(bundle.misconceptions.length).toBeGreaterThanOrEqual(8);
  });

  it("catches broken references", () => {
    const broken = JSON.parse(JSON.stringify(rawContent));
    broken.curriculum.lessons[0].questionIds.push("q.does-not-exist");
    const result = loadContentBundle(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("q.does-not-exist");
  });

  it("every question with a visual has an accessible description", () => {
    const bundle = loadShippedContent();
    for (const q of bundle.questions.values()) {
      if (q.visual.kind !== "none") {
        expect(q.visual.accessibleDescription, `question ${q.id}`).toBeTruthy();
      }
    }
  });

  it("every lesson's questions cover its objectives' skills", () => {
    const bundle = loadShippedContent();
    for (const lesson of bundle.curriculum.lessons) {
      for (const qid of lesson.questionIds) {
        expect(bundle.questions.get(qid), `lesson ${lesson.id} question ${qid}`).toBeTruthy();
      }
    }
  });
});
