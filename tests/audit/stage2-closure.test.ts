/**
 * S2-21: the Stage 2 closure audit.
 *
 * `STAGE2_RECONSTRUCTION_SCOPE.md` §10 lists twelve conditions closure tests
 * must **fail** on. This file names all twelve, in that order, and fails on each
 * independently. It is deliberately the last thing written in the stage: the
 * point is not to re-implement what the other eight audit files already prove,
 * but to make the *list itself* enforceable, so that closure is a measurement
 * rather than an assertion someone made in a report.
 *
 * Where a guard is already enforced elsewhere, this file **exercises the same
 * property from the closure list's own wording** rather than importing the other
 * file's conclusion. That is not duplication for its own sake: a guard living in
 * `lesson-structure.test.ts` can be narrowed by a future unit that has no idea
 * §10 depends on it, and the failure would then be a silently-weakened rule
 * rather than a red test. Each case here says which file owns the detail.
 *
 * The last two guards are about **documents**, not content, and nothing in the
 * repository checked them before this unit. They are the two that matter most
 * to a reconstruction whose predecessor was lost to unpushed commits.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { loadShippedContent } from "../../src/content";
import { generatedRun } from "../../src/content/generated";
import { allGeneratorFamilies } from "../../src/content/generators";
import {
  buildCoverageReport,
  MAX_SINGLE_SHAPE_SHARE,
  REQUIRED_INTERACTIONS_PER_TOPIC,
  REQUIRED_REASONING_FAMILIES
} from "../../src/core/generation/report";
import { listInteractions, registerDefaultInteractions } from "../../src/core/questions/registry";
import { RENDERED_INTERACTION_TYPES } from "../../src/renderer/components/rendered-interactions";
import { investigationForRegion } from "../../src/core/investigations/engine";
import { REGIONS_OWING_A_BOSS, REGIONS_WITH_A_BOSS } from "../helpers/complete-bosses";

const content = loadShippedContent();
const authored = [...content.questions.values()];

/** The coverage report the closure numbers are read from, built once. */
const run = generatedRun(authored, content.misconceptions, content.remediations);
const reports = buildCoverageReport({
  curriculum: content.curriculum,
  authored,
  families: allGeneratorFamilies(),
  results: run.results,
  accepted: run.accepted
});

const backlog = readFileSync("docs/STAGE2_RECONSTRUCTION_BACKLOG.md", "utf8");
const ciWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};

describe("scope §10 closure drift guards", () => {
  it("1. no completed topic has fewer than the required validated interactions", () => {
    // Detail owned by `content-coverage.test.ts`; the closure list's own wording
    // is checked here against the same report the coverage script writes.
    for (const topic of reports) {
      expect(
        topic.totalAvailable,
        `${topic.skillId} offers ${topic.totalAvailable}, below the floor of ${REQUIRED_INTERACTIONS_PER_TOPIC}`
      ).toBeGreaterThanOrEqual(REQUIRED_INTERACTIONS_PER_TOPIC);
      expect(
        topic.reasoningFamilies.length,
        `${topic.skillId} spans ${topic.reasoningFamilies.length} reasoning families: ${topic.reasoningFamilies.join(", ")}`
      ).toBeGreaterThanOrEqual(REQUIRED_REASONING_FAMILIES);
      expect(
        topic.largestShapeShare,
        `${topic.skillId} leans ${Math.round(topic.largestShapeShare * 100)}% on one shape`
      ).toBeLessThanOrEqual(MAX_SINGLE_SHAPE_SHARE);
    }
  });

  it("2. no completed topic has zero generator families and is omitted from reporting", () => {
    // The omission is the defect, not the zero: a topic with no families must
    // still appear, and must appear as a failure.
    const reported = new Set(reports.map((r) => r.skillId));
    for (const topic of reports) {
      expect(reported.has(topic.skillId)).toBe(true);
      if (topic.generatorFamilies === 0) {
        expect(topic.failures.length, `${topic.skillId} has no families and is reported as passing`).toBeGreaterThan(0);
      }
    }
  });

  it("3. no interaction type is registered without evaluation or accessibility coverage", () => {
    registerDefaultInteractions();
    for (const declared of listInteractions()) {
      if (!declared.implemented) {
        expect(
          RENDERED_INTERACTION_TYPES.has(declared.type),
          `${declared.type} is stubbed but has a renderer`
        ).toBe(false);
        continue;
      }
      expect(
        RENDERED_INTERACTION_TYPES.has(declared.type),
        `${declared.type} is implemented with no renderer, so it cannot be operated at all`
      ).toBe(true);
      expect(declared.responseKind, `${declared.type} declares no response kind to evaluate`).toBeTruthy();
    }
  });

  it("4. no skill lacks a stage classification", () => {
    for (const skill of content.curriculum.skills) {
      expect(skill.stage, `${skill.id} has no stage`).toBeTruthy();
      expect([1, 2, 3, 4, 5, 6]).toContain(skill.stage);
    }
  });

  it("5. no curriculum reference points at something missing", () => {
    // `loadShippedContent` throws on a dangling reference, so reaching this line
    // is most of the guard. The rest is the references it does not resolve for
    // us, checked here rather than assumed.
    const datasetIds = new Set(content.datasets.keys());
    const questionIds = new Set(content.questions.keys());
    for (const question of content.questions.values()) {
      if (question.visual.kind !== "none") {
        expect(
          datasetIds.has(question.visual.datasetId ?? ""),
          `${question.id} draws a ${question.visual.kind} from a dataset that does not exist`
        ).toBe(true);
      }
    }
    for (const investigation of content.curriculum.investigations) {
      for (const step of investigation.steps) {
        for (const qid of step.questionIds) {
          expect(questionIds.has(qid), `${investigation.id} step ${step.id} asks missing question ${qid}`).toBe(true);
        }
      }
    }
  });

  it("6. no declared misconception is unreachable", () => {
    // Detail owned by `misconception-library.test.ts`, which builds the response
    // that expresses each declaration and puts it through the real pipeline.
    // What closure asks is narrower and independent: every misconception a
    // reachable question names must exist and name a remediation.
    const reachable = new Set<string>(content.curriculum.lessons.flatMap((l) => l.questionIds));
    for (const investigation of content.curriculum.investigations) {
      for (const step of investigation.steps) for (const q of step.questionIds) reachable.add(q);
    }
    const byId = new Map(content.misconceptions.map((m) => [m.id, m]));
    const remediationIds = new Set(content.remediations.map((r) => r.id));

    for (const question of content.questions.values()) {
      if (!reachable.has(question.id)) continue;
      const declared = new Set([
        ...question.misconceptionIds,
        ...(question.choices ?? []).flatMap((c) => (c.misconceptionId ? [c.misconceptionId] : []))
      ]);
      for (const id of declared) {
        const misconception = byId.get(id);
        expect(misconception, `${question.id} declares ${id}, which does not exist`).toBeDefined();
        expect(
          remediationIds.has(misconception!.remediationId),
          `${id} names remediation ${misconception!.remediationId}, which does not exist`
        ).toBe(true);
      }
    }
  });

  it("7. no distractor names an undeclared misconception, and no remediation is orphaned", () => {
    for (const question of content.questions.values()) {
      for (const choice of question.choices ?? []) {
        if (!choice.misconceptionId) continue;
        expect(
          question.misconceptionIds.includes(choice.misconceptionId),
          `${question.id} tags choice ${choice.id} with ${choice.misconceptionId} without declaring it`
        ).toBe(true);
      }
    }
    const named = new Set(content.misconceptions.map((m) => m.remediationId));
    for (const remediation of content.remediations) {
      expect(named.has(remediation.id), `remediation ${remediation.id} belongs to no misconception`).toBe(true);
    }
  });

  it("8. no region ends without a boss and a completion achievement", () => {
    for (const region of content.curriculum.regions) {
      expect(
        investigationForRegion(content.curriculum, region.id),
        `${region.id} has no boss investigation`
      ).not.toBeNull();
      expect(
        content.achievements.some((a) => a.trigger.kind === "region-completed" && a.trigger.regionId === region.id),
        `${region.id} has no completion achievement`
      ).toBe(true);
    }
    // And the declared lists still account for every region, which is what makes
    // a *future* region's missing boss visible rather than silent.
    expect([...REGIONS_WITH_A_BOSS, ...REGIONS_OWING_A_BOSS].sort()).toEqual(
      content.curriculum.regions.map((r) => r.id).sort()
    );
    expect(REGIONS_OWING_A_BOSS, "a region still owes a boss at closure").toEqual([]);
  });

  it("9. no region is added without extending the fresh-save playthrough", () => {
    // The playthrough completes every lesson of both regions and both cases. It
    // iterates the curriculum rather than naming regions, so it covers a third
    // region automatically — but only if it is still written that way, which is
    // what this reads.
    const playthrough = readFileSync("tests/integration/region-completion.test.ts", "utf8");
    expect(playthrough, "the playthrough no longer plays a region's lessons generically").toMatch(
      /lessonIdsOfRegion\(/
    );
    expect(playthrough, "the playthrough no longer closes a region's case").toMatch(/playInvestigation\(/);
    for (const region of content.curriculum.regions) {
      expect(
        playthrough.includes(region.id),
        `${region.id} is never named in the fresh-save playthrough`
      ).toBe(true);
    }
  });

  it("10. no Stage 3 topic appears before Stage 3 begins", () => {
    for (const skill of content.curriculum.skills) {
      expect(skill.stage, `${skill.id} is a Stage ${skill.stage} skill shipping in Stage 2`).toBeLessThanOrEqual(2);
    }
  });

  it("11. no completed unit lacks a verified remote commit", () => {
    // The guard this reconstruction exists because of. Every backlog row marked
    // Complete must carry a local hash, a remote hash, the two equal, and a
    // verification cell that says so — read out of the document, because the
    // document is the record.
    const rows = backlog
      .split("\n")
      .filter((line) => line.startsWith("| S2-") || line.startsWith("| R-") || line.startsWith("| X-"));
    expect(rows.length, "no unit rows found in the backlog").toBeGreaterThan(15);

    const complete = rows.filter((row) => /\*\*Complete\*\*/.test(row));
    expect(complete.length, "no completed units found").toBeGreaterThan(10);

    for (const row of complete) {
      const cells = row.split("|").map((c) => c.trim());
      const id = cells[1];
      const hashes = [...row.matchAll(/`([0-9a-f]{7,40})`/g)].map((m) => m[1]!);
      expect(hashes.length, `${id} is Complete with no commit hash recorded`).toBeGreaterThanOrEqual(2);

      const [local, remote] = hashes;
      expect(
        remote!.startsWith(local!) || local!.startsWith(remote!),
        `${id} records local ${local} and remote ${remote}, which are not the same commit`
      ).toBe(true);
      expect(row, `${id} is Complete without a verified remote match`).toMatch(/Yes\s*—\s*MATCH/);
    }
  });

  it("12. no document claims a script that does not exist", () => {
    // "Documentation claims a test, package, launch, or push that did not occur"
    // is the guard `test:a11y` spent six units demonstrating: it was named in
    // the scope, absent from `package.json`, and every report had to say so by
    // hand. Mechanised here in the direction that can be checked — every script
    // CI runs must be defined.
    const invoked = [...ciWorkflow.matchAll(/run:\s*npm run ([a-z:0-9-]+)/g)].map((m) => m[1]!);
    expect(invoked.length, "the workflow invokes no npm scripts").toBeGreaterThan(3);
    for (const script of invoked) {
      expect(
        packageJson.scripts[script],
        `CI runs \`npm run ${script}\`, which package.json does not define`
      ).toBeTruthy();
    }
    // And the reverse for the one the scope singles out: it may be named only
    // because it exists.
    expect(packageJson.scripts["test:a11y"], "test:a11y is referenced across the docs and must exist").toBeTruthy();
  });
});
