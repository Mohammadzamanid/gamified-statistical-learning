/**
 * Generator families for the four operations and counting.
 *
 * One implementation, parameterised by the operation. That is deliberate and it
 * is not a shortcut around the diversity rule: what varies between the families
 * below is the **reasoning pattern** the learner has to perform — comparing,
 * ordering, spotting someone else's error, filtering out a number that does not
 * belong — and what varies between topics is the operation. Sharing the code
 * that builds a prompt does not make two families the same family, in the way
 * that renumbering one question a hundred times does not make a hundred.
 *
 * Every family enumerates deterministically and exhaustively over a small
 * parameter grid, and reports the combinations it rejects rather than skipping
 * them, because §4 counts raw and valid combinations separately.
 */
import type { Question } from "../../shared/schemas";
import type { RawResponse } from "../../core/questions/types";
import type { Candidate, GeneratorFamily } from "../../core/generation/types";

export interface OperationSpec {
  /** Matches the topic's skill, e.g. `addition`. */
  slug: string;
  skillId: string;
  topicId: string;
  objectiveId: string;
  /** How the operation is written in prompts, e.g. `+`. */
  symbol: string;
  /** How the operation is said, e.g. "added to". */
  verb: string;
  apply: (a: number, b: number) => number;
  /** Rejects a combination the operation cannot honestly ask about. */
  invalidReason: (a: number, b: number) => string | null;
  /**
   * The same arithmetic worked out a **second, different way**.
   *
   * The validation pipeline compares this against the answer the question
   * publishes. Deriving both from `apply` would make that check tautological, so
   * each operation supplies a genuinely independent route — repeated addition for
   * multiplication, counting down for subtraction, and so on. A typo in either
   * route makes the two disagree and the combination is rejected.
   */
  applyIndependently: (a: number, b: number) => number;
  /** Concrete situations for the word-problem families. */
  contexts: ReadonlyArray<{ noun: string; unit: string; story: (a: number, b: number) => string }>;
  /**
   * The operation's own parameter grid, when the shared one does not suit it.
   *
   * Counting reads tallies, where the leftover can only be 0-4, so the shared
   * grid would be rejected almost entirely by counting's own validity rule. An
   * operation that needs different numbers says so rather than having its
   * coverage quietly strangled.
   */
  left?: readonly number[];
  right?: readonly number[];
}

const LEFT = [12, 18, 24, 27, 35, 42, 48, 56, 63, 72];
const RIGHT = [2, 3, 4, 5, 6, 7, 8, 9];

function id(spec: OperationSpec, family: string, key: string): string {
  return `q.gen.${spec.slug}.${family}.${key}`;
}

function base(spec: OperationSpec, difficulty: 1 | 2 | 3 | 4 | 5): Pick<
  Question,
  "topicId" | "objectiveId" | "skillIds" | "difficulty"
> {
  return { topicId: spec.topicId, objectiveId: spec.objectiveId, skillIds: [spec.skillId], difficulty };
}

/** The learner's answer, computed by the operation's second route. */
function expected(spec: OperationSpec, a: number, b: number): () => RawResponse {
  return () => ({ kind: "numeric", text: String(spec.applyIndependently(a, b)) });
}

/** Every (a, b) pair, including the ones the operation cannot use. */
function grid(spec: OperationSpec): Array<[number, number]> {
  const left = spec.left ?? LEFT;
  const right = spec.right ?? RIGHT;
  return left.flatMap((a) => right.map((b) => [a, b] as [number, number]));
}

// --------------------------------------------------------------------------
// Families
// --------------------------------------------------------------------------

function calculationFamily(spec: OperationSpec): GeneratorFamily {
  return {
    id: `gen.${spec.slug}.calculation`,
    topicId: spec.topicId,
    skillIds: [spec.skillId],
    reasoningFamily: "calculation",
    description: `Carry out ${spec.slug} on a pair of values and report the result.`,
    enumerate: () =>
      grid(spec).map(([a, b]): Candidate => {
        const reason = spec.invalidReason(a, b);
        return {
          key: `${a}-${b}`,
          invalidReason: reason,
          expectedResponse: expected(spec, a, b),
          build: () => ({
            ...base(spec, 2),
            id: id(spec, "calc", `${a}-${b}`),
            misconceptionIds: [],
            estimatedSeconds: 45,
            accessibilityDescription: `A calculation question asking for ${a} ${spec.symbol} ${b}. Enter the result as a number.`,
            interaction: "numeric-input",
            prompt: `The harbour clerk needs ${a} ${spec.verb} ${b}. What is the result?`,
            answer: { kind: "numeric", value: spec.apply(a, b), tolerance: 0, asProportion: false },
            acceptedAlternatives: [],
            hints: [],
            explanation: `${a} ${spec.symbol} ${b} is ${spec.apply(a, b)}.`,
            solutionSteps: [],
            visual: { kind: "none" }
          })
        };
      })
  };
}

function comparisonFamily(spec: OperationSpec): GeneratorFamily {
  return {
    id: `gen.${spec.slug}.comparison`,
    topicId: spec.topicId,
    skillIds: [spec.skillId],
    reasoningFamily: "comparison",
    description: `Decide which of two ${spec.slug} results is larger without being told either.`,
    enumerate: () =>
      grid(spec).map(([a, b]): Candidate => {
        const left = spec.apply(a, b);
        const right = spec.apply(a, b + 1);
        const reason = spec.invalidReason(a, b) ?? spec.invalidReason(a, b + 1) ?? (left === right ? "both results are equal, so there is nothing to compare" : null);
        return {
          key: `${a}-${b}`,
          invalidReason: reason,
          expectedResponse: () => ({
            kind: "choice",
            choiceIds: [spec.applyIndependently(a, b) > spec.applyIndependently(a, b + 1) ? "ch.first" : "ch.second"]
          }),
          build: () => ({
            ...base(spec, 3),
            id: id(spec, "cmp", `${a}-${b}`),
            misconceptionIds: [],
            estimatedSeconds: 50,
            accessibilityDescription: `A multiple-choice question comparing ${a} ${spec.symbol} ${b} with ${a} ${spec.symbol} ${b + 1}. Choose the larger.`,
            interaction: "multiple-choice",
            prompt: `Without working either out fully: which is larger, ${a} ${spec.symbol} ${b} or ${a} ${spec.symbol} ${b + 1}?`,
            choices: [
              { id: "ch.first", text: `${a} ${spec.symbol} ${b}` },
              { id: "ch.second", text: `${a} ${spec.symbol} ${b + 1}` },
              { id: "ch.equal", text: "They are equal" }
            ],
            answer: { kind: "choice", correctChoiceIds: [left > right ? "ch.first" : "ch.second"] },
            acceptedAlternatives: [],
            hints: [],
            explanation: `${a} ${spec.symbol} ${b} is ${left} and ${a} ${spec.symbol} ${b + 1} is ${right}, so the ${left > right ? "first" : "second"} is larger.`,
            solutionSteps: [],
            visual: { kind: "none" }
          })
        };
      })
  };
}

function errorFamily(spec: OperationSpec): GeneratorFamily {
  return {
    id: `gen.${spec.slug}.error-identification`,
    topicId: spec.topicId,
    skillIds: [spec.skillId],
    reasoningFamily: "error-identification",
    description: `Judge whether someone else's ${spec.slug} is right, and by how much it is out.`,
    enumerate: () =>
      grid(spec).map(([a, b]): Candidate => {
        const right = spec.apply(a, b);
        const claimed = right + (b % 2 === 0 ? 1 : -1);
        const reason = spec.invalidReason(a, b) ?? (claimed === right ? "the wrong answer coincides with the right one" : null);
        return {
          key: `${a}-${b}`,
          invalidReason: reason,
          expectedResponse: () => ({
            kind: "choice",
            choiceIds: [spec.applyIndependently(a, b) === claimed ? "ch.right" : "ch.wrong"]
          }),
          build: () => ({
            ...base(spec, 3),
            id: id(spec, "err", `${a}-${b}`),
            misconceptionIds: [],
            estimatedSeconds: 55,
            accessibilityDescription: `An error-identification question about a clerk's claim that ${a} ${spec.symbol} ${b} is ${claimed}. Choose one option.`,
            interaction: "error-identification",
            prompt: `A clerk writes in the ledger that ${a} ${spec.symbol} ${b} is ${claimed}. Is that right?`,
            choices: [
              { id: "ch.wrong", text: `No — the answer should be ${right}` },
              { id: "ch.right", text: "Yes, the ledger is correct" },
              { id: "ch.cannot", text: "There is not enough information to tell" }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.wrong"] },
            acceptedAlternatives: [],
            hints: [],
            explanation: `${a} ${spec.symbol} ${b} is ${right}, not ${claimed}, so the ledger is out by ${Math.abs(claimed - right)}.`,
            solutionSteps: [],
            visual: { kind: "none" }
          })
        };
      })
  };
}

function applicationFamily(spec: OperationSpec): GeneratorFamily {
  return {
    id: `gen.${spec.slug}.real-world-application`,
    topicId: spec.topicId,
    skillIds: [spec.skillId],
    reasoningFamily: "real-world-application",
    description: `The operation inside a harbour situation, where the learner must decide what to do.`,
    enumerate: () =>
      spec.contexts.flatMap((context, ci) =>
        grid(spec).map(([a, b]): Candidate => {
          const reason = spec.invalidReason(a, b);
          return {
            key: `${ci}-${a}-${b}`,
            invalidReason: reason,
            expectedResponse: expected(spec, a, b),
            build: () => ({
              ...base(spec, 3),
              id: id(spec, "app", `${ci}-${a}-${b}`),
              misconceptionIds: [],
              estimatedSeconds: 60,
              accessibilityDescription: `A word problem about ${context.noun} at the harbour. Enter the answer as a number of ${context.unit}.`,
              interaction: "numeric-input",
              prompt: context.story(a, b),
              answer: { kind: "numeric", value: spec.apply(a, b), tolerance: 0, unit: context.unit, asProportion: false },
              acceptedAlternatives: [],
              hints: [],
              explanation: `This is ${a} ${spec.symbol} ${b}, which is ${spec.apply(a, b)} ${context.unit}.`,
              solutionSteps: [],
              visual: { kind: "none" }
            })
          };
        })
      )
  };
}

function filteringFamily(spec: OperationSpec): GeneratorFamily {
  return {
    id: `gen.${spec.slug}.irrelevant-information-filtering`,
    topicId: spec.topicId,
    skillIds: [spec.skillId],
    reasoningFamily: "irrelevant-information-filtering",
    description: `The same operation, in a problem carrying one number that plays no part in it.`,
    enumerate: () =>
      grid(spec).map(([a, b]): Candidate => {
        const distractor = a + b + 13;
        const reason = spec.invalidReason(a, b) ?? (distractor === a || distractor === b ? "the irrelevant number collides with a relevant one" : null);
        return {
          key: `${a}-${b}`,
          invalidReason: reason,
          expectedResponse: expected(spec, a, b),
          build: () => ({
            ...base(spec, 4),
            id: id(spec, "filter", `${a}-${b}`),
            misconceptionIds: [],
            estimatedSeconds: 70,
            accessibilityDescription: `A word problem containing one number that is not needed. Enter the answer as a number.`,
            interaction: "numeric-input",
            prompt: `The ledger records ${a} crates on the quay, ${b} boats tied up, and ${distractor} metres of rope in the store. Taking only the figures that matter, what is ${a} ${spec.verb} ${b}?`,
            answer: { kind: "numeric", value: spec.apply(a, b), tolerance: 0, asProportion: false },
            acceptedAlternatives: [],
            hints: [],
            explanation: `The rope has nothing to do with it. ${a} ${spec.symbol} ${b} is ${spec.apply(a, b)}.`,
            solutionSteps: [],
            visual: { kind: "none" }
          })
        };
      })
  };
}

function multiStepFamily(spec: OperationSpec): GeneratorFamily {
  return {
    id: `gen.${spec.slug}.multi-step-reasoning`,
    topicId: spec.topicId,
    skillIds: [spec.skillId],
    reasoningFamily: "multi-step-reasoning",
    description: `Two chained uses of the operation, where the first result feeds the second.`,
    enumerate: () =>
      grid(spec).map(([a, b]): Candidate => {
        const first = spec.apply(a, b);
        const reason =
          spec.invalidReason(a, b) ??
          (!Number.isInteger(first) || first <= 0 ? "the intermediate result is not a usable whole number" : spec.invalidReason(first, b));
        return {
          key: `${a}-${b}`,
          invalidReason: reason,
          expectedResponse: () => ({
            kind: "numeric",
            text: String(spec.applyIndependently(spec.applyIndependently(a, b), b))
          }),
          build: () => ({
            ...base(spec, 4),
            id: id(spec, "multi", `${a}-${b}`),
            misconceptionIds: [],
            estimatedSeconds: 90,
            accessibilityDescription: `A two-step calculation: first ${a} ${spec.symbol} ${b}, then the same operation applied again with ${b}. Enter the final result as a number.`,
            interaction: "numeric-input",
            prompt: `Start with ${a} ${spec.verb} ${b}. Take that result and apply the same step again with ${b}. What do you end with?`,
            answer: { kind: "numeric", value: spec.apply(first, b), tolerance: 0, asProportion: false },
            acceptedAlternatives: [],
            hints: [],
            explanation: `First ${a} ${spec.symbol} ${b} is ${first}. Then ${first} ${spec.symbol} ${b} is ${spec.apply(first, b)}.`,
            solutionSteps: [],
            visual: { kind: "none" }
          })
        };
      })
  };
}

function orderingFamily(spec: OperationSpec): GeneratorFamily {
  return {
    id: `gen.${spec.slug}.ordering`,
    topicId: spec.topicId,
    skillIds: [spec.skillId],
    reasoningFamily: "ordering",
    description: `Arrange three results of the operation from smallest to largest.`,
    enumerate: () =>
      grid(spec).map(([a, b]): Candidate => {
        const pairs: Array<[number, number]> = [
          [a, b],
          [a, b + 1],
          [a, b + 2]
        ];
        const values = pairs.map(([x, y]) => spec.apply(x, y));
        const anyInvalid = pairs.map(([x, y]) => spec.invalidReason(x, y)).find((r) => r !== null) ?? null;
        const distinct = new Set(values).size === values.length;
        const reason = anyInvalid ?? (distinct ? null : "two of the three results are equal, so the order is ambiguous");
        return {
          key: `${a}-${b}`,
          invalidReason: reason,
          expectedResponse: () => {
            const independent = pairs.map(([x, y]) => spec.applyIndependently(x, y));
            return {
              kind: "ordering",
              order: pairs
                .map((_, i) => i)
                .sort((i, j) => independent[i]! - independent[j]!)
                .map((i) => `it.${i}`)
            };
          },
          build: () => {
            const items = pairs.map(([x, y], i) => ({ id: `it.${i}`, text: `${x} ${spec.symbol} ${y}` }));
            const order = pairs
              .map((_, i) => i)
              .sort((i, j) => values[i]! - values[j]!)
              .map((i) => `it.${i}`);
            return {
              ...base(spec, 3),
              id: id(spec, "order", `${a}-${b}`),
              misconceptionIds: [],
              estimatedSeconds: 70,
              accessibilityDescription: `An ordering question with three ${spec.slug} expressions. Arrange them from smallest result to largest.`,
              interaction: "ordering",
              prompt: `Put these three in order, smallest result first.`,
              items,
              answer: { kind: "ordering", correctOrder: order },
              acceptedAlternatives: [],
              hints: [],
              explanation: `The results are ${values.join(", ")}, so the order is ${order.join(", ")}.`,
              solutionSteps: [],
              visual: { kind: "none" }
            };
          }
        };
      })
  };
}

function recognitionFamily(spec: OperationSpec): GeneratorFamily {
  return {
    id: `gen.${spec.slug}.recognition`,
    topicId: spec.topicId,
    skillIds: [spec.skillId],
    reasoningFamily: "recognition",
    description: `Pick the calculation that matches a described situation, without carrying it out.`,
    enumerate: () =>
      spec.contexts.flatMap((context, ci) =>
        grid(spec).map(([a, b]): Candidate => {
          const reason = spec.invalidReason(a, b) ?? (a === b ? "the two values are equal, so the wrong-order distractor is identical" : null);
          return {
            key: `${ci}-${a}-${b}`,
            invalidReason: reason,
            // No second computation is possible here: the question is about
            // matching a description, not about a value. Stating the option the
            // family intends still catches a build() that marks another correct.
            expectedResponse: () => ({ kind: "choice", choiceIds: ["ch.right"] }),
            build: () => ({
              ...base(spec, 2),
              id: id(spec, "recog", `${ci}-${a}-${b}`),
              misconceptionIds: [],
              estimatedSeconds: 45,
              accessibilityDescription: `A multiple-choice question asking which calculation matches a situation about ${context.noun}. Choose one option.`,
              interaction: "method-selection",
              prompt: `${context.story(a, b)} Which calculation answers that — you do not need to work it out.`,
              choices: [
                { id: "ch.right", text: `${a} ${spec.symbol} ${b}` },
                { id: "ch.swapped", text: `${b} ${spec.symbol} ${a}` },
                { id: "ch.plus", text: `${a} + ${b}` }
              ],
              answer: { kind: "choice", correctChoiceIds: ["ch.right"] },
              acceptedAlternatives: [],
              hints: [],
              explanation: `The amount being ${spec.verb} is ${a}, so the calculation is ${a} ${spec.symbol} ${b}.`,
              solutionSteps: [],
              visual: { kind: "none" }
            })
          };
        })
      )
  };
}

/** The eight families a single arithmetic operation contributes. */
export function arithmeticFamilies(spec: OperationSpec): GeneratorFamily[] {
  return [
    calculationFamily(spec),
    comparisonFamily(spec),
    errorFamily(spec),
    applicationFamily(spec),
    filteringFamily(spec),
    multiStepFamily(spec),
    orderingFamily(spec),
    recognitionFamily(spec)
  ];
}
