/**
 * Generator families for Region 2's spread module: range, quartiles,
 * percentiles, interquartile range, variance and standard deviation.
 *
 * The third module to follow D-058's pattern, and it reuses `centre.ts`'s
 * corpus outright rather than inventing lists of its own. The same catch list
 * has a mean and a range, a median and quartiles; two corpora would be two
 * things to keep true, and the questions differ anyway because what is asked
 * differs.
 *
 * **Two conventions matter here and both are the taught ones.** Quartiles are
 * the median of each half (D-045), not the interpolated R-7 figures a
 * spreadsheet gives. Variance averages the squared distances — the *population*
 * denominator — because that is what `l.r2-variance` teaches, and the
 * laboratory was corrected to match in the same cycle (D-060). A generator
 * answering by the other convention would mark a learner wrong for doing
 * exactly what the lesson said.
 *
 * As in `centre.ts`, every answer is reached twice by different routes and the
 * validator rejects the candidate when they disagree (D-020), with the
 * arithmetic itself pinned to hand-worked values in the tests (D-059).
 */
import type { Question } from "../../shared/schemas";
import type { RawResponse } from "../../core/questions/types";
import type { Candidate, GeneratorFamily } from "../../core/generation/types";
import { LISTS, meanOf, type CatchList } from "./centre";

const numeric = (value: number): RawResponse => ({ kind: "numeric", text: String(value) });
const choose = (id: string): RawResponse => ({ kind: "choice", choiceIds: [id] });

function baseOf(
  topicId: string,
  objectiveId: string,
  skillId: string,
  difficulty: 1 | 2 | 3 | 4 | 5
): Pick<Question, "topicId" | "objectiveId" | "skillIds" | "difficulty"> {
  return { topicId, objectiveId, skillIds: [skillId], difficulty };
}

const round4 = (n: number): number => Number(n.toFixed(4));
const round2 = (n: number): number => Number(n.toFixed(2));

const listText = (list: CatchList): string => list.values.join(", ");
const listSentence = (list: CatchList): string =>
  `${list.boat} logged ${list.values.length} figures over ${list.occasion}: ${listText(list)} ${list.unit}.`;
const sortedOf = (list: CatchList): number[] => [...list.values].sort((a, b) => a - b);

// --- Route A --------------------------------------------------------------

export function rangeOf(values: readonly number[]): number {
  return Math.max(...values) - Math.min(...values);
}

function medianOfSorted(sorted: readonly number[]): number {
  const n = sorted.length;
  return n % 2 === 1 ? sorted[(n - 1) / 2]! : round4((sorted[n / 2 - 1]! + sorted[n / 2]!) / 2);
}

/** Quartiles by the median of each half — the convention the lessons teach. */
export function quartilesOf(values: readonly number[]): { q1: number; q2: number; q3: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const lower = sorted.slice(0, Math.floor(n / 2));
  const upper = sorted.slice(Math.ceil(n / 2));
  return { q1: medianOfSorted(lower), q2: medianOfSorted(sorted), q3: medianOfSorted(upper) };
}

/** The population variance: the average of the squared distances (D-060). */
export function varianceOf(values: readonly number[]): number {
  const m = meanOf(values);
  let squares = 0;
  for (const v of values) squares += (v - m) ** 2;
  return round4(squares / values.length);
}

// --- Route B --------------------------------------------------------------

/** The range by walking the list once, keeping the extremes as it goes. */
export function rangeByWalking(values: readonly number[]): number {
  let lo = values[0]!;
  let hi = values[0]!;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return hi - lo;
}

/**
 * The variance from the mean of the squares minus the square of the mean.
 * Algebraically the same quantity, arithmetically a different route.
 */
export function varianceByMomentDifference(values: readonly number[]): number {
  let sum = 0;
  let sumOfSquares = 0;
  for (const v of values) {
    sum += v;
    sumOfSquares += v * v;
  }
  const n = values.length;
  return round4(sumOfSquares / n - (sum / n) ** 2);
}

const RANGE = { skill: "skill.range", topic: "t.spread", objective: "obj.compute-range" };
const QUARTILES = { skill: "skill.r2-quartiles", topic: "t.r2-quartiles", objective: "obj.r2-quartiles" };
const PERCENTILES = { skill: "skill.r2-percentiles", topic: "t.r2-percentiles", objective: "obj.r2-percentiles" };
const IQR = { skill: "skill.r2-iqr", topic: "t.r2-iqr", objective: "obj.r2-iqr" };
const VARIANCE = { skill: "skill.r2-variance", topic: "t.r2-variance", objective: "obj.r2-variance" };
const SD = { skill: "skill.r2-standard-deviation", topic: "t.r2-standard-deviation", objective: "obj.r2-standard-deviation" };

// --------------------------------------------------------------------------
// Range
// --------------------------------------------------------------------------

function rangeCalculationFamily(): GeneratorFamily {
  return {
    id: "gen.r2-range.calculation",
    topicId: RANGE.topic,
    skillIds: [RANGE.skill],
    reasoningFamily: "calculation",
    description: "Take the range as largest minus smallest.",
    enumerate: () =>
      LISTS.map((list): Candidate => ({
        key: list.id,
        invalidReason: rangeOf(list.values) === 0 ? "every figure is identical, so the range is zero and teaches nothing" : null,
        expectedResponse: () => numeric(rangeByWalking(list.values)),
        build: () => ({
          ...baseOf(RANGE.topic, RANGE.objective, RANGE.skill, 1),
          id: `q.gen.r2-range.compute.${list.id}`,
          estimatedSeconds: 45,
          accessibilityDescription: `A log of ${list.values.length} figures: ${listText(list)}. Enter the range.`,
          interaction: "numeric-input",
          prompt: `${listSentence(list)} What is the range?`,
          answer: { kind: "numeric", value: rangeOf(list.values), tolerance: 0, unit: list.unit },
          explanation:
            `The largest figure is ${Math.max(...list.values)} and the smallest is ${Math.min(...list.values)}, so ` +
            `the range is ${Math.max(...list.values)} - ${Math.min(...list.values)} = ${rangeOf(list.values)}. ` +
            `It uses only those two figures, which is its weakness as well as its speed.`
        })
      }))
  };
}

/** What one extreme figure does to the range, against what it does to the IQR. */
function rangeFragilityFamily(): GeneratorFamily {
  return {
    id: "gen.r2-range.prediction",
    topicId: RANGE.topic,
    skillIds: [RANGE.skill],
    reasoningFamily: "prediction",
    description: "Say what one far-off figure does to the range.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const far = Math.max(...list.values) * 3;
        return {
          key: `${list.id}-far`,
          invalidReason: null,
          expectedResponse: () => choose("ch.range"),
          build: () => ({
            ...baseOf(RANGE.topic, RANGE.objective, RANGE.skill, 2),
            id: `q.gen.r2-range.fragile.${list.id}`,
            estimatedSeconds: 60,
            accessibilityDescription:
              `A log gains one figure of ${far}. Choose which measure of spread moves most.`,
            interaction: "multiple-choice",
            prompt:
              `${listSentence(list)} One more reading of ${far} ${list.unit} is added. Which measure of spread ` +
              `changes the most?`,
            choices: [
              { id: "ch.range", text: "The range" },
              { id: "ch.iqr", text: "The interquartile range" },
              { id: "ch.neither", text: "Neither — both use every figure equally" }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.range"] },
            explanation:
              `The range is built from the two extremes alone, so a new largest figure moves it from ` +
              `${rangeOf(list.values)} to ${rangeOf([...list.values, far])} at a stroke. The interquartile range ` +
              `looks at the middle half, where nothing has happened.`
          })
        };
      })
  };
}

// --------------------------------------------------------------------------
// Quartiles and IQR
// --------------------------------------------------------------------------

function quartileFamily(which: "q1" | "q3"): GeneratorFamily {
  const label = which === "q1" ? "first quartile" : "third quartile";
  return {
    id: `gen.r2-quartiles.calculation-${which}`,
    topicId: QUARTILES.topic,
    skillIds: [QUARTILES.skill],
    reasoningFamily: which === "q1" ? "calculation" : "multi-step-reasoning",
    description: `Find the ${label} as the median of its half.`,
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const q = quartilesOf(list.values);
        return {
          key: `${list.id}-${which}`,
          invalidReason:
            list.values.length < 5 ? "too few figures for the halves to be worth taking a median of" : null,
          expectedResponse: () => {
            // Independent route: count in from the correct end rather than
            // slicing the sorted array.
            const sorted = sortedOf(list);
            const half = which === "q1" ? sorted.slice(0, Math.floor(sorted.length / 2)) : sorted.slice(Math.ceil(sorted.length / 2));
            const peeled = [...half];
            while (peeled.length > 2) {
              peeled.splice(peeled.indexOf(Math.min(...peeled)), 1);
              peeled.splice(peeled.indexOf(Math.max(...peeled)), 1);
            }
            return numeric(peeled.length === 1 ? peeled[0]! : round4((peeled[0]! + peeled[1]!) / 2));
          },
          build: () => ({
            ...baseOf(QUARTILES.topic, QUARTILES.objective, QUARTILES.skill, 3),
            id: `q.gen.r2-quartiles.${which}.${list.id}`,
            estimatedSeconds: 90,
            accessibilityDescription: `A log of ${list.values.length} figures: ${listText(list)}. Enter the ${label}.`,
            interaction: "numeric-input",
            prompt:
              `${listSentence(list)} Put them in order, split the list at the median, and take the median of the ` +
              `${which === "q1" ? "lower" : "upper"} half. What is the ${label}?`,
            answer: { kind: "numeric", value: q[which], tolerance: 0.01, unit: list.unit },
            explanation:
              `In order: ${sortedOf(list).join(", ")}. The median is ${q.q2}, and the ${label} is the median of the ` +
              `${which === "q1" ? "lower" : "upper"} half: ${q[which]}. With an odd count the middle figure belongs ` +
              `to neither half — that is the convention these lessons use, and a spreadsheet may answer differently.`
          })
        };
      })
  };
}

function iqrFamily(): GeneratorFamily {
  return {
    id: "gen.r2-iqr.multi-step",
    topicId: IQR.topic,
    skillIds: [IQR.skill],
    reasoningFamily: "multi-step-reasoning",
    description: "Both quartiles, then the width between them.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const q = quartilesOf(list.values);
        return {
          key: list.id,
          invalidReason:
            list.values.length < 5
              ? "too few figures for the halves to be worth taking a median of"
              : q.q3 === q.q1
                ? "the middle half has no width here, so there is nothing to measure"
                : null,
          expectedResponse: () => numeric(round4(quartilesOf(list.values).q3 - quartilesOf(list.values).q1)),
          build: () => ({
            ...baseOf(IQR.topic, IQR.objective, IQR.skill, 3),
            id: `q.gen.r2-iqr.compute.${list.id}`,
            misconceptionIds: ["mc.iqr-uses-the-extremes"],
            parameters: { "mc.iqr-uses-the-extremes": { wrongValue: rangeOf(list.values) } },
            estimatedSeconds: 100,
            accessibilityDescription:
              `A log of ${list.values.length} figures: ${listText(list)}. Enter the interquartile range.`,
            interaction: "numeric-input",
            prompt: `${listSentence(list)} What is the interquartile range?`,
            answer: { kind: "numeric", value: round4(q.q3 - q.q1), tolerance: 0.01, unit: list.unit },
            explanation:
              `In order: ${sortedOf(list).join(", ")}. The first quartile is ${q.q1} and the third is ${q.q3}, so ` +
              `the interquartile range is ${q.q3} - ${q.q1} = ${round4(q.q3 - q.q1)}. The range, which uses the two ` +
              `extremes instead, is ${rangeOf(list.values)} — a different measure of a different thing.`
          })
        };
      })
  };
}

function iqrComparisonFamily(): GeneratorFamily {
  return {
    id: "gen.r2-iqr.comparison",
    topicId: IQR.topic,
    skillIds: [IQR.skill],
    reasoningFamily: "comparison",
    description: "Compare two logs' middle halves.",
    enumerate: () =>
      LISTS.flatMap((a, i) =>
        LISTS.slice(i + 1).map((b): Candidate => {
          const ia = round4(quartilesOf(a.values).q3 - quartilesOf(a.values).q1);
          const ib = round4(quartilesOf(b.values).q3 - quartilesOf(b.values).q1);
          return {
            key: `${a.id}-vs-${b.id}`,
            invalidReason: ia === ib ? "the two middle halves are the same width" : null,
            expectedResponse: () => choose(ia > ib ? "ch.a" : "ch.b"),
            build: () => ({
              ...baseOf(IQR.topic, IQR.objective, IQR.skill, 3),
              id: `q.gen.r2-iqr.compare.${a.id}-${b.id}`,
              estimatedSeconds: 90,
              accessibilityDescription:
                `Two logs: ${a.boat} ${listText(a)}, ${b.boat} ${listText(b)}. Choose the wider middle half.`,
              interaction: "multiple-choice",
              prompt:
                `${a.boat} logged ${listText(a)} ${a.unit}. ${b.boat} logged ${listText(b)} ${b.unit}. ` +
                `Whose middle half is wider?`,
              choices: [
                { id: "ch.a", text: a.boat },
                { id: "ch.b", text: b.boat },
                { id: "ch.same", text: "The two are equally wide" }
              ],
              answer: { kind: "choice", correctChoiceIds: [ia > ib ? "ch.a" : "ch.b"] },
              explanation:
                `${a.boat}'s middle half spans ${ia} and ${b.boat}'s spans ${ib}, so ${ia > ib ? a.boat : b.boat} ` +
                `is the more variable through its middle. Neither answer depends on the extremes.`
            })
          };
        })
      )
  };
}

// --------------------------------------------------------------------------
// Percentiles
// --------------------------------------------------------------------------

/** What percentile a value stands at, from the count at or below it. */
function percentileFamily(): GeneratorFamily {
  return {
    id: "gen.r2-percentiles.calculation",
    topicId: PERCENTILES.topic,
    skillIds: [PERCENTILES.skill],
    reasoningFamily: "calculation",
    description: "Turn a count at or below a figure into a percentile.",
    enumerate: () =>
      LISTS.flatMap((list) =>
        [...new Set(list.values)].map((value): Candidate => {
          const atOrBelow = list.values.filter((v) => v <= value).length;
          const percentile = round4((atOrBelow / list.values.length) * 100);
          return {
            key: `${list.id}-${value}`,
            invalidReason:
              !Number.isInteger(percentile * 100)
                ? "the percentile does not land on a hundredth, so it cannot be typed exactly"
                : percentile === 100
                  ? "the largest figure stands at the hundredth percentile, which is true of every log and teaches nothing"
                  : null,
            expectedResponse: () => {
              let count = 0;
              for (const v of list.values) if (v <= value) count += 1;
              return numeric(round4((count / list.values.length) * 100));
            },
            build: () => ({
              ...baseOf(PERCENTILES.topic, PERCENTILES.objective, PERCENTILES.skill, 3),
              id: `q.gen.r2-percentiles.standing.${list.id}-${value}`,
              // Declared only where reading the log from the wrong end gives a
              // *different* number. At the 50th percentile the two coincide, so
              // the declared "mistake" would be the right answer and the
              // diagnosis would fire on it. Conditional rather than rejected:
              // the question is sound, it just has no trap.
              ...(round4(((list.values.length - atOrBelow) / list.values.length) * 100) !== percentile
                ? {
                    misconceptionIds: ["mc.percentile-counts-above"],
                    parameters: {
                      "mc.percentile-counts-above": {
                        wrongValue: round4(((list.values.length - atOrBelow) / list.values.length) * 100)
                      }
                    }
                  }
                : {}),
              estimatedSeconds: 80,
              accessibilityDescription:
                `A log of ${list.values.length} figures with ${atOrBelow} at or below ${value}. ` +
                `Enter the percentile that figure stands at.`,
              interaction: "numeric-input",
              prompt:
                `${listSentence(list)} ${atOrBelow} of the ${list.values.length} readings are ${value} ${list.unit} ` +
                `or less. What percentile does ${value} stand at?`,
              answer: { kind: "numeric", value: percentile, tolerance: 0.01, unit: "th percentile" },
              explanation:
                `${atOrBelow} out of ${list.values.length} is ${percentile}%, so ${value} stands at the ` +
                `${percentile}th percentile. Counting the readings *above* instead gives ` +
                `${round4(((list.values.length - atOrBelow) / list.values.length) * 100)}, which is the same log ` +
                `read from the wrong end.`
            })
          };
        })
      )
  };
}

/** The quartiles named as percentiles. */
function percentileRecognitionFamily(): GeneratorFamily {
  const NAMED: ReadonlyArray<{ id: string; percentile: number; name: string }> = [
    { id: "q1", percentile: 25, name: "the first quartile" },
    { id: "q2", percentile: 50, name: "the median" },
    { id: "q3", percentile: 75, name: "the third quartile" }
  ];
  return {
    id: "gen.r2-percentiles.recognition",
    topicId: PERCENTILES.topic,
    skillIds: [PERCENTILES.skill],
    reasoningFamily: "recognition",
    description: "Name the quartile a percentile is another word for.",
    enumerate: () =>
      LISTS.flatMap((list) =>
        NAMED.map((named): Candidate => ({
          key: `${list.id}-${named.id}`,
          invalidReason: null,
          expectedResponse: () => choose(`ch.${named.id}`),
          build: () => ({
            ...baseOf(PERCENTILES.topic, PERCENTILES.objective, PERCENTILES.skill, 2),
            id: `q.gen.r2-percentiles.name.${list.id}-${named.id}`,
            estimatedSeconds: 45,
            accessibilityDescription: `Which quartile is the ${named.percentile}th percentile another name for?`,
            interaction: "multiple-choice",
            prompt:
              `${list.boat}'s soundings are described by percentiles. The ${named.percentile}th percentile of that ` +
              `log is another name for what?`,
            choices: [
              { id: "ch.q1", text: "The first quartile" },
              { id: "ch.q2", text: "The median" },
              { id: "ch.q3", text: "The third quartile" }
            ],
            answer: { kind: "choice", correctChoiceIds: [`ch.${named.id}`] },
            explanation:
              `Quartiles cut the ordered log into four equal parts, so the ${named.percentile}th percentile is ` +
              `${named.name}. Percentiles are the same idea cut a hundred ways instead of four.`
          })
        }))
      )
  };
}

// --------------------------------------------------------------------------
// Variance and standard deviation
// --------------------------------------------------------------------------

function varianceFamily(): GeneratorFamily {
  return {
    id: "gen.r2-variance.calculation",
    topicId: VARIANCE.topic,
    skillIds: [VARIANCE.skill],
    reasoningFamily: "calculation",
    description: "Average the squared distances from the mean.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const mean = meanOf(list.values);
        const value = varianceOf(list.values);
        return {
          key: list.id,
          invalidReason:
            !Number.isInteger(mean * 100)
              ? "the mean does not land on a hundredth, so the squared distances cannot be worked by hand"
              : !Number.isInteger(value * 100)
                ? "the variance does not land on a hundredth, so it cannot be typed exactly"
                : null,
          expectedResponse: () => numeric(varianceByMomentDifference(list.values)),
          build: () => ({
            ...baseOf(VARIANCE.topic, VARIANCE.objective, VARIANCE.skill, 4),
            id: `q.gen.r2-variance.compute.${list.id}`,
            // The mistake the lesson names: averaging the raw distances, which
            // cancel to zero by construction. `known-wrong-answer` on a numeric
            // question means declaring the value under `parameters` (D-025).
            misconceptionIds: ["mc.distances-average-to-spread"],
            parameters: { "mc.distances-average-to-spread": { wrongValue: 0 } },
            estimatedSeconds: 140,
            accessibilityDescription:
              `A log of ${list.values.length} figures with mean ${mean}. Enter the variance.`,
            interaction: "numeric-input",
            prompt:
              `${listSentence(list)} Its mean is ${mean}. Square each figure's distance from the mean, then average ` +
              `those squares. What is the variance?`,
            answer: { kind: "numeric", value, tolerance: 0.01, unit: `squared ${list.unit}` },
            explanation:
              `The distances from ${mean} are ${list.values.map((v) => round2(v - mean)).join(", ")}. Squared and ` +
              `averaged over all ${list.values.length}, they give ${value} squared ${list.unit}. Averaging the raw ` +
              `distances would give zero, every time, which is why the squaring is there.`
          })
        };
      })
  };
}

function standardDeviationFamily(): GeneratorFamily {
  return {
    id: "gen.r2-standard-deviation.calculation",
    topicId: SD.topic,
    skillIds: [SD.skill],
    reasoningFamily: "calculation",
    description: "Take the root of a variance to get back on the data's scale.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const v = varianceOf(list.values);
        const sd = round2(Math.sqrt(v));
        return {
          key: list.id,
          invalidReason: v === 0 ? "a variance of zero makes the root trivial" : null,
          expectedResponse: () => numeric(round2(Math.sqrt(varianceByMomentDifference(list.values)))),
          build: () => ({
            ...baseOf(SD.topic, SD.objective, SD.skill, 3),
            id: `q.gen.r2-standard-deviation.compute.${list.id}`,
            estimatedSeconds: 70,
            accessibilityDescription:
              `A log with a variance of ${v} squared ${list.unit}. Enter the standard deviation to two decimal places.`,
            interaction: "numeric-input",
            prompt:
              `${list.boat}'s log has a variance of ${v} squared ${list.unit}. What is its standard deviation, in ` +
              `${list.unit}, to two decimal places?`,
            answer: { kind: "numeric", value: sd, tolerance: 0.01, unit: list.unit },
            explanation:
              `The standard deviation is the square root of the variance: √${v} = ${sd} ${list.unit}. Taking the ` +
              `root undoes the squaring, which is what puts the figure back on the scale of the readings — ` +
              `${list.unit}, not squared ${list.unit}.`
          })
        };
      })
  };
}

/** Which of two logs is the more variable, by standard deviation. */
function standardDeviationComparisonFamily(): GeneratorFamily {
  return {
    id: "gen.r2-standard-deviation.comparison",
    topicId: SD.topic,
    skillIds: [SD.skill],
    reasoningFamily: "comparison",
    description: "Compare two logs by how far their readings sit from their means.",
    enumerate: () =>
      LISTS.flatMap((a, i) =>
        LISTS.slice(i + 1).map((b): Candidate => {
          const sa = round2(Math.sqrt(varianceOf(a.values)));
          const sb = round2(Math.sqrt(varianceOf(b.values)));
          return {
            key: `${a.id}-vs-${b.id}`,
            invalidReason: sa === sb ? "the two standard deviations agree to two places" : null,
            expectedResponse: () => choose(sa > sb ? "ch.a" : "ch.b"),
            build: () => ({
              ...baseOf(SD.topic, SD.objective, SD.skill, 3),
              id: `q.gen.r2-standard-deviation.compare.${a.id}-${b.id}`,
              estimatedSeconds: 70,
              accessibilityDescription:
                `Two logs with standard deviations ${sa} and ${sb}. Choose the more variable.`,
              interaction: "multiple-choice",
              prompt:
                `${a.boat}'s standard deviation is ${sa} ${a.unit} and ${b.boat}'s is ${sb} ${b.unit}. ` +
                `Which boat's catches sat further from their own average?`,
              choices: [
                { id: "ch.a", text: a.boat },
                { id: "ch.b", text: b.boat },
                { id: "ch.same", text: "The same — a standard deviation says nothing about that" }
              ],
              answer: { kind: "choice", correctChoiceIds: [sa > sb ? "ch.a" : "ch.b"] },
              explanation:
                `A standard deviation is a typical distance from the mean, in the data's own units, so the larger ` +
                `figure — ${Math.max(sa, sb)} — belongs to the more variable log. It says nothing about which boat ` +
                `landed more.`
            })
          };
        })
      )
  };
}

/** The units the variance leaves behind. */
function varianceUnitsFamily(): GeneratorFamily {
  return {
    id: "gen.r2-variance.recognition",
    topicId: VARIANCE.topic,
    skillIds: [VARIANCE.skill],
    reasoningFamily: "recognition",
    description: "Name the units a variance is measured in.",
    enumerate: () =>
      LISTS.map((list): Candidate => ({
        key: `${list.id}-units`,
        invalidReason: null,
        expectedResponse: () => choose("ch.squared"),
        build: () => ({
          ...baseOf(VARIANCE.topic, VARIANCE.objective, VARIANCE.skill, 2),
          id: `q.gen.r2-variance.units.${list.id}`,
          estimatedSeconds: 45,
          accessibilityDescription: `Choose the units a variance of a log measured in ${list.unit} is expressed in.`,
          interaction: "multiple-choice",
          prompt:
            `${list.boat}'s catches are measured in ${list.unit}. What are the units of their variance?`,
          choices: [
            { id: "ch.squared", text: `Squared ${list.unit}` },
            { id: "ch.same", text: list.unit.charAt(0).toUpperCase() + list.unit.slice(1) },
            { id: "ch.none", text: "A variance has no units" }
          ],
          answer: { kind: "choice", correctChoiceIds: ["ch.squared"] },
          explanation:
            `Each distance is measured in ${list.unit}, and squaring a distance squares its units too, so the ` +
            `variance is in squared ${list.unit}. That is why it is a working number rather than a reportable one, ` +
            `and why the standard deviation exists.`
        })
      }))
  };
}

/** A report quoting a variance as though it were on the data's scale. */
function varianceErrorFamily(): GeneratorFamily {
  return {
    id: "gen.r2-variance.error-identification",
    topicId: VARIANCE.topic,
    skillIds: [VARIANCE.skill],
    reasoningFamily: "error-identification",
    description: "Find what is wrong with a variance quoted in the data's own units.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const v = varianceOf(list.values);
        return {
          key: `${list.id}-units-error`,
          invalidReason: v === 0 ? "a variance of zero makes the point invisible" : null,
          expectedResponse: () => choose("ch.units"),
          build: () => ({
            ...baseOf(VARIANCE.topic, VARIANCE.objective, VARIANCE.skill, 3),
            id: `q.gen.r2-variance.error.${list.id}`,
            estimatedSeconds: 65,
            accessibilityDescription:
              `A report says catches varied by ${v} ${list.unit}, quoting the variance. Choose what is wrong.`,
            interaction: "error-identification",
            prompt:
              `${list.boat}'s variance is ${v}. A report writes: "Catches varied by about ${v} ${list.unit}." ` +
              `What is wrong with that sentence?`,
            choices: [
              {
                id: "ch.units",
                text: `The variance is in squared ${list.unit}; the figure on the data's own scale is the standard deviation, ${round2(Math.sqrt(v))}`
              },
              { id: "ch.value", text: "The variance has been calculated incorrectly" },
              { id: "ch.fine", text: "Nothing is wrong with it" }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.units"] },
            explanation:
              `The arithmetic is right and the sentence is still wrong: ${v} is in squared ${list.unit}, which ` +
              `nobody can picture beside a catch. Its root, ${round2(Math.sqrt(v))} ${list.unit}, is the figure that ` +
              `belongs in that sentence.`
          })
        };
      })
  };
}

/**
 * A pairwise comparison, parameterised by the measure being compared.
 *
 * Four topics need a comparison family and all four differ only in which number
 * is read off each log, so one builder serves them rather than four near-copies.
 */
function comparisonFamily(spec: {
  id: string;
  topic: { skill: string; topic: string; objective: string };
  noun: string;
  question: string;
  of: (values: readonly number[]) => number;
  independently: (values: readonly number[]) => number;
  note: string;
}): GeneratorFamily {
  return {
    id: spec.id,
    topicId: spec.topic.topic,
    skillIds: [spec.topic.skill],
    reasoningFamily: "comparison",
    description: `Compare two logs by their ${spec.noun}.`,
    enumerate: () =>
      LISTS.flatMap((a, i) =>
        LISTS.slice(i + 1).map((b): Candidate => {
          const va = spec.of(a.values);
          const vb = spec.of(b.values);
          return {
            key: `${a.id}-vs-${b.id}`,
            invalidReason: va === vb ? `the two ${spec.noun}s are equal, so there is no greater one` : null,
            expectedResponse: () =>
              choose(spec.independently(a.values) > spec.independently(b.values) ? "ch.a" : "ch.b"),
            build: () => ({
              ...baseOf(spec.topic.topic, spec.topic.objective, spec.topic.skill, 3),
              id: `${spec.id}.${a.id}-${b.id}`.replace("gen.", "q.gen."),
              estimatedSeconds: 80,
              accessibilityDescription:
                `Two logs: ${a.boat} ${listText(a)}, ${b.boat} ${listText(b)}. Choose the greater ${spec.noun}.`,
              interaction: "multiple-choice",
              prompt:
                `${a.boat} logged ${listText(a)} ${a.unit}. ${b.boat} logged ${listText(b)} ${b.unit}. ` +
                `${spec.question}`,
              choices: [
                { id: "ch.a", text: a.boat },
                { id: "ch.b", text: b.boat },
                { id: "ch.same", text: `Their ${spec.noun}s are the same` }
              ],
              answer: { kind: "choice", correctChoiceIds: [va > vb ? "ch.a" : "ch.b"] },
              explanation:
                `${a.boat}'s ${spec.noun} is ${va} and ${b.boat}'s is ${vb}. ${spec.note}`
            })
          };
        })
      )
  };
}

/** A single-answer recognition question, parameterised by its claim. */
function recognitionFamily(spec: {
  id: string;
  topic: { skill: string; topic: string; objective: string };
  reasoning: "recognition" | "prediction" | "error-identification" | "real-world-application";
  description: string;
  ask: (list: CatchList) => string;
  choices: ReadonlyArray<{ id: string; text: string }>;
  correct: string;
  explain: (list: CatchList) => string;
}): GeneratorFamily {
  return {
    id: spec.id,
    topicId: spec.topic.topic,
    skillIds: [spec.topic.skill],
    reasoningFamily: spec.reasoning,
    description: spec.description,
    enumerate: () =>
      LISTS.map((list): Candidate => ({
        key: list.id,
        invalidReason: null,
        expectedResponse: () => choose(spec.correct),
        build: () => ({
          ...baseOf(spec.topic.topic, spec.topic.objective, spec.topic.skill, 2),
          id: `${spec.id}.${list.id}`.replace("gen.", "q.gen."),
          estimatedSeconds: 50,
          accessibilityDescription: spec.ask(list),
          interaction: "multiple-choice",
          prompt: spec.ask(list),
          choices: [...spec.choices],
          answer: { kind: "choice", correctChoiceIds: [spec.correct] },
          explanation: spec.explain(list)
        })
      }))
  };
}

export function spreadFamilies(): GeneratorFamily[] {
  return [
    rangeCalculationFamily(),
    rangeFragilityFamily(),
    quartileFamily("q1"),
    quartileFamily("q3"),
    iqrFamily(),
    iqrComparisonFamily(),
    percentileFamily(),
    percentileRecognitionFamily(),
    varianceFamily(),
    varianceUnitsFamily(),
    varianceErrorFamily(),
    standardDeviationFamily(),
    standardDeviationComparisonFamily(),

    // The comparison families four topics need, from one builder.
    comparisonFamily({
      id: "gen.r2-range.comparison",
      topic: RANGE,
      noun: "range",
      question: "Which log has the greater range?",
      of: rangeOf,
      independently: rangeByWalking,
      note: "The range answers only from the two extremes, so most of each log plays no part in this comparison."
    }),
    comparisonFamily({
      id: "gen.r2-quartiles.comparison",
      topic: QUARTILES,
      noun: "third quartile",
      question: "Which log has the higher third quartile?",
      of: (v) => quartilesOf(v).q3,
      independently: (v) => quartilesOf([...v].reverse()).q3,
      note: "The third quartile is the median of the upper half, so it reports where the top quarter begins."
    }),
    comparisonFamily({
      id: "gen.r2-percentiles.comparison",
      topic: PERCENTILES,
      noun: "median as a percentile standing",
      question: "Whose median figure is the larger?",
      of: (v) => quartilesOf(v).q2,
      independently: (v) => quartilesOf([...v].reverse()).q2,
      note: "The median is the 50th percentile of its own log, which is what makes the two logs comparable at all."
    }),
    comparisonFamily({
      id: "gen.r2-variance.comparison",
      topic: VARIANCE,
      noun: "variance",
      question: "Which log has the greater variance?",
      of: varianceOf,
      independently: varianceByMomentDifference,
      note: "A variance is in squared units, so it compares spreads but is not a figure to quote beside a catch."
    }),

    // The remaining reasoning families, from the other builder.
    recognitionFamily({
      id: "gen.r2-range.error-identification",
      topic: RANGE,
      reasoning: "error-identification",
      description: "Find what a clerk reported instead of the range.",
      ask: (list) =>
        `${listSentence(list)} A clerk writes: "The range is ${Math.max(...list.values)}." What has the clerk done?`,
      choices: [
        { id: "ch.largest", text: "Reported the largest figure instead of the distance between the extremes" },
        { id: "ch.smallest", text: "Reported the smallest figure" },
        { id: "ch.fine", text: "Nothing — that is the range" }
      ],
      correct: "ch.largest",
      explain: (list) =>
        `The range is a distance: ${Math.max(...list.values)} - ${Math.min(...list.values)} = ` +
        `${rangeOf(list.values)}. The clerk has reported one end of it.`
    }),
    recognitionFamily({
      id: "gen.r2-quartiles.recognition",
      topic: QUARTILES,
      reasoning: "recognition",
      description: "Say what fraction of a log lies below the first quartile.",
      ask: (list) =>
        `${list.boat}'s log is cut at its quartiles. What fraction of the readings lies below the first quartile?`,
      choices: [
        { id: "ch.quarter", text: "About a quarter" },
        { id: "ch.half", text: "About half" },
        { id: "ch.three", text: "About three quarters" }
      ],
      correct: "ch.quarter",
      explain: () =>
        "Quartiles cut the ordered log into four parts of equal size, so about a quarter of the readings fall below " +
        "the first quartile and about three quarters above it."
    }),
    recognitionFamily({
      id: "gen.r2-iqr.recognition",
      topic: IQR,
      reasoning: "recognition",
      description: "Say which part of a log the interquartile range describes.",
      ask: (list) => `${list.boat}'s interquartile range is quoted in a report. What does it describe?`,
      choices: [
        { id: "ch.middle", text: "The width of the middle half of the readings" },
        { id: "ch.all", text: "The distance from the smallest reading to the largest" },
        { id: "ch.typical", text: "The typical reading" }
      ],
      correct: "ch.middle",
      explain: () =>
        "It is the distance from the first quartile to the third, so it spans the middle half and ignores the outer " +
        "quarters entirely. That is exactly why one extreme reading barely moves it."
    }),
    recognitionFamily({
      id: "gen.r2-iqr.error-identification",
      topic: IQR,
      reasoning: "error-identification",
      description: "Find an interquartile range computed from the extremes.",
      ask: (list) =>
        `${listSentence(list)} A clerk writes: "The interquartile range is ${rangeOf(list.values)}." ` +
        `What has the clerk done?`,
      choices: [
        { id: "ch.extremes", text: "Used the smallest and largest readings, which is the range rather than the interquartile range" },
        { id: "ch.median", text: "Used the median twice" },
        { id: "ch.fine", text: "Nothing — that is the interquartile range" }
      ],
      correct: "ch.extremes",
      explain: (list) => {
        const q = quartilesOf(list.values);
        return (
          `${rangeOf(list.values)} is the range. The interquartile range runs from the first quartile ${q.q1} to ` +
          `the third ${q.q3}, so it is ${round4(q.q3 - q.q1)} — a measure of the middle, not of the extremes.`
        );
      }
    }),
    recognitionFamily({
      id: "gen.r2-percentiles.multi-step",
      topic: PERCENTILES,
      reasoning: "prediction",
      description: "Say how the percentile standing changes when a larger reading joins.",
      ask: (list) =>
        `${listSentence(list)} A reading larger than every one of them is added. What happens to the percentile ` +
        `standing of the log's smallest figure?`,
      choices: [
        { id: "ch.down", text: "It falls, because the same count now sits at or below it out of a longer log" },
        { id: "ch.up", text: "It rises, because the log now reaches higher" },
        { id: "ch.same", text: "It stays where it was" }
      ],
      correct: "ch.down",
      explain: (list) =>
        `The smallest figure still has ${list.values.filter((v) => v === Math.min(...list.values)).length} reading` +
        `${list.values.filter((v) => v === Math.min(...list.values)).length === 1 ? "" : "s"} at or below it, but the ` +
        `log now holds ${list.values.length + 1} rather than ${list.values.length}, so its standing falls. A ` +
        `percentile is a share of the log, not a property of the figure alone.`
    }),
    recognitionFamily({
      id: "gen.r2-variance.prediction",
      topic: VARIANCE,
      reasoning: "prediction",
      description: "Say what adding the same amount to every reading does to the variance.",
      ask: (list) =>
        `${listSentence(list)} Every figure is later corrected upward by 3 ${list.unit} — the scale was misread by ` +
        `the same amount each time. What happens to the variance?`,
      choices: [
        { id: "ch.same", text: "It is unchanged" },
        { id: "ch.up3", text: "It rises by 3" },
        { id: "ch.up9", text: "It rises by 9" }
      ],
      correct: "ch.same",
      explain: (list) =>
        `The mean rises by 3 as well, so every distance from the mean is exactly what it was and the variance stays ` +
        `at ${varianceOf(list.values)}. Variance measures spread, and shifting a whole log spreads it no further.`
    }),
    recognitionFamily({
      id: "gen.r2-standard-deviation.real-world-application",
      topic: SD,
      reasoning: "real-world-application",
      description: "Use a standard deviation to judge whether a reading is unusual.",
      ask: (list) => {
        const sd = round2(Math.sqrt(varianceOf(list.values)));
        const m = meanOf(list.values);
        return (
          `${list.boat}'s catches average ${m} ${list.unit} with a standard deviation of ${sd}. A new trip lands ` +
          `${round2(m + 3 * sd)} ${list.unit}. How should that trip be read?`
        );
      },
      choices: [
        { id: "ch.unusual", text: "As unusual — it sits about three standard deviations above the average" },
        { id: "ch.ordinary", text: "As an ordinary trip" },
        { id: "ch.impossible", text: "As impossible" }
      ],
      correct: "ch.unusual",
      explain: (list) => {
        const sd = round2(Math.sqrt(varianceOf(list.values)));
        return (
          `A standard deviation is a typical distance from the mean, so a trip three of them out is far beyond the ` +
          `usual run — ${sd} ${list.unit} is typical, and this is about ${round2(3 * sd)} above the average. ` +
          `Unusual is not impossible: it is a judgement about how often, not about whether.`
        );
      }
    }),
    recognitionFamily({
      id: "gen.r2-standard-deviation.recognition",
      topic: SD,
      reasoning: "recognition",
      description: "Name the units a standard deviation is measured in.",
      ask: (list) =>
        `${list.boat}'s catches are measured in ${list.unit}. What are the units of their standard deviation?`,
      choices: [
        { id: "ch.same", text: "The same units as the catches" },
        { id: "ch.squared", text: "Squared units" },
        { id: "ch.none", text: "It has no units" }
      ],
      correct: "ch.same",
      explain: (list) =>
        `Taking the square root of the variance undoes the squaring, so the standard deviation is back in ` +
        `${list.unit} — which is the whole reason it exists beside the variance.`
    })
  ];
}
