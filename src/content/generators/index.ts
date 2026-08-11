/**
 * Every generator family the app ships.
 *
 * The list is flat and explicit so the coverage report can compare it against
 * the curriculum's topic list and name the topics that have no generator — which
 * `STAGE2_RECONSTRUCTION_SCOPE.md` §4 requires to be reported as failures rather
 * than quietly omitted.
 */
import { arithmeticFamilies, type OperationSpec } from "./arithmetic";
import { fractionText, partsFamilies, type Form, type Part, type PartsTopic } from "./parts";
import { centreFamilies } from "./centre";
import { countsFamilies } from "./counts";
import { spreadFamilies } from "./spread";
import { dataFamilies } from "./data";
import { positionFamilies } from "./position";
import { ratioFamilies } from "./ratios";
import type { GeneratorFamily } from "../../core/generation/types";

const COUNTING: OperationSpec = {
  slug: "r1-counting",
  skillId: "skill.r1-counting",
  topicId: "t.r1-counting",
  objectiveId: "obj.r1-counting",
  symbol: "groups of five plus",
  verb: "counted as groups of five, plus",
  apply: (a, b) => a * 5 + b,
  // Counting sheets are read in struck groups of five, so a leftover of five or
  // more would have been drawn as another group and can never appear.
  invalidReason: (a, b) => (b >= 5 ? "a tally never leaves five or more loose marks" : a > 20 ? "more groups than a shift sheet holds" : null),
  // A tally reads in struck groups of five, so the leftover is 0-4 and nothing else.
  left: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  right: [0, 1, 2, 3, 4],
  // Counted out group by group rather than multiplied.
  applyIndependently: (a, b) => {
    let total = 0;
    for (let g = 0; g < a; g++) total += 5;
    return total + b;
  },
  contexts: [
    {
      noun: "tally marks",
      unit: "crates",
      story: (a, b) => `The shift tally shows ${a} complete struck groups of five and ${b} loose marks. How many crates is that?`
    },
    {
      noun: "barrel tallies",
      unit: "barrels",
      story: (a, b) => `A cooper's sheet records ${a} struck groups of five barrels and ${b} single marks. How many barrels were made?`
    }
  ]
};

const ADDITION: OperationSpec = {
  slug: "r1-addition",
  skillId: "skill.r1-addition",
  topicId: "t.r1-addition",
  objectiveId: "obj.r1-addition",
  symbol: "+",
  verb: "added to",
  apply: (a, b) => a + b,
  invalidReason: () => null,
  // Counted on one at a time from the larger number.
  applyIndependently: (a, b) => {
    let total = a;
    for (let i = 0; i < b; i++) total += 1;
    return total;
  },
  contexts: [
    {
      noun: "two landings",
      unit: "crates",
      story: (a, b) => `The morning landing was ${a} crates and the afternoon landing was ${b}. How many crates for the day?`
    },
    {
      noun: "two jetties",
      unit: "crates",
      story: (a, b) => `The north jetty holds ${a} crates and the south jetty holds ${b}. How many are on the quay altogether?`
    }
  ]
};

const SUBTRACTION: OperationSpec = {
  slug: "r1-subtraction",
  skillId: "skill.r1-subtraction",
  topicId: "t.r1-subtraction",
  objectiveId: "obj.r1-subtraction",
  symbol: "-",
  verb: "with this taken away:",
  apply: (a, b) => a - b,
  // Negative numbers are a later lesson, so a subtraction that crosses zero is
  // not a combination this topic may ask about yet.
  invalidReason: (a, b) => (a - b < 0 ? "the result would fall below zero, which this topic has not taught yet" : null),
  // Counted back one at a time.
  applyIndependently: (a, b) => {
    let total = a;
    for (let i = 0; i < b; i++) total -= 1;
    return total;
  },
  contexts: [
    {
      noun: "crates sold",
      unit: "crates",
      story: (a, b) => `The quay held ${a} crates and ${b} were sold before noon. How many are left?`
    },
    {
      noun: "two counts compared",
      unit: "crates",
      story: (a, b) => `The harbour logged ${a} crates in and ${b} crates out. How many more came in than went out?`
    }
  ]
};

const MULTIPLICATION: OperationSpec = {
  slug: "r1-multiplication",
  skillId: "skill.r1-multiplication",
  topicId: "t.r1-multiplication",
  objectiveId: "obj.r1-multiplication",
  symbol: "x",
  verb: "in equal groups of",
  apply: (a, b) => a * b,
  invalidReason: (a, b) => (a * b > 1000 ? "the product is larger than this topic's range" : null),
  // Repeated addition — what multiplication means, done the long way.
  applyIndependently: (a, b) => {
    let total = 0;
    for (let i = 0; i < b; i++) total += a;
    return total;
  },
  contexts: [
    {
      noun: "equal loads",
      unit: "crates",
      story: (a, b) => `Each of ${b} boats carries ${a} crates, and every boat is loaded the same. How many crates in total?`
    },
    {
      noun: "stacked pallets",
      unit: "crates",
      story: (a, b) => `A pallet holds ${a} crates and the quay has ${b} full pallets. How many crates are stacked?`
    }
  ]
};

const DIVISION: OperationSpec = {
  slug: "r1-division",
  skillId: "skill.r1-division",
  topicId: "t.r1-division",
  objectiveId: "obj.r1-division",
  symbol: "/",
  verb: "shared equally between",
  apply: (a, b) => a / b,
  // Remainders and fractions come later, so only exact shares are askable here.
  invalidReason: (a, b) =>
    b === 0 ? "nothing can be shared between zero parts" : a % b !== 0 ? "the share does not come out exactly, and remainders are a later lesson" : null,
  // Repeated subtraction: how many times does the divisor come out?
  applyIndependently: (a, b) => {
    if (b === 0) return Number.NaN;
    let left = a;
    let times = 0;
    while (left >= b) {
      left -= b;
      times += 1;
    }
    return left === 0 ? times : Number.NaN;
  },
  contexts: [
    {
      noun: "an equal share",
      unit: "crates",
      story: (a, b) => `A catch of ${a} crates is shared equally between ${b} boats. How many crates does each boat get?`
    },
    {
      noun: "coins shared",
      unit: "coins",
      story: (a, b) => `A payment of ${a} coins is split equally between ${b} crew members. How many coins each?`
    }
  ]
};

export const OPERATION_SPECS = [COUNTING, ADDITION, SUBTRACTION, MULTIPLICATION, DIVISION];

// --------------------------------------------------------------------------
// Module 2 — parts of a whole
//
// One part/whole pair, five different ways of writing it. The topic decides the
// form; the reasoning families are shared, because comparing two shares is the
// same act of thought whether they are written as fractions or as percentages.
// --------------------------------------------------------------------------

/** The share as a plain number, by division. Every form starts here. */
const share = (p: Part): number => Number((p.part / p.whole).toFixed(6));

/** The same share by repeated subtraction in thousandths — a different route. */
function shareIndependently(p: Part): number {
  let remaining = p.part * 1000;
  let thousandths = 0;
  while (remaining >= p.whole) {
    remaining -= p.whole;
    thousandths += 1;
  }
  return Number((thousandths / 1000).toFixed(6));
}

/** A terminating decimal printed with exactly the places it needs. */
const decimalText = (v: number): string =>
  v.toFixed(v === Math.round(v) ? 0 : (String(v).split(".")[1]?.length ?? 0));

const asFraction: Form = {
  value: share,
  valueIndependently: shareIndependently,
  interaction: "fraction-input",
  ask: "What fraction of the crates is that? You may answer as a fraction or a decimal.",
  render: fractionText,
  noun: "fraction",
  // Naming the part you were *not* asked about. The commonest fraction slip
  // there is, and the reason "what fraction is shaded" is asked so carefully.
  trap: {
    wrong: (p) => Number((1 - share(p)).toFixed(6)),
    option: "The empty bays were counted instead of the full ones",
    explain: (p) => `${p.part} of the ${p.whole} bays are full, so the fraction has to be built from the full ones.`
  },
  tolerance: 0.0005
};

const asDecimal: Form = {
  value: share,
  valueIndependently: shareIndependently,
  interaction: "numeric-input",
  ask: "Write that share as a decimal.",
  render: decimalText,
  noun: "decimal",
  // Place value, not arithmetic: the digits are right and the point is not.
  trap: {
    wrong: (p) => Number((share(p) / 10).toFixed(6)),
    option: "The decimal point is one place too far to the left",
    explain: () => "The digits are right but the value is ten times too small, so the point has slipped a place."
  },
  tolerance: 0.0005
};

const asPercentage: Form = {
  value: (p) => Number((share(p) * 100).toFixed(4)),
  valueIndependently: (p) => {
    // Scale to a hundred by repeated addition rather than by multiplying.
    let counted = 0;
    for (let i = 0; i < p.part; i++) counted += 100 / p.whole;
    return Number(counted.toFixed(4));
  },
  interaction: "percentage-input",
  ask: "What percentage of the crates is that? Answer on the 0-100 scale.",
  render: (v) => `${Number(v.toFixed(2))}%`,
  noun: "percentage",
  // Stopping one step early: the share is right, the scaling to a hundred never
  // happened, and a % sign was written on it anyway.
  trap: {
    wrong: share,
    option: "The share was left as a decimal and never scaled to a hundred",
    explain: () => "A percentage counts parts per hundred, so the decimal share still has to be multiplied by 100."
  },
  unit: "%",
  tolerance: 0.01
};

const asProportion: Form = {
  value: share,
  valueIndependently: shareIndependently,
  interaction: "numeric-input",
  ask: "What proportion of the crates is that? Answer between 0 and 1.",
  render: (v) => decimalText(v),
  noun: "proportion",
  // The mirror image of the percentage trap, which is why both topics need it.
  trap: {
    wrong: (p) => Number((share(p) * 100).toFixed(4)),
    option: "That is the percentage, not a proportion between 0 and 1",
    explain: () => "A proportion sits between 0 and 1; scaling it to a hundred turns it into a percentage instead."
  },
  tolerance: 0.0005
};

export const PARTS_TOPICS: ReadonlyArray<[PartsTopic, Form]> = [
  [{ slug: "r1-fractions", skillId: "skill.r1-fractions", topicId: "t.r1-fractions", objectiveId: "obj.r1-fractions" }, asFraction],
  [{ slug: "r1-decimals", skillId: "skill.r1-decimals", topicId: "t.r1-decimals", objectiveId: "obj.r1-decimals" }, asDecimal],
  [{ slug: "r1-percentages", skillId: "skill.r1-percentages", topicId: "t.r1-percentages", objectiveId: "obj.r1-percentages" }, asPercentage],
  [{ slug: "r1-proportions", skillId: "skill.r1-proportions", topicId: "t.r1-proportions", objectiveId: "obj.r1-proportions" }, asProportion]
];

export function allGeneratorFamilies(): GeneratorFamily[] {
  return [
    ...OPERATION_SPECS.flatMap(arithmeticFamilies),
    ...PARTS_TOPICS.flatMap(([topic, form]) => partsFamilies(topic, form)),
    ...ratioFamilies(),
    ...positionFamilies(),
    ...dataFamilies(),
    ...countsFamilies(),
    ...centreFamilies(),
    ...spreadFamilies()
  ];
}
