/**
 * The per-topic coverage report required by `STAGE2_RECONSTRUCTION_SCOPE.md` §4.
 *
 * Two rules from that section shape this file more than anything else:
 *
 *  1. "The authoritative topic list comes from the **completed curriculum and
 *     skill graph** — never from the set of generator modules. A topic with zero
 *     generators must appear in the report as a **failure**, not vanish from it."
 *     So the topic list is built from the curriculum, and a topic with no
 *     generator gets a row saying so.
 *
 *  2. The seven metrics "are distinct and must never be used interchangeably".
 *     They are therefore seven named fields, computed from different things, and
 *     the report prints all seven per topic even when some are zero.
 */
import type { Curriculum, Question } from "../../shared/schemas";
import { reasoningShape } from "./normalize";
import { REASONING_FAMILY_LABELS, type ReasoningFamily } from "./reasoning-families";
import type { GeneratorFamily, ValidatedCandidate } from "./types";

/** A topic, as the curriculum defines it: one skill taught by one lesson. */
export interface Topic {
  skillId: string;
  title: string;
  lessonIds: string[];
  regionId: string;
}

export interface RejectionCounts {
  invalidCombinations: number;
  invalidReasons: Record<string, number>;
  schemaFailures: number;
  answerFailures: number;
  missingAccessibility: number;
  missingMisconceptionMapping: number;
  exactDuplicates: number;
  nearDuplicates: number;
}

export interface TopicReport extends Topic {
  /** Metric 1 — hand-written entries in content JSON. */
  authoredRecords: number;
  /** Metric 2 — distinct generator families producing for this topic. */
  generatorFamilies: number;
  /** Metric 3 — distinct reasoning patterns actually represented, authored and generated. */
  reasoningFamilies: ReasoningFamily[];
  /** Metric 4 — every combination the generators could emit, before validity rules. */
  rawCombinations: number;
  /** Metric 5 — raw combinations surviving the generators' own validity rules. */
  validCombinations: number;
  /** Metric 6 — valid combinations that also passed schema, answer, a11y and duplicate checks. */
  validatedGenerated: number;
  /** Metric 7 — authored records plus final validated generated interactions. */
  totalAvailable: number;
  rejections: RejectionCounts;
  /** Questions with a skill nothing in the curriculum teaches through a lesson. */
  unreachableQuestions: string[];
  /**
   * The share of this topic's interactions taken by its single commonest
   * reasoning shape. §4 rules out "100 numeric variants of one reasoning
   * pattern", and this is that rule as a number.
   */
  largestShapeShare: number;
  /** Every reason this topic is not Complete under §4, in report order. */
  failures: string[];
}

export const REQUIRED_INTERACTIONS_PER_TOPIC = 100;
export const REQUIRED_REASONING_FAMILIES = 4;
/** No single reasoning shape may account for more than this share of a topic. */
export const MAX_SINGLE_SHAPE_SHARE = 0.5;

/**
 * The topic list, from the curriculum graph.
 *
 * A topic is a skill some lesson teaches. Skills nothing teaches are not topics
 * (they cannot be Complete or incomplete); skills several lessons teach appear
 * once, with every lesson listed.
 */
export function topicsFromCurriculum(curriculum: Curriculum): Topic[] {
  const bySkill = new Map<string, Topic>();
  for (const lesson of curriculum.lessons) {
    const module = curriculum.modules.find((m) => m.id === lesson.moduleId);
    const skillIds = lesson.objectiveIds.flatMap(
      (oid) => curriculum.objectives.find((o) => o.id === oid)?.skillIds ?? []
    );
    for (const skillId of skillIds) {
      const existing = bySkill.get(skillId);
      if (existing) {
        if (!existing.lessonIds.includes(lesson.id)) existing.lessonIds.push(lesson.id);
        continue;
      }
      bySkill.set(skillId, {
        skillId,
        title: curriculum.skills.find((s) => s.id === skillId)?.title ?? skillId,
        lessonIds: [lesson.id],
        regionId: module?.regionId ?? "unknown"
      });
    }
  }
  return [...bySkill.values()].sort((a, b) => a.skillId.localeCompare(b.skillId));
}

function emptyRejections(): RejectionCounts {
  return {
    invalidCombinations: 0,
    invalidReasons: {},
    schemaFailures: 0,
    answerFailures: 0,
    missingAccessibility: 0,
    missingMisconceptionMapping: 0,
    exactDuplicates: 0,
    nearDuplicates: 0
  };
}

export interface ReportInput {
  curriculum: Curriculum;
  authored: readonly Question[];
  families: readonly GeneratorFamily[];
  results: readonly ValidatedCandidate[];
  /** Reasoning family each authored question represents, where content declares one. */
  authoredFamilies?: ReadonlyMap<string, ReasoningFamily>;
  /** The questions that survived validation, needed for the shape-dominance check. */
  accepted?: readonly Question[];
}

export function buildCoverageReport(input: ReportInput): TopicReport[] {
  const { curriculum, authored, families, results } = input;
  const familyById = new Map(families.map((f) => [f.id, f]));
  const lessonSkills = new Set(
    curriculum.lessons.flatMap((l) =>
      l.objectiveIds.flatMap((oid) => curriculum.objectives.find((o) => o.id === oid)?.skillIds ?? [])
    )
  );

  return topicsFromCurriculum(curriculum).map((topic) => {
    const topicFamilies = families.filter((f) => f.skillIds.includes(topic.skillId));
    const topicAuthored = authored.filter((q) => q.skillIds.includes(topic.skillId));

    const rejections = emptyRejections();
    let rawCombinations = 0;
    let validCombinations = 0;
    let validatedGenerated = 0;
    const representedFamilies = new Set<ReasoningFamily>();

    for (const result of results) {
      const family = familyById.get(result.familyId);
      if (!family || !family.skillIds.includes(topic.skillId)) continue;
      rawCombinations += 1;

      switch (result.outcome.status) {
        case "invalid":
          rejections.invalidCombinations += 1;
          rejections.invalidReasons[result.outcome.reason] =
            (rejections.invalidReasons[result.outcome.reason] ?? 0) + 1;
          break;
        case "schema-failure":
          validCombinations += 1;
          rejections.schemaFailures += 1;
          break;
        case "answer-failure":
          validCombinations += 1;
          rejections.answerFailures += 1;
          break;
        case "missing-accessibility":
          validCombinations += 1;
          rejections.missingAccessibility += 1;
          break;
        case "missing-misconception-mapping":
          validCombinations += 1;
          rejections.missingMisconceptionMapping += 1;
          break;
        case "exact-duplicate":
          validCombinations += 1;
          rejections.exactDuplicates += 1;
          break;
        case "near-duplicate":
          validCombinations += 1;
          rejections.nearDuplicates += 1;
          break;
        case "accepted":
          validCombinations += 1;
          validatedGenerated += 1;
          representedFamilies.add(family.reasoningFamily);
          break;
      }
    }

    for (const q of topicAuthored) {
      const declared = input.authoredFamilies?.get(q.id);
      if (declared) representedFamilies.add(declared);
    }

    // A question is unreachable when no lesson teaches any skill it practises,
    // so nothing in the curriculum could ever put it in front of a learner.
    const unreachableQuestions = topicAuthored
      .filter((q) => !q.skillIds.some((s) => lessonSkills.has(s)))
      .map((q) => q.id);

    const totalAvailable = topicAuthored.length + validatedGenerated;
    const reasoningFamilies = [...representedFamilies].sort();

    // Every interaction a learner could actually meet for this topic, authored
    // and generated alike, reduced to the shape of the thinking it asks for.
    const topicQuestions = [
      ...topicAuthored,
      ...(input.accepted ?? []).filter((q) => q.skillIds.includes(topic.skillId))
    ];
    const shapeCounts = new Map<string, number>();
    for (const q of topicQuestions) {
      const shape = reasoningShape(q);
      shapeCounts.set(shape, (shapeCounts.get(shape) ?? 0) + 1);
    }
    const largestShape = Math.max(0, ...shapeCounts.values());
    const largestShapeShare = topicQuestions.length === 0 ? 0 : largestShape / topicQuestions.length;

    const failures: string[] = [];
    if (topicFamilies.length === 0) {
      failures.push("no generator families produce for this topic");
    }
    if (totalAvailable < REQUIRED_INTERACTIONS_PER_TOPIC) {
      failures.push(
        `${totalAvailable} available interactions, below the required ${REQUIRED_INTERACTIONS_PER_TOPIC}`
      );
    }
    if (reasoningFamilies.length < REQUIRED_REASONING_FAMILIES) {
      failures.push(
        `${reasoningFamilies.length} reasoning families represented, below the required ${REQUIRED_REASONING_FAMILIES}`
      );
    }
    if (unreachableQuestions.length > 0) {
      failures.push(`${unreachableQuestions.length} unreachable question(s): ${unreachableQuestions.join(", ")}`);
    }
    if (largestShapeShare > MAX_SINGLE_SHAPE_SHARE) {
      failures.push(
        `${Math.round(largestShapeShare * 100)}% of interactions share one reasoning shape, above the ` +
          `${Math.round(MAX_SINGLE_SHAPE_SHARE * 100)}% ceiling — this is the "numeric variants of one pattern" case`
      );
    }

    return {
      ...topic,
      authoredRecords: topicAuthored.length,
      generatorFamilies: topicFamilies.length,
      reasoningFamilies,
      rawCombinations,
      validCombinations,
      validatedGenerated,
      totalAvailable,
      rejections,
      unreachableQuestions,
      largestShapeShare,
      failures
    };
  });
}

/** The machine-readable form: stable field order, safe to diff between commits. */
export function reportToJson(reports: readonly TopicReport[]): string {
  return `${JSON.stringify({ generatedFrom: "curriculum graph", topics: reports }, null, 2)}\n`;
}

/** The human-readable form. Failures are stated, never omitted. */
export function reportToMarkdown(reports: readonly TopicReport[]): string {
  const complete = reports.filter((r) => r.failures.length === 0);
  const lines: string[] = [];

  lines.push("# CONTENT_COVERAGE.md — per-topic interaction coverage");
  lines.push("");
  lines.push("**Generated** by `npm run report:coverage`. Do not edit by hand.");
  lines.push("");
  lines.push(
    "Topics come from the **curriculum graph**, never from the set of generator modules " +
      "(`STAGE2_RECONSTRUCTION_SCOPE.md` §4). A topic with no generators appears here as a failure rather than " +
      "being omitted."
  );
  lines.push("");
  lines.push(
    `**${complete.length} of ${reports.length} topics** meet §4: at least ` +
      `${REQUIRED_INTERACTIONS_PER_TOPIC} validated available interactions spanning at least ` +
      `${REQUIRED_REASONING_FAMILIES} reasoning families, with nothing unreachable.`
  );
  lines.push("");
  lines.push("## The seven metrics, per topic");
  lines.push("");
  lines.push(
    "| Topic | Authored records | Generator families | Reasoning families | Raw combinations | Valid combinations | Validated generated | **Total available** | Meets §4 |"
  );
  lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---|");
  for (const r of reports) {
    lines.push(
      `| ${r.title} (\`${r.skillId}\`) | ${r.authoredRecords} | ${r.generatorFamilies} | ` +
        `${r.reasoningFamilies.length} | ${r.rawCombinations} | ${r.validCombinations} | ` +
        `${r.validatedGenerated} | **${r.totalAvailable}** | ${r.failures.length === 0 ? "Yes" : "**No**"} |`
    );
  }
  lines.push("");
  lines.push("## Rejections, per topic");
  lines.push("");
  lines.push(
    "| Topic | Invalid combinations | Schema failures | Correct-answer failures | Missing a11y | Missing misconception mapping | Exact duplicates | Near duplicates | Unreachable |"
  );
  lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---:|");
  for (const r of reports) {
    const x = r.rejections;
    lines.push(
      `| ${r.title} | ${x.invalidCombinations} | ${x.schemaFailures} | ${x.answerFailures} | ` +
        `${x.missingAccessibility} | ${x.missingMisconceptionMapping} | ${x.exactDuplicates} | ` +
        `${x.nearDuplicates} | ${r.unreachableQuestions.length} | ${Math.round(r.largestShapeShare * 100)}% |`
    );
  }
  lines.push("");
  lines.push("## Why combinations were rejected");
  lines.push("");
  for (const r of reports) {
    const reasons = Object.entries(r.rejections.invalidReasons).sort((a, b) => b[1] - a[1]);
    if (reasons.length === 0) continue;
    lines.push(`**${r.title}**`);
    lines.push("");
    for (const [reason, count] of reasons) lines.push(`- ${count} x ${reason}`);
    lines.push("");
  }

  lines.push("## Reasoning families represented");
  lines.push("");
  for (const r of reports) {
    const names = r.reasoningFamilies.map((f) => REASONING_FAMILY_LABELS[f]).join(" · ");
    lines.push(`- **${r.title}** — ${r.reasoningFamilies.length}: ${names || "_none_"}`);
  }
  lines.push("");

  const failing = reports.filter((r) => r.failures.length > 0);
  lines.push("## Topics that do not meet §4");
  lines.push("");
  if (failing.length === 0) {
    lines.push("None.");
  } else {
    for (const r of failing) {
      lines.push(`- **${r.title}** (\`${r.skillId}\`)`);
      for (const f of r.failures) lines.push(`  - ${f}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}
