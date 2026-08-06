/**
 * The generated practice bank.
 *
 * Built at load time from the generator families rather than committed as
 * thousands of JSON records: the generators are a few hundred lines, the
 * questions they produce are not, and a repository carrying both would have two
 * copies of the same content that could drift apart.
 *
 * These questions are **genuinely available**, not merely counted. They carry
 * real skill ids, so the spaced-review queue picks them like any other question
 * — which is what makes "total available interactions" an honest metric rather
 * than a number in a report.
 */
import type { Question } from "../shared/schemas";
import { allGeneratorFamilies } from "./generators";
import { fingerprintAuthored, validateFamilies, type ValidationRun } from "../core/generation/validate";
import type { Misconception, Remediation } from "../shared/schemas";

let cached: ValidationRun | null = null;

/**
 * Runs every generator once and caches the result.
 *
 * Cached because generation is deterministic: the same inputs always give the
 * same questions, so repeating the work would only cost time. `resetGenerated`
 * exists for tests that change the inputs.
 */
export function generatedRun(
  authored: readonly Question[],
  misconceptions: readonly Misconception[],
  remediations: readonly Remediation[]
): ValidationRun {
  if (cached) return cached;
  cached = validateFamilies(allGeneratorFamilies(), {
    misconceptions,
    remediations,
    ...fingerprintAuthored(authored)
  });
  return cached;
}

export function resetGenerated(): void {
  cached = null;
}
