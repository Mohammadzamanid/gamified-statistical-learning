/**
 * Content loader: validates every content file against its schema at startup
 * and builds indexed lookups. Invalid content fails loudly with file + path.
 */
import {
  AchievementSchema,
  CurriculumSchema,
  DatasetSchema,
  MisconceptionSchema,
  QuestionSchema,
  RemediationSchema,
  type Achievement,
  type Curriculum,
  type Dataset,
  type Misconception,
  type Question,
  type Remediation
} from "../../shared/schemas";
import { z } from "zod";
import { err, ok, type Result } from "../../shared/utilities/result";

export interface ContentBundleInput {
  curriculum: unknown;
  questions: unknown;
  misconceptions: unknown;
  remediations: unknown;
  datasets: unknown;
  achievements: unknown;
}

export interface ContentBundle {
  curriculum: Curriculum;
  questions: Map<string, Question>;
  misconceptions: Misconception[];
  remediations: Remediation[];
  datasets: Map<string, Dataset>;
  achievements: Achievement[];
}

function formatZodError(label: string, e: z.ZodError): string {
  const first = e.issues.slice(0, 5).map((i) => `${label}${i.path.length ? "." + i.path.join(".") : ""}: ${i.message}`);
  return first.join("; ");
}

export function loadContentBundle(input: ContentBundleInput): Result<ContentBundle> {
  const curriculum = CurriculumSchema.safeParse(input.curriculum);
  if (!curriculum.success) return err(formatZodError("curriculum", curriculum.error));

  const questions = z.array(QuestionSchema).safeParse(input.questions);
  if (!questions.success) return err(formatZodError("questions", questions.error));

  const misconceptions = z.array(MisconceptionSchema).safeParse(input.misconceptions);
  if (!misconceptions.success) return err(formatZodError("misconceptions", misconceptions.error));

  const remediations = z.array(RemediationSchema).safeParse(input.remediations);
  if (!remediations.success) return err(formatZodError("remediations", remediations.error));

  const datasets = z.array(DatasetSchema).safeParse(input.datasets);
  if (!datasets.success) return err(formatZodError("datasets", datasets.error));

  const achievements = z.array(AchievementSchema).safeParse(input.achievements);
  if (!achievements.success) return err(formatZodError("achievements", achievements.error));

  const refCheck = checkReferences(
    curriculum.data,
    questions.data,
    misconceptions.data,
    remediations.data,
    datasets.data,
    achievements.data
  );
  if (!refCheck.ok) return err(refCheck.error);

  return ok({
    curriculum: curriculum.data,
    questions: new Map(questions.data.map((q) => [q.id, q])),
    misconceptions: misconceptions.data,
    remediations: remediations.data,
    datasets: new Map(datasets.data.map((d) => [d.id, d])),
    achievements: achievements.data
  });
}

/** Cross-reference integrity: every id referenced anywhere must exist. */
function checkReferences(
  curriculum: Curriculum,
  questions: Question[],
  misconceptions: Misconception[],
  remediations: Remediation[],
  datasets: Dataset[],
  achievements: Achievement[]
): Result<null> {
  const problems: string[] = [];
  const questionIds = new Set(questions.map((q) => q.id));
  const skillIds = new Set(curriculum.skills.map((s) => s.id));
  const objectiveIds = new Set(curriculum.objectives.map((o) => o.id));
  const misconceptionIds = new Set(misconceptions.map((m) => m.id));
  const remediationIds = new Set(remediations.map((r) => r.id));
  const datasetIds = new Set(datasets.map((d) => d.id));
  const lessonIds = new Set(curriculum.lessons.map((l) => l.id));
  const moduleIds = new Set(curriculum.modules.map((m) => m.id));
  const regionIds = new Set(curriculum.regions.map((r) => r.id));

  for (const w of curriculum.worlds) {
    for (const r of w.regionIds) if (!regionIds.has(r)) problems.push(`world ${w.id} references missing region ${r}`);
  }
  for (const r of curriculum.regions) {
    for (const m of r.moduleIds) if (!moduleIds.has(m)) problems.push(`region ${r.id} references missing module ${m}`);
  }
  for (const m of curriculum.modules) {
    for (const l of m.lessonIds) if (!lessonIds.has(l)) problems.push(`module ${m.id} references missing lesson ${l}`);
  }
  for (const l of curriculum.lessons) {
    for (const q of l.questionIds) if (!questionIds.has(q)) problems.push(`lesson ${l.id} references missing question ${q}`);
    for (const o of l.objectiveIds) if (!objectiveIds.has(o)) problems.push(`lesson ${l.id} references missing objective ${o}`);
  }
  for (const q of questions) {
    for (const s of q.skillIds) if (!skillIds.has(s)) problems.push(`question ${q.id} references missing skill ${s}`);
    if (!objectiveIds.has(q.objectiveId)) problems.push(`question ${q.id} references missing objective ${q.objectiveId}`);
    for (const m of q.misconceptionIds) if (!misconceptionIds.has(m)) problems.push(`question ${q.id} references missing misconception ${m}`);
    if (q.datasetId && !datasetIds.has(q.datasetId)) problems.push(`question ${q.id} references missing dataset ${q.datasetId}`);
    if (q.followUpQuestionId && !questionIds.has(q.followUpQuestionId)) problems.push(`question ${q.id} follow-up ${q.followUpQuestionId} missing`);
    // Step-level misconception mappings must resolve too, otherwise a wrong step
    // classifies to an id nothing can remediate.
    if (q.answer.kind === "steps") {
      for (const step of q.answer.steps) {
        for (const mv of step.misconceptionValues) {
          if (!misconceptionIds.has(mv.misconceptionId)) {
            problems.push(`question ${q.id} step ${step.id} references missing misconception ${mv.misconceptionId}`);
          }
        }
      }
    }
    if (q.answer.kind === "point") {
      for (const mp of q.answer.misconceptionPoints) {
        if (!misconceptionIds.has(mp.misconceptionId)) {
          problems.push(`question ${q.id} point target references missing misconception ${mp.misconceptionId}`);
        }
      }
      const swapped = q.answer.swappedAxesMisconceptionId;
      if (swapped && !misconceptionIds.has(swapped)) {
        problems.push(`question ${q.id} references missing misconception ${swapped}`);
      }
    }
    if (q.answer.kind === "placement") {
      for (const mp of q.answer.misconceptionPlacements) {
        if (!misconceptionIds.has(mp.misconceptionId)) {
          problems.push(`question ${q.id} placement references missing misconception ${mp.misconceptionId}`);
        }
      }
    }
  }
  for (const mc of misconceptions) {
    if (!remediationIds.has(mc.remediationId)) problems.push(`misconception ${mc.id} references missing remediation ${mc.remediationId}`);
  }
  for (const r of remediations) {
    for (const q of r.followUpQuestionIds) if (!questionIds.has(q)) problems.push(`remediation ${r.id} follow-up ${q} missing`);
  }
  // An achievement whose trigger points at a missing id can never fire, and would do so
  // silently. Validate every id-bearing trigger kind.
  for (const a of achievements) {
    const t = a.trigger;
    if (t.kind === "region-completed" && !regionIds.has(t.regionId)) {
      problems.push(`achievement ${a.id} references missing region ${t.regionId}`);
    }
    if (t.kind === "lesson-completed" && !lessonIds.has(t.lessonId)) {
      problems.push(`achievement ${a.id} references missing lesson ${t.lessonId}`);
    }
    if (t.kind === "skill-mastered" && !skillIds.has(t.skillId)) {
      problems.push(`achievement ${a.id} references missing skill ${t.skillId}`);
    }
  }

  return problems.length === 0 ? ok(null) : err(problems.slice(0, 10).join("; "));
}
