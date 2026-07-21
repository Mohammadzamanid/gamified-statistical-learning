import { describe, expect, it } from "vitest";
import { DatasetSchema, QuestionSchema, SaveFileSchema, SettingsSchema, createEmptySave } from "../../src/shared/schemas";

const validQuestion = {
  id: "q.test",
  topicId: "t.x",
  objectiveId: "obj.x",
  skillIds: ["skill.x"],
  difficulty: 1,
  interaction: "numeric-input",
  prompt: "What is 2+2?",
  answer: { kind: "numeric", value: 4, tolerance: 0 },
  explanation: "2+2=4"
};

describe("schema validation", () => {
  it("accepts a valid question and applies defaults", () => {
    const q = QuestionSchema.parse(validQuestion);
    expect(q.hints).toEqual([]);
    expect(q.visual.kind).toBe("none");
    expect(q.estimatedSeconds).toBe(60);
  });

  it("rejects choice questions without choices", () => {
    const bad = { ...validQuestion, interaction: "multiple-choice", answer: { kind: "choice", correctChoiceIds: ["a"] } };
    expect(QuestionSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects correct choice ids that are not among the choices", () => {
    const bad = {
      ...validQuestion,
      interaction: "multiple-choice",
      choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
      answer: { kind: "choice", correctChoiceIds: ["zzz"] }
    };
    expect(QuestionSchema.safeParse(bad).success).toBe(false);
  });

  it("requires accessible descriptions on visuals", () => {
    const bad = { ...validQuestion, visual: { kind: "bar-chart" } };
    expect(QuestionSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects ragged dataset rows", () => {
    const bad = {
      id: "ds.x",
      title: "X",
      columns: [{ name: "a", kind: "numeric" }, { name: "b", kind: "numeric" }],
      rows: [[1, 2], [3]]
    };
    expect(DatasetSchema.safeParse(bad).success).toBe(false);
  });

  it("save files round-trip and reject invalid mastery data", () => {
    const save = createEmptySave({ id: "p1", name: "Test", createdAt: new Date().toISOString(), isGuest: false, avatarSeed: 0 });
    expect(SaveFileSchema.safeParse(save).success).toBe(true);
    const corrupt = { ...save, xp: -5 };
    expect(SaveFileSchema.safeParse(corrupt).success).toBe(false);
  });

  it("settings apply defaults", () => {
    const s = SettingsSchema.parse({});
    expect(s.theme).toBe("dark");
    expect(s.textScale).toBe("m");
  });
});
