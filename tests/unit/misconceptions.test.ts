import { beforeAll, describe, expect, it } from "vitest";
import { QuestionSchema, type Misconception, type Remediation } from "../../src/shared/schemas";
import { clearDetectors, registerBuiltInDetectors, registerDetector } from "../../src/core/misconceptions/detectors";
import { buildLibrary, runFeedbackPipeline } from "../../src/core/misconceptions/engine";

const remediations: Remediation[] = [
  { id: "rem.a", title: "A", explanation: "Targeted A", microLesson: "lesson A", followUpQuestionIds: ["q.follow"], skillIds: [] },
  { id: "rem.b", title: "B", explanation: "Targeted B", followUpQuestionIds: [], skillIds: [] }
];
const misconceptions: Misconception[] = [
  { id: "mc.median", title: "Median given", description: "d", detector: "confused-statistic", detectorParams: { wrongValue: 4 }, remediationId: "rem.a" },
  { id: "mc.decimal", title: "Decimal form", description: "d", detector: "decimal-instead-of-percentage", remediationId: "rem.b" },
  { id: "mc.tag", title: "Tagged", description: "d", detector: "tagged-distractor", remediationId: "rem.b" }
];

const meanQ = QuestionSchema.parse({
  id: "q.mean", topicId: "t", objectiveId: "o", skillIds: ["skill.mean"], difficulty: 1,
  interaction: "numeric-input", prompt: "mean of 2,4,4,6,9?",
  answer: { kind: "numeric", value: 5, tolerance: 0.001 },
  hints: [{ level: 1, text: "hint one" }, { level: 2, text: "hint two" }],
  explanation: "mean is 5",
  misconceptionIds: ["mc.median"]
});

describe("misconception pipeline", () => {
  beforeAll(() => {
    clearDetectors();
    registerBuiltInDetectors();
  });

  it("classifies mean/median confusion and returns targeted remediation + follow-up", () => {
    const lib = buildLibrary(misconceptions, remediations);
    const plan = runFeedbackPipeline(meanQ, { kind: "numeric", text: "4" }, lib, 0);
    expect(plan.correct).toBe(false);
    expect(plan.misconception?.id).toBe("mc.median");
    expect(plan.message).toBe("Targeted A");
    expect(plan.remediation?.microLesson).toBe("lesson A");
    expect(plan.followUpQuestionId).toBe("q.follow");
    expect(plan.nextHint).toBe("hint one");
    expect(plan.hintLevelUsed).toBe(1);
  });

  it("falls back to generic feedback when no detector matches", () => {
    const lib = buildLibrary(misconceptions, remediations);
    const plan = runFeedbackPipeline(meanQ, { kind: "numeric", text: "7" }, lib, 1);
    expect(plan.misconception).toBeNull();
    expect(plan.nextHint).toBe("hint two");
  });

  it("detects decimal-instead-of-percentage", () => {
    const pctQ = QuestionSchema.parse({
      ...meanQ, id: "q.pct", interaction: "percentage-input",
      answer: { kind: "numeric", value: 30, tolerance: 0.01 },
      misconceptionIds: ["mc.decimal"]
    });
    const lib = buildLibrary(misconceptions, remediations);
    const plan = runFeedbackPipeline(pctQ, { kind: "numeric", text: "0.3" }, lib, 0);
    expect(plan.misconception?.id).toBe("mc.decimal");
  });

  it("detects tagged distractors on choice questions", () => {
    const mcQ = QuestionSchema.parse({
      id: "q.mc", topicId: "t", objectiveId: "o", skillIds: ["s"], difficulty: 1,
      interaction: "multiple-choice", prompt: "which?",
      choices: [
        { id: "a", text: "wrong", misconceptionId: "mc.tag" },
        { id: "b", text: "right" }
      ],
      answer: { kind: "choice", correctChoiceIds: ["b"] },
      explanation: "x",
      misconceptionIds: ["mc.tag"]
    });
    const lib = buildLibrary(misconceptions, remediations);
    const plan = runFeedbackPipeline(mcQ, { kind: "choice", choiceIds: ["a"] }, lib, 0);
    expect(plan.misconception?.id).toBe("mc.tag");
  });

  it("new detectors can be registered independently", () => {
    registerDetector("always-true-test", () => true);
    const custom: Misconception[] = [
      { id: "mc.custom", title: "C", description: "d", detector: "always-true-test", remediationId: "rem.b" }
    ];
    const q = QuestionSchema.parse({ ...meanQ, id: "q.c", misconceptionIds: ["mc.custom"] });
    const lib = buildLibrary(custom, remediations);
    const plan = runFeedbackPipeline(q, { kind: "numeric", text: "999" }, lib, 0);
    expect(plan.misconception?.id).toBe("mc.custom");
  });

  it("detects reversed fraction, sign error, and unit error", () => {
    clearDetectors();
    registerBuiltInDetectors();
    const lib = buildLibrary(
      [
        { id: "mc.rev", title: "r", description: "d", detector: "reversed-fraction", remediationId: "rem.b" },
        { id: "mc.sign", title: "s", description: "d", detector: "sign-error", remediationId: "rem.b" },
        { id: "mc.unit", title: "u", description: "d", detector: "unit-error", detectorParams: { factor: 1000 }, remediationId: "rem.b" }
      ],
      remediations
    );
    const fq = QuestionSchema.parse({ ...meanQ, id: "q.f", answer: { kind: "numeric", value: 0.25, tolerance: 0.0005 }, misconceptionIds: ["mc.rev"] });
    expect(runFeedbackPipeline(fq, { kind: "numeric", text: "4" }, lib, 0).misconception?.id).toBe("mc.rev");

    const sq = QuestionSchema.parse({ ...meanQ, id: "q.s", answer: { kind: "numeric", value: 2.5, tolerance: 0.001 }, misconceptionIds: ["mc.sign"] });
    expect(runFeedbackPipeline(sq, { kind: "numeric", text: "-2.5" }, lib, 0).misconception?.id).toBe("mc.sign");

    const uq = QuestionSchema.parse({ ...meanQ, id: "q.u", answer: { kind: "numeric", value: 1.5, tolerance: 0.001 }, misconceptionIds: ["mc.unit"] });
    expect(runFeedbackPipeline(uq, { kind: "numeric", text: "1500" }, lib, 0).misconception?.id).toBe("mc.unit");
  });
});
