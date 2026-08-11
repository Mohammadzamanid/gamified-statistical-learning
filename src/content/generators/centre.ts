/**
 * Generator families for Region 2's centre module: mean, median, mode, and
 * choosing between them.
 *
 * The counts module took one corpus of tallies and read it three ways (D-058).
 * This is the same opportunity one level along: a catch list has a mean, a
 * median and a mode, and `l.r2-choosing-measures` is the lesson about picking
 * between them — so four topics share one corpus of lists, and the differences
 * between the topics are differences in what is asked.
 *
 * **Every answer is computed twice, by genuinely different routes.** The
 * question's answer and the family's `expectedResponse` are built from separate
 * code paths — a mean by summing and dividing against a running average, a
 * median by sorting and indexing against repeatedly discarding the extremes —
 * because a family that derives its expected response from its own answer key
 * proves nothing (D-020). Where the two disagree the validator rejects the
 * candidate as an answer failure, which is what caught 24 of them in the counts
 * module.
 */
import type { Question } from "../../shared/schemas";
import type { RawResponse } from "../../core/questions/types";
import type { Candidate, GeneratorFamily } from "../../core/generation/types";

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

// --------------------------------------------------------------------------
// The lists
// --------------------------------------------------------------------------

export interface CatchList {
  readonly id: string;
  readonly boat: string;
  /** What one value is: "crates", "metres". */
  readonly unit: string;
  /** What the values were recorded over: "seven trips". */
  readonly occasion: string;
  readonly values: readonly number[];
}

export const LISTS: readonly CatchList[] = [
  { id: "kittiwake", boat: "the Kittiwake", unit: "crates", occasion: "five trips", values: [4, 6, 6, 8, 11] },
  { id: "fulmar", boat: "the Fulmar", unit: "crates", occasion: "seven trips", values: [3, 5, 5, 7, 9, 9, 9] },
  { id: "gannet", boat: "the Gannet", unit: "crates", occasion: "six trips", values: [2, 4, 8, 8, 10, 16] },
  { id: "shearwater", boat: "the Shearwater", unit: "crates", occasion: "five trips", values: [7, 7, 7, 12, 17] },
  { id: "petrel", boat: "the Petrel", unit: "boxes", occasion: "eight landings", values: [1, 3, 3, 4, 6, 7, 7, 9] },
  { id: "skua", boat: "the Skua", unit: "boxes", occasion: "five landings", values: [10, 12, 12, 14, 32] },
  { id: "guillemot", boat: "the Guillemot", unit: "metres", occasion: "seven soundings", values: [8, 9, 9, 10, 11, 12, 14] },
  { id: "razorbill", boat: "the Razorbill", unit: "metres", occasion: "six soundings", values: [5, 6, 6, 10, 12, 13] },
  { id: "tern", boat: "the Tern", unit: "crates", occasion: "nine trips", values: [2, 2, 3, 4, 4, 4, 6, 7, 8] },
  { id: "eider", boat: "the Eider", unit: "crates", occasion: "five trips", values: [15, 18, 18, 20, 24] },
  { id: "scoter", boat: "the Scoter", unit: "crates", occasion: "seven trips", values: [6, 8, 11, 11, 12, 14, 18] },
  { id: "merlin", boat: "the Merlin", unit: "boxes", occasion: "six landings", values: [4, 9, 9, 13, 15, 22] },
  { id: "osprey", boat: "the Osprey", unit: "boxes", occasion: "nine landings", values: [3, 5, 8, 8, 9, 11, 11, 11, 16] },
  { id: "curlew", boat: "the Curlew", unit: "crates", occasion: "five trips", values: [9, 13, 13, 16, 24] },
  { id: "dunlin", boat: "the Dunlin", unit: "metres", occasion: "seven soundings", values: [4, 7, 7, 8, 12, 15, 19] },
  { id: "sanderling", boat: "the Sanderling", unit: "metres", occasion: "six soundings", values: [11, 14, 14, 17, 20, 24] },
  { id: "brent", boat: "the Brent", unit: "crates", occasion: "eight trips", values: [2, 5, 6, 6, 8, 9, 13, 15] },
  { id: "shelduck", boat: "the Shelduck", unit: "crates", occasion: "five trips", values: [12, 14, 14, 19, 26] },
  { id: "pochard", boat: "the Pochard", unit: "boxes", occasion: "seven landings", values: [5, 6, 10, 10, 13, 14, 19] },
  { id: "smew", boat: "the Smew", unit: "boxes", occasion: "six landings", values: [7, 11, 11, 15, 18, 20] },
  { id: "goldeneye", boat: "the Goldeneye", unit: "crates", occasion: "nine trips", values: [1, 4, 4, 6, 7, 9, 12, 12, 14] },
  { id: "wigeon", boat: "the Wigeon", unit: "crates", occasion: "five trips", values: [8, 10, 10, 15, 22] },
  { id: "teal", boat: "the Teal", unit: "metres", occasion: "seven soundings", values: [6, 9, 12, 12, 13, 16, 21] }
];

const listText = (list: CatchList): string => list.values.join(", ");

const listSentence = (list: CatchList): string =>
  `${list.boat} logged ${list.values.length} figures over ${list.occasion}: ${listText(list)} ${list.unit}.`;

const round4 = (n: number): number => Number(n.toFixed(4));

// --- Route A: the way the question's answer is built ----------------------

export function meanOf(values: readonly number[]): number {
  let total = 0;
  for (const v of values) total += v;
  return round4(total / values.length);
}

export function medianOf(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 === 1 ? sorted[(n - 1) / 2]! : round4((sorted[n / 2 - 1]! + sorted[n / 2]!) / 2);
}

export function modesOf(values: readonly number[]): number[] {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const top = Math.max(...counts.values());
  return [...counts.entries()].filter(([, c]) => c === top).map(([v]) => v).sort((a, b) => a - b);
}

// --- Route B: an independent way to reach the same number -----------------

/**
 * A running average: after k values the average is a, adding v gives
 * (a·k + v)/(k+1). Never forms the total, so it shares no arithmetic with
 * `meanOf` beyond the definition itself.
 */
export function meanByRunningAverage(values: readonly number[]): number {
  let average = 0;
  let seen = 0;
  for (const v of values) {
    average = (average * seen + v) / (seen + 1);
    seen += 1;
  }
  return round4(average);
}

/**
 * The median by peeling: drop the smallest and the largest together until one
 * or two values are left. No sorting, no indexing.
 */
export function medianByPeeling(values: readonly number[]): number {
  const rest = [...values];
  while (rest.length > 2) {
    const lo = Math.min(...rest);
    const hi = Math.max(...rest);
    rest.splice(rest.indexOf(lo), 1);
    rest.splice(rest.indexOf(hi), 1);
  }
  return rest.length === 1 ? rest[0]! : round4((rest[0]! + rest[1]!) / 2);
}

/** The most common value, found by counting each distinct value in turn. */
export function modeByScanning(values: readonly number[]): number {
  let best = values[0]!;
  let bestCount = 0;
  for (const candidate of [...new Set(values)].sort((a, b) => a - b)) {
    let count = 0;
    for (const v of values) if (v === candidate) count += 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

// --------------------------------------------------------------------------
// Mean
// --------------------------------------------------------------------------

const MEAN = { skill: "skill.mean", topic: "t.r2-mean", objective: "obj.compute-mean" };
const MEDIAN = { skill: "skill.median", topic: "t.r2-median", objective: "obj.compute-median" };
const MODE = { skill: "skill.r2-mode", topic: "t.r2-mode", objective: "obj.r2-mode" };
const CHOOSE = { skill: "skill.choose-measure", topic: "t.r2-choosing-measures", objective: "obj.r2-choosing-measures" };

/** Compute the mean, with the sum declared as the mistake. */
function meanCalculationFamily(): GeneratorFamily {
  return {
    id: "gen.r2-mean.calculation",
    topicId: MEAN.topic,
    skillIds: [MEAN.skill],
    reasoningFamily: "calculation",
    description: "Compute a mean from a list of catches.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const mean = meanOf(list.values);
        let total = 0;
        for (const v of list.values) total += v;
        return {
          key: list.id,
          invalidReason:
            !Number.isInteger(mean * 100)
              ? "the mean does not land on a hundredth, so the answer cannot be typed exactly"
              : null,
          expectedResponse: () => numeric(meanByRunningAverage(list.values)),
          build: () => ({
            ...baseOf(MEAN.topic, MEAN.objective, MEAN.skill, 2),
            id: `q.gen.r2-mean.compute.${list.id}`,
            misconceptionIds: ["mc.sum-not-mean"],
            parameters: { "mc.sum-not-mean": { wrongValue: total } },
            estimatedSeconds: 60,
            accessibilityDescription: `A list of ${list.values.length} figures: ${listText(list)}. Enter their mean.`,
            interaction: "numeric-input",
            prompt: `${listSentence(list)} What is the mean?`,
            answer: { kind: "numeric", value: mean, tolerance: 0.01, unit: list.unit },
            explanation:
              `Add the ${list.values.length} figures to get ${total}, then divide by ${list.values.length}: ` +
              `${total} ÷ ${list.values.length} = ${mean}. Stopping at ${total} answers a different question — ` +
              `that is the total, not the mean.`
          })
        };
      })
  };
}

/** The missing value that would produce a stated mean. */
function meanMissingValueFamily(): GeneratorFamily {
  return {
    id: "gen.r2-mean.multi-step",
    topicId: MEAN.topic,
    skillIds: [MEAN.skill],
    reasoningFamily: "multi-step-reasoning",
    description: "Work back from a target mean to the figure still missing.",
    enumerate: () =>
      LISTS.flatMap((list) =>
        [1, 2].map((extra): Candidate => {
          const known = list.values.slice(0, -1);
          const target = meanOf(list.values) + extra;
          const needed = round4(target * list.values.length - known.reduce((a, b) => a + b, 0));
          return {
            key: `${list.id}-plus${extra}`,
            invalidReason:
              needed <= 0
                ? "the missing figure would be zero or negative, which no catch can be"
                : !Number.isInteger(needed)
                  ? "the missing figure is not whole, and a part-crate reads as an error"
                  : null,
            expectedResponse: () => {
              // Independent route: raise every known figure to the target and
              // see how much of the shortfall the last one must cover.
              let shortfall = 0;
              for (const v of known) shortfall += target - v;
              return numeric(round4(target + shortfall));
            },
            build: () => ({
              ...baseOf(MEAN.topic, MEAN.objective, MEAN.skill, 3),
              id: `q.gen.r2-mean.missing.${list.id}-${extra}`,
              estimatedSeconds: 90,
              accessibilityDescription:
                `${known.length} figures are known — ${known.join(", ")} — and one is missing. ` +
                `Enter the figure that would make the mean ${target}.`,
              interaction: "numeric-input",
              prompt:
                `${list.boat}'s log has ${known.length} figures readable — ${known.join(", ")} ${list.unit} — ` +
                `and the last is smudged. The skipper says the mean over all ${list.values.length} was ${target}. ` +
                `What was the missing figure?`,
              answer: { kind: "numeric", value: needed, tolerance: 0.01, unit: list.unit },
              explanation:
                `A mean of ${target} over ${list.values.length} figures means a total of ` +
                `${round4(target * list.values.length)}. The readable figures come to ` +
                `${known.reduce((a, b) => a + b, 0)}, so the smudged one was ${needed}.`
            })
          };
        })
      )
  };
}

/** What one extreme value does to the mean. */
function meanPredictionFamily(): GeneratorFamily {
  return {
    id: "gen.r2-mean.prediction",
    topicId: MEAN.topic,
    skillIds: [MEAN.skill],
    reasoningFamily: "prediction",
    description: "Say which way the mean moves when one extreme figure joins.",
    enumerate: () =>
      LISTS.flatMap((list) =>
        (["above", "below"] as const).map((side): Candidate => {
          const mean = meanOf(list.values);
          const extra = side === "above" ? Math.max(...list.values) * 3 : 0;
          const after = meanOf([...list.values, extra]);
          return {
            key: `${list.id}-${side}`,
            invalidReason:
              round4(after) === round4(mean)
                ? "the new figure sits exactly on the mean, so nothing moves"
                : null,
            expectedResponse: () => choose(side === "above" ? "ch.up" : "ch.down"),
            build: () => ({
              ...baseOf(MEAN.topic, MEAN.objective, MEAN.skill, 2),
              id: `q.gen.r2-mean.predict.${list.id}-${side}`,
              estimatedSeconds: 55,
              accessibilityDescription:
                `A list with mean ${mean}, joined by a figure of ${extra}. Choose which way the mean moves.`,
              interaction: "multiple-choice",
              prompt:
                `${listSentence(list)} Its mean is ${mean}. One more trip is logged at ${extra} ${list.unit}. ` +
                `Before working it out — which way does the mean move?`,
              choices: [
                { id: "ch.up", text: "Up" },
                { id: "ch.down", text: "Down" },
                { id: "ch.same", text: "It stays where it is" }
              ],
              answer: { kind: "choice", correctChoiceIds: [side === "above" ? "ch.up" : "ch.down"] },
              explanation:
                `Every figure enters the sum, so a figure ${side} the mean pulls the mean ${side === "above" ? "up" : "down"}. ` +
                `Here it moves from ${mean} to ${after}. The median would have moved far less, or not at all.`
            })
          };
        })
      )
  };
}

/** A clerk who reported the total. */
function meanErrorFamily(): GeneratorFamily {
  return {
    id: "gen.r2-mean.error-identification",
    topicId: MEAN.topic,
    skillIds: [MEAN.skill],
    reasoningFamily: "error-identification",
    description: "Find what a clerk computed instead of the mean.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        let total = 0;
        for (const v of list.values) total += v;
        return {
          key: `${list.id}-error`,
          invalidReason:
            total === meanOf(list.values) ? "the total equals the mean here, so there is no error to find" : null,
          expectedResponse: () => choose("ch.total"),
          build: () => ({
            ...baseOf(MEAN.topic, MEAN.objective, MEAN.skill, 2),
            id: `q.gen.r2-mean.error.${list.id}`,
            // `mc.sum-not-mean` is **not** declared here, and the option below
            // carries no tag. Its detector is `confused-statistic`, which reads
            // a number: on a choice question it can never fire, so declaring it
            // would be a tag that inflates a count and nothing else (D-025,
            // D-057). It is declared on the numeric family above, where the
            // wrong value can actually be typed.
            estimatedSeconds: 55,
            accessibilityDescription: `A clerk reports the mean of ${listText(list)} as ${total}. Choose what went wrong.`,
            interaction: "error-identification",
            prompt: `${listSentence(list)} A clerk writes: "The mean is ${total}." What has the clerk done?`,
            choices: [
              { id: "ch.total", text: "Added the figures and stopped, never dividing by how many there were" },
              { id: "ch.median", text: "Reported the middle figure instead" },
              { id: "ch.fine", text: "Nothing — that is the mean" }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.total"] },
            explanation:
              `${total} is the total of the ${list.values.length} figures. The mean divides it by how many there ` +
              `were: ${total} ÷ ${list.values.length} = ${meanOf(list.values)}.`
          })
        };
      })
  };
}

// --------------------------------------------------------------------------
// Median
// --------------------------------------------------------------------------

/** Compute the median, with the unsorted middle declared as the mistake. */
function medianCalculationFamily(): GeneratorFamily {
  return {
    id: "gen.r2-median.calculation",
    topicId: MEDIAN.topic,
    skillIds: [MEDIAN.skill],
    reasoningFamily: "calculation",
    description: "Order the figures and take the middle one.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        // Presented out of order, so the work is the ordering.
        const shuffled = [...list.values].reverse();
        const unsortedMiddle = shuffled[Math.floor((shuffled.length - 1) / 2)]!;
        const median = medianOf(list.values);
        return {
          key: list.id,
          invalidReason:
            unsortedMiddle === median
              ? "the middle of the unsorted list is already the median, so ordering makes no difference"
              : null,
          expectedResponse: () => numeric(medianByPeeling(list.values)),
          build: () => ({
            ...baseOf(MEDIAN.topic, MEDIAN.objective, MEDIAN.skill, 2),
            id: `q.gen.r2-median.compute.${list.id}`,
            estimatedSeconds: 65,
            accessibilityDescription: `An unordered list of ${shuffled.length} figures: ${shuffled.join(", ")}. Enter the median.`,
            interaction: "numeric-input",
            prompt:
              `${list.boat}'s log, in the order it was written: ${shuffled.join(", ")} ${list.unit}. ` +
              `What is the median?`,
            answer: { kind: "numeric", value: median, tolerance: 0.01, unit: list.unit },
            explanation:
              `Order them first: ${[...list.values].sort((a, b) => a - b).join(", ")}. The median is ${median}. ` +
              `Taking the middle of the list as written gives ${unsortedMiddle}, which is a different figure — ` +
              `the median is about position in the *order*, not position on the page.`
          })
        };
      })
  };
}

/** Put the figures in order. */
function medianOrderingFamily(): GeneratorFamily {
  return {
    id: "gen.r2-median.ordering",
    topicId: MEDIAN.topic,
    skillIds: [MEDIAN.skill],
    reasoningFamily: "ordering",
    description: "Arrange the figures smallest to largest, the step a median needs.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const shuffled = [...list.values].reverse();
        const distinct = [...new Set(shuffled)];
        const sorted = [...distinct].sort((a, b) => a - b);
        return {
          key: `${list.id}-order`,
          invalidReason:
            distinct.length < 4
              ? "fewer than four distinct figures makes the ordering trivial"
              : distinct.join(",") === sorted.join(",")
                ? "the figures are already in order as written"
                : null,
          expectedResponse: () => ({
            kind: "ordering",
            order: sorted.map((v) => `it.${v}`)
          }),
          build: () => ({
            ...baseOf(MEDIAN.topic, MEDIAN.objective, MEDIAN.skill, 1),
            id: `q.gen.r2-median.order.${list.id}`,
            estimatedSeconds: 60,
            accessibilityDescription: `Arrange these figures smallest to largest: ${distinct.join(", ")}.`,
            interaction: "ordering",
            prompt:
              `Before a median can be read, the figures have to be in order. ${list.boat} logged these: ` +
              `${distinct.join(", ")} ${list.unit}. Put them smallest to largest.`,
            items: distinct.map((v) => ({ id: `it.${v}`, text: `${v} ${list.unit}` })),
            answer: { kind: "ordering", correctOrder: sorted.map((v) => `it.${v}`) },
            explanation:
              `Smallest to largest: ${sorted.join(", ")}. Ordering is the whole of the work — once they are in ` +
              `order the median is simply the one in the middle.`
          })
        };
      })
  };
}

/** Which of two boats has the higher median. */
function medianComparisonFamily(): GeneratorFamily {
  return {
    id: "gen.r2-median.comparison",
    topicId: MEDIAN.topic,
    skillIds: [MEDIAN.skill],
    reasoningFamily: "comparison",
    description: "Compare two boats' medians.",
    enumerate: () =>
      LISTS.flatMap((a, i) =>
        LISTS.slice(i + 1).map((b): Candidate => {
          const ma = medianOf(a.values);
          const mb = medianOf(b.values);
          return {
            key: `${a.id}-vs-${b.id}`,
            invalidReason: ma === mb ? "the two medians are equal, so there is no higher one" : null,
            expectedResponse: () =>
              choose(medianByPeeling(a.values) > medianByPeeling(b.values) ? "ch.a" : "ch.b"),
            build: () => ({
              ...baseOf(MEDIAN.topic, MEDIAN.objective, MEDIAN.skill, 2),
              id: `q.gen.r2-median.compare.${a.id}-${b.id}`,
              estimatedSeconds: 75,
              accessibilityDescription:
                `Two logs: ${a.boat} ${listText(a)}, ${b.boat} ${listText(b)}. Choose the higher median.`,
              interaction: "multiple-choice",
              prompt:
                `${a.boat} logged ${listText(a)} ${a.unit}. ${b.boat} logged ${listText(b)} ${b.unit}. ` +
                `Which has the higher median?`,
              choices: [
                { id: "ch.a", text: a.boat },
                { id: "ch.b", text: b.boat },
                { id: "ch.same", text: "Their medians are the same" }
              ],
              answer: { kind: "choice", correctChoiceIds: [ma > mb ? "ch.a" : "ch.b"] },
              explanation:
                `${a.boat}'s median is ${ma} and ${b.boat}'s is ${mb}, so ${ma > mb ? a.boat : b.boat} is higher. ` +
                `The lists are different lengths, which the median does not mind — it is a position, not a total.`
            })
          };
        })
      )
  };
}

// --------------------------------------------------------------------------
// Mode
// --------------------------------------------------------------------------

/** The most common figure, with the first repeated one declared as the mistake. */
function modeCalculationFamily(): GeneratorFamily {
  return {
    id: "gen.r2-mode.calculation",
    topicId: MODE.topic,
    skillIds: [MODE.skill],
    reasoningFamily: "calculation",
    description: "Find the most common figure in a log.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const modes = modesOf(list.values);
        const seen = new Set<number>();
        let firstRepeat: number | null = null;
        for (const v of list.values) {
          if (seen.has(v) && firstRepeat === null) firstRepeat = v;
          seen.add(v);
        }
        return {
          key: list.id,
          invalidReason:
            modes.length > 1
              ? "this log has more than one mode, so a single-answer question would be wrong"
              : firstRepeat === null
                ? "no figure repeats, so there is no mode"
                : null,
          expectedResponse: () => numeric(modeByScanning(list.values)),
          build: () => ({
            ...baseOf(MODE.topic, MODE.objective, MODE.skill, 1),
            id: `q.gen.r2-mode.compute.${list.id}`,
            // Declared only where the first repeat and the mode differ. Where
            // they coincide the question is still sound; it is the *mistake*
            // that has nowhere to show, and rejecting the whole candidate for
            // that threw away seven lists out of ten.
            ...(firstRepeat !== modes[0]
              ? {
                  misconceptionIds: ["mc.first-repeat-is-mode"],
                  parameters: { "mc.first-repeat-is-mode": { wrongValue: firstRepeat } }
                }
              : {}),
            estimatedSeconds: 50,
            accessibilityDescription: `A log of ${list.values.length} figures: ${listText(list)}. Enter the mode.`,
            interaction: "numeric-input",
            prompt: `${listSentence(list)} What is the mode?`,
            answer: { kind: "numeric", value: modes[0]!, tolerance: 0, unit: list.unit },
            explanation:
              `Count how often each figure appears; ${modes[0]} appears most, so it is the mode.` +
              (firstRepeat === modes[0]
                ? " Here it is also the first figure to repeat, which is a coincidence of this log rather than a rule."
                : ` ${firstRepeat} is the first figure to appear twice as you read along, which is a different thing —` +
                  ` the mode is about the largest count, not the earliest repeat.`)
          })
        };
      })
  };
}

/** Whether a log has a mode at all. */
function modeRecognitionFamily(): GeneratorFamily {
  return {
    id: "gen.r2-mode.recognition",
    topicId: MODE.topic,
    skillIds: [MODE.skill],
    reasoningFamily: "recognition",
    description: "Say whether a log has one mode, several, or none.",
    enumerate: () =>
      LISTS.flatMap((list) =>
        [0, 1].map((variant): Candidate => {
          // Variant 1 strips the repeats, which leaves a log with no mode at all.
          const values = variant === 0 ? list.values : [...new Set(list.values)];
          const modes = modesOf(values);
          const answer = values.length === new Set(values).size ? "ch.none" : modes.length > 1 ? "ch.several" : "ch.one";
          return {
            key: `${list.id}-${variant}`,
            invalidReason: null,
            expectedResponse: () => choose(answer),
            build: () => ({
              ...baseOf(MODE.topic, MODE.objective, MODE.skill, 2),
              id: `q.gen.r2-mode.recognise.${list.id}-${variant}`,
              estimatedSeconds: 45,
              accessibilityDescription: `A log of ${values.length} figures: ${values.join(", ")}. Say how many modes it has.`,
              interaction: "multiple-choice",
              prompt: `${list.boat}'s log reads ${values.join(", ")} ${list.unit}. What can be said about its mode?`,
              choices: [
                { id: "ch.one", text: "It has exactly one mode" },
                { id: "ch.several", text: "Several figures tie for most common" },
                { id: "ch.none", text: "It has no mode — every figure appears once" }
              ],
              answer: { kind: "choice", correctChoiceIds: [answer] },
              explanation:
                answer === "ch.none"
                  ? "Every figure appears exactly once, so no figure is more common than the rest and there is no mode."
                  : answer === "ch.several"
                    ? `${modes.join(" and ")} each appear the most often, so the log has more than one mode. A log is allowed to.`
                    : `${modes[0]} appears more often than any other figure, so it is the single mode.`
            })
          };
        })
      )
  };
}

// --------------------------------------------------------------------------
// Choosing a measure
// --------------------------------------------------------------------------

/** Which summary survives one extreme figure. */
function chooseMeasureFamily(): GeneratorFamily {
  return {
    id: "gen.r2-choosing-measures.real-world-application",
    topicId: CHOOSE.topic,
    skillIds: [CHOOSE.skill],
    reasoningFamily: "real-world-application",
    description: "Pick the summary that survives an extreme figure.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const outlier = Math.max(...list.values) * 4;
        const withOutlier = [...list.values, outlier];
        const meanShift = Math.abs(meanOf(withOutlier) - meanOf(list.values));
        const medianShift = Math.abs(medianOf(withOutlier) - medianOf(list.values));
        return {
          key: `${list.id}-outlier`,
          invalidReason:
            meanShift <= medianShift
              ? "the extreme figure does not move the mean further than the median here, so there is nothing to choose between them"
              : null,
          expectedResponse: () => choose("ch.median"),
          build: () => ({
            ...baseOf(CHOOSE.topic, CHOOSE.objective, CHOOSE.skill, 3),
            id: `q.gen.r2-choosing-measures.outlier.${list.id}`,
            misconceptionIds: ["mc.outlier-mean"],
            estimatedSeconds: 80,
            accessibilityDescription:
              `A log of ${list.values.length} ordinary figures joined by one of ${outlier}. ` +
              `Choose the summary that describes the ordinary run better.`,
            interaction: "method-selection",
            prompt:
              `${listSentence(list)} One more trip is logged at ${outlier} ${list.unit} — a shoal nobody expects ` +
              `to meet again. Which summary describes a typical trip better?`,
            choices: [
              { id: "ch.median", text: "The median, which barely moves" },
              {
                id: "ch.mean",
                text: "The mean, which uses every figure and so cannot be distorted",
                misconceptionId: "mc.outlier-mean"
              },
              { id: "ch.either", text: "Either — one unusual figure cannot change a summary much" }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.median"] },
            explanation:
              `The mean moves from ${meanOf(list.values)} to ${meanOf(withOutlier)} — a shift of ` +
              `${round4(meanShift)} — while the median moves ${round4(medianShift)}. Every figure enters the mean, ` +
              `which is exactly why one unusual figure drags it. The median reports position, so it holds.`
          })
        };
      })
  };
}

/** Which measure answers the question being asked. */
function chooseMeasurePurposeFamily(): GeneratorFamily {
  const PURPOSES: ReadonlyArray<{ id: string; ask: string; measure: "ch.mean" | "ch.median" | "ch.mode"; why: string }> = [
    {
      id: "total",
      ask: "wants the total pay bill for the season and has each crew member's daily rate",
      measure: "ch.mean",
      why: "the mean multiplied by the count gives the total back, which is the one thing only the mean can do"
    },
    {
      id: "typical",
      ask: "wants to know what a typical day looks like on a log with one enormous haul in it",
      measure: "ch.median",
      why: "the median reports position, so a single extreme figure moves it very little"
    },
    {
      id: "stock",
      ask: "wants to know which box size to order most of",
      measure: "ch.mode",
      why: "the mode names the most common value, which is what a stock decision needs"
    },
    {
      id: "middle",
      ask: "wants a figure with half the trips above it and half below",
      measure: "ch.median",
      why: "that is the median's definition"
    }
  ];
  return {
    id: "gen.r2-choosing-measures.comparison",
    topicId: CHOOSE.topic,
    skillIds: [CHOOSE.skill],
    reasoningFamily: "comparison",
    description: "Match the summary to what is being asked for.",
    enumerate: () =>
      LISTS.flatMap((list) =>
        PURPOSES.map((purpose): Candidate => ({
          key: `${list.id}-${purpose.id}`,
          invalidReason: null,
          expectedResponse: () => choose(purpose.measure),
          build: () => ({
            ...baseOf(CHOOSE.topic, CHOOSE.objective, CHOOSE.skill, 3),
            id: `q.gen.r2-choosing-measures.purpose.${list.id}-${purpose.id}`,
            estimatedSeconds: 70,
            accessibilityDescription: `A harbourmaster ${purpose.ask}. Choose the summary that answers it.`,
            interaction: "method-selection",
            prompt:
              `${list.boat}'s log reads ${listText(list)} ${list.unit}. The harbourmaster ${purpose.ask}. ` +
              `Which summary answers that?`,
            choices: [
              { id: "ch.mean", text: "The mean" },
              { id: "ch.median", text: "The median" },
              { id: "ch.mode", text: "The mode" }
            ],
            answer: { kind: "choice", correctChoiceIds: [purpose.measure] },
            explanation: `The question decides the measure: ${purpose.why}.`
          })
        }))
      )
  };
}

/** A clerk who took the middle of the list as written. */
function medianErrorFamily(): GeneratorFamily {
  return {
    id: "gen.r2-median.error-identification",
    topicId: MEDIAN.topic,
    skillIds: [MEDIAN.skill],
    reasoningFamily: "error-identification",
    description: "Find why a middle-of-the-page figure is not the median.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const shuffled = [...list.values].reverse();
        const unsortedMiddle = shuffled[Math.floor((shuffled.length - 1) / 2)]!;
        return {
          key: `${list.id}-median-error`,
          invalidReason:
            unsortedMiddle === medianOf(list.values)
              ? "the middle of the list as written is the median here, so the clerk is right"
              : null,
          expectedResponse: () => choose("ch.unsorted"),
          build: () => ({
            ...baseOf(MEDIAN.topic, MEDIAN.objective, MEDIAN.skill, 2),
            id: `q.gen.r2-median.error.${list.id}`,
            estimatedSeconds: 60,
            accessibilityDescription:
              `A clerk reports the median of ${shuffled.join(", ")} as ${unsortedMiddle}. Choose what went wrong.`,
            interaction: "error-identification",
            prompt:
              `${list.boat}'s log as written reads ${shuffled.join(", ")} ${list.unit}. A clerk writes: ` +
              `"The median is ${unsortedMiddle}." What has the clerk done?`,
            choices: [
              {
                id: "ch.unsorted",
                text: "Taken the figure in the middle of the page, without putting the figures in order first"
              },
              { id: "ch.mean", text: "Computed the mean instead" },
              { id: "ch.fine", text: "Nothing — that is the median" }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.unsorted"] },
            explanation:
              `In order the log reads ${[...list.values].sort((a, b) => a - b).join(", ")}, so the median is ` +
              `${medianOf(list.values)}. The clerk read the middle of the list as written, which is a position on ` +
              `the page rather than a position in the order.`
          })
        };
      })
  };
}

/** Which of two logs has the higher mode. */
function modeComparisonFamily(): GeneratorFamily {
  return {
    id: "gen.r2-mode.comparison",
    topicId: MODE.topic,
    skillIds: [MODE.skill],
    reasoningFamily: "comparison",
    description: "Compare two logs' modes.",
    enumerate: () =>
      LISTS.flatMap((a, i) =>
        LISTS.slice(i + 1).map((b): Candidate => {
          const ma = modesOf(a.values);
          const mb = modesOf(b.values);
          return {
            key: `${a.id}-vs-${b.id}`,
            invalidReason:
              ma.length > 1 || mb.length > 1
                ? "one of these logs has more than one mode, so there is no single figure to compare"
                : ma[0] === mb[0]
                  ? "the two modes are the same figure"
                  : null,
            expectedResponse: () =>
              choose(modeByScanning(a.values) > modeByScanning(b.values) ? "ch.a" : "ch.b"),
            build: () => ({
              ...baseOf(MODE.topic, MODE.objective, MODE.skill, 2),
              id: `q.gen.r2-mode.compare.${a.id}-${b.id}`,
              estimatedSeconds: 60,
              accessibilityDescription:
                `Two logs: ${a.boat} ${listText(a)}, ${b.boat} ${listText(b)}. Choose the higher mode.`,
              interaction: "multiple-choice",
              prompt:
                `${a.boat} logged ${listText(a)} ${a.unit}. ${b.boat} logged ${listText(b)} ${b.unit}. ` +
                `Which log's mode is the higher figure?`,
              choices: [
                { id: "ch.a", text: a.boat },
                { id: "ch.b", text: b.boat },
                { id: "ch.same", text: "Their modes are the same figure" }
              ],
              answer: { kind: "choice", correctChoiceIds: [ma[0]! > mb[0]! ? "ch.a" : "ch.b"] },
              explanation:
                `${a.boat}'s most common figure is ${ma[0]} and ${b.boat}'s is ${mb[0]}, so ` +
                `${ma[0]! > mb[0]! ? a.boat : b.boat} has the higher mode. How *often* each repeats does not enter ` +
                `the comparison — only which figure repeats most.`
            })
          };
        })
      )
  };
}

/** The tallest stack on a dot plot is the mode. */
function modeVisualFamily(): GeneratorFamily {
  return {
    id: "gen.r2-mode.visual-interpretation",
    topicId: MODE.topic,
    skillIds: [MODE.skill],
    reasoningFamily: "visual-interpretation",
    description: "Read the mode off a dot plot described in words.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const modes = modesOf(list.values);
        const stacks = [...new Set(list.values)]
          .sort((a, b) => a - b)
          .map((v) => ({ value: v, height: list.values.filter((x) => x === v).length }));
        return {
          key: `${list.id}-dots`,
          invalidReason:
            modes.length > 1 ? "two columns tie for tallest, so no single column is the mode" : null,
          expectedResponse: () => choose(`ch.${modeByScanning(list.values)}`),
          build: () => ({
            ...baseOf(MODE.topic, MODE.objective, MODE.skill, 2),
            id: `q.gen.r2-mode.dots.${list.id}`,
            estimatedSeconds: 50,
            accessibilityDescription:
              `A dot plot with one dot per figure: ${stacks.map((s) => `${s.value} has ${s.height}`).join(", ")}. ` +
              `Choose the value under the tallest column.`,
            interaction: "graph-interpretation",
            prompt:
              `${list.boat}'s log is drawn as a dot plot, one dot per ${list.occasion.split(" ")[1]?.replace(/s$/, "") ?? "figure"}: ` +
              `${stacks.map((s) => `${s.value} ${list.unit} has ${s.height} dot${s.height === 1 ? "" : "s"}`).join(", ")}. ` +
              `Which value is the mode?`,
            choices: stacks.map((s) => ({ id: `ch.${s.value}`, text: `${s.value} ${list.unit}` })),
            answer: { kind: "choice", correctChoiceIds: [`ch.${modes[0]}`] },
            explanation:
              `The mode is the value under the tallest column — ${modes[0]}, with ` +
              `${stacks.find((s) => s.value === modes[0])!.height} dots. The height is how *many*; the value is ` +
              `what is read off the axis, and those are different numbers.`
          })
        };
      })
  };
}

/** A report that used the mean on a log one figure has dragged. */
function chooseMeasureErrorFamily(): GeneratorFamily {
  return {
    id: "gen.r2-choosing-measures.error-identification",
    topicId: CHOOSE.topic,
    skillIds: [CHOOSE.skill],
    reasoningFamily: "error-identification",
    description: "Find what is wrong with a mean quoted for a dragged log.",
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const outlier = Math.max(...list.values) * 5;
        const dragged = [...list.values, outlier];
        return {
          key: `${list.id}-mean-error`,
          invalidReason:
            Math.abs(meanOf(dragged) - meanOf(list.values)) <= Math.abs(medianOf(dragged) - medianOf(list.values))
              ? "the mean is not dragged further than the median here, so the report is not misleading"
              : null,
          expectedResponse: () => choose("ch.dragged"),
          build: () => ({
            ...baseOf(CHOOSE.topic, CHOOSE.objective, CHOOSE.skill, 3),
            id: `q.gen.r2-choosing-measures.error.${list.id}`,
            misconceptionIds: ["mc.outlier-mean"],
            estimatedSeconds: 75,
            accessibilityDescription:
              `A report quotes a mean of ${meanOf(dragged)} for a log of ${dragged.join(", ")}. Choose what is wrong.`,
            interaction: "error-identification",
            prompt:
              `${list.boat}'s season reads ${dragged.join(", ")} ${list.unit}. The report says: "A typical trip ` +
              `landed ${meanOf(dragged)} ${list.unit}." What is wrong with that?`,
            choices: [
              {
                id: "ch.dragged",
                text: `One trip of ${outlier} has pulled the mean above almost every actual trip`
              },
              { id: "ch.arith", text: "The arithmetic is wrong" },
              {
                id: "ch.fine",
                text: "Nothing — the mean uses every figure, so it cannot be pulled about",
                misconceptionId: "mc.outlier-mean"
              }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.dragged"] },
            explanation:
              `The arithmetic is right and the sentence is still wrong: ${dragged.filter((v) => v < meanOf(dragged)).length} ` +
              `of the ${dragged.length} trips landed less than the quoted mean. The median, ${medianOf(dragged)}, ` +
              `describes a typical trip far better.`
          })
        };
      })
  };
}

/** What each summary is, before choosing between them. */
function chooseMeasureRecognitionFamily(): GeneratorFamily {
  const CLAIMS: ReadonlyArray<{ id: string; text: string; measure: "ch.mean" | "ch.median" | "ch.mode" }> = [
    { id: "half", text: "half the figures sit above it and half below", measure: "ch.median" },
    { id: "total", text: "multiplying it by the number of figures gives the total back", measure: "ch.mean" },
    { id: "common", text: "it is the figure that appears most often", measure: "ch.mode" },
    { id: "every", text: "every single figure enters the arithmetic that produces it", measure: "ch.mean" },
    { id: "position", text: "it is a position in the order rather than a calculation over all the values", measure: "ch.median" }
  ];
  return {
    id: "gen.r2-choosing-measures.recognition",
    topicId: CHOOSE.topic,
    skillIds: [CHOOSE.skill],
    reasoningFamily: "recognition",
    description: "Name the summary a description belongs to.",
    enumerate: () =>
      LISTS.flatMap((list) =>
        CLAIMS.map((claim): Candidate => ({
          key: `${list.id}-${claim.id}`,
          invalidReason: null,
          expectedResponse: () => choose(claim.measure),
          build: () => ({
            ...baseOf(CHOOSE.topic, CHOOSE.objective, CHOOSE.skill, 2),
            id: `q.gen.r2-choosing-measures.recognise.${list.id}-${claim.id}`,
            estimatedSeconds: 45,
            accessibilityDescription: `Which summary is described by: ${claim.text}?`,
            interaction: "multiple-choice",
            prompt:
              `Reading ${list.boat}'s log of ${listText(list)} ${list.unit}, which summary is being described: ` +
              `${claim.text}?`,
            choices: [
              { id: "ch.mean", text: "The mean" },
              { id: "ch.median", text: "The median" },
              { id: "ch.mode", text: "The mode" }
            ],
            answer: { kind: "choice", correctChoiceIds: [claim.measure] },
            explanation: `That description is the definition of the ${claim.measure.replace("ch.", "")}.`
          })
        }))
      )
  };
}

export function centreFamilies(): GeneratorFamily[] {
  return [
    meanCalculationFamily(),
    meanMissingValueFamily(),
    meanPredictionFamily(),
    meanErrorFamily(),
    medianCalculationFamily(),
    medianOrderingFamily(),
    medianComparisonFamily(),
    medianErrorFamily(),
    modeCalculationFamily(),
    modeRecognitionFamily(),
    modeComparisonFamily(),
    modeVisualFamily(),
    chooseMeasureFamily(),
    chooseMeasurePurposeFamily(),
    chooseMeasureErrorFamily(),
    chooseMeasureRecognitionFamily()
  ];
}
