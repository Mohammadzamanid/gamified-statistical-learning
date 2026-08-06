/**
 * Writes the per-topic coverage report required by scope §4.
 *
 * Run with `npm run report:coverage`. Both forms are committed: the Markdown so
 * a reader can see where the content stands without running anything, and the
 * JSON so a change in coverage shows up as a reviewable diff rather than a
 * number someone has to recompute.
 */
import { writeFileSync } from "node:fs";
import { loadShippedContent } from "../src/content";
import { generatedRun } from "../src/content/generated";
import { allGeneratorFamilies } from "../src/content/generators";
import { buildCoverageReport, reportToJson, reportToMarkdown } from "../src/core/generation/report";

const content = loadShippedContent();
const authored = [...content.questions.values()];
const run = generatedRun(authored, content.misconceptions, content.remediations);
const reports = buildCoverageReport({
  curriculum: content.curriculum,
  authored,
  families: allGeneratorFamilies(),
  results: run.results,
  accepted: run.accepted
});

writeFileSync("docs/CONTENT_COVERAGE.md", reportToMarkdown(reports));
writeFileSync("docs/content-coverage.json", reportToJson(reports));

const failing = reports.filter((r) => r.failures.length > 0);
console.log(`${reports.length - failing.length} of ${reports.length} topics meet scope §4.`);
for (const r of failing) console.log(`  FAIL ${r.skillId}: ${r.failures.join("; ")}`);
