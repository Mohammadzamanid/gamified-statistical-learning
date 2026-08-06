/**
 * Every generator family the app ships.
 *
 * The list is flat and explicit so the coverage report can compare it against
 * the curriculum's topic list and name the topics that have no generator — which
 * `STAGE2_RECONSTRUCTION_SCOPE.md` §4 requires to be reported as failures rather
 * than quietly omitted.
 */
import { arithmeticFamilies, type OperationSpec } from "./arithmetic";
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

export function allGeneratorFamilies(): GeneratorFamily[] {
  return OPERATION_SPECS.flatMap(arithmeticFamilies);
}
