/**
 * Generator families for Module 2 — parts of a whole.
 *
 * Fractions, decimals, percentages and proportions are not two-number
 * operations, so the arithmetic template does not carry over. What they share is
 * a **part and a whole**; what differs is the form the share is written in, and
 * that difference has to reach the learner or the four topics are one topic.
 *
 * The first attempt at this file got that wrong: only the conversion family used
 * the topic's form, so comparison, ordering, recognition and error emitted
 * *identical* questions under all four topics. The near-duplicate gate caught it
 * and collapsed three topics to almost nothing — correctly, because counting one
 * question four times is exactly what §4 exists to prevent. So every family here
 * renders its values through `form.render`, and asks in that topic's own terms.
 *
 * `expectedResponse` is stated by the family and never read back out of the
 * question it built (D-020); each form reaches its value by a second route.
 */
import type { RawResponse } from "../../core/questions/types";
import type { Candidate, GeneratorFamily } from "../../core/generation/types";
import type { Question } from "../../shared/schemas";

/** A part out of a whole, the pair every family here is built from. */
export interface Part {
  part: number;
  whole: number;
}

/** Parts chosen so the shares land on values a beginner can hold in mind. */
export const PARTS: readonly Part[] = [
  { part: 1, whole: 2 }, { part: 1, whole: 4 }, { part: 3, whole: 4 }, { part: 1, whole: 5 },
  { part: 2, whole: 5 }, { part: 3, whole: 5 }, { part: 4, whole: 5 }, { part: 1, whole: 10 },
  { part: 3, whole: 10 }, { part: 7, whole: 10 }, { part: 9, whole: 10 }, { part: 1, whole: 20 },
  { part: 3, whole: 20 }, { part: 9, whole: 20 }, { part: 11, whole: 20 }, { part: 13, whole: 20 },
  { part: 1, whole: 25 }, { part: 6, whole: 25 }, { part: 12, whole: 25 }, { part: 19, whole: 25 },
  { part: 5, whole: 8 }, { part: 7, whole: 8 }, { part: 3, whole: 8 }, { part: 1, whole: 8 },
  { part: 7, whole: 50 }, { part: 21, whole: 50 }, { part: 33, whole: 50 }, { part: 49, whole: 50 },
  { part: 17, whole: 100 }, { part: 43, whole: 100 }, { part: 61, whole: 100 }, { part: 88, whole: 100 },
  { part: 5, whole: 16 }, { part: 11, whole: 16 }, { part: 3, whole: 40 }, { part: 27, whole: 40 }
];

/**
 * Totals a share can be taken *of*, for the application family.
 *
 * Deliberately short. Every application question is one reasoning shape, so a
 * long list of totals would push that single shape past the 50% ceiling §4 sets
 * — a hundred numeric variants of one pattern is exactly what that rule exists
 * to stop, and the generator must not walk into it.
 */
const TOTALS = [20, 40, 100, 200];

function decimalShare({ part, whole }: Part): number {
  return Number((part / whole).toFixed(6));
}

/**
 * The same share by repeated subtraction rather than division.
 *
 * A different route on purpose, so the two can disagree if either is wrong
 * (D-020). Works in millionths to stay in integer arithmetic.
 */
function decimalShareIndependently({ part, whole }: Part): number {
  let remaining = part * 1_000_000;
  let millionths = 0;
  while (remaining >= whole) {
    remaining -= whole;
    millionths += 1;
  }
  return Number((millionths / 1_000_000).toFixed(6));
}

/**
 * Shares a beginner can write down exactly, in three decimal places or fewer.
 *
 * Two separate rejections wearing one name would be a lie in the coverage
 * report, so they are reported apart: a share that never terminates cannot be
 * written at all, and a share needing a fourth decimal place can be written but
 * is past what these topics ask for.
 */
function inexact(p: Part): string | null {
  if (Math.abs(decimalShare(p) - decimalShareIndependently(p)) > 1e-9) {
    return "the share does not terminate, so a beginner cannot write it exactly";
  }
  if (Math.abs(decimalShare(p) * 1000 - Math.round(decimalShare(p) * 1000)) > 1e-9) {
    return "the share needs a fourth decimal place, which these topics do not ask for";
  }
  return null;
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

/**
 * A terminating share written back as a reduced fraction: 0.375 becomes "3/8".
 *
 * The fractions topic has to *look* like fractions. Rendering its shares as
 * decimals was what made it indistinguishable from the decimals and proportions
 * topics in the first attempt at this file.
 */
export function fractionText(value: number): string {
  const scale = 1_000_000;
  const top = Math.round(value * scale);
  const divisor = greatestCommonDivisor(Math.abs(top), scale) || 1;
  const bottom = scale / divisor;
  return bottom === 1 ? String(top / divisor) : `${top / divisor}/${bottom}`;
}

/** How one topic writes a share, and how it asks for one. */
export interface Form {
  /** The value a learner enters for this share. */
  value: (p: Part) => number;
  /** The same value by a second, different route. */
  valueIndependently: (p: Part) => number;
  interaction: Question["interaction"];
  /** How the conversion question asks for it. */
  ask: string;
  /** How a value of this form appears in prose and in choices. */
  render: (value: number) => string;
  /** The name of the form, for prompts: "fraction", "percentage", … */
  noun: string;
  /** The mistake this form invites, and the option that names it. */
  trap: { wrong: (p: Part) => number; option: string; explain: (p: Part) => string };
  unit?: string;
  tolerance: number;
}

export interface PartsTopic {
  slug: string;
  skillId: string;
  topicId: string;
  objectiveId: string;
}

const numeric = (value: number): RawResponse => ({ kind: "numeric", text: String(value) });
const choose = (id: string): RawResponse => ({ kind: "choice", choiceIds: [id] });

function baseOf(t: PartsTopic, difficulty: 1 | 2 | 3 | 4 | 5): Pick<
  Question,
  "topicId" | "objectiveId" | "skillIds" | "difficulty"
> {
  return { topicId: t.topicId, objectiveId: t.objectiveId, skillIds: [t.skillId], difficulty };
}

// --------------------------------------------------------------------------
// Families
// --------------------------------------------------------------------------

function conversionFamily(t: PartsTopic, form: Form): GeneratorFamily {
  return {
    id: `gen.${t.slug}.representation-conversion`,
    topicId: t.topicId,
    skillIds: [t.skillId],
    reasoningFamily: "representation-conversion",
    description: `Move a part of a whole into a ${form.noun}.`,
    enumerate: () =>
      PARTS.map((p): Candidate => ({
        key: `${p.part}-${p.whole}`,
        invalidReason: inexact(p),
        expectedResponse: () => numeric(form.valueIndependently(p)),
        build: () => ({
          ...baseOf(t, 2),
          id: `q.gen.${t.slug}.conv.${p.part}-${p.whole}`,
          misconceptionIds: [],
          estimatedSeconds: 50,
          accessibilityDescription: `A question converting ${p.part} out of ${p.whole} into a ${form.noun}. Enter the value as a number.`,
          interaction: form.interaction,
          prompt: `Of the ${p.whole} crates on the quay, ${p.part} hold cod. ${form.ask}`,
          answer: {
            kind: "numeric",
            value: form.value(p),
            tolerance: form.tolerance,
            ...(form.unit ? { unit: form.unit } : {})
          },
          explanation: `${p.part} out of ${p.whole} is ${form.render(form.value(p))}.`
        })
      }))
  };
}

function comparisonFamily(t: PartsTopic, form: Form): GeneratorFamily {
  return {
    id: `gen.${t.slug}.comparison`,
    topicId: t.topicId,
    skillIds: [t.skillId],
    reasoningFamily: "comparison",
    description: `Compare two shares already written as ${form.noun}s.`,
    enumerate: () =>
      PARTS.map((p, i): Candidate => {
        const other = PARTS[(i + 7) % PARTS.length]!;
        const reason =
          inexact(p) ??
          inexact(other) ??
          (Math.abs(decimalShare(p) - decimalShare(other)) < 1e-9
            ? "the two shares are equal, so there is nothing to compare"
            : null);
        const firstBigger = form.valueIndependently(p) > form.valueIndependently(other);
        return {
          key: `${p.part}-${p.whole}-vs-${other.part}-${other.whole}`,
          invalidReason: reason,
          expectedResponse: () => choose(firstBigger ? "ch.first" : "ch.second"),
          build: () => ({
            ...baseOf(t, 3),
            id: `q.gen.${t.slug}.cmp.${p.part}-${p.whole}-${other.part}-${other.whole}`,
            misconceptionIds: [],
            estimatedSeconds: 55,
            accessibilityDescription: `A multiple-choice question comparing the ${form.noun} ${form.render(form.value(p))} with the ${form.noun} ${form.render(form.value(other))}. Choose the larger.`,
            interaction: "multiple-choice",
            prompt: `Two holds report how full they are as a ${form.noun}: one says ${form.render(form.value(p))}, the other says ${form.render(form.value(other))}. Which hold is fuller?`,
            choices: [
              { id: "ch.first", text: form.render(form.value(p)) },
              { id: "ch.second", text: form.render(form.value(other)) },
              { id: "ch.equal", text: "They are equally full" }
            ],
            answer: { kind: "choice", correctChoiceIds: [firstBigger ? "ch.first" : "ch.second"] },
            explanation: `Written as ${form.noun}s these are ${form.render(form.value(p))} and ${form.render(form.value(other))}, so the ${firstBigger ? "first" : "second"} is fuller.`
          })
        };
      })
  };
}

function applicationFamily(t: PartsTopic, form: Form): GeneratorFamily {
  return {
    id: `gen.${t.slug}.real-world-application`,
    topicId: t.topicId,
    skillIds: [t.skillId],
    reasoningFamily: "real-world-application",
    description: `Take a ${form.noun} of a real total and report how many that is.`,
    enumerate: () =>
      PARTS.flatMap((p) =>
        TOTALS.map((total): Candidate => {
          const crates = Number((decimalShare(p) * total).toFixed(6));
          const reason =
            inexact(p) ??
            (total % p.whole !== 0
              ? "the total does not divide into this many equal parts"
              : crates % 1 !== 0
                ? "the share of this total is not a whole number of crates"
                : null);
          // Independent route: add the part once per group instead of scaling.
          const independent = () => {
            let counted = 0;
            for (let g = 0; g < total / p.whole; g++) counted += p.part;
            return counted;
          };
          return {
            key: `${p.part}-${p.whole}-of-${total}`,
            invalidReason: reason,
            expectedResponse: () => numeric(independent()),
            build: () => ({
              ...baseOf(t, 3),
              id: `q.gen.${t.slug}.app.${p.part}-${p.whole}-${total}`,
              misconceptionIds: [],
              estimatedSeconds: 60,
              accessibilityDescription: `A word problem taking the ${form.noun} ${form.render(form.value(p))} of a shipment of ${total} crates. Enter the number of crates.`,
              interaction: "numeric-input",
              prompt: `The manifest gives the cod share of a ${total}-crate shipment as the ${form.noun} ${form.render(form.value(p))}. How many crates of cod is that?`,
              answer: { kind: "numeric", value: crates, tolerance: 0, unit: "crates" },
              explanation: `The ${form.noun} ${form.render(form.value(p))} of ${total} crates is ${crates} crates.`
            })
          };
        })
      )
  };
}

function orderingFamily(t: PartsTopic, form: Form): GeneratorFamily {
  return {
    id: `gen.${t.slug}.ordering`,
    topicId: t.topicId,
    skillIds: [t.skillId],
    reasoningFamily: "ordering",
    description: `Arrange three ${form.noun}s from smallest to largest.`,
    enumerate: () =>
      PARTS.map((p, i): Candidate => {
        const trio = [p, PARTS[(i + 5) % PARTS.length]!, PARTS[(i + 11) % PARTS.length]!];
        const values = trio.map((x) => form.valueIndependently(x));
        const anyInexact = trio.map(inexact).find((r) => r !== null) ?? null;
        const distinct = new Set(values).size === trio.length;
        return {
          key: `${p.part}-${p.whole}`,
          invalidReason:
            anyInexact ?? (distinct ? null : "two of the three shares are equal, so the order is ambiguous"),
          expectedResponse: () => ({
            kind: "ordering",
            order: trio
              .map((_, k) => k)
              .sort((a, b) => values[a]! - values[b]!)
              .map((k) => `it.${k}`)
          }),
          build: () => ({
            ...baseOf(t, 3),
            id: `q.gen.${t.slug}.order.${p.part}-${p.whole}`,
            misconceptionIds: [],
            estimatedSeconds: 70,
            accessibilityDescription: `An ordering question with three ${form.noun}s. Arrange them from smallest to largest.`,
            interaction: "ordering",
            prompt: `Three holds report how full they are as ${form.noun}s. Put them in order, emptiest first.`,
            items: trio.map((x, k) => ({ id: `it.${k}`, text: form.render(form.value(x)) })),
            answer: {
              kind: "ordering",
              correctOrder: trio
                .map((_, k) => k)
                .sort((a, b) => form.value(trio[a]!) - form.value(trio[b]!))
                .map((k) => `it.${k}`)
            },
            explanation: `In order those ${form.noun}s run ${[...trio]
              .sort((x, y) => form.value(x) - form.value(y))
              .map((x) => form.render(form.value(x)))
              .join(", ")}.`
          })
        };
      })
  };
}

function errorFamily(t: PartsTopic, form: Form): GeneratorFamily {
  return {
    id: `gen.${t.slug}.error-identification`,
    topicId: t.topicId,
    skillIds: [t.skillId],
    reasoningFamily: "error-identification",
    description: `Spot the mistake this form invites: ${form.trap.option}.`,
    enumerate: () =>
      PARTS.map((p): Candidate => {
        const wrong = form.trap.wrong(p);
        const reason =
          inexact(p) ??
          (Math.abs(wrong - form.value(p)) < 1e-9 ? "the mistake happens to give the right answer here" : null);
        return {
          key: `${p.part}-${p.whole}`,
          invalidReason: reason,
          expectedResponse: () => choose("ch.trap"),
          build: () => ({
            ...baseOf(t, 3),
            id: `q.gen.${t.slug}.err.${p.part}-${p.whole}`,
            misconceptionIds: [],
            estimatedSeconds: 60,
            accessibilityDescription: `An error-identification question about a clerk who recorded the ${form.noun} for ${p.part} out of ${p.whole} as ${form.render(wrong)}. Choose one option.`,
            interaction: "error-identification",
            prompt: `${p.part} of a hold's ${p.whole} bays are full. The clerk records the ${form.noun} as ${form.render(wrong)}. What has gone wrong?`,
            choices: [
              { id: "ch.trap", text: form.trap.option },
              { id: "ch.fine", text: "Nothing — that is the right value" },
              { id: "ch.rounding", text: "Only the rounding is off" }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.trap"] },
            explanation: `${form.trap.explain(p)} The ${form.noun} should be ${form.render(form.value(p))}.`
          })
        };
      })
  };
}

function transferFamily(t: PartsTopic, form: Form): GeneratorFamily {
  return {
    id: `gen.${t.slug}.transfer`,
    topicId: t.topicId,
    skillIds: [t.skillId],
    reasoningFamily: "transfer",
    description: `The same ${form.noun} in a context away from the harbour.`,
    enumerate: () =>
      PARTS.map((p): Candidate => ({
        key: `${p.part}-${p.whole}`,
        invalidReason: inexact(p),
        expectedResponse: () => numeric(form.valueIndependently(p)),
        build: () => ({
          ...baseOf(t, 4),
          id: `q.gen.${t.slug}.transfer.${p.part}-${p.whole}`,
          misconceptionIds: [],
          estimatedSeconds: 60,
          accessibilityDescription: `A question about a school survey, asking for the ${form.noun} of ${p.part} out of ${p.whole} respondents. Enter the value as a number.`,
          interaction: form.interaction,
          prompt: `A school surveys ${p.whole} pupils and ${p.part} of them walk to lessons. ${form.ask}`,
          answer: {
            kind: "numeric",
            value: form.value(p),
            tolerance: form.tolerance,
            ...(form.unit ? { unit: form.unit } : {})
          },
          explanation: `The situation has changed but the arithmetic has not: ${p.part} out of ${p.whole} is ${form.render(form.value(p))}.`
        })
      }))
  };
}

/** The six families a part/whole topic contributes. */
export function partsFamilies(topic: PartsTopic, form: Form): GeneratorFamily[] {
  return [
    conversionFamily(topic, form),
    comparisonFamily(topic, form),
    applicationFamily(topic, form),
    orderingFamily(topic, form),
    errorFamily(topic, form),
    transferFamily(topic, form)
  ];
}

export { decimalShare, decimalShareIndependently };
