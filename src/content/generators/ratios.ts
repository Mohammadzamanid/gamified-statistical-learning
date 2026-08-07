/**
 * Generator families for ratios.
 *
 * A ratio is the nearest neighbour of the part/whole topics and the furthest
 * thing from them: it compares two amounts *directly*, in a fixed order, and
 * neither amount need be a part of anything. That difference is the whole
 * lesson, and it is also the topic's headline misconception — reading the first
 * part of a 3-to-5 mix as three fifths rather than three eighths.
 *
 * So this is the first generator module that declares misconceptions rather than
 * shipping an empty list. The pipeline has always validated misconception
 * mappings; until now nothing exercised the *accepting* side of that gate,
 * because no shipped generator tagged a distractor. Two families here do, and
 * the tag names the error the option actually embodies:
 *
 *  - `mc.ratio-part-as-whole` on the option that divides by the other part;
 *  - `mc.additive-scaling` on the mix scaled by adding rather than multiplying.
 *
 * `expectedResponse` is stated by the family and never read back out of the
 * question it built (D-020). Where a value can be reached a second way it is:
 * scaling is checked by repeated addition against multiplication, and two
 * ratios are compared by cross-multiplying against dividing.
 */
import type { Question } from "../../shared/schemas";
import type { RawResponse } from "../../core/questions/types";
import type { Candidate, GeneratorFamily } from "../../core/generation/types";

const SKILL = "skill.r1-ratios";
const TOPIC = "t.r1-ratios";
const OBJECTIVE = "obj.r1-ratios";

/** Two amounts in a fixed order: `first` of the one for every `second` of the other. */
interface Mix {
  first: number;
  second: number;
}

/**
 * The mixes every family enumerates over.
 *
 * Small numbers on purpose: a ratio question is about the relationship, and a
 * learner who has to fight the arithmetic is not practising the relationship.
 */
const MIXES: readonly Mix[] = [
  { first: 1, second: 2 }, { first: 1, second: 3 }, { first: 1, second: 4 }, { first: 1, second: 5 },
  { first: 1, second: 6 }, { first: 2, second: 3 }, { first: 2, second: 5 }, { first: 2, second: 7 },
  { first: 3, second: 4 }, { first: 3, second: 5 }, { first: 3, second: 7 }, { first: 3, second: 8 },
  { first: 3, second: 10 }, { first: 4, second: 5 }, { first: 4, second: 7 }, { first: 4, second: 9 },
  { first: 5, second: 6 }, { first: 5, second: 7 }, { first: 5, second: 8 }, { first: 5, second: 9 },
  { first: 5, second: 12 }, { first: 7, second: 8 }, { first: 7, second: 10 }, { first: 7, second: 12 },
  // Equal parts. Included deliberately: several families below reject a mix
  // whose two amounts match, and a grid that never contains one would leave
  // those rejections as decoration nobody had tested.
  { first: 4, second: 4 }, { first: 6, second: 6 }
];

/**
 * Scale factors. Four, not eight.
 *
 * The scaling family is one reasoning shape, and every extra factor multiplies
 * it against the whole mix grid. Eight would carry that single shape past the
 * 50% ceiling §4 sets on its own — the same trap the parts generator walked into.
 */
const SCALES = [2, 3, 4, 6];

/** Contexts for the word-problem families: a ratio is not always a liquid. */
const CONTEXTS: ReadonlyArray<{
  firstNoun: string;
  secondNoun: string;
  unit: string;
  story: (m: Mix, have: number) => string;
}> = [
  {
    firstNoun: "measures of water",
    secondNoun: "measures of salt",
    unit: "measures",
    story: (m, have) =>
      `The curing shed mixes brine at ${m.first} measures of water to ${m.second} of salt. Today's batch uses ${have} measures of water. How many measures of salt does it need?`
  },
  {
    firstNoun: "boats",
    secondNoun: "deckhands",
    unit: "deckhands",
    story: (m, have) =>
      `The harbour staffs ${m.first} boats with ${m.second} deckhands, and keeps that balance whatever the fleet size. With ${have} boats out, how many deckhands are needed?`
  }
];

// --------------------------------------------------------------------------
// Arithmetic, and the second route to each answer
// --------------------------------------------------------------------------

/** The total number of parts in the mix. */
function totalParts(m: Mix): number {
  return m.first + m.second;
}

/** The same total counted up one part at a time rather than added. */
function totalPartsIndependently(m: Mix): number {
  let total = 0;
  for (let i = 0; i < m.first; i++) total += 1;
  for (let i = 0; i < m.second; i++) total += 1;
  return total;
}

/** Scale by multiplying — how the mix is meant to grow. */
function scaled(value: number, by: number): number {
  return value * by;
}

/**
 * The same scaling by repeated addition.
 *
 * Genuinely a different route: a learner scaling a ratio by hand adds the part
 * once per batch, and that is what this does. If either route is wrong the two
 * disagree and the combination is rejected before it can reach anyone.
 */
function scaledIndependently(value: number, by: number): number {
  let total = 0;
  for (let i = 0; i < by; i++) total += value;
  return total;
}

/** Which mix is richer in its first amount — by cross-multiplying. */
function firstIsStronger(a: Mix, b: Mix): boolean {
  return a.first * b.second > b.first * a.second;
}

/** The same comparison by division, so a cross-multiplication slip shows up. */
function firstIsStrongerIndependently(a: Mix, b: Mix): boolean {
  return a.first / a.second > b.first / b.second;
}

function strength(m: Mix): number {
  return m.first / m.second;
}

const mixText = (m: Mix): string => `${m.first} to ${m.second}`;

function base(difficulty: 1 | 2 | 3 | 4 | 5): Pick<
  Question,
  "topicId" | "objectiveId" | "skillIds" | "difficulty"
> {
  return { topicId: TOPIC, objectiveId: OBJECTIVE, skillIds: [SKILL], difficulty };
}

const numeric = (value: number): RawResponse => ({ kind: "numeric", text: String(value) });
const choose = (id: string): RawResponse => ({ kind: "choice", choiceIds: [id] });

// --------------------------------------------------------------------------
// Families
// --------------------------------------------------------------------------

/**
 * The share-of-the-whole family, and the misconception it is built around.
 *
 * A ratio of 3 to 5 makes the first amount three *eighths* of the mixture, not
 * three fifths. The wrong option is the topic's named misconception, so it is
 * tagged — which means the engine runs its detector and the learner gets the
 * remediation rather than a bare "incorrect".
 */
function shareFamily(): GeneratorFamily {
  return {
    id: "gen.r1-ratios.representation-conversion",
    topicId: TOPIC,
    skillIds: [SKILL],
    reasoningFamily: "representation-conversion",
    description: "Turn a ratio into the fraction of the whole mixture one part occupies.",
    enumerate: () =>
      MIXES.map((m): Candidate => {
        const total = totalParts(m);
        return {
          key: `${m.first}-${m.second}`,
          // Equal parts would make the misconception option and the right one
          // both read "half", so the distractor would stop being wrong.
          invalidReason: m.first === m.second ? "the two parts are equal, so the misconception option is also correct" : null,
          expectedResponse: () => choose("ch.of-whole"),
          build: () => ({
            ...base(2),
            id: `q.gen.r1-ratios.share.${m.first}-${m.second}`,
            misconceptionIds: ["mc.ratio-part-as-whole"],
            estimatedSeconds: 55,
            accessibilityDescription: `A multiple-choice question about a mix of ${mixText(m)}, asking what fraction of the whole mixture the first amount makes up. Choose one option.`,
            interaction: "multiple-choice",
            prompt: `Brine is mixed ${m.first} measures of water to ${m.second} of salt. What fraction of the whole mixture is water?`,
            choices: [
              { id: "ch.of-whole", text: `${m.first}/${total}` },
              {
                id: "ch.of-other",
                text: `${m.first}/${m.second}`,
                misconceptionId: "mc.ratio-part-as-whole"
              },
              { id: "ch.other-of-whole", text: `${m.second}/${total}` }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.of-whole"] },
            explanation: `The mixture has ${m.first} parts water and ${m.second} parts salt, so ${total} parts in all. Water is ${m.first} of those ${total}, which is ${m.first}/${total}. ${m.first}/${m.second} compares water with salt, not water with the whole batch.`
          })
        };
      })
  };
}

/** Scale a mix up and report the matching amount of the second ingredient. */
function scalingFamily(): GeneratorFamily {
  return {
    id: "gen.r1-ratios.calculation",
    topicId: TOPIC,
    skillIds: [SKILL],
    reasoningFamily: "calculation",
    description: "Given one amount from a scaled-up mix, work out the other.",
    enumerate: () =>
      MIXES.flatMap((m) =>
        SCALES.map((by): Candidate => {
          const have = scaled(m.first, by);
          const need = scaled(m.second, by);
          return {
            key: `${m.first}-${m.second}-x${by}`,
            invalidReason: need > 60 ? "the scaled batch is larger than the shed the lesson shows" : null,
            expectedResponse: () => numeric(scaledIndependently(m.second, by)),
            build: () => ({
              ...base(3),
              id: `q.gen.r1-ratios.scale.${m.first}-${m.second}-${by}`,
              misconceptionIds: [],
              estimatedSeconds: 60,
              accessibilityDescription: `A question scaling the ratio ${mixText(m)} up to ${have} of the first amount. Enter the second amount as a number.`,
              interaction: "numeric-input",
              prompt: `A mix is kept at ${m.first} measures of water to ${m.second} of salt. A batch uses ${have} measures of water. How many measures of salt keeps the mix the same?`,
              answer: { kind: "numeric", value: need, tolerance: 0, unit: "measures" },
              explanation: `${have} is ${m.first} multiplied by ${by}, so the salt must be multiplied by ${by} too: ${m.second} times ${by} is ${need}.`
            })
          };
        })
      )
  };
}

/**
 * Scaling done wrong, with the wrong way tagged.
 *
 * `mc.additive-scaling` is the belief that a mix survives adding the same
 * amount to both sides. Offering it as an option — and saying so in the tag —
 * is the only way the engine can recognise the learner who holds it.
 */
function additiveScalingFamily(): GeneratorFamily {
  return {
    id: "gen.r1-ratios.error-identification",
    topicId: TOPIC,
    skillIds: [SKILL],
    reasoningFamily: "error-identification",
    description: "Judge a scaled mix where the same amount was added to both sides.",
    enumerate: () =>
      MIXES.flatMap((m) =>
        SCALES.map((by): Candidate => {
          const added = by;
          const wrong: Mix = { first: m.first + added, second: m.second + added };
          const right: Mix = { first: scaled(m.first, by), second: scaled(m.second, by) };
          // Adding to an equal mix leaves it equal, so the distractor would be
          // the right answer. Two identical mixes are caught by the same test,
          // because identical mixes have identical strength.
          const reason =
            Math.abs(strength(wrong) - strength(m)) < 1e-9
              ? "adding the same amount to both leaves this mix unchanged, so the wrong option is not wrong"
              : null;
          return {
            key: `${m.first}-${m.second}-x${by}`,
            invalidReason: reason,
            expectedResponse: () => choose("ch.multiplied"),
            build: () => ({
              ...base(4),
              id: `q.gen.r1-ratios.additive.${m.first}-${m.second}-${by}`,
              misconceptionIds: ["mc.additive-scaling"],
              estimatedSeconds: 70,
              accessibilityDescription: `A multiple-choice question about scaling the mix ${mixText(m)} to ${by} times the batch, where a clerk added ${added} to each amount instead. Choose the mix that keeps the strength the same.`,
              interaction: "multiple-choice",
              prompt: `The mix is ${m.first} measures of water to ${m.second} of salt. The shed needs ${by} times the batch, and the clerk writes it up as ${mixText(wrong)}. Which mix actually keeps the strength the same?`,
              choices: [
                { id: "ch.multiplied", text: `${mixText(right)}` },
                {
                  id: "ch.added",
                  text: `${mixText(wrong)}`,
                  misconceptionId: "mc.additive-scaling"
                },
                { id: "ch.first-only", text: `${right.first} to ${m.second}` }
              ],
              answer: { kind: "choice", correctChoiceIds: ["ch.multiplied"] },
              explanation: `Both amounts have to be multiplied by ${by}, giving ${mixText(right)}. Adding ${added} to each keeps the *difference* the same, not the strength: ${mixText(wrong)} is a different mix.`
            })
          };
        })
      )
  };
}

/** Which of two mixes is richer in the first ingredient. */
function comparisonFamily(): GeneratorFamily {
  return {
    id: "gen.r1-ratios.comparison",
    topicId: TOPIC,
    skillIds: [SKILL],
    reasoningFamily: "comparison",
    description: "Decide which of two mixes carries more of the first amount per unit of the second.",
    enumerate: () =>
      MIXES.map((m, i): Candidate => {
        const other = MIXES[(i + 9) % MIXES.length]!;
        const reason =
          Math.abs(strength(m) - strength(other)) < 1e-9
            ? "the two mixes are equally strong, so there is nothing to compare"
            : null;
        return {
          key: `${m.first}-${m.second}-vs-${other.first}-${other.second}`,
          invalidReason: reason,
          expectedResponse: () => choose(firstIsStrongerIndependently(m, other) ? "ch.first" : "ch.second"),
          build: () => ({
            ...base(3),
            id: `q.gen.r1-ratios.cmp.${m.first}-${m.second}-${other.first}-${other.second}`,
            misconceptionIds: [],
            estimatedSeconds: 60,
            accessibilityDescription: `A multiple-choice question comparing a mix of ${mixText(m)} with a mix of ${mixText(other)}. Choose the wetter mix.`,
            interaction: "multiple-choice",
            prompt: `Two sheds mix brine. One works at ${mixText(m)} water to salt, the other at ${mixText(other)}. Which shed's brine is wetter — more water for each measure of salt?`,
            choices: [
              { id: "ch.first", text: `The ${mixText(m)} shed` },
              { id: "ch.second", text: `The ${mixText(other)} shed` },
              { id: "ch.equal", text: "They are the same strength" }
            ],
            answer: { kind: "choice", correctChoiceIds: [firstIsStronger(m, other) ? "ch.first" : "ch.second"] },
            explanation: `Per measure of salt the first carries ${(strength(m)).toFixed(2)} of water and the second ${(strength(other)).toFixed(2)}, so the ${firstIsStronger(m, other) ? "first" : "second"} is wetter.`
          })
        };
      })
  };
}

/** Three mixes, ordered driest to wettest. */
function orderingFamily(): GeneratorFamily {
  return {
    id: "gen.r1-ratios.ordering",
    topicId: TOPIC,
    skillIds: [SKILL],
    reasoningFamily: "ordering",
    description: "Arrange three mixes from the driest to the wettest.",
    enumerate: () =>
      MIXES.map((m, i): Candidate => {
        const trio = [m, MIXES[(i + 7) % MIXES.length]!, MIXES[(i + 13) % MIXES.length]!];
        const values = trio.map(strength);
        const distinct = new Set(values).size === trio.length;
        return {
          key: `${m.first}-${m.second}`,
          invalidReason: distinct ? null : "two of the three mixes are equally strong, so the order is ambiguous",
          expectedResponse: () => ({
            kind: "ordering",
            // Ordered by cross-multiplying pairwise rather than by the divided
            // strength the question is built from.
            order: trio
              .map((_, k) => k)
              .sort((a, b) => (firstIsStronger(trio[a]!, trio[b]!) ? 1 : -1))
              .map((k) => `it.${k}`)
          }),
          build: () => ({
            ...base(4),
            id: `q.gen.r1-ratios.order.${m.first}-${m.second}`,
            misconceptionIds: [],
            estimatedSeconds: 80,
            accessibilityDescription: `An ordering question with three water-to-salt mixes. Arrange them from the driest to the wettest.`,
            interaction: "ordering",
            prompt: `Three sheds report their brine as water to salt. Put them in order, driest first.`,
            items: trio.map((x, k) => ({ id: `it.${k}`, text: mixText(x) })),
            answer: {
              kind: "ordering",
              correctOrder: trio
                .map((_, k) => k)
                .sort((a, b) => values[a]! - values[b]!)
                .map((k) => `it.${k}`)
            },
            explanation: `Water per measure of salt: ${trio
              .map((x) => `${mixText(x)} gives ${strength(x).toFixed(2)}`)
              .join("; ")}. Driest first means smallest first.`
          })
        };
      })
  };
}

/** The ratio inside a working situation, where the learner picks what to do. */
function applicationFamily(): GeneratorFamily {
  return {
    id: "gen.r1-ratios.real-world-application",
    topicId: TOPIC,
    skillIds: [SKILL],
    reasoningFamily: "real-world-application",
    description: "A ratio held steady across a change of scale, in a harbour situation.",
    enumerate: () =>
      CONTEXTS.flatMap((context, ci) =>
        MIXES.map((m): Candidate => {
          const by = 3 + (ci % 2);
          const have = scaled(m.first, by);
          const need = scaled(m.second, by);
          return {
            key: `${ci}-${m.first}-${m.second}`,
            invalidReason: need > 60 ? "the scaled batch is larger than the shed the lesson shows" : null,
            expectedResponse: () => numeric(scaledIndependently(m.second, by)),
            build: () => ({
              ...base(3),
              id: `q.gen.r1-ratios.app.${ci}-${m.first}-${m.second}`,
              misconceptionIds: [],
              estimatedSeconds: 65,
              accessibilityDescription: `A word problem holding the ratio ${mixText(m)} of ${context.firstNoun} to ${context.secondNoun} while the scale changes. Enter the answer as a number of ${context.unit}.`,
              interaction: "numeric-input",
              prompt: context.story(m, have),
              answer: { kind: "numeric", value: need, tolerance: 0, unit: context.unit },
              explanation: `${have} is ${by} times ${m.first}, so the other amount is ${by} times ${m.second}, which is ${need} ${context.unit}.`
            })
          };
        })
      )
  };
}

/** Scale the mix, then total it — the second step needs the first. */
function multiStepFamily(): GeneratorFamily {
  return {
    id: "gen.r1-ratios.multi-step-reasoning",
    topicId: TOPIC,
    skillIds: [SKILL],
    reasoningFamily: "multi-step-reasoning",
    description: "Scale a mix from one known amount, then report the size of the whole batch.",
    enumerate: () =>
      MIXES.flatMap((m) =>
        SCALES.map((by): Candidate => {
          const have = scaled(m.first, by);
          const whole = scaled(totalParts(m), by);
          return {
            key: `${m.first}-${m.second}-x${by}`,
            invalidReason: whole > 100 ? "the whole batch is larger than the shed the lesson shows" : null,
            expectedResponse: () => numeric(scaledIndependently(totalPartsIndependently(m), by)),
            build: () => ({
              ...base(4),
              id: `q.gen.r1-ratios.multi.${m.first}-${m.second}-${by}`,
              misconceptionIds: [],
              estimatedSeconds: 90,
              accessibilityDescription: `A two-step question: scale the mix ${mixText(m)} to ${have} of the first amount, then total the whole batch. Enter the total as a number.`,
              interaction: "numeric-input",
              prompt: `Brine is mixed ${m.first} measures of water to ${m.second} of salt. A batch uses ${have} measures of water. How many measures does the finished batch hold in total?`,
              answer: { kind: "numeric", value: whole, tolerance: 0, unit: "measures" },
              explanation: `${have} measures of water is ${by} batches of ${m.first}, so there are ${scaled(m.second, by)} of salt. Together that is ${whole} measures.`
            })
          };
        })
      )
  };
}

/** The same relationship, well away from the curing shed. */
function transferFamily(): GeneratorFamily {
  return {
    id: "gen.r1-ratios.transfer",
    topicId: TOPIC,
    skillIds: [SKILL],
    reasoningFamily: "transfer",
    description: "A ratio held steady in a setting the lesson never mentions.",
    enumerate: () =>
      MIXES.map((m): Candidate => {
        const by = 5;
        const have = scaled(m.first, by);
        const need = scaled(m.second, by);
        return {
          key: `${m.first}-${m.second}`,
          invalidReason: need > 60 ? "the scaled batch is larger than the shed the lesson shows" : null,
          expectedResponse: () => numeric(scaledIndependently(m.second, by)),
          build: () => ({
            ...base(4),
            id: `q.gen.r1-ratios.transfer.${m.first}-${m.second}`,
            misconceptionIds: [],
            estimatedSeconds: 70,
            accessibilityDescription: `A question about mixing paint in the ratio ${mixText(m)}, scaled up to ${have} tins of the first colour. Enter the answer as a number of tins.`,
            interaction: "numeric-input",
            prompt: `A painter mixes a colour from ${m.first} tins of blue to ${m.second} tins of white, and never varies it. A large job takes ${have} tins of blue. How many tins of white does it take?`,
            answer: { kind: "numeric", value: need, tolerance: 0, unit: "tins" },
            explanation: `The paint is nothing like brine, but the relationship is the same one: ${have} is ${by} times ${m.first}, so the white is ${by} times ${m.second}, which is ${need} tins.`
          })
        };
      })
  };
}

/** The eight families the ratios topic contributes. */
export function ratioFamilies(): GeneratorFamily[] {
  return [
    shareFamily(),
    scalingFamily(),
    additiveScalingFamily(),
    comparisonFamily(),
    orderingFamily(),
    applicationFamily(),
    multiStepFamily(),
    transferFamily()
  ];
}

export { MIXES, strength, totalParts, totalPartsIndependently };
