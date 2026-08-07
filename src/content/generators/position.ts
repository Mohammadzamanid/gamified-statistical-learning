/**
 * Generator families for the position group: negatives, number lines, coordinates.
 *
 * These three topics share a subject — *where a value sits* — and share nothing
 * else with the arithmetic or part/whole templates. A negative is a direction
 * from zero, a number line is a scale you read against, and a coordinate is two
 * of those at right angles. So they get one module, but three separate sets of
 * families rather than one parameterised spec: the thing that varies between
 * them is what a position *means*, and that is not a parameter.
 *
 * Each topic carries one named misconception, and each is wired to a detector
 * that can genuinely fire for that question's answer kind — which is not
 * automatic, and is the trap this module had to be written around:
 *
 *  - `mc.negative-magnitude` uses `known-wrong-answer`, which reaches a learner
 *    through a **tagged distractor**, so it appears only on multiple-choice.
 *  - `mc.tick-counted-not-scaled` and `mc.axes-swapped` use `point-geometry`,
 *    which reads the evaluator's placement signals, so they appear only on
 *    point-placement — as a `misconceptionPoints` entry and as
 *    `swappedAxesMisconceptionId` respectively.
 *
 * Declaring a misconception whose detector cannot fire for the answer kind would
 * inflate a mapping count while doing nothing for the learner, which is the
 * defect the coverage audit now drives the real engine to rule out.
 */
import type { Question } from "../../shared/schemas";
import type { RawResponse } from "../../core/questions/types";
import type { Candidate, GeneratorFamily } from "../../core/generation/types";

const numeric = (value: number): RawResponse => ({ kind: "numeric", text: String(value) });
const choose = (id: string): RawResponse => ({ kind: "choice", choiceIds: [id] });
const point = (x: number, y?: number): RawResponse =>
  y === undefined ? { kind: "point", x } : { kind: "point", x, y };

function baseOf(
  topicId: string,
  objectiveId: string,
  skillId: string,
  difficulty: 1 | 2 | 3 | 4 | 5
): Pick<Question, "topicId" | "objectiveId" | "skillIds" | "difficulty"> {
  return { topicId, objectiveId, skillIds: [skillId], difficulty };
}

/** Signed value as it is written in prose: -7, not "minus 7". */
const signed = (v: number): string => String(v);

// ==========================================================================
// Negative numbers
// ==========================================================================

const NEG = {
  skill: "skill.r1-negatives",
  topic: "t.r1-negatives",
  objective: "obj.r1-negatives"
};

/** Depths, debts and temperatures a beginner meets, plus their positive mirrors. */
const SIGNED_VALUES = [-18, -15, -12, -9, -7, -6, -4, -3, -2, -1, 0, 2, 3, 5, 6, 8, 11, 14];

/** Only the values below zero, for the families that are about ordering them. */
const NEGATIVES = SIGNED_VALUES.filter((v) => v < 0);

/**
 * How far apart two positions are on the scale, counted one step at a time.
 *
 * The long way round on purpose: this is the second route the answer key is
 * checked against, and computing it as `Math.abs(b - a)` in both places would
 * make that check prove nothing (D-020).
 */
function stepsBetween(a: number, b: number): number {
  let steps = 0;
  let here = Math.min(a, b);
  const there = Math.max(a, b);
  while (here < there) {
    here += 1;
    steps += 1;
  }
  return steps;
}

/**
 * Comparing two negatives, with the magnitude reading offered and tagged.
 *
 * The whole difficulty of the topic in one question: -12 has the bigger digits
 * and is the smaller number. A learner who picks it is not guessing, and the
 * tag is what lets the engine say so instead of "incorrect".
 */
function negativeComparisonFamily(): GeneratorFamily {
  return {
    id: "gen.r1-negatives.comparison",
    topicId: NEG.topic,
    skillIds: [NEG.skill],
    reasoningFamily: "comparison",
    description: "Decide which of two negative soundings is the larger number.",
    enumerate: () =>
      NEGATIVES.flatMap((a, i) =>
        NEGATIVES.slice(i + 1).map((b): Candidate => {
          // a is earlier in the list, so more negative; b is nearer zero.
          const larger = a > b ? a : b;
          const smaller = a > b ? b : a;
          return {
            key: `${a}-vs-${b}`,
            invalidReason:
              a === b
                ? "the two soundings are the same, so there is nothing to compare"
                : Math.abs(a) === Math.abs(b)
                  ? "the two soundings have the same digits, so the misconception option is not distinguishable"
                  : null,
            expectedResponse: () => choose(larger === a ? "ch.a" : "ch.b"),
            build: () => ({
              ...baseOf(NEG.topic, NEG.objective, NEG.skill, 3),
              id: `q.gen.r1-negatives.cmp.${a}-${b}`,
              misconceptionIds: ["mc.negative-magnitude"],
              estimatedSeconds: 50,
              accessibilityDescription: `A multiple-choice question comparing the soundings ${signed(a)} and ${signed(b)} metres relative to the waterline. Choose the larger number.`,
              interaction: "multiple-choice",
              prompt: `Two soundings are logged against the waterline: ${signed(a)} metres and ${signed(b)} metres. Which is the larger number?`,
              choices: [
                { id: "ch.a", text: `${signed(a)} metres`, ...(a === smaller ? { misconceptionId: "mc.negative-magnitude" } : {}) },
                { id: "ch.b", text: `${signed(b)} metres`, ...(b === smaller ? { misconceptionId: "mc.negative-magnitude" } : {}) },
                { id: "ch.equal", text: "They are the same number" }
              ],
              answer: { kind: "choice", correctChoiceIds: [larger === a ? "ch.a" : "ch.b"] },
              explanation: `${signed(larger)} sits nearer the surface than ${signed(smaller)}, so ${signed(larger)} is the larger number. The minus sign says which side of zero a value is on, not how big it is — ${Math.abs(smaller)} is the larger *digit* and ${signed(smaller)} is the smaller number.`
            })
          };
        })
      )
  };
}

/** Three signed values, deepest first. */
function negativeOrderingFamily(): GeneratorFamily {
  return {
    id: "gen.r1-negatives.ordering",
    topicId: NEG.topic,
    skillIds: [NEG.skill],
    reasoningFamily: "ordering",
    description: "Arrange three signed soundings from the deepest to the highest.",
    enumerate: () =>
      SIGNED_VALUES.map((v, i): Candidate => {
        const trio = [v, SIGNED_VALUES[(i + 6) % SIGNED_VALUES.length]!, SIGNED_VALUES[(i + 11) % SIGNED_VALUES.length]!];
        const distinct = new Set(trio).size === trio.length;
        return {
          key: `${v}`,
          invalidReason: distinct ? null : "two of the three soundings are the same, so the order is ambiguous",
          expectedResponse: () => ({
            kind: "ordering",
            // Ordered by walking the scale rather than by comparing directly.
            order: trio
              .map((_, k) => k)
              .sort((a, b) => stepsBetween(trio[a]!, -100) - stepsBetween(trio[b]!, -100))
              .map((k) => `it.${k}`)
          }),
          build: () => ({
            ...baseOf(NEG.topic, NEG.objective, NEG.skill, 3),
            id: `q.gen.r1-negatives.order.${v}`,
            misconceptionIds: [],
            estimatedSeconds: 70,
            accessibilityDescription: `An ordering question with three soundings measured against the waterline. Arrange them from the deepest to the highest.`,
            interaction: "ordering",
            prompt: `Three soundings are logged against the waterline. Put them in order, deepest first.`,
            items: trio.map((x, k) => ({ id: `it.${k}`, text: `${signed(x)} metres` })),
            answer: {
              kind: "ordering",
              correctOrder: trio
                .map((_, k) => k)
                .sort((a, b) => trio[a]! - trio[b]!)
                .map((k) => `it.${k}`)
            },
            explanation: `Deepest first means smallest first: ${[...trio].sort((a, b) => a - b).map(signed).join(", ")}.`
          })
        };
      })
  };
}

/** Write a description below the waterline as a signed number. */
function negativeConversionFamily(): GeneratorFamily {
  return {
    id: "gen.r1-negatives.representation-conversion",
    topicId: NEG.topic,
    skillIds: [NEG.skill],
    reasoningFamily: "representation-conversion",
    description: "Turn a described depth or height into a signed number.",
    enumerate: () =>
      SIGNED_VALUES.map((v): Candidate => ({
        key: `${v}`,
        invalidReason: v === 0 ? "zero has no side of the waterline to describe" : null,
        expectedResponse: () => numeric(v < 0 ? 0 - Math.abs(v) : Math.abs(v)),
        build: () => ({
          ...baseOf(NEG.topic, NEG.objective, NEG.skill, 2),
          id: `q.gen.r1-negatives.conv.${v}`,
          misconceptionIds: [],
          estimatedSeconds: 45,
          accessibilityDescription: `A question turning a description of ${Math.abs(v)} metres ${v < 0 ? "below" : "above"} the waterline into a signed number. Enter the value as a number.`,
          interaction: "numeric-input",
          prompt: `The log book records a point ${Math.abs(v)} metres ${v < 0 ? "below" : "above"} the waterline. Written as a single signed number, what is it?`,
          answer: { kind: "numeric", value: v, tolerance: 0, unit: "metres" },
          explanation: `${v < 0 ? "Below" : "Above"} the waterline is the ${v < 0 ? "negative" : "positive"} side of zero, so it is written ${signed(v)}.`
        })
      }))
  };
}

/** How far it is from one sounding to another, across zero. */
function negativeDistanceFamily(): GeneratorFamily {
  return {
    id: "gen.r1-negatives.calculation",
    topicId: NEG.topic,
    skillIds: [NEG.skill],
    reasoningFamily: "calculation",
    description: "Measure the distance between two signed positions, including across zero.",
    enumerate: () =>
      SIGNED_VALUES.flatMap((a, i) =>
        [SIGNED_VALUES[(i + 5) % SIGNED_VALUES.length]!, SIGNED_VALUES[(i + 9) % SIGNED_VALUES.length]!].map(
          (b, j): Candidate => ({
            key: `${a}-${b}-${j}`,
            invalidReason: a === b ? "the two positions are the same, so the distance is zero" : null,
            expectedResponse: () => numeric(stepsBetween(a, b)),
            build: () => ({
              ...baseOf(NEG.topic, NEG.objective, NEG.skill, 3),
              id: `q.gen.r1-negatives.dist.${a}-${b}-${j}`,
              misconceptionIds: [],
              estimatedSeconds: 60,
              accessibilityDescription: `A question asking the distance in metres between a sounding of ${signed(a)} and one of ${signed(b)}. Enter the distance as a number.`,
              interaction: "numeric-input",
              prompt: `One sounding reads ${signed(a)} metres and another reads ${signed(b)} metres. How many metres apart are they?`,
              answer: { kind: "numeric", value: Math.abs(b - a), tolerance: 0, unit: "metres" },
              explanation: `Counting along the scale from ${signed(Math.min(a, b))} up to ${signed(Math.max(a, b))} takes ${Math.abs(b - a)} steps, so they are ${Math.abs(b - a)} metres apart.`
            })
          })
        )
      )
  };
}

/** Below zero somewhere other than a harbour. */
function negativeTransferFamily(): GeneratorFamily {
  return {
    id: "gen.r1-negatives.transfer",
    topicId: NEG.topic,
    skillIds: [NEG.skill],
    reasoningFamily: "transfer",
    description: "Negative values in a setting the lesson never mentions.",
    enumerate: () =>
      NEGATIVES.map((v): Candidate => {
        const spent = Math.abs(v);
        const held = 5;
        return {
          key: `${v}`,
          invalidReason: spent <= held ? "the account would not go below zero, so nothing negative is recorded" : null,
          expectedResponse: () => numeric(0 - stepsBetween(held, spent)),
          build: () => ({
            ...baseOf(NEG.topic, NEG.objective, NEG.skill, 4),
            id: `q.gen.r1-negatives.transfer.${v}`,
            misconceptionIds: [],
            estimatedSeconds: 65,
            accessibilityDescription: `A question about an account holding ${held} coins from which ${spent} coins are spent. Enter the resulting balance as a signed number.`,
            interaction: "numeric-input",
            prompt: `A chandler's account holds ${held} coins and a bill of ${spent} coins is paid from it. Written as a signed number, what is the balance now?`,
            answer: { kind: "numeric", value: held - spent, tolerance: 0, unit: "coins" },
            explanation: `Nothing here is a depth, but the scale behaves the same way: ${spent} taken from ${held} passes zero and lands ${spent - held} below it, which is written ${signed(held - spent)}.`
          })
        };
      })
  };
}

/** A log book that ranked two negatives by their digits. */
function negativeErrorFamily(): GeneratorFamily {
  return {
    id: "gen.r1-negatives.error-identification",
    topicId: NEG.topic,
    skillIds: [NEG.skill],
    reasoningFamily: "error-identification",
    description: "Judge a log book that ordered two negative soundings by their digits.",
    enumerate: () =>
      NEGATIVES.flatMap((a, i) =>
        NEGATIVES.slice(i + 1).map((b): Candidate => {
          const deeper = Math.min(a, b);
          const shallower = Math.max(a, b);
          return {
            key: `${a}-vs-${b}`,
            invalidReason:
              Math.abs(a) === Math.abs(b) ? "the two soundings have the same digits, so there is no claim to judge" : null,
            expectedResponse: () => choose("ch.wrong"),
            build: () => ({
              ...baseOf(NEG.topic, NEG.objective, NEG.skill, 4),
              id: `q.gen.r1-negatives.err.${a}-${b}`,
              misconceptionIds: [],
              estimatedSeconds: 65,
              accessibilityDescription: `An error-identification question about a log book claiming ${signed(deeper)} is deeper water than ${signed(shallower)} because its digits are larger. Choose one option.`,
              interaction: "error-identification",
              prompt: `A log book records that ${signed(deeper)} metres is the larger reading, "because ${Math.abs(deeper)} is bigger than ${Math.abs(shallower)}". Is that right?`,
              choices: [
                { id: "ch.wrong", text: `No — ${signed(shallower)} is the larger number` },
                { id: "ch.right", text: "Yes, the log book is correct" },
                { id: "ch.cannot", text: "There is not enough information to tell" }
              ],
              answer: { kind: "choice", correctChoiceIds: ["ch.wrong"] },
              explanation: `The digits say how far from zero, not which is larger. ${signed(deeper)} is further below the waterline, so it is the smaller number and ${signed(shallower)} is the larger.`
            })
          };
        })
      )
  };
}

// ==========================================================================
// Number lines
// ==========================================================================

const LINE = {
  skill: "skill.r1-number-lines",
  topic: "t.r1-number-lines",
  objective: "obj.r1-number-lines"
};

/** A line whose labelled marks are `step` units apart — the scale to be read. */
interface Scale {
  step: number;
  max: number;
  label: string;
  unit: string;
}

const SCALES: readonly Scale[] = [
  { step: 2, max: 20, label: "Crates landed", unit: "crates" },
  { step: 5, max: 50, label: "Barrels cured", unit: "barrels" },
  { step: 10, max: 100, label: "Fathoms of rope", unit: "fathoms" },
  { step: 20, max: 200, label: "Coins taken", unit: "coins" },
  { step: 25, max: 100, label: "Salt in pounds", unit: "pounds" }
];

/** Which labelled mark, counting from zero: the 3rd mark on a step-5 line is 15. */
const MARKS = [1, 2, 3, 4, 5, 6, 7];

function ticksOf(scale: Scale): number[] {
  const out: number[] = [];
  for (let v = 0; v <= scale.max; v += scale.step) out.push(v);
  return out;
}

/**
 * The value at the nth labelled mark, reached by stepping along the line.
 *
 * Reading a scale *is* repeated addition of the step, so this is both the
 * independent route and the thing the lesson teaches.
 */
function valueAtMark(scale: Scale, mark: number): number {
  let value = 0;
  for (let i = 0; i < mark; i++) value += scale.step;
  return value;
}

/**
 * Placing a value on a scaled line, with the tick-counting error declared.
 *
 * A learner who counts marks as one unit each lands at the *mark number* rather
 * than the value, so that position is registered as `mc.tick-counted-not-scaled`
 * — the evaluator classifies it geometrically and the engine names it.
 */
function linePlacementFamily(): GeneratorFamily {
  return {
    id: "gen.r1-number-lines.visual-interpretation",
    topicId: LINE.topic,
    skillIds: [LINE.skill],
    reasoningFamily: "visual-interpretation",
    description: "Place a value on a line whose labelled marks are more than one unit apart.",
    enumerate: () =>
      SCALES.flatMap((scale) =>
        MARKS.map((mark): Candidate => {
          const value = valueAtMark(scale, mark);
          return {
            key: `${scale.step}-${mark}`,
            // No "the marks happen to give the right value" guard here: every
            // scale in the list steps by more than one, so the mark number and
            // the value can never coincide. A guard that cannot fire is
            // decoration; the audit that drives the real engine is what proves
            // the wrong placement is distinguishable from the right one.
            invalidReason: value > scale.max ? "the value lies beyond the end of this line" : null,
            expectedResponse: () => point(valueAtMark(scale, mark)),
            build: () => ({
              ...baseOf(LINE.topic, LINE.objective, LINE.skill, 3),
              id: `q.gen.r1-number-lines.place.${scale.step}-${mark}`,
              misconceptionIds: ["mc.tick-counted-not-scaled"],
              estimatedSeconds: 70,
              accessibilityDescription: `Place a value on a number line labelled ${scale.label} running from 0 to ${scale.max}, with marks every ${scale.step}. The value to place is ${value}.`,
              interaction: "point-placement",
              prompt: `This line is marked every ${scale.step} ${scale.unit}, not every one. Place the point at ${value} ${scale.unit}.`,
              pointField: {
                kind: "number-line",
                xMin: 0,
                xMax: scale.max,
                xStep: 1,
                xLabel: scale.label,
                xTicks: ticksOf(scale),
                accessibleDescription: `A number line labelled ${scale.label}, running from 0 to ${scale.max} with a labelled mark every ${scale.step}.`
              },
              answer: {
                kind: "point",
                x: value,
                toleranceX: 0,
                // Counting the marks instead of reading the scale: the learner
                // walks past `mark` marks and stops, landing at `mark`.
                misconceptionPoints: [{ x: mark, misconceptionId: "mc.tick-counted-not-scaled" }]
              },
              explanation: `${value} is ${mark} marks along, because each mark is worth ${scale.step} ${scale.unit}. Stopping at ${mark} would be counting the marks rather than reading what they are worth.`
            })
          };
        })
      )
  };
}

/** The distance between two labelled marks, in units rather than marks. */
function lineDistanceFamily(): GeneratorFamily {
  return {
    id: "gen.r1-number-lines.calculation",
    topicId: LINE.topic,
    skillIds: [LINE.skill],
    reasoningFamily: "calculation",
    description: "Work out the gap between two marks on a scaled line.",
    enumerate: () =>
      SCALES.flatMap((scale) =>
        MARKS.map((mark): Candidate => {
          const from = valueAtMark(scale, mark);
          const to = valueAtMark(scale, mark + 2);
          return {
            key: `${scale.step}-${mark}`,
            invalidReason: to > scale.max ? "the second mark lies beyond the end of this line" : null,
            expectedResponse: () => numeric(stepsBetween(valueAtMark(scale, mark), valueAtMark(scale, mark + 2))),
            build: () => ({
              ...baseOf(LINE.topic, LINE.objective, LINE.skill, 3),
              id: `q.gen.r1-number-lines.gap.${scale.step}-${mark}`,
              misconceptionIds: [],
              estimatedSeconds: 55,
              accessibilityDescription: `A question about a line labelled ${scale.label} with marks every ${scale.step}, asking the gap in ${scale.unit} between the marks at ${from} and ${to}.`,
              interaction: "numeric-input",
              prompt: `On a line marked every ${scale.step} ${scale.unit}, one reading sits at ${from} and another at ${to}. How many ${scale.unit} apart are they?`,
              answer: { kind: "numeric", value: to - from, tolerance: 0, unit: scale.unit },
              explanation: `Two marks apart at ${scale.step} ${scale.unit} a mark is ${to - from} ${scale.unit}, not 2.`
            })
          };
        })
      )
  };
}

/** Reading the scale in a working situation. */
function lineApplicationFamily(): GeneratorFamily {
  return {
    id: "gen.r1-number-lines.real-world-application",
    topicId: LINE.topic,
    skillIds: [LINE.skill],
    reasoningFamily: "real-world-application",
    description: "Read a value off a scaled gauge in a harbour situation.",
    enumerate: () =>
      SCALES.flatMap((scale) =>
        MARKS.map((mark): Candidate => {
          const value = valueAtMark(scale, mark);
          return {
            key: `${scale.step}-${mark}`,
            invalidReason: value > scale.max ? "the reading lies beyond the end of this gauge" : null,
            expectedResponse: () => numeric(valueAtMark(scale, mark)),
            build: () => ({
              ...baseOf(LINE.topic, LINE.objective, LINE.skill, 3),
              id: `q.gen.r1-number-lines.read.${scale.step}-${mark}`,
              misconceptionIds: [],
              estimatedSeconds: 55,
              accessibilityDescription: `A question about a gauge labelled ${scale.label} whose marks are ${scale.step} ${scale.unit} apart, with the needle ${mark} marks along. Enter the reading as a number.`,
              interaction: "numeric-input",
              prompt: `The gauge for ${scale.label.toLowerCase()} is marked every ${scale.step} ${scale.unit}. The needle sits exactly ${mark} marks along from zero. What does it read?`,
              answer: { kind: "numeric", value, tolerance: 0, unit: scale.unit },
              explanation: `${mark} marks at ${scale.step} ${scale.unit} each is ${value} ${scale.unit}.`
            })
          };
        })
      )
  };
}

/** Someone read the marks and not the scale. */
function lineErrorFamily(): GeneratorFamily {
  return {
    id: "gen.r1-number-lines.error-identification",
    topicId: LINE.topic,
    skillIds: [LINE.skill],
    reasoningFamily: "error-identification",
    description: "Judge a reading taken by counting marks rather than reading the scale.",
    enumerate: () =>
      SCALES.flatMap((scale) =>
        MARKS.map((mark): Candidate => {
          const value = valueAtMark(scale, mark);
          return {
            key: `${scale.step}-${mark}`,
            invalidReason: value > scale.max ? "the reading lies beyond the end of this gauge" : null,
            expectedResponse: () => choose("ch.scale"),
            build: () => ({
              ...baseOf(LINE.topic, LINE.objective, LINE.skill, 4),
              id: `q.gen.r1-number-lines.err.${scale.step}-${mark}`,
              misconceptionIds: [],
              estimatedSeconds: 65,
              accessibilityDescription: `An error-identification question about a mate who read ${mark} from a gauge marked every ${scale.step} ${scale.unit}. Choose what went wrong.`,
              interaction: "error-identification",
              prompt: `A gauge is marked every ${scale.step} ${scale.unit}. The needle is ${mark} marks along and the mate writes down ${mark}. What has gone wrong?`,
              choices: [
                { id: "ch.scale", text: `The marks were counted instead of read — each is worth ${scale.step}, so it is ${value}` },
                { id: "ch.fine", text: "Nothing — that is the right reading" },
                { id: "ch.zero", text: "The count started from the wrong end of the line" }
              ],
              answer: { kind: "choice", correctChoiceIds: ["ch.scale"] },
              explanation: `Each mark carries ${scale.step} ${scale.unit}, so ${mark} marks is ${value} ${scale.unit}. Writing ${mark} counts the marks as one apiece.`
            })
          };
        })
      )
  };
}

/** Which of two readings sits further along the line. */
function lineComparisonFamily(): GeneratorFamily {
  return {
    id: "gen.r1-number-lines.comparison",
    topicId: LINE.topic,
    skillIds: [LINE.skill],
    reasoningFamily: "comparison",
    description: "Compare two readings taken from lines with different scales.",
    enumerate: () =>
      SCALES.flatMap((scale, si) =>
        MARKS.map((mark): Candidate => {
          const other = SCALES[(si + 2) % SCALES.length]!;
          const here = valueAtMark(scale, mark);
          const there = valueAtMark(other, mark);
          return {
            key: `${scale.step}-${other.step}-${mark}`,
            invalidReason:
              here > scale.max || there > other.max
                ? "one of the two readings lies beyond the end of its line"
                : here === there
                  ? "the two readings are equal, so there is nothing to compare"
                  : null,
            expectedResponse: () => choose(here > there ? "ch.first" : "ch.second"),
            build: () => ({
              ...baseOf(LINE.topic, LINE.objective, LINE.skill, 4),
              id: `q.gen.r1-number-lines.cmp.${scale.step}-${other.step}-${mark}`,
              misconceptionIds: [],
              estimatedSeconds: 65,
              accessibilityDescription: `A multiple-choice question comparing a needle ${mark} marks along a line marked every ${scale.step} with a needle ${mark} marks along a line marked every ${other.step}. Choose the larger reading.`,
              interaction: "multiple-choice",
              prompt: `Two gauges both have their needle exactly ${mark} marks from zero. One is marked every ${scale.step}, the other every ${other.step}. Which gauge is showing the larger value?`,
              choices: [
                { id: "ch.first", text: `The one marked every ${scale.step}` },
                { id: "ch.second", text: `The one marked every ${other.step}` },
                { id: "ch.equal", text: "They show the same value — the needles are level" }
              ],
              answer: { kind: "choice", correctChoiceIds: [here > there ? "ch.first" : "ch.second"] },
              explanation: `Same number of marks, different worth: ${mark} marks at ${scale.step} is ${here}, and at ${other.step} it is ${there}.`
            })
          };
        })
      )
  };
}

// ==========================================================================
// Coordinates
// ==========================================================================

const COORD = {
  skill: "skill.r1-coordinates",
  topic: "t.r1-coordinates",
  objective: "obj.r1-coordinates"
};

const X_VALUES = [1, 2, 3, 4, 5, 6, 7, 8];
const Y_VALUES = [1, 2, 3, 4, 5, 6, 7, 8];
const GRID_MAX = 8;

const gridField = (): NonNullable<Question["pointField"]> => ({
  kind: "coordinate-plane",
  xMin: 0,
  xMax: GRID_MAX,
  xStep: 1,
  xLabel: "Berth along the quay",
  xTicks: [0, 2, 4, 6, 8],
  yMin: 0,
  yMax: GRID_MAX,
  yStep: 1,
  yLabel: "Row back from the water",
  yTicks: [0, 2, 4, 6, 8],
  accessibleDescription: `A grid with berth along the quay from 0 to ${GRID_MAX} across the bottom, and row back from the water from 0 to ${GRID_MAX} up the side.`
});

/**
 * Plotting a pair, with the swap registered.
 *
 * A symmetric target cannot evidence a swap — placing (4, 4) the wrong way round
 * is the same point — so those combinations are rejected rather than shipped
 * with a misconception that could never fire.
 */
function coordinatePlacementFamily(): GeneratorFamily {
  return {
    id: "gen.r1-coordinates.visual-interpretation",
    topicId: COORD.topic,
    skillIds: [COORD.skill],
    reasoningFamily: "visual-interpretation",
    description: "Plot a coordinate pair on a grid, in the order the pair is written.",
    enumerate: () =>
      X_VALUES.flatMap((x) =>
        Y_VALUES.map((y): Candidate => ({
          key: `${x}-${y}`,
          invalidReason:
            x === y ? "the pair is symmetric, so placing it the wrong way round gives the same point" : null,
          expectedResponse: () => point(x, y),
          build: () => ({
            ...baseOf(COORD.topic, COORD.objective, COORD.skill, 3),
            id: `q.gen.r1-coordinates.plot.${x}-${y}`,
            misconceptionIds: ["mc.axes-swapped"],
            estimatedSeconds: 70,
            accessibilityDescription: `Plot the point at berth ${x} along the quay and row ${y} back from the water, on a grid running 0 to ${GRID_MAX} on both axes.`,
            interaction: "point-placement",
            prompt: `A store is listed in the register as (${x}, ${y}). Plot it: across the quay first, then back from the water.`,
            pointField: gridField(),
            answer: {
              kind: "point",
              x,
              y,
              toleranceX: 0,
              toleranceY: 0,
              swappedAxesMisconceptionId: "mc.axes-swapped"
            },
            explanation: `Across to berth ${x}, then back to row ${y}. Plotting it at (${y}, ${x}) uses the right two numbers on the wrong axes, which names a different store.`
          })
        }))
      )
  };
}

/** Which written pair matches a described position. */
function coordinateRecognitionFamily(): GeneratorFamily {
  return {
    id: "gen.r1-coordinates.recognition",
    topicId: COORD.topic,
    skillIds: [COORD.skill],
    reasoningFamily: "recognition",
    description: "Pick the coordinate pair that names a described position.",
    enumerate: () =>
      X_VALUES.flatMap((x) =>
        Y_VALUES.map((y): Candidate => ({
          key: `${x}-${y}`,
          invalidReason: x === y ? "the pair is symmetric, so the swapped option is the same pair" : null,
          // No misconception is declared here on purpose: `mc.axes-swapped` is
          // classified geometrically from a placement, so a tag on a choice
          // would name a detector that cannot fire for this answer kind.
          expectedResponse: () => choose("ch.right"),
          build: () => ({
            ...baseOf(COORD.topic, COORD.objective, COORD.skill, 2),
            id: `q.gen.r1-coordinates.name.${x}-${y}`,
            misconceptionIds: [],
            estimatedSeconds: 45,
            accessibilityDescription: `A multiple-choice question asking which coordinate pair names a store ${x} berths along the quay and ${y} rows back from the water.`,
            interaction: "multiple-choice",
            prompt: `A store stands ${x} berths along the quay and ${y} rows back from the water. Which pair names it in the register?`,
            choices: [
              { id: "ch.right", text: `(${x}, ${y})` },
              { id: "ch.swapped", text: `(${y}, ${x})` },
              { id: "ch.summed", text: `(${x + y}, ${y})` }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.right"] },
            explanation: `The first number is always the distance along the quay, so it is (${x}, ${y}). (${y}, ${x}) is the same two numbers read in the wrong order.`
          })
        }))
      )
  };
}

/** Move from a berth and say where you end. */
function coordinateMoveFamily(): GeneratorFamily {
  return {
    id: "gen.r1-coordinates.multi-step-reasoning",
    topicId: COORD.topic,
    skillIds: [COORD.skill],
    reasoningFamily: "multi-step-reasoning",
    description: "Apply two moves to a coordinate pair and report where it lands.",
    enumerate: () =>
      X_VALUES.flatMap((x) =>
        Y_VALUES.map((y): Candidate => {
          const dx = 2;
          const dy = 1;
          return {
            key: `${x}-${y}`,
            invalidReason:
              x + dx > GRID_MAX || y + dy > GRID_MAX ? "the move would run off the edge of the grid" : null,
            expectedResponse: () => point(stepsBetween(0, x) + dx, stepsBetween(0, y) + dy),
            build: () => ({
              ...baseOf(COORD.topic, COORD.objective, COORD.skill, 4),
              id: `q.gen.r1-coordinates.move.${x}-${y}`,
              misconceptionIds: [],
              estimatedSeconds: 80,
              accessibilityDescription: `Starting from berth ${x}, row ${y}, move ${dx} berths along the quay and ${dy} row back, then plot where you end up on a grid running 0 to ${GRID_MAX}.`,
              interaction: "point-placement",
              prompt: `A barrow starts at (${x}, ${y}), goes ${dx} berths further along the quay, then ${dy} row further back from the water. Plot where it ends up.`,
              pointField: gridField(),
              answer: { kind: "point", x: x + dx, y: y + dy, toleranceX: 0, toleranceY: 0 },
              explanation: `Along the quay: ${x} plus ${dx} is ${x + dx}. Back from the water: ${y} plus ${dy} is ${y + dy}. So it ends at (${x + dx}, ${y + dy}).`
            })
          };
        })
      )
  };
}

/** Which of two stores is further along the quay. */
function coordinateComparisonFamily(): GeneratorFamily {
  return {
    id: "gen.r1-coordinates.comparison",
    topicId: COORD.topic,
    skillIds: [COORD.skill],
    reasoningFamily: "comparison",
    description: "Compare two coordinate pairs along one named axis.",
    enumerate: () =>
      X_VALUES.flatMap((x) =>
        Y_VALUES.map((y): Candidate => {
          const other = { x: y, y: x };
          return {
            key: `${x}-${y}`,
            invalidReason: x === y ? "the two stores share a berth, so there is nothing to compare" : null,
            expectedResponse: () => choose(x > other.x ? "ch.first" : "ch.second"),
            build: () => ({
              ...baseOf(COORD.topic, COORD.objective, COORD.skill, 3),
              id: `q.gen.r1-coordinates.cmp.${x}-${y}`,
              misconceptionIds: [],
              estimatedSeconds: 55,
              accessibilityDescription: `A multiple-choice question comparing the store at (${x}, ${y}) with the store at (${other.x}, ${other.y}), asking which is further along the quay.`,
              interaction: "multiple-choice",
              prompt: `One store is registered at (${x}, ${y}) and another at (${other.x}, ${other.y}). Which is further along the quay?`,
              choices: [
                { id: "ch.first", text: `(${x}, ${y})` },
                { id: "ch.second", text: `(${other.x}, ${other.y})` },
                { id: "ch.equal", text: "They are the same distance along" }
              ],
              answer: { kind: "choice", correctChoiceIds: [x > other.x ? "ch.first" : "ch.second"] },
              explanation: `Distance along the quay is the *first* number, so compare ${x} with ${other.x}: the ${x > other.x ? "first" : "second"} is further along. The rows back from the water do not come into it.`
            })
          };
        })
      )
  };
}

/** A register entry written the wrong way round. */
function coordinateErrorFamily(): GeneratorFamily {
  return {
    id: "gen.r1-coordinates.error-identification",
    topicId: COORD.topic,
    skillIds: [COORD.skill],
    reasoningFamily: "error-identification",
    description: "Judge a register entry whose two numbers were written in the wrong order.",
    enumerate: () =>
      X_VALUES.flatMap((x) =>
        Y_VALUES.map((y): Candidate => ({
          key: `${x}-${y}`,
          invalidReason: x === y ? "the pair is symmetric, so writing it the wrong way round changes nothing" : null,
          expectedResponse: () => choose("ch.swapped"),
          build: () => ({
            ...baseOf(COORD.topic, COORD.objective, COORD.skill, 4),
            id: `q.gen.r1-coordinates.err.${x}-${y}`,
            misconceptionIds: [],
            estimatedSeconds: 60,
            accessibilityDescription: `An error-identification question about a clerk who recorded a store standing ${x} berths along and ${y} rows back as the pair (${y}, ${x}). Choose what went wrong.`,
            interaction: "error-identification",
            prompt: `A store stands ${x} berths along the quay and ${y} rows back from the water. The clerk records it as (${y}, ${x}). What has gone wrong?`,
            choices: [
              { id: "ch.swapped", text: "The two numbers were written in the wrong order" },
              { id: "ch.fine", text: "Nothing — a pair can be written either way round" },
              { id: "ch.count", text: "One of the two distances was counted wrongly" }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.swapped"] },
            explanation: `The order carries the meaning: (${x}, ${y}) is ${x} along and ${y} back, while (${y}, ${x}) is ${y} along and ${x} back — a different place on the quay.`
          })
        }))
      )
  };
}

/** Fixing a place by two numbers, away from the harbour. */
function coordinateTransferFamily(): GeneratorFamily {
  return {
    id: "gen.r1-coordinates.transfer",
    topicId: COORD.topic,
    skillIds: [COORD.skill],
    reasoningFamily: "transfer",
    description: "A coordinate pair in a setting the lesson never mentions.",
    enumerate: () =>
      X_VALUES.flatMap((x) =>
        Y_VALUES.map((y): Candidate => ({
          key: `${x}-${y}`,
          invalidReason: x === y ? "the pair is symmetric, so the swapped option names the same seat" : null,
          expectedResponse: () => choose("ch.right"),
          build: () => ({
            ...baseOf(COORD.topic, COORD.objective, COORD.skill, 4),
            id: `q.gen.r1-coordinates.transfer.${x}-${y}`,
            misconceptionIds: [],
            estimatedSeconds: 55,
            accessibilityDescription: `A multiple-choice question about a hall seat ${x} seats along a row and in row ${y}, asking which pair names it when the seat number is written first.`,
            interaction: "multiple-choice",
            prompt: `A hall lists seats with the seat number first and the row second. Someone is sitting in seat ${x} of row ${y}. Which pair names their place?`,
            choices: [
              { id: "ch.right", text: `(${x}, ${y})` },
              { id: "ch.swapped", text: `(${y}, ${x})` },
              { id: "ch.total", text: `(${x}, ${x + y})` }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.right"] },
            explanation: `Nothing here is a quay, but the rule is the same: whichever value the list puts first goes first. Seat ${x}, row ${y} is (${x}, ${y}).`
          })
        }))
      )
  };
}

/** Every family in the position group. */
export function positionFamilies(): GeneratorFamily[] {
  return [
    negativeComparisonFamily(),
    negativeOrderingFamily(),
    negativeConversionFamily(),
    negativeDistanceFamily(),
    negativeTransferFamily(),
    negativeErrorFamily(),
    linePlacementFamily(),
    lineDistanceFamily(),
    lineApplicationFamily(),
    lineErrorFamily(),
    lineComparisonFamily(),
    coordinatePlacementFamily(),
    coordinateRecognitionFamily(),
    coordinateMoveFamily(),
    coordinateComparisonFamily(),
    coordinateErrorFamily(),
    coordinateTransferFamily()
  ];
}

export { SIGNED_VALUES, SCALES as LINE_SCALES, stepsBetween, valueAtMark };
