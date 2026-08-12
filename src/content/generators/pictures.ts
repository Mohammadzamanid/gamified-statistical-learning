/**
 * Generator families for Region 2's remaining topics: the six graph kinds,
 * outliers, skew, comparing distributions, misleading graphs and data literacy.
 *
 * The fourth and last module to follow D-058's pattern, and the widest
 * application of it: a dot plot, a histogram and a box plot are three pictures
 * of one list, exactly as a mean, a median and a mode were three summaries of
 * it. So this reuses `centre.ts`'s catch lists again, and `counts.ts`'s
 * categorical logs for the bar charts, and adds one thing neither had — pairs,
 * for the scatterplots, which need a second measurement per case.
 *
 * Every chart is described in words rather than drawn, which is what the
 * authored questions in these lessons already do and what keeps a generated
 * question answerable without a rendered picture. The descriptions are built
 * from the data (D-053's habit), so a figure quoted in a prompt is the figure
 * the list actually holds.
 *
 * Conventions as everywhere: quartiles by the median of each half (D-045), the
 * variance dividing by how many readings there are (D-060), and a misconception
 * tagged only on a wrong option and only where its detector can fire (D-025,
 * D-057).
 */
import type { Question } from "../../shared/schemas";
import type { RawResponse } from "../../core/questions/types";
import type { Candidate, GeneratorFamily } from "../../core/generation/types";
import { LISTS, meanOf, medianOf, modesOf, type CatchList } from "./centre";
import { quartilesOf, rangeOf } from "./spread";

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

const round2 = (n: number): number => Number(n.toFixed(2));
const listText = (list: CatchList): string => list.values.join(", ");
const sortedOf = (list: CatchList): number[] => [...list.values].sort((a, b) => a - b);

/** One dot per reading, stacked over each distinct value. */
function stacksOf(list: CatchList): Array<{ value: number; height: number }> {
  return [...new Set(list.values)]
    .sort((a, b) => a - b)
    .map((value) => ({ value, height: list.values.filter((v) => v === value).length }));
}

function dotPlotWords(list: CatchList): string {
  return stacksOf(list)
    .map((s) => `${s.value} has ${s.height} dot${s.height === 1 ? "" : "s"}`)
    .join(", ");
}

function boxPlotWords(list: CatchList): string {
  const q = quartilesOf(list.values);
  return (
    `smallest ${Math.min(...list.values)}, first quartile ${q.q1}, median ${q.q2}, third quartile ${q.q3}, ` +
    `largest ${Math.max(...list.values)}`
  );
}

const BARS = { skill: "skill.r2-bar-charts", topic: "t.r2-bar-charts", objective: "obj.r2-bar-charts" };
const HISTOGRAMS = { skill: "skill.r2-histograms", topic: "t.r2-histograms", objective: "obj.r2-histograms" };
const DOTS = { skill: "skill.r2-dot-plots", topic: "t.r2-dot-plots", objective: "obj.r2-dot-plots" };
const BOXES = { skill: "skill.r2-box-plots", topic: "t.r2-box-plots", objective: "obj.r2-box-plots" };
const SCATTER = { skill: "skill.r2-scatterplots", topic: "t.r2-scatterplots", objective: "obj.r2-scatterplots" };
const CHOOSING = { skill: "skill.r2-choosing-graphs", topic: "t.r2-choosing-graphs", objective: "obj.r2-choosing-graphs" };
const OUTLIERS = { skill: "skill.r2-outliers", topic: "t.r2-outliers", objective: "obj.r2-outliers" };
const SKEW = { skill: "skill.r2-skew", topic: "t.r2-skew", objective: "obj.r2-skew" };
const COMPARING = { skill: "skill.r2-comparing-distributions", topic: "t.r2-comparing-distributions", objective: "obj.r2-comparing-distributions" };
const MISLEADING = { skill: "skill.r2-misleading-graphs", topic: "t.r2-misleading-graphs", objective: "obj.r2-misleading-graphs" };
const LITERACY = { skill: "skill.data-literacy", topic: "t.data-literacy", objective: "obj.read-data" };

type Topic = { skill: string; topic: string; objective: string };

/**
 * Which side a log's tail lies on, by the reading `l.r2-skew` teaches: a mean
 * above the median means a tail of high readings.
 *
 * Exported so the tests can pin it to hand-worked cases. A probe reversing it
 * failed nothing, because it feeds both the question's answer and the family's
 * expected response — D-059's shape exactly, in a third place.
 */
export function skewOf(list: CatchList): "right" | "left" | "symmetric" {
  const m = meanOf(list.values);
  const md = medianOf(list.values);
  if (m > md) return "right";
  if (m < md) return "left";
  return "symmetric";
}

// --------------------------------------------------------------------------
// Two builders, because most of these families differ only in what is asked
// --------------------------------------------------------------------------

/** A numeric question over each list. */
function numericOverLists(spec: {
  id: string;
  topic: Topic;
  reasoning: GeneratorFamily["reasoningFamily"];
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  seconds: number;
  invalid?: (list: CatchList) => string | null;
  ask: (list: CatchList) => string;
  words: (list: CatchList) => string;
  value: (list: CatchList) => number;
  independently: (list: CatchList) => number;
  unit?: (list: CatchList) => string;
  tolerance?: number;
  explain: (list: CatchList) => string;
  misconception?: { id: string; wrongValue: (list: CatchList) => number };
}): GeneratorFamily {
  return {
    id: spec.id,
    topicId: spec.topic.topic,
    skillIds: [spec.topic.skill],
    reasoningFamily: spec.reasoning,
    description: spec.description,
    enumerate: () =>
      LISTS.map((list): Candidate => {
        const wrong = spec.misconception?.wrongValue(list);
        return {
          key: list.id,
          invalidReason:
            (spec.invalid?.(list) ?? null) ??
            (wrong !== undefined && wrong === spec.value(list)
              ? "the declared mistake is the correct answer here, so it could only fire on a right response"
              : null),
          expectedResponse: () => numeric(spec.independently(list)),
          build: () => ({
            ...baseOf(spec.topic.topic, spec.topic.objective, spec.topic.skill, spec.difficulty),
            id: `${spec.id}.${list.id}`.replace("gen.", "q.gen."),
            estimatedSeconds: spec.seconds,
            accessibilityDescription: spec.words(list),
            interaction: "numeric-input",
            prompt: spec.ask(list),
            answer: {
              kind: "numeric",
              value: spec.value(list),
              tolerance: spec.tolerance ?? 0,
              ...(spec.unit ? { unit: spec.unit(list) } : {})
            },
            explanation: spec.explain(list),
            ...(spec.misconception && wrong !== undefined
              ? {
                  misconceptionIds: [spec.misconception.id],
                  parameters: { [spec.misconception.id]: { wrongValue: wrong } }
                }
              : {})
          })
        };
      })
  };
}

/** A choice question over each list, with the answer chosen per list. */
function choiceOverLists(spec: {
  id: string;
  topic: Topic;
  reasoning: GeneratorFamily["reasoningFamily"];
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  seconds: number;
  interaction?: "multiple-choice" | "graph-interpretation" | "method-selection" | "error-identification";
  invalid?: (list: CatchList) => string | null;
  ask: (list: CatchList) => string;
  words: (list: CatchList) => string;
  choices: (list: CatchList) => ReadonlyArray<{ id: string; text: string; misconceptionId?: string }>;
  correct: (list: CatchList) => string;
  explain: (list: CatchList) => string;
  misconceptionIds?: readonly string[];
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
        invalidReason: spec.invalid?.(list) ?? null,
        expectedResponse: () => choose(spec.correct(list)),
        build: () => ({
          ...baseOf(spec.topic.topic, spec.topic.objective, spec.topic.skill, spec.difficulty),
          id: `${spec.id}.${list.id}`.replace("gen.", "q.gen."),
          estimatedSeconds: spec.seconds,
          accessibilityDescription: spec.words(list),
          interaction: spec.interaction ?? "multiple-choice",
          prompt: spec.ask(list),
          choices: [...spec.choices(list)],
          answer: { kind: "choice", correctChoiceIds: [spec.correct(list)] },
          explanation: spec.explain(list),
          ...(spec.misconceptionIds ? { misconceptionIds: [...spec.misconceptionIds] } : {})
        })
      }))
  };
}

/** A pairwise choice question, for the comparison families. */
function pairwise(spec: {
  id: string;
  topic: Topic;
  reasoning: GeneratorFamily["reasoningFamily"];
  description: string;
  noun: string;
  ask: (a: CatchList, b: CatchList) => string;
  of: (list: CatchList) => number;
  independently: (list: CatchList) => number;
  explain: (a: CatchList, b: CatchList) => string;
}): GeneratorFamily {
  return {
    id: spec.id,
    topicId: spec.topic.topic,
    skillIds: [spec.topic.skill],
    reasoningFamily: spec.reasoning,
    description: spec.description,
    enumerate: () =>
      LISTS.flatMap((a, i) =>
        LISTS.slice(i + 1).map((b): Candidate => ({
          key: `${a.id}-vs-${b.id}`,
          invalidReason: spec.of(a) === spec.of(b) ? `the two ${spec.noun}s are equal` : null,
          expectedResponse: () => choose(spec.independently(a) > spec.independently(b) ? "ch.a" : "ch.b"),
          build: () => ({
            ...baseOf(spec.topic.topic, spec.topic.objective, spec.topic.skill, 3),
            id: `${spec.id}.${a.id}-${b.id}`.replace("gen.", "q.gen."),
            estimatedSeconds: 80,
            accessibilityDescription: `Two logs compared by ${spec.noun}: ${a.boat} and ${b.boat}.`,
            interaction: "multiple-choice",
            prompt: spec.ask(a, b),
            choices: [
              { id: "ch.a", text: a.boat },
              { id: "ch.b", text: b.boat },
              { id: "ch.same", text: `Their ${spec.noun}s are the same` }
            ],
            answer: { kind: "choice", correctChoiceIds: [spec.of(a) > spec.of(b) ? "ch.a" : "ch.b"] },
            explanation: spec.explain(a, b)
          })
        }))
      )
  };
}

// --------------------------------------------------------------------------
// Scatterplots need pairs, which no earlier corpus holds
// --------------------------------------------------------------------------

interface PairedLog {
  readonly id: string;
  readonly boat: string;
  readonly xName: string;
  readonly yName: string;
  readonly xUnit: string;
  readonly yUnit: string;
  readonly points: ReadonlyArray<readonly [number, number]>;
}

const PAIRED: readonly PairedLog[] = [
  {
    id: "hours-crates",
    boat: "the Kittiwake",
    xName: "hours at sea",
    yName: "crates landed",
    xUnit: "hours",
    yUnit: "crates",
    points: [[3, 4], [4, 5], [5, 7], [6, 8], [7, 10], [8, 11], [9, 6], [10, 14]]
  },
  {
    id: "crew-boxes",
    boat: "the Fulmar",
    xName: "hands aboard",
    yName: "boxes packed",
    xUnit: "hands",
    yUnit: "boxes",
    points: [[2, 6], [2, 8], [3, 11], [3, 13], [4, 15], [4, 18], [5, 21], [5, 24]]
  },
  {
    id: "depth-catch",
    boat: "the Gannet",
    xName: "depth fished",
    yName: "crates landed",
    xUnit: "metres",
    yUnit: "crates",
    points: [[10, 18], [12, 16], [14, 15], [16, 12], [18, 11], [20, 8], [22, 7], [24, 4]]
  },
  {
    id: "swell-catch",
    boat: "the Petrel",
    xName: "swell height",
    yName: "crates landed",
    xUnit: "metres",
    yUnit: "crates",
    points: [[1, 12], [1, 9], [2, 11], [2, 8], [3, 10], [3, 13], [4, 9], [4, 11]]
  },
  {
    id: "distance-fuel",
    boat: "the Skua",
    xName: "miles run",
    yName: "fuel burned",
    xUnit: "miles",
    yUnit: "litres",
    points: [[10, 20], [20, 40], [30, 60], [40, 80], [50, 100], [60, 120], [70, 140], [80, 160]]
  },
  {
    id: "wind-catch",
    boat: "the Guillemot",
    xName: "wind force",
    yName: "crates landed",
    xUnit: "on the Beaufort scale",
    yUnit: "crates",
    points: [[2, 14], [3, 13], [4, 11], [5, 9], [6, 7], [7, 5], [8, 3], [9, 2]]
  },
  {
    id: "nets-catch",
    boat: "the Razorbill",
    xName: "nets shot",
    yName: "crates landed",
    xUnit: "nets",
    yUnit: "crates",
    points: [[1, 3], [2, 5], [3, 8], [4, 10], [5, 13], [6, 15], [7, 18], [8, 21]]
  },
  {
    id: "price-sales",
    boat: "the Eider",
    xName: "price per box",
    yName: "boxes sold",
    xUnit: "pounds",
    yUnit: "boxes",
    points: [[4, 30], [5, 26], [6, 22], [7, 19], [8, 15], [9, 12], [10, 8], [11, 5]]
  },
  {
    id: "hours-fuel",
    boat: "the Scoter",
    xName: "hours steaming",
    yName: "fuel burned",
    xUnit: "hours",
    yUnit: "litres",
    points: [[1, 14], [2, 27], [3, 41], [4, 55], [5, 68], [6, 82], [7, 95], [8, 109]]
  },
  {
    id: "moon-catch",
    boat: "the Curlew",
    xName: "days past the new moon",
    yName: "crates landed",
    xUnit: "days",
    yUnit: "crates",
    points: [[2, 9], [5, 12], [8, 7], [11, 13], [14, 8], [17, 11], [20, 10], [23, 12]]
  },
  {
    id: "age-repairs",
    boat: "the Tern",
    xName: "years since refit",
    yName: "repair callouts",
    xUnit: "years",
    yUnit: "callouts",
    points: [[1, 1], [2, 1], [3, 3], [4, 2], [5, 5], [6, 6], [7, 6], [8, 9]]
  }
];

/** Rising, falling, or neither — read off the pairs rather than declared. */
export function directionOf(log: PairedLog): "rising" | "falling" | "neither" {
  let rises = 0;
  let falls = 0;
  for (let i = 1; i < log.points.length; i += 1) {
    const previous = log.points[i - 1]!;
    const current = log.points[i]!;
    if (current[1] > previous[1]) rises += 1;
    if (current[1] < previous[1]) falls += 1;
  }
  if (rises >= falls * 3) return "rising";
  if (falls >= rises * 3) return "falling";
  return "neither";
}

function pairsText(log: PairedLog): string {
  return log.points.map(([x, y]) => `(${x}, ${y})`).join(", ");
}

function scatterFamilies(): GeneratorFamily[] {
  const DIRECTION_WORDS = {
    rising: "As one goes up, so does the other",
    falling: "As one goes up, the other goes down",
    neither: "Neither — the cloud has no clear slope"
  } as const;
  return [
    {
      id: "gen.r2-scatterplots.visual-interpretation",
      topicId: SCATTER.topic,
      skillIds: [SCATTER.skill],
      reasoningFamily: "visual-interpretation",
      description: "Read one point's second measurement off a scatterplot.",
      enumerate: () =>
        PAIRED.flatMap((log) =>
          log.points.map(([x, y], index): Candidate => ({
            key: `${log.id}-${index}`,
            invalidReason:
              log.points.filter(([px]) => px === x).length > 1
                ? "two points share this horizontal position, so naming it does not name a point"
                : null,
            // A choice, not a number: this family publishes options and asks
            // which one the point sits at. Stating a numeric response made all
            // 72 candidates answer failures — the third time this exact slip has
            // been caught by the check that exists because of D-020.
            expectedResponse: () => {
              let found = 0;
              for (const [px, py] of log.points) if (px === x) found = py;
              return choose(`ch.${found}`);
            },
            build: () => ({
              ...baseOf(SCATTER.topic, SCATTER.objective, SCATTER.skill, 2),
              id: `q.gen.r2-scatterplots.read.${log.id}-${index}`,
              estimatedSeconds: 55,
              accessibilityDescription:
                `A scatterplot of ${log.yName} against ${log.xName}, with points at ${pairsText(log)}. ` +
                `Enter the ${log.yName} for the point at ${x} ${log.xUnit}.`,
              interaction: "graph-interpretation",
              prompt:
                `${log.boat}'s season is plotted as ${log.yName} against ${log.xName}, one point per trip: ` +
                `${pairsText(log)}. How many ${log.yUnit} did the trip of ${x} ${log.xUnit} land?`,
              choices: [...new Set(log.points.map(([, py]) => py))]
                .sort((p, q) => p - q)
                .map((py) => ({ id: `ch.${py}`, text: `${py} ${log.yUnit}` })),
              answer: { kind: "choice", correctChoiceIds: [`ch.${y}`] },
              explanation:
                `Each point carries two numbers: how far along, and how far up. The point at ${x} ${log.xUnit} ` +
                `sits at ${y} ${log.yUnit}. Reading a scatterplot means reading both.`
            })
          }))
        )
    },
    {
      id: "gen.r2-scatterplots.recognition",
      topicId: SCATTER.topic,
      skillIds: [SCATTER.skill],
      reasoningFamily: "recognition",
      description: "Name the direction a cloud of points drifts.",
      enumerate: () =>
        PAIRED.map((log): Candidate => {
          const direction = directionOf(log);
          return {
            key: `${log.id}-direction`,
            invalidReason: null,
            expectedResponse: () => choose(`ch.${direction}`),
            build: () => ({
              ...baseOf(SCATTER.topic, SCATTER.objective, SCATTER.skill, 2),
              id: `q.gen.r2-scatterplots.direction.${log.id}`,
              estimatedSeconds: 55,
              accessibilityDescription:
                `A scatterplot of ${log.yName} against ${log.xName} with points at ${pairsText(log)}. ` +
                `Choose the direction the cloud drifts.`,
              interaction: "graph-interpretation",
              prompt:
                `${log.boat}'s trips are plotted as ${log.yName} against ${log.xName}: ${pairsText(log)}. ` +
                `Which way does the cloud drift?`,
              choices: [
                { id: "ch.rising", text: DIRECTION_WORDS.rising },
                { id: "ch.falling", text: DIRECTION_WORDS.falling },
                { id: "ch.neither", text: DIRECTION_WORDS.neither }
              ],
              answer: { kind: "choice", correctChoiceIds: [`ch.${direction}`] },
              explanation:
                `Following the points from left to right, ${
                  direction === "rising"
                    ? `the ${log.yName} climbs as the ${log.xName} does`
                    : direction === "falling"
                      ? `the ${log.yName} falls as the ${log.xName} climbs`
                      : `the ${log.yName} goes up and down with no settled direction`
                }. A drift is a tendency across the cloud, not a rule every point obeys.`
            })
          };
        })
    },
    {
      id: "gen.r2-scatterplots.error-identification",
      topicId: SCATTER.topic,
      skillIds: [SCATTER.skill],
      reasoningFamily: "error-identification",
      description: "Find the leap from a drift to a cause.",
      enumerate: () =>
        PAIRED.map((log): Candidate => ({
          key: `${log.id}-cause`,
          invalidReason:
            directionOf(log) === "neither" ? "a cloud with no drift gives nobody a cause to claim" : null,
          expectedResponse: () => choose("ch.cause"),
          build: () => ({
            ...baseOf(SCATTER.topic, SCATTER.objective, SCATTER.skill, 3),
            id: `q.gen.r2-scatterplots.cause.${log.id}`,
            misconceptionIds: ["mc.correlation-causation"],
            estimatedSeconds: 75,
            accessibilityDescription:
              `A report claims that changing the ${log.xName} would change the ${log.yName}. Choose what is wrong.`,
            interaction: "error-identification",
            prompt:
              `${log.boat}'s plot of ${log.yName} against ${log.xName} — ${pairsText(log)} — drifts ` +
              `${directionOf(log)}. The harbourmaster writes: "Change the ${log.xName} and the ${log.yName} will ` +
              `follow." What is wrong with that?`,
            choices: [
              {
                id: "ch.cause",
                text: "The plot shows the two moving together; it does not show one causing the other"
              },
              { id: "ch.points", text: "Eight points are too few to plot at all" },
              {
                id: "ch.fine",
                text: "Nothing — a clear drift on a plot is what cause looks like",
                misconceptionId: "mc.correlation-causation"
              }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.cause"] },
            explanation:
              `A drift says the two vary together. Something else may drive both — the season, the weather, the ` +
              `skipper's habits — and only an experiment or a design that rules those out can support the word ` +
              `"follow".`
          })
        }))
    },
    {
      id: "gen.r2-scatterplots.calculation",
      topicId: SCATTER.topic,
      skillIds: [SCATTER.skill],
      reasoningFamily: "calculation",
      description: "Count the points above a stated level on a scatterplot.",
      enumerate: () =>
        PAIRED.flatMap((log) =>
          [...new Set(log.points.map(([, y]) => y))].sort((a, b) => a - b).map((level): Candidate => {
            const above = log.points.filter(([, y]) => y > level).length;
            return {
              key: `${log.id}-above-${level}`,
              invalidReason:
                above === 0
                  ? "no point sits above this level, so the question has a trivial answer"
                  : above === log.points.length
                    ? "every point sits above this level"
                    : null,
              expectedResponse: () => {
                let count = 0;
                for (const [, y] of log.points) if (y > level) count += 1;
                return numeric(count);
              },
              build: () => ({
                ...baseOf(SCATTER.topic, SCATTER.objective, SCATTER.skill, 2),
                id: `q.gen.r2-scatterplots.above.${log.id}-${level}`,
                estimatedSeconds: 60,
                accessibilityDescription:
                  `A scatterplot with points at ${pairsText(log)}. Enter how many sit above ${level} ${log.yUnit}.`,
                interaction: "numeric-input",
                prompt:
                  `${log.boat}'s trips are plotted as ${log.yName} against ${log.xName}: ${pairsText(log)}. ` +
                  `How many trips landed more than ${level} ${log.yUnit}?`,
                answer: { kind: "numeric", value: above, tolerance: 0, unit: "trips" },
                explanation:
                  `Reading up the vertical axis, ${above} of the ${log.points.length} points sit above ${level} ` +
                  `${log.yUnit}. A scatterplot answers questions about either measurement on its own as well as ` +
                  `about the relationship between them.`
              })
            };
          })
        )
    },
    {
      id: "gen.r2-scatterplots.comparison",
      topicId: SCATTER.topic,
      skillIds: [SCATTER.skill],
      reasoningFamily: "comparison",
      description: "Compare two plots by which drifts more clearly.",
      enumerate: () =>
        PAIRED.flatMap((a, i) =>
          PAIRED.slice(i + 1).map((b): Candidate => {
            const da = directionOf(a);
            const db = directionOf(b);
            return {
              key: `${a.id}-vs-${b.id}`,
              invalidReason: da === db ? "both clouds drift the same way, so there is nothing to choose" : null,
              expectedResponse: () => choose(da === "neither" ? "ch.b" : db === "neither" ? "ch.a" : "ch.differ"),
              build: () => ({
                ...baseOf(SCATTER.topic, SCATTER.objective, SCATTER.skill, 3),
                id: `q.gen.r2-scatterplots.compare.${a.id}-${b.id}`,
                estimatedSeconds: 85,
                accessibilityDescription:
                  `Two scatterplots: ${a.boat}'s ${a.yName} against ${a.xName}, and ${b.boat}'s ${b.yName} against ` +
                  `${b.xName}. Say what the pair shows.`,
                interaction: "multiple-choice",
                prompt:
                  `${a.boat}: ${a.yName} against ${a.xName} at ${pairsText(a)}. ` +
                  `${b.boat}: ${b.yName} against ${b.xName} at ${pairsText(b)}. ` +
                  `Which plot shows the clearer relationship?`,
                choices: [
                  { id: "ch.a", text: `${a.boat}'s` },
                  { id: "ch.b", text: `${b.boat}'s` },
                  { id: "ch.differ", text: "Both are clear — they simply drift in different directions" }
                ],
                answer: {
                  kind: "choice",
                  correctChoiceIds: [da === "neither" ? "ch.b" : db === "neither" ? "ch.a" : "ch.differ"]
                },
                explanation:
                  da === "neither"
                    ? `${a.boat}'s cloud has no settled direction, while ${b.boat}'s drifts ${db}.`
                    : db === "neither"
                      ? `${b.boat}'s cloud has no settled direction, while ${a.boat}'s drifts ${da}.`
                      : `Both drift clearly — one ${da}, the other ${db}. A falling drift is no less a relationship ` +
                        `than a rising one.`
              })
            };
          })
        )
    }
  ];
}

// --------------------------------------------------------------------------
// The families
// --------------------------------------------------------------------------

export function pictureFamilies(): GeneratorFamily[] {
  const outlierOf = (list: CatchList): number => {
    const q = quartilesOf(list.values);
    const fence = q.q3 + 1.5 * (q.q3 - q.q1);
    const beyond = list.values.filter((v) => v > fence);
    return beyond.length > 0 ? Math.max(...beyond) : Math.max(...list.values);
  };
  return [
    // ---- Dot plots -------------------------------------------------------
    numericOverLists({
      id: "gen.r2-dot-plots.visual-interpretation",
      topic: DOTS,
      reasoning: "visual-interpretation",
      description: "Read a column height off a dot plot.",
      difficulty: 1,
      seconds: 45,
      ask: (l) =>
        `${l.boat}'s log is drawn as a dot plot, one dot per reading: ${dotPlotWords(l)}. ` +
        `How many readings share the most common value?`,
      words: (l) => `A dot plot with columns: ${dotPlotWords(l)}. Enter the tallest column's height.`,
      value: (l) => Math.max(...stacksOf(l).map((s) => s.height)),
      independently: (l) => {
        let tallest = 0;
        for (const v of new Set(l.values)) {
          let count = 0;
          for (const other of l.values) if (other === v) count += 1;
          if (count > tallest) tallest = count;
        }
        return tallest;
      },
      explain: (l) =>
        `The tallest column stands ${Math.max(...stacksOf(l).map((s) => s.height))} dots high, over the value ` +
        `${modesOf(l.values).join(" and ")}. The height is how many readings share that value — the value itself ` +
        `is read off the axis, and the two are different numbers.`,
      // No misconception declared. `mc.dot-height-read-as-value` is a
      // tagged-distractor, which needs an option to sit on and can never fire
      // from a typed number (D-025, D-057). It lives on the error-identification
      // family below, where there is an option that expresses it.
    }),
    choiceOverLists({
      id: "gen.r2-dot-plots.recognition",
      topic: DOTS,
      reasoning: "recognition",
      description: "Say what one dot on a dot plot stands for.",
      difficulty: 1,
      seconds: 40,
      ask: (l) => `${l.boat}'s ${l.values.length} readings are drawn as a dot plot. What does one dot stand for?`,
      words: (l) => `A dot plot of ${l.values.length} readings. Choose what a single dot stands for.`,
      choices: (l) => [
        { id: "ch.one", text: `One reading — one of the ${l.values.length} figures in the log` },
        { id: "ch.value", text: "The value written beneath the column" },
        { id: "ch.group", text: "A group of readings falling in an interval" }
      ],
      correct: () => "ch.one",
      explain: (l) =>
        `A dot plot draws one dot per reading, so all ${l.values.length} are visible and nothing is pooled. ` +
        `Pooling into intervals is what a histogram does, and it is the difference between the two pictures.`
    }),
    pairwise({
      id: "gen.r2-dot-plots.comparison",
      topic: DOTS,
      reasoning: "comparison",
      description: "Compare two dot plots by their tallest column.",
      noun: "tallest column",
      ask: (a, b) =>
        `${a.boat}'s dot plot: ${dotPlotWords(a)}. ${b.boat}'s: ${dotPlotWords(b)}. Whose tallest column is taller?`,
      of: (l) => Math.max(...stacksOf(l).map((s) => s.height)),
      independently: (l) => Math.max(...stacksOf(l).map((s) => s.height)),
      explain: (a, b) =>
        `${a.boat}'s tallest column stands ${Math.max(...stacksOf(a).map((s) => s.height))} dots and ${b.boat}'s ` +
        `${Math.max(...stacksOf(b).map((s) => s.height))}. A taller column means more readings agreed, not that ` +
        `they were larger.`
    }),
    choiceOverLists({
      id: "gen.r2-dot-plots.error-identification",
      topic: DOTS,
      reasoning: "error-identification",
      description: "Find a column height read as a value.",
      difficulty: 2,
      seconds: 55,
      interaction: "error-identification",
      invalid: (l) =>
        Math.max(...stacksOf(l).map((s) => s.height)) === modesOf(l.values)[0]
          ? "the tallest column's height and its value coincide, so the mistake is invisible"
          : null,
      ask: (l) =>
        `${l.boat}'s dot plot: ${dotPlotWords(l)}. A clerk writes: "The most common catch was ` +
        `${Math.max(...stacksOf(l).map((s) => s.height))} ${l.unit}." What has the clerk done?`,
      words: (l) => `A clerk reports a column's height as a catch figure. Choose what went wrong.`,
      choices: (l) => [
        {
          id: "ch.height",
          text: `Read the column's height — how many readings — as though it were the value beneath it`
        },
        { id: "ch.mean", text: "Reported the mean instead" },
        {
          id: "ch.fine",
          text: "Nothing — the tallest column names the most common catch",
          misconceptionId: "mc.dot-height-read-as-value"
        }
      ],
      correct: () => "ch.height",
      explain: (l) =>
        `The tallest column stands ${Math.max(...stacksOf(l).map((s) => s.height))} dots high over the value ` +
        `${modesOf(l.values)[0]}. The most common catch is ${modesOf(l.values)[0]} ${l.unit}; the height says how ` +
        `many trips agreed on it.`,
      misconceptionIds: ["mc.dot-height-read-as-value"]
    }),

    // ---- Histograms ------------------------------------------------------
    numericOverLists({
      id: "gen.r2-histograms.calculation",
      topic: HISTOGRAMS,
      reasoning: "calculation",
      description: "Count the readings falling in one interval of a histogram.",
      difficulty: 2,
      seconds: 60,
      ask: (l) => {
        const lo = Math.min(...l.values);
        const width = Math.ceil(rangeOf(l.values) / 4);
        return (
          `${l.boat}'s ${l.values.length} readings — ${listText(l)} ${l.unit} — are drawn as a histogram in ` +
          `intervals ${width} ${l.unit} wide, the first starting at ${lo}. How many readings fall in the first ` +
          `interval, from ${lo} up to but not including ${lo + width}?`
        );
      },
      words: (l) => `A histogram of ${listText(l)} in intervals of width ${Math.ceil(rangeOf(l.values) / 4)}.`,
      value: (l) => {
        const lo = Math.min(...l.values);
        const width = Math.ceil(rangeOf(l.values) / 4);
        return l.values.filter((v) => v >= lo && v < lo + width).length;
      },
      independently: (l) => {
        const lo = Math.min(...l.values);
        const width = Math.ceil(rangeOf(l.values) / 4);
        let count = 0;
        for (const v of l.values) if (v - lo < width && v >= lo) count += 1;
        return count;
      },
      unit: () => "readings",
      explain: (l) => {
        const lo = Math.min(...l.values);
        const width = Math.ceil(rangeOf(l.values) / 4);
        const inside = l.values.filter((v) => v >= lo && v < lo + width);
        return (
          `The first interval runs from ${lo} up to ${lo + width}, taking its lower bound and excluding its upper. ` +
          `${inside.join(", ")} fall inside it — ${inside.length} reading${inside.length === 1 ? "" : "s"}. A bar's ` +
          `height counts readings; its *width* is the interval, which is why histogram bars touch.`
        );
      }
    }),
    choiceOverLists({
      id: "gen.r2-histograms.recognition",
      topic: HISTOGRAMS,
      reasoning: "recognition",
      description: "Say why histogram bars touch.",
      difficulty: 2,
      seconds: 45,
      ask: (l) => `${l.boat}'s readings are drawn as a histogram and the bars touch. Why?`,
      words: () => "Choose why the bars of a histogram touch one another.",
      choices: () => [
        { id: "ch.adjacent", text: "The intervals are adjacent: where one ends the next begins, with no gap in the values" },
        { id: "ch.style", text: "It is a drawing convention with no meaning" },
        { id: "ch.equal", text: "It shows that every bar holds the same number of readings" }
      ],
      correct: () => "ch.adjacent",
      explain: () =>
        "A histogram's axis is continuous and its intervals are adjacent, so a gap would claim values that no " +
        "interval covers. A bar chart's categories are separate things, which is why its bars stand apart."
    }),
    choiceOverLists({
      id: "gen.r2-histograms.prediction",
      topic: HISTOGRAMS,
      reasoning: "prediction",
      description: "Say what a wider interval does to a histogram.",
      difficulty: 3,
      seconds: 65,
      ask: (l) =>
        `${l.boat}'s ${l.values.length} readings are drawn in intervals ${Math.ceil(rangeOf(l.values) / 4)} ` +
        `${l.unit} wide. The interval is doubled. What happens to the picture?`,
      words: () => "Choose what doubling the interval width does to a histogram.",
      choices: () => [
        { id: "ch.fewer", text: "Fewer, taller bars: the same readings pooled into wider groups" },
        { id: "ch.more", text: "More bars, each shorter" },
        { id: "ch.same", text: "Nothing — the data has not changed" }
      ],
      correct: () => "ch.fewer",
      explain: (l) =>
        `The readings are the same ${l.values.length} figures either way, but a wider interval collects more of ` +
        `them into each bar, so there are fewer bars and they stand taller. The data did not change and the picture ` +
        `did — which is the whole of what the misleading-graphs lesson is about.`
    }),
    pairwise({
      id: "gen.r2-histograms.comparison",
      topic: HISTOGRAMS,
      reasoning: "comparison",
      description: "Compare two logs by how many intervals they need.",
      noun: "spread across intervals",
      ask: (a, b) =>
        `${a.boat} logged ${listText(a)} ${a.unit} and ${b.boat} logged ${listText(b)} ${b.unit}. ` +
        `Drawn in intervals of the same width, whose histogram would stretch across more of them?`,
      of: (l) => rangeOf(l.values),
      independently: (l) => Math.max(...l.values) - Math.min(...l.values),
      explain: (a, b) =>
        `${a.boat}'s readings span ${rangeOf(a.values)} and ${b.boat}'s span ${rangeOf(b.values)}, so the wider ` +
        `span needs more intervals of a given width. The count of readings does not decide it.`
    }),

    // ---- Box plots -------------------------------------------------------
    numericOverLists({
      id: "gen.r2-box-plots.calculation",
      topic: BOXES,
      reasoning: "calculation",
      description: "Read the box's width off a five-number summary.",
      difficulty: 2,
      seconds: 65,
      invalid: (l) => (l.values.length < 5 ? "too few readings for a box worth drawing" : null),
      ask: (l) => `${l.boat}'s readings are drawn as a box plot: ${boxPlotWords(l)}. How wide is the box?`,
      words: (l) => `A box plot with ${boxPlotWords(l)}. Enter the width of the box.`,
      value: (l) => Number((quartilesOf(l.values).q3 - quartilesOf(l.values).q1).toFixed(4)),
      independently: (l) => {
        const q = quartilesOf(l.values);
        return Number((q.q3 - q.q1).toFixed(4));
      },
      unit: (l) => l.unit,
      tolerance: 0.01,
      explain: (l) => {
        const q = quartilesOf(l.values);
        return (
          `The box runs from the first quartile ${q.q1} to the third ${q.q3}, so it is ${round2(q.q3 - q.q1)} ` +
          `${l.unit} wide and holds the middle half of the readings. The whiskers reach the extremes, which is a ` +
          `different span: ${rangeOf(l.values)}.`
        );
      }
    }),
    choiceOverLists({
      id: "gen.r2-box-plots.recognition",
      topic: BOXES,
      reasoning: "recognition",
      description: "Say what share of the readings the box holds.",
      difficulty: 2,
      seconds: 45,
      ask: (l) => `${l.boat}'s box plot reads ${boxPlotWords(l)}. What share of the readings does the box hold?`,
      words: () => "Choose what share of the readings a box plot's box holds.",
      choices: () => [
        { id: "ch.half", text: "About half of them" },
        { id: "ch.quarter", text: "About a quarter" },
        { id: "ch.all", text: "All of them" }
      ],
      correct: () => "ch.half",
      explain: () =>
        "The box runs from the first quartile to the third, and those cuts leave a quarter below and a quarter " +
        "above, so about half the readings sit inside it. The whiskers carry the rest."
    }),
    choiceOverLists({
      id: "gen.r2-box-plots.visual-interpretation",
      topic: BOXES,
      reasoning: "visual-interpretation",
      description: "Read the median line off a box plot.",
      difficulty: 2,
      seconds: 50,
      interaction: "graph-interpretation",
      ask: (l) => `${l.boat}'s box plot reads ${boxPlotWords(l)}. Which figure is the line inside the box?`,
      words: (l) => `A box plot with ${boxPlotWords(l)}. Choose the value of the line inside the box.`,
      choices: (l) => {
        const q = quartilesOf(l.values);
        return [
          { id: "ch.median", text: `${q.q2} ${l.unit}` },
          { id: "ch.q1", text: `${q.q1} ${l.unit}` },
          { id: "ch.q3", text: `${q.q3} ${l.unit}` }
        ];
      },
      correct: () => "ch.median",
      invalid: (l) => {
        const q = quartilesOf(l.values);
        return q.q1 === q.q2 || q.q2 === q.q3 ? "two of the three cuts coincide, so the options repeat" : null;
      },
      explain: (l) =>
        `The line inside the box is the median, ${quartilesOf(l.values).q2} ${l.unit}. The box's two ends are the ` +
        `quartiles, so all three cuts are visible at once — which is what a box plot is for.`
    }),
    pairwise({
      id: "gen.r2-box-plots.comparison",
      topic: BOXES,
      reasoning: "comparison",
      description: "Compare two box plots by their boxes.",
      noun: "box",
      ask: (a, b) =>
        `${a.boat}'s box plot: ${boxPlotWords(a)}. ${b.boat}'s: ${boxPlotWords(b)}. Whose box is wider?`,
      of: (l) => quartilesOf(l.values).q3 - quartilesOf(l.values).q1,
      independently: (l) => {
        const q = quartilesOf(l.values);
        return q.q3 - q.q1;
      },
      explain: (a, b) => {
        const qa = quartilesOf(a.values);
        const qb = quartilesOf(b.values);
        return (
          `${a.boat}'s box spans ${round2(qa.q3 - qa.q1)} and ${b.boat}'s ${round2(qb.q3 - qb.q1)}. Box plots are ` +
          `built for exactly this: two distributions set against the same scale, compared at a glance.`
        );
      }
    }),

    // ---- Bar charts and choosing a graph ---------------------------------
    choiceOverLists({
      id: "gen.r2-bar-charts.recognition",
      topic: BARS,
      reasoning: "recognition",
      description: "Say why a bar chart's bars stand apart.",
      difficulty: 1,
      seconds: 40,
      // The prompt has to name its list, or every candidate is the same
      // question and 22 of the 23 are rejected as exact duplicates.
      ask: (l) =>
        `${l.boat}'s landings are drawn by port as a bar chart, and the bars stand apart with gaps between them. ` +
        `Why?`,
      words: () => "Choose why a bar chart's bars have gaps between them.",
      choices: () => [
        { id: "ch.separate", text: "The categories are separate things, with no values in between them" },
        { id: "ch.style", text: "To make the chart easier to read; it has no meaning" },
        { id: "ch.count", text: "To show that the counts are estimates" }
      ],
      correct: () => "ch.separate",
      explain: () =>
        "One port is not next to another on any scale, so nothing lies between two bars. A histogram's intervals " +
        "*are* adjacent, which is why its bars touch — the gap is the difference between the two charts."
    }),
    choiceOverLists({
      id: "gen.r2-bar-charts.visual-interpretation",
      topic: BARS,
      reasoning: "visual-interpretation",
      description: "Read the tallest bar off a chart described in words.",
      difficulty: 1,
      seconds: 45,
      interaction: "graph-interpretation",
      invalid: (l) => (modesOf(l.values).length > 1 ? "two bars tie for tallest" : null),
      ask: (l) =>
        `${l.boat}'s catches are drawn as a bar chart, one bar per trip, from a zero baseline: ` +
        `${listText(l)} ${l.unit}. Which bar is the tallest?`,
      words: (l) => `A bar chart of ${listText(l)} drawn from zero. Choose the tallest bar.`,
      choices: (l) =>
        [...new Set(l.values)]
          .sort((a, b) => a - b)
          .map((v) => ({ id: `ch.${v}`, text: `The bar at ${v} ${l.unit}` })),
      correct: (l) => `ch.${Math.max(...l.values)}`,
      explain: (l) =>
        `The tallest bar is the largest figure, ${Math.max(...l.values)} ${l.unit}. Drawn from zero, a bar twice ` +
        `as tall means twice as much — a promise the chart only keeps from a zero baseline.`
    }),
    choiceOverLists({
      id: "gen.r2-choosing-graphs.method-selection",
      topic: CHOOSING,
      reasoning: "comparison",
      description: "Pick the chart that suits a one-variable numeric log.",
      difficulty: 3,
      seconds: 70,
      interaction: "method-selection",
      ask: (l) =>
        `${l.boat}'s log holds ${l.values.length} numeric readings — ${listText(l)} ${l.unit} — and every one is ` +
        `worth seeing individually. Which chart suits it best?`,
      words: () => "Choose the chart that shows every reading of a small numeric log.",
      choices: () => [
        { id: "ch.dot", text: "A dot plot — one dot per reading, so nothing is pooled away" },
        { id: "ch.bar", text: "A bar chart — one bar per named category" },
        { id: "ch.scatter", text: "A scatterplot — one point per pair of measurements" }
      ],
      correct: () => "ch.dot",
      explain: (l) =>
        `${l.values.length} readings is few enough for every dot to be visible, and a dot plot pools nothing. A ` +
        `bar chart needs categories, which this log has none of, and a scatterplot needs a second measurement per ` +
        `trip.`
    }),
    choiceOverLists({
      id: "gen.r2-choosing-graphs.real-world-application",
      topic: CHOOSING,
      reasoning: "real-world-application",
      description: "Pick the chart that answers a question about the middle.",
      difficulty: 3,
      seconds: 70,
      interaction: "method-selection",
      ask: (l) =>
        `A harbourmaster wants to compare where the middle half of ${l.boat}'s catches sat against three other ` +
        `boats, on one page. Which chart does that?`,
      words: () => "Choose the chart for comparing several logs' middle halves at once.",
      choices: () => [
        { id: "ch.box", text: "Box plots side by side, on a shared scale" },
        { id: "ch.dot", text: "Four dot plots" },
        { id: "ch.hist", text: "Four histograms" }
      ],
      correct: () => "ch.box",
      explain: () =>
        "A box plot reduces each log to five numbers, which is exactly what makes four of them comparable side by " +
        "side. A dot plot or a histogram shows more of each log and less of the comparison."
    }),

    // ---- Outliers --------------------------------------------------------
    numericOverLists({
      id: "gen.r2-outliers.calculation",
      topic: OUTLIERS,
      reasoning: "calculation",
      description: "Compute the upper fence a reading has to pass to be an outlier.",
      difficulty: 3,
      seconds: 95,
      invalid: (l) => {
        const q = quartilesOf(l.values);
        return q.q3 - q.q1 === 0 ? "a middle half of no width makes the fence rule degenerate" : null;
      },
      ask: (l) => {
        const q = quartilesOf(l.values);
        return (
          `${l.boat} logged ${listText(l)} ${l.unit}. Its first quartile is ${q.q1} and its third is ${q.q3}. ` +
          `A reading counts as an outlier above the third quartile plus one and a half interquartile ranges. ` +
          `What is that upper fence?`
        );
      },
      words: (l) => `A log with quartiles ${quartilesOf(l.values).q1} and ${quartilesOf(l.values).q3}. Enter the upper fence.`,
      value: (l) => {
        const q = quartilesOf(l.values);
        return Number((q.q3 + 1.5 * (q.q3 - q.q1)).toFixed(4));
      },
      independently: (l) => {
        const q = quartilesOf(l.values);
        const iqr = q.q3 - q.q1;
        return Number((q.q3 + iqr + iqr / 2).toFixed(4));
      },
      unit: (l) => l.unit,
      tolerance: 0.01,
      explain: (l) => {
        const q = quartilesOf(l.values);
        const iqr = q.q3 - q.q1;
        return (
          `The middle half spans ${round2(iqr)}, so one and a half of those is ${round2(1.5 * iqr)}. Added to the ` +
          `third quartile ${q.q3}, the fence sits at ${round2(q.q3 + 1.5 * iqr)} ${l.unit}. The rule is built from ` +
          `the middle half, so one extreme reading cannot move the fence that judges it.`
        );
      }
    }),
    choiceOverLists({
      id: "gen.r2-outliers.error-identification",
      topic: OUTLIERS,
      reasoning: "error-identification",
      description: "Find a reading discarded for being inconvenient.",
      difficulty: 3,
      seconds: 75,
      interaction: "error-identification",
      ask: (l) =>
        `${l.boat} logged ${listText(l)} ${l.unit}. A clerk drops the largest figure, ${Math.max(...l.values)}, ` +
        `saying "that one is an outlier and spoils the average". What is wrong with that?`,
      words: () => "Choose what is wrong with dropping a reading for spoiling an average.",
      choices: (l) => {
        const q = quartilesOf(l.values);
        const fence = q.q3 + 1.5 * (q.q3 - q.q1);
        return [
          {
            id: "ch.test",
            text:
              Math.max(...l.values) > fence
                ? "Nothing about the fence rule — but a reading beyond it is to be investigated, not deleted"
                : `The figure is not beyond the fence at ${round2(fence)}, so it is not an outlier at all — it is just the largest reading`
          },
          { id: "ch.mean", text: "The mean should never be reported at all" },
          { id: "ch.fine", text: "Nothing — a large figure that moves the average should always be dropped" }
        ];
      },
      correct: () => "ch.test",
      explain: (l) => {
        const q = quartilesOf(l.values);
        const fence = q.q3 + 1.5 * (q.q3 - q.q1);
        return (
          `An outlier is decided by a rule, not by inconvenience: the fence here is ${round2(fence)} ${l.unit}, and ` +
          `${Math.max(...l.values)} ${
            Math.max(...l.values) > fence ? "does pass it" : "does not pass it"
          }. Even a reading that does is evidence — of a shoal, or a mistake in the log — and deleting it destroys ` +
          `the evidence.`
        );
      }
    }),
    choiceOverLists({
      id: "gen.r2-outliers.prediction",
      topic: OUTLIERS,
      reasoning: "prediction",
      description: "Say which summary an outlier moves most.",
      difficulty: 2,
      seconds: 60,
      ask: (l) =>
        `${l.boat} logged ${listText(l)} ${l.unit}. A reading of ${Math.max(...l.values) * 5} is added. ` +
        `Which summary moves most?`,
      words: () => "Choose which summary an extreme reading moves most.",
      choices: () => [
        { id: "ch.mean", text: "The mean" },
        // The learner who believes an extreme reading leaves the mean alone
        // picks the median instead, so that is where the tag belongs.
        { id: "ch.median", text: "The median", misconceptionId: "mc.outlier-mean" },
        { id: "ch.mode", text: "The mode" }
      ],
      correct: () => "ch.mean",
      explain: (l) => {
        const far = Math.max(...l.values) * 5;
        return (
          `Every reading enters the mean, so a figure of ${far} drags it from ${meanOf(l.values)} to ` +
          `${meanOf([...l.values, far])}. The median only shifts one position along the order, and the mode does ` +
          `not move at all unless the new figure repeats.`
        );
      },
      misconceptionIds: ["mc.outlier-mean"]
    }),

    // ---- Skew ------------------------------------------------------------
    choiceOverLists({
      id: "gen.r2-skew.recognition",
      topic: SKEW,
      reasoning: "recognition",
      description: "Name the direction of skew from the mean and the median.",
      difficulty: 2,
      seconds: 60,
      invalid: (l) => (skewOf(l) === "symmetric" ? "the mean sits on the median, so there is no tail to name" : null),
      ask: (l) =>
        `${l.boat}'s log has a mean of ${meanOf(l.values)} ${l.unit} and a median of ${medianOf(l.values)}. ` +
        `Which way is it skewed?`,
      words: (l) => `A log with mean ${meanOf(l.values)} and median ${medianOf(l.values)}. Choose the direction of skew.`,
      choices: () => [
        { id: "ch.right", text: "Right-skewed — a tail of high readings" },
        { id: "ch.left", text: "Left-skewed — a tail of low readings" },
        { id: "ch.none", text: "Not skewed either way" }
      ],
      correct: (l) => (skewOf(l) === "right" ? "ch.right" : "ch.left"),
      explain: (l) =>
        `The mean is ${skewOf(l) === "right" ? "above" : "below"} the median, and the mean is the summary an ` +
        `extreme reading drags. So the tail lies on the ${skewOf(l) === "right" ? "high" : "low"} side, and the ` +
        `skew is named for the tail rather than for where the readings pile up.`
    }),
    pairwise({
      id: "gen.r2-skew.comparison",
      topic: SKEW,
      reasoning: "comparison",
      description: "Compare two logs by how far the mean sits from the median.",
      noun: "gap between mean and median",
      ask: (a, b) =>
        `${a.boat}: mean ${meanOf(a.values)}, median ${medianOf(a.values)}. ` +
        `${b.boat}: mean ${meanOf(b.values)}, median ${medianOf(b.values)}. Whose log is more strongly skewed?`,
      of: (l) => Math.abs(meanOf(l.values) - medianOf(l.values)),
      independently: (l) => Math.abs(medianOf(l.values) - meanOf(l.values)),
      explain: (a, b) =>
        `The gap between mean and median is ${round2(Math.abs(meanOf(a.values) - medianOf(a.values)))} for ` +
        `${a.boat} and ${round2(Math.abs(meanOf(b.values) - medianOf(b.values)))} for ${b.boat}. A wider gap means ` +
        `a longer tail pulling the mean away from the middle.`
    }),
    choiceOverLists({
      id: "gen.r2-skew.visual-interpretation",
      topic: SKEW,
      reasoning: "visual-interpretation",
      description: "Read the skew off a dot plot's shape.",
      difficulty: 3,
      seconds: 65,
      interaction: "graph-interpretation",
      invalid: (l) => (skewOf(l) === "symmetric" ? "no tail to see" : null),
      ask: (l) => `${l.boat}'s dot plot reads ${dotPlotWords(l)}. Where is its tail?`,
      words: (l) => `A dot plot with columns ${dotPlotWords(l)}. Choose which side the tail lies on.`,
      choices: () => [
        { id: "ch.right", text: "On the right — a few high readings trailing away" },
        { id: "ch.left", text: "On the left — a few low readings trailing away" },
        { id: "ch.none", text: "There is no tail" }
      ],
      correct: (l) => (skewOf(l) === "right" ? "ch.right" : "ch.left"),
      explain: (l) =>
        `The dots bunch on one side and trail away on the other. Here the mean ${meanOf(l.values)} sits ` +
        `${skewOf(l) === "right" ? "above" : "below"} the median ${medianOf(l.values)}, which is the same fact in ` +
        `numbers: the tail is on the ${skewOf(l) === "right" ? "high" : "low"} side.`
    }),

    // ---- Comparing distributions ----------------------------------------
    pairwise({
      id: "gen.r2-comparing-distributions.comparison",
      topic: COMPARING,
      reasoning: "comparison",
      description: "Compare two logs on spread when their centres are close.",
      noun: "middle half",
      ask: (a, b) =>
        `${a.boat} logged ${listText(a)} ${a.unit} and ${b.boat} logged ${listText(b)} ${b.unit}. ` +
        `Whose catches were the less predictable through the middle?`,
      of: (l) => quartilesOf(l.values).q3 - quartilesOf(l.values).q1,
      independently: (l) => {
        const q = quartilesOf(l.values);
        return q.q3 - q.q1;
      },
      explain: (a, b) => {
        const qa = quartilesOf(a.values);
        const qb = quartilesOf(b.values);
        return (
          `${a.boat}'s middle half spans ${round2(qa.q3 - qa.q1)} and ${b.boat}'s ${round2(qb.q3 - qb.q1)}, so the ` +
          `wider one is the less predictable. Comparing two sets means comparing centre, spread and shape — this ` +
          `question is the spread, and the medians may well agree.`
        );
      }
    }),
    choiceOverLists({
      id: "gen.r2-comparing-distributions.error-identification",
      topic: COMPARING,
      reasoning: "error-identification",
      description: "Find a comparison that stopped at the centre.",
      difficulty: 3,
      seconds: 80,
      interaction: "error-identification",
      ask: (l) =>
        `${l.boat}'s harbour and its neighbour both report a median catch of ${medianOf(l.values)} ${l.unit}. ` +
        `A report concludes: "The two harbours had the same season." What is missing?`,
      words: () => "Choose what a comparison based only on the median leaves out.",
      choices: () => [
        { id: "ch.spread", text: "The spread and the shape — two logs with one median can be entirely different sets" },
        { id: "ch.count", text: "How many boats each harbour has" },
        {
          id: "ch.fine",
          text: "Nothing — equal medians is what it means for two seasons to be the same",
          misconceptionId: "mc.same-centre-same-data"
        }
      ],
      correct: () => "ch.spread",
      explain: () =>
        "A median is one value chosen to stand for a whole log, so two logs sharing one have agreed about their " +
        "middles and about nothing else. The spread says how far each reaches, and the shape says whether either " +
        "has a tail.",
      misconceptionIds: ["mc.same-centre-same-data"]
    }),
    choiceOverLists({
      id: "gen.r2-comparing-distributions.recognition",
      topic: COMPARING,
      reasoning: "recognition",
      description: "Name what a fair comparison requires.",
      difficulty: 2,
      seconds: 55,
      ask: (l) =>
        `A report compares ${l.boat} with another boat by giving ${l.boat}'s mean and the other boat's median. ` +
        `What is wrong with that?`,
      words: () => "Choose what is wrong with comparing one log's mean to another's median.",
      choices: () => [
        { id: "ch.same", text: "The same measure has to be used for both, or the two figures are not comparable" },
        { id: "ch.mean", text: "The mean should never be used in a comparison" },
        { id: "ch.nothing", text: "Nothing — both are averages" }
      ],
      correct: () => "ch.same",
      explain: () =>
        "A mean and a median answer different questions, so setting one against the other says nothing about which " +
        "boat landed more. Same measures, same scale, both distributions: that is the whole discipline."
    }),

    // ---- Misleading graphs ----------------------------------------------
    choiceOverLists({
      id: "gen.r2-misleading-graphs.error-identification",
      topic: MISLEADING,
      reasoning: "error-identification",
      description: "Find a truncated axis behind a dramatic chart.",
      difficulty: 3,
      seconds: 80,
      interaction: "error-identification",
      invalid: (l) =>
        rangeOf(l.values) === 0 || Math.min(...l.values) < 2
          ? "the readings do not admit a baseline above zero that still shows every bar"
          : null,
      ask: (l) => {
        const base = Math.min(...l.values) - 1;
        return (
          `${l.boat}'s catches — ${listText(l)} ${l.unit} — are drawn as bars from a baseline of ${base} rather ` +
          `than zero. The tallest bar towers over the shortest. What has happened?`
        );
      },
      words: (l) =>
        `A bar chart of ${listText(l)} drawn from a baseline of ${Math.min(...l.values) - 1}. Choose what is wrong.`,
      choices: (l) => {
        const base = Math.min(...l.values) - 1;
        return [
          {
            id: "ch.axis",
            text: `The bars show differences from ${base}, not amounts, so their heights exaggerate a real gap of ${rangeOf(l.values)}`
          },
          { id: "ch.numbers", text: "The figures themselves have been altered" },
          {
            id: "ch.fine",
            text: "Nothing — every figure on the chart is correct",
            misconceptionId: "mc.truncated-axis-read-as-scale"
          }
        ];
      },
      correct: () => "ch.axis",
      explain: (l) => {
        const base = Math.min(...l.values) - 1;
        return (
          `Every number is right and the picture still misleads. From ${base}, the shortest bar stands ` +
          `${Math.min(...l.values) - base} and the tallest ${Math.max(...l.values) - base} — a ratio the data does ` +
          `not have. From zero they would stand ${Math.min(...l.values)} and ${Math.max(...l.values)}.`
        );
      },
      misconceptionIds: ["mc.truncated-axis-read-as-scale"]
    }),
    choiceOverLists({
      id: "gen.r2-misleading-graphs.recognition",
      topic: MISLEADING,
      reasoning: "recognition",
      description: "Name what to check before believing a chart.",
      difficulty: 2,
      seconds: 50,
      ask: (l) => `Before believing a bar chart of ${l.boat}'s catches, what should be checked first?`,
      words: () => "Choose the first thing to check on a bar chart.",
      choices: () => [
        { id: "ch.axis", text: "Where the value axis starts" },
        { id: "ch.colour", text: "Whether the bars are the same colour" },
        { id: "ch.order", text: "Whether the bars are in alphabetical order" }
      ],
      correct: () => "ch.axis",
      explain: () =>
        "A bar chart's promise is that length stands for amount, and that promise holds only from a zero baseline. " +
        "The axis is invisible in the impression the chart leaves, which is exactly why it has to be looked at."
    }),
    choiceOverLists({
      id: "gen.r2-misleading-graphs.prediction",
      topic: MISLEADING,
      reasoning: "prediction",
      description: "Say what redrawing from zero does to a truncated chart.",
      difficulty: 3,
      seconds: 65,
      invalid: (l) => (Math.min(...l.values) < 2 ? "no baseline above zero leaves every bar visible" : null),
      ask: (l) =>
        `${l.boat}'s catches are drawn from a baseline of ${Math.min(...l.values) - 1}, where the bars look wildly ` +
        `different. The chart is redrawn from zero. What happens?`,
      words: () => "Choose what redrawing a truncated chart from zero does.",
      choices: () => [
        { id: "ch.level", text: "The bars come out much closer in height, because the real differences are smaller than they looked" },
        { id: "ch.same", text: "Nothing changes — the data is the same" },
        { id: "ch.reverse", text: "The order of the bars reverses" }
      ],
      correct: () => "ch.level",
      explain: (l) =>
        `The figures do not change and the picture does. From zero the bars stand at ${listText(l)}, whose ` +
        `differences are modest; from a raised baseline only the part above it is drawn, and small differences ` +
        `fill the frame.`
    }),

    // ---- Data literacy ---------------------------------------------------
    choiceOverLists({
      id: "gen.data-literacy.recognition",
      topic: LITERACY,
      reasoning: "recognition",
      description: "Say what one row of a log stands for.",
      difficulty: 1,
      seconds: 40,
      ask: (l) =>
        `${l.boat}'s log has ${l.values.length} rows, one per ${l.occasion.split(" ")[1]?.replace(/s$/, "") ?? "trip"}, ` +
        `each recording the catch. What is one row?`,
      words: () => "Choose what a single row of a data log stands for.",
      choices: () => [
        { id: "ch.case", text: "One case — a single occasion the log recorded" },
        { id: "ch.variable", text: "One variable — a thing being measured" },
        { id: "ch.value", text: "The whole log summarised" }
      ],
      correct: () => "ch.case",
      explain: (l) =>
        `Rows are cases and columns are variables. This log has ${l.values.length} cases and one variable, the ` +
        `catch. Counting the columns when the cases were asked for is the commonest way to misread a table.`
    }),
    numericOverLists({
      id: "gen.data-literacy.calculation",
      topic: LITERACY,
      reasoning: "calculation",
      description: "Count the cases in a log.",
      difficulty: 1,
      seconds: 35,
      ask: (l) => `${l.boat}'s log reads ${listText(l)} ${l.unit}, one figure per trip. How many cases does it hold?`,
      words: (l) => `A log of ${listText(l)}. Enter how many cases it holds.`,
      value: (l) => l.values.length,
      independently: (l) => {
        let count = 0;
        for (const _ of l.values) count += 1;
        return count;
      },
      unit: () => "cases",
      explain: (l) =>
        `Each figure is one trip, so the log holds ${l.values.length} cases. The single variable being recorded is ` +
        `the catch — one column, not one case.`
    }),
    choiceOverLists({
      id: "gen.data-literacy.error-identification",
      topic: LITERACY,
      reasoning: "error-identification",
      description: "Find a claim the log cannot support.",
      difficulty: 3,
      seconds: 70,
      interaction: "error-identification",
      ask: (l) =>
        `${l.boat}'s log records only the catch on each of ${l.values.length} trips: ${listText(l)} ${l.unit}. ` +
        `A report says: "Longer trips landed more." What is wrong?`,
      words: () => "Choose why a log of one variable cannot support a claim about two.",
      choices: () => [
        { id: "ch.novar", text: "The log records only the catch — trip length was never recorded, so the claim rests on nothing in it" },
        { id: "ch.small", text: "The log is too short for any claim at all" },
        { id: "ch.mean", text: "The report should have used the median" }
      ],
      correct: () => "ch.novar",
      explain: () =>
        "A claim relating two things needs both of them measured on the same cases. This log has one variable, so " +
        "it can describe catches and nothing about what drove them."
      // No misconception declared: `mc.axis-misread` is about reading the wrong
      // axis of a chart, and nothing here offers a learner a way to express it.
      // A tag with no expressible option inflates a count and does nothing else
      // (D-057).
    }),
    pairwise({
      id: "gen.data-literacy.comparison",
      topic: LITERACY,
      reasoning: "comparison",
      description: "Compare two logs by how many cases they hold.",
      noun: "number of cases",
      ask: (a, b) =>
        `${a.boat}'s log reads ${listText(a)} and ${b.boat}'s reads ${listText(b)}. Which log holds more cases?`,
      of: (l) => l.values.length,
      independently: (l) => [...l.values].length,
      explain: (a, b) =>
        `${a.boat}'s log has ${a.values.length} rows and ${b.boat}'s has ${b.values.length}. More cases is not more ` +
        `catch: the figures inside them decide that, and this question is about the shape of the table.`
    }),

    // The families the reasoning-family floor and the volume still needed.
    pairwise({
      id: "gen.r2-bar-charts.comparison",
      topic: BARS,
      reasoning: "comparison",
      description: "Compare two logs by their tallest bar.",
      noun: "tallest bar",
      ask: (a, b) =>
        `${a.boat}'s catches are drawn as bars from zero: ${listText(a)} ${a.unit}. ${b.boat}'s: ` +
        `${listText(b)} ${b.unit}. Whose tallest bar is taller?`,
      of: (l) => Math.max(...l.values),
      independently: (l) => {
        let hi = l.values[0]!;
        for (const v of l.values) if (v > hi) hi = v;
        return hi;
      },
      explain: (a, b) =>
        `${a.boat}'s tallest bar stands at ${Math.max(...a.values)} and ${b.boat}'s at ${Math.max(...b.values)}. ` +
        `Both are drawn from zero, which is what makes the two heights comparable at all.`
    }),
    choiceOverLists({
      id: "gen.r2-bar-charts.prediction",
      topic: BARS,
      reasoning: "prediction",
      description: "Say what a doubled figure does to its bar.",
      difficulty: 2,
      seconds: 55,
      ask: (l) =>
        `${l.boat}'s catches are drawn as bars from zero: ${listText(l)} ${l.unit}. One trip's figure is doubled. ` +
        `What happens to its bar?`,
      words: () => "Choose what doubling a figure does to its bar on a chart drawn from zero.",
      choices: () => [
        { id: "ch.double", text: "It becomes twice as tall" },
        { id: "ch.more", text: "It grows, but by an amount the chart cannot predict" },
        { id: "ch.same", text: "It stays the same height" }
      ],
      correct: () => "ch.double",
      explain: () =>
        "From a zero baseline a bar's length is the amount itself, so twice the amount is twice the bar. That " +
        "proportionality is the promise a truncated axis breaks."
    }),
    pairwise({
      id: "gen.r2-choosing-graphs.comparison",
      topic: CHOOSING,
      reasoning: "comparison",
      description: "Compare two logs by how well a dot plot would serve them.",
      noun: "number of distinct values",
      ask: (a, b) =>
        `${a.boat} logged ${listText(a)} ${a.unit} and ${b.boat} logged ${listText(b)} ${b.unit}. ` +
        `Whose log would need more columns if each were drawn as a dot plot?`,
      of: (l) => new Set(l.values).size,
      independently: (l) => [...new Set([...l.values])].length,
      explain: (a, b) =>
        `${a.boat}'s log holds ${new Set(a.values).size} distinct values and ${b.boat}'s ${new Set(b.values).size}, ` +
        `and a dot plot draws one column per distinct value. The more distinct values, the closer a dot plot comes ` +
        `to needing intervals instead.`
    }),
    choiceOverLists({
      id: "gen.r2-choosing-graphs.recognition",
      topic: CHOOSING,
      reasoning: "recognition",
      description: "Name what a chart choice costs.",
      difficulty: 3,
      seconds: 60,
      ask: (l) =>
        `${l.boat}'s ${l.values.length} readings could be drawn as a dot plot or pooled into a histogram. ` +
        `What does choosing the histogram cost?`,
      words: () => "Choose what is given up by pooling readings into intervals.",
      choices: () => [
        { id: "ch.individual", text: "The individual readings: an interval shows how many, not which" },
        { id: "ch.total", text: "The total number of readings" },
        { id: "ch.nothing", text: "Nothing at all" }
      ],
      correct: () => "ch.individual",
      explain: (l) =>
        `A histogram reports how many readings fell in each interval, so ${listText(l)} becomes a set of counts ` +
        `and the individual figures are gone. That is a cost worth paying when there are too many to see, and not ` +
        `before.`
    }),
    pairwise({
      id: "gen.r2-misleading-graphs.comparison",
      topic: MISLEADING,
      reasoning: "comparison",
      description: "Compare two logs by how much a raised baseline would exaggerate them.",
      noun: "vulnerability to a raised baseline",
      ask: (a, b) =>
        `${a.boat} logged ${listText(a)} ${a.unit} and ${b.boat} logged ${listText(b)} ${b.unit}. Drawn from a ` +
        `baseline just below each log's smallest figure, whose chart would exaggerate its differences more?`,
      of: (l) => rangeOf(l.values) / Math.max(...l.values),
      independently: (l) => (Math.max(...l.values) - Math.min(...l.values)) / Math.max(...l.values),
      explain: (a, b) =>
        `A raised baseline exaggerates most when the readings sit close together far from zero. ${a.boat}'s span ` +
        `${rangeOf(a.values)} against a largest figure of ${Math.max(...a.values)}; ${b.boat}'s ` +
        `${rangeOf(b.values)} against ${Math.max(...b.values)}. The chart with the larger share of its height ` +
        `already above the baseline is the one that changes least.`
    }),
    pairwise({
      id: "gen.r2-outliers.comparison",
      topic: OUTLIERS,
      reasoning: "comparison",
      description: "Compare two logs by how far their largest reading sits past the fence.",
      noun: "distance past the upper fence",
      ask: (a, b) =>
        `${a.boat} logged ${listText(a)} ${a.unit} and ${b.boat} logged ${listText(b)} ${b.unit}. Whose largest ` +
        `reading sits further beyond its own upper fence?`,
      of: (l) => {
        const q = quartilesOf(l.values);
        return Math.max(...l.values) - (q.q3 + 1.5 * (q.q3 - q.q1));
      },
      independently: (l) => {
        const q = quartilesOf(l.values);
        const iqr = q.q3 - q.q1;
        return Math.max(...l.values) - q.q3 - iqr - iqr / 2;
      },
      explain: (a, b) => {
        const fa = quartilesOf(a.values).q3 + 1.5 * (quartilesOf(a.values).q3 - quartilesOf(a.values).q1);
        const fb = quartilesOf(b.values).q3 + 1.5 * (quartilesOf(b.values).q3 - quartilesOf(b.values).q1);
        return (
          `${a.boat}'s fence sits at ${round2(fa)} and its largest reading at ${Math.max(...a.values)}; ` +
          `${b.boat}'s at ${round2(fb)} and ${Math.max(...b.values)}. Each log is judged against its own middle ` +
          `half, so the comparison is of distances past a fence rather than of the readings themselves.`
        );
      }
    }),
    choiceOverLists({
      id: "gen.r2-comparing-distributions.prediction",
      topic: COMPARING,
      reasoning: "prediction",
      description: "Say what happens to a comparison when both logs are shifted alike.",
      difficulty: 3,
      seconds: 70,
      ask: (l) =>
        `Two harbours are compared on ${l.boat}'s season and another's. Every figure in both is later corrected ` +
        `upward by 2 ${l.unit}. What happens to the comparison of their spreads?`,
      words: () => "Choose what shifting both logs equally does to a comparison of spread.",
      choices: () => [
        { id: "ch.same", text: "Nothing — both centres move and neither spread changes" },
        { id: "ch.wider", text: "Both spreads widen by 2" },
        { id: "ch.closer", text: "The two spreads move closer together" }
      ],
      correct: () => "ch.same",
      explain: () =>
        "A shift moves every reading and every centre by the same amount, so no distance between readings changes. " +
        "Spread is about distances, which is why it survives a shift that the mean and median do not."
    }),
    choiceOverLists({
      id: "gen.r2-skew.prediction",
      topic: SKEW,
      reasoning: "prediction",
      description: "Say which way one large reading skews a log.",
      difficulty: 2,
      seconds: 55,
      ask: (l) =>
        `${l.boat} logged ${listText(l)} ${l.unit}. One more trip lands ${Math.max(...l.values) * 4}. ` +
        `Which way will the log be skewed?`,
      words: () => "Choose the direction of skew after one very large reading joins.",
      choices: () => [
        { id: "ch.right", text: "Right-skewed — the tail runs to the high side" },
        { id: "ch.left", text: "Left-skewed — the tail runs to the low side" },
        { id: "ch.none", text: "Not skewed — one reading cannot change the shape" }
      ],
      correct: () => "ch.right",
      explain: (l) => {
        const far = Math.max(...l.values) * 4;
        const after = [...l.values, far];
        return (
          `The new figure sits far above the rest, so it drags the mean to ${meanOf(after)} while the median only ` +
          `moves to ${medianOf(after)}. Mean above median means a tail on the high side: right-skewed, named for ` +
          `the tail rather than the bunch.`
        );
      }
    }),
    choiceOverLists({
      id: "gen.r2-choosing-graphs.error-identification",
      topic: CHOOSING,
      reasoning: "error-identification",
      description: "Find a chart chosen for data it cannot show.",
      difficulty: 3,
      seconds: 70,
      interaction: "error-identification",
      ask: (l) =>
        `${l.boat}'s log holds ${l.values.length} catch figures and nothing else: ${listText(l)} ${l.unit}. ` +
        `A clerk draws it as a scatterplot. What is wrong?`,
      words: () => "Choose why a one-variable log cannot be drawn as a scatterplot.",
      choices: () => [
        { id: "ch.pairs", text: "A scatterplot needs two measurements per trip, and this log records one" },
        { id: "ch.few", text: "There are too few readings for any chart" },
        { id: "ch.order", text: "The readings are not in order" }
      ],
      correct: () => "ch.pairs",
      explain: (l) =>
        `Each point on a scatterplot carries a pair — how far along and how far up. This log has ${l.values.length} ` +
        `single figures, so there is nothing to put on the second axis. A dot plot shows exactly this data.`
    }),
    ...scatterFamilies()
  ];
}
