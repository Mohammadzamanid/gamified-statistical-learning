/**
 * Generator families for Region 2's counts module: frequency, proportion,
 * percentage.
 *
 * The first Region 2 topics to get generators, and the reason they come first
 * is that all three read the *same* log three ways — twelve calm mornings out
 * of twenty is a frequency of 12, a proportion of 0.6 and a percentage of 60%.
 * One corpus of logs therefore feeds three topics, and the difference between
 * them is what the question asks for rather than what it is about. That is also
 * the misconception the module teaches against, so the traps are shared: a
 * proportion reported as a percentage, and a percentage left as a decimal.
 *
 * Region 1 already has `parts.ts`, which asks the same three conversions about
 * a *quantity* — "15 of 60 crates were damaged". These are about a **log of
 * observations**, which is the Region 2 framing: the count comes from tallying
 * cases, not from a number in the prompt. Different topic ids, different
 * skills, and questions a learner meets after data literacy rather than before.
 *
 * `expectedResponse` is stated by each family and never read back out of the
 * question it built (D-020). Counts are re-derived by walking the log rather
 * than by reading the same total the answer key used.
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
// The logs
// --------------------------------------------------------------------------

interface Category {
  readonly name: string;
  readonly count: number;
}

/** A season's observations, tallied into categories. */
interface Log {
  readonly id: string;
  readonly harbour: string;
  /** What one observation is: "mornings", "landings". */
  readonly caseNoun: string;
  /** What was recorded about each: "the sea state". */
  readonly recorded: string;
  readonly categories: readonly Category[];
}

const LOGS: readonly Log[] = [
  {
    id: "seastate",
    harbour: "Northport",
    caseNoun: "mornings",
    recorded: "the sea state",
    categories: [
      { name: "calm", count: 12 },
      { name: "choppy", count: 5 },
      { name: "rough", count: 3 }
    ]
  },
  {
    id: "seastate-east",
    harbour: "Eastquay",
    caseNoun: "mornings",
    recorded: "the sea state",
    categories: [
      { name: "calm", count: 9 },
      { name: "choppy", count: 9 },
      { name: "rough", count: 7 }
    ]
  },
  {
    id: "gear",
    harbour: "Southbar",
    caseNoun: "landings",
    recorded: "the gear used",
    categories: [
      { name: "creels", count: 18 },
      { name: "nets", count: 14 },
      { name: "lines", count: 8 }
    ]
  },
  {
    id: "berth",
    harbour: "Westhead",
    caseNoun: "arrivals",
    recorded: "where the boat tied up",
    categories: [
      { name: "the inner wall", count: 7 },
      { name: "the outer wall", count: 21 },
      { name: "a mooring buoy", count: 12 }
    ]
  },
  {
    id: "catch-grade",
    harbour: "Midpier",
    caseNoun: "boxes",
    recorded: "the grade written on the lid",
    categories: [
      { name: "prime", count: 15 },
      { name: "standard", count: 25 },
      { name: "bait", count: 10 }
    ]
  },
  {
    id: "weather",
    harbour: "Kirkwall",
    caseNoun: "days",
    recorded: "the weather at noon",
    categories: [
      { name: "dry", count: 22 },
      { name: "showers", count: 14 },
      { name: "gale", count: 4 }
    ]
  },
  {
    id: "crew",
    harbour: "Stromness",
    caseNoun: "trips",
    recorded: "how many hands sailed",
    categories: [
      { name: "two hands", count: 6 },
      { name: "three hands", count: 16 },
      { name: "four hands", count: 18 }
    ]
  },
  {
    id: "repairs",
    harbour: "Burravoe",
    caseNoun: "callouts",
    recorded: "what needed fixing",
    categories: [
      { name: "engine", count: 11 },
      { name: "winch", count: 17 },
      { name: "hull", count: 2 }
    ]
  },
  {
    id: "tide",
    harbour: "Voe",
    caseNoun: "departures",
    recorded: "the state of the tide",
    categories: [
      { name: "flood", count: 24 },
      { name: "slack", count: 6 },
      { name: "ebb", count: 20 }
    ]
  },
  {
    id: "market",
    harbour: "Scalloway",
    caseNoun: "sales",
    recorded: "who bought the box",
    categories: [
      { name: "the smokehouse", count: 20 },
      { name: "the market stall", count: 16 },
      { name: "a passing van", count: 4 }
    ]
  }
];

/** The log's total, counted by walking its categories. */
function totalOf(log: Log): number {
  let total = 0;
  for (const category of log.categories) total += category.count;
  return total;
}

/** One category's count, found by name rather than by index. */
function countOf(log: Log, name: string): number {
  for (const category of log.categories) {
    if (category.name === name) return category.count;
  }
  throw new Error(`log ${log.id} has no category ${name}`);
}

/** How the log reads in a prompt: "12 calm, 5 choppy and 3 rough". */
function tallyText(log: Log): string {
  const parts = log.categories.map((c) => `${c.count} ${c.name}`);
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function logSentence(log: Log): string {
  return (
    `${log.harbour} logged ${totalOf(log)} ${log.caseNoun} last season and recorded ${log.recorded} ` +
    `for each: ${tallyText(log)}.`
  );
}

function describeLog(log: Log): string {
  return `A tally of ${log.harbour}'s ${totalOf(log)} ${log.caseNoun} by ${log.recorded}: ${tallyText(log)}.`;
}

const round4 = (n: number): number => Number(n.toFixed(4));

// --------------------------------------------------------------------------
// Frequency
// --------------------------------------------------------------------------

const FREQ = { skill: "skill.r2-frequency", topic: "t.r2-frequency", objective: "obj.r2-frequency" };

/**
 * How many observations fell in one category.
 *
 * The trap is the module's own misconception: reporting how many *categories*
 * were recorded instead of how many cases fell in one. It is a
 * `known-wrong-answer`, so on a numeric question the wrong value is declared
 * under `parameters` rather than tagged on a distractor.
 */
function frequencyCountFamily(): GeneratorFamily {
  return {
    id: "gen.r2-frequency.calculation",
    topicId: FREQ.topic,
    skillIds: [FREQ.skill],
    reasoningFamily: "calculation",
    description: "Read one category's frequency out of a season log.",
    enumerate: () =>
      LOGS.flatMap((log) =>
        log.categories.map((category): Candidate => {
          const categoryCount = log.categories.length;
          return {
            key: `${log.id}-${category.name}`,
            invalidReason:
              category.count === categoryCount
                ? "this category's frequency equals the number of categories, so the mistake is invisible"
                : null,
            expectedResponse: () => numeric(countOf(log, category.name)),
            build: () => ({
              ...baseOf(FREQ.topic, FREQ.objective, FREQ.skill, 1),
              id: `q.gen.r2-frequency.count.${log.id}-${log.categories.indexOf(category)}`,
              misconceptionIds: ["mc.frequency-counts-categories"],
              parameters: { "mc.frequency-counts-categories": { wrongValue: categoryCount } },
              estimatedSeconds: 45,
              accessibilityDescription: `${describeLog(log)} Enter the frequency of ${category.name} as a number.`,
              interaction: "numeric-input",
              prompt: `${logSentence(log)} What is the frequency of ${category.name}?`,
              answer: { kind: "numeric", value: category.count, tolerance: 0, unit: log.caseNoun },
              explanation:
                `A frequency counts ${log.caseNoun}, not kinds. ${category.count} of the ${totalOf(log)} ${log.caseNoun} ` +
                `were ${category.name}, so the frequency is ${category.count}. The log names ${categoryCount} categories, ` +
                `which is a different question and the one this mistake answers.`
            })
          };
        })
      )
  };
}

/** Which category was recorded most often. */
function frequencyComparisonFamily(): GeneratorFamily {
  return {
    id: "gen.r2-frequency.comparison",
    topicId: FREQ.topic,
    skillIds: [FREQ.skill],
    reasoningFamily: "comparison",
    description: "Name the most or least frequent category in a log.",
    enumerate: () =>
      LOGS.flatMap((log) =>
        (["most", "least"] as const).map((direction): Candidate => {
          const sorted = [...log.categories].sort((a, b) => a.count - b.count);
          const target = direction === "most" ? sorted[sorted.length - 1]! : sorted[0]!;
          const runnerUp = direction === "most" ? sorted[sorted.length - 2]! : sorted[1]!;
          return {
            key: `${log.id}-${direction}`,
            invalidReason:
              target.count === runnerUp.count
                ? `two categories tie for ${direction} frequent, so there is no single answer`
                : null,
            expectedResponse: () => choose(`ch.${log.categories.indexOf(target)}`),
            build: () => ({
              ...baseOf(FREQ.topic, FREQ.objective, FREQ.skill, 1),
              id: `q.gen.r2-frequency.extreme.${log.id}-${direction}`,
              estimatedSeconds: 40,
              accessibilityDescription: `${describeLog(log)} Choose the ${direction} frequent category.`,
              interaction: "multiple-choice",
              prompt: `${logSentence(log)} Which was recorded ${direction} often?`,
              choices: log.categories.map((c, i) => ({ id: `ch.${i}`, text: c.name })),
              answer: { kind: "choice", correctChoiceIds: [`ch.${log.categories.indexOf(target)}`] },
              explanation:
                `Comparing the frequencies, ${target.name} has ${target.count} and the next closest, ${runnerUp.name}, ` +
                `has ${runnerUp.count}. The ${direction} frequent category is therefore ${target.name}.`
            })
          };
        })
      )
  };
}

/** Everything that is not one category: the total minus its frequency. */
function frequencyComplementFamily(): GeneratorFamily {
  return {
    id: "gen.r2-frequency.multi-step",
    topicId: FREQ.topic,
    skillIds: [FREQ.skill],
    reasoningFamily: "multi-step-reasoning",
    description: "Total the log, then subtract one category's frequency.",
    enumerate: () =>
      LOGS.flatMap((log) =>
        log.categories.map((category): Candidate => ({
          key: `${log.id}-not-${category.name}`,
          invalidReason:
            log.categories.length < 3
              ? "with two categories the complement is a single other frequency, so nothing is totalled"
              : null,
          expectedResponse: () => {
            let others = 0;
            for (const c of log.categories) if (c.name !== category.name) others += c.count;
            return numeric(others);
          },
          build: () => ({
            ...baseOf(FREQ.topic, FREQ.objective, FREQ.skill, 2),
            id: `q.gen.r2-frequency.complement.${log.id}-${log.categories.indexOf(category)}`,
            estimatedSeconds: 60,
            accessibilityDescription: `${describeLog(log)} Enter how many were not ${category.name}.`,
            interaction: "numeric-input",
            prompt: `${logSentence(log)} How many ${log.caseNoun} were **not** ${category.name}?`,
            answer: {
              kind: "numeric",
              value: totalOf(log) - countOf(log, category.name),
              tolerance: 0,
              unit: log.caseNoun
            },
            explanation:
              `Two steps: the log holds ${totalOf(log)} ${log.caseNoun} altogether, and ${category.count} of them ` +
              `were ${category.name}, so ${totalOf(log)} - ${category.count} = ${totalOf(log) - category.count} ` +
              `were not. Adding the other frequencies gives the same number, which is a useful check.`
          })
        }))
      )
  };
}

/** A clerk's report with the frequency filled in wrongly. */
function frequencyErrorFamily(): GeneratorFamily {
  return {
    id: "gen.r2-frequency.error-identification",
    topicId: FREQ.topic,
    skillIds: [FREQ.skill],
    reasoningFamily: "error-identification",
    description: "Find what a clerk counted instead of the frequency.",
    enumerate: () =>
      LOGS.map((log): Candidate => {
        const first = log.categories[0]!;
        return {
          key: `${log.id}-error`,
          invalidReason:
            first.count === log.categories.length
              ? "the clerk's wrong figure equals the right one here, so there is no error to find"
              : null,
          expectedResponse: () => choose("ch.categories"),
          build: () => ({
            ...baseOf(FREQ.topic, FREQ.objective, FREQ.skill, 2),
            id: `q.gen.r2-frequency.error.${log.id}`,
            misconceptionIds: ["mc.frequency-counts-categories"],
            estimatedSeconds: 55,
            accessibilityDescription: `${describeLog(log)} Choose what the clerk counted instead of the frequency.`,
            interaction: "error-identification",
            prompt:
              `${logSentence(log)} A clerk writes: "The frequency of ${first.name} is ${log.categories.length}." ` +
              `What did the clerk count?`,
            choices: [
              {
                id: "ch.categories",
                text: `The number of categories in the log, not the ${log.caseNoun} in one of them`
              },
              { id: "ch.total", text: `The total number of ${log.caseNoun}` },
              // The misconception goes on the option that *agrees* with the
              // clerk. Tagging the correct option instead — which the first
              // draft did — means the diagnosis fires on a right answer, and the
              // coverage audit caught it doing exactly that.
              {
                id: "ch.right",
                text: "Nothing — that is the frequency",
                misconceptionId: "mc.frequency-counts-categories"
              }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.categories"] },
            explanation:
              `The log names ${log.categories.length} categories, and the clerk has reported that number. ` +
              `A frequency counts ${log.caseNoun}: ${first.count} of them were ${first.name}.`
          })
        };
      })
  };
}

/** The tally read back from a described dot plot rather than from prose. */
function frequencyVisualFamily(): GeneratorFamily {
  return {
    id: "gen.r2-frequency.visual-interpretation",
    topicId: FREQ.topic,
    skillIds: [FREQ.skill],
    reasoningFamily: "visual-interpretation",
    description: "Read one column's height off a tally chart described in words.",
    enumerate: () =>
      LOGS.flatMap((log) =>
        log.categories.map((category): Candidate => ({
          key: `${log.id}-chart-${category.name}`,
          // Two categories of equal height give the learner two identical
          // options, and no way to tell which one the question means. Found by
          // the answer check rather than by reading: the family stated the
          // first column of that height and the question published the second.
          invalidReason:
            log.categories.filter((c) => c.count === category.count).length > 1
              ? "another category has the same column height, so two options read identically"
              : null,
          // A choice, not a number: this family asks which column *is* the
          // frequency, so the stated response has to be the option the learner
          // picks. Stating a numeric one made every candidate an answer failure
          // — 24 of them — which is the check working (D-020).
          expectedResponse: () => {
            const heights = log.categories.map((c) => c.count);
            return choose(`ch.${heights.indexOf(countOf(log, category.name))}`);
          },
          build: () => ({
            ...baseOf(FREQ.topic, FREQ.objective, FREQ.skill, 2),
            id: `q.gen.r2-frequency.chart.${log.id}-${log.categories.indexOf(category)}`,
            estimatedSeconds: 45,
            accessibilityDescription:
              `A tally chart of ${log.harbour}'s ${log.caseNoun} with one column per category: ` +
              `${log.categories.map((c) => `${c.name} ${c.count} marks tall`).join(", ")}. ` +
              `Enter the height of the ${category.name} column.`,
            interaction: "graph-interpretation",
            prompt:
              `${log.harbour}'s tally chart has one column per category, drawn one mark per ${log.caseNoun.replace(/s$/, "")}: ` +
              `${log.categories.map((c) => `${c.name} stands ${c.count} marks tall`).join(", ")}. ` +
              `Which column height is the frequency of ${category.name}?`,
            choices: log.categories.map((c, i) => ({ id: `ch.${i}`, text: `${c.count} marks` })),
            answer: { kind: "choice", correctChoiceIds: [`ch.${log.categories.indexOf(category)}`] },
            explanation:
              `Each mark stands for one ${log.caseNoun.replace(/s$/, "")}, so a column's height *is* its frequency. ` +
              `The ${category.name} column stands ${category.count} marks tall.`
          })
        }))
      )
  };
}

// --------------------------------------------------------------------------
// Proportion and percentage
// --------------------------------------------------------------------------

/** The two forms the same share can be reported in. */
interface ShareForm {
  readonly slug: string;
  readonly skill: string;
  readonly topic: string;
  readonly objective: string;
  readonly noun: string;
  /** The reported value for `count` out of `total`. */
  readonly value: (count: number, total: number) => number;
  readonly ask: string;
  readonly render: (v: number) => string;
  readonly tolerance: number;
  readonly unit?: string;
  /** The other form's value — the mistake this one invites. */
  readonly trapValue: (count: number, total: number) => number;
  readonly trapText: string;
  readonly misconceptionId: string;
}

const AS_PROPORTION: ShareForm = {
  slug: "r2-proportion",
  skill: "skill.r2-proportion",
  topic: "t.r2-proportion",
  objective: "obj.r2-proportion",
  noun: "proportion",
  value: (count, total) => round4(count / total),
  ask: "What proportion of them was that? Answer between 0 and 1.",
  render: (v) => String(v),
  tolerance: 0.0005,
  trapValue: (count, total) => round4((count / total) * 100),
  trapText: "that is the percentage, which counts parts per hundred rather than parts of one",
  misconceptionId: "mc.percent-vs-decimal"
};

const AS_PERCENTAGE: ShareForm = {
  slug: "r2-percentage",
  skill: "skill.r2-percentage",
  topic: "t.r2-percentage",
  objective: "obj.r2-percentage",
  noun: "percentage",
  value: (count, total) => round4((count / total) * 100),
  ask: "What percentage of them was that?",
  render: (v) => `${v}%`,
  tolerance: 0.01,
  unit: "%",
  trapValue: (count, total) => round4(count / total),
  trapText: "that is the proportion, still sitting between 0 and 1 rather than scaled to a hundred",
  misconceptionId: "mc.decimal-vs-percent"
};

export const SHARE_FORMS: readonly ShareForm[] = [AS_PROPORTION, AS_PERCENTAGE];

/** One category's share of the log, reported in this form. */
function shareCalculationFamily(form: ShareForm): GeneratorFamily {
  return {
    id: `gen.${form.slug}.calculation`,
    topicId: form.topic,
    skillIds: [form.skill],
    reasoningFamily: "calculation",
    description: `Report one category's share of a season log as a ${form.noun}.`,
    enumerate: () =>
      LOGS.flatMap((log) =>
        log.categories.map((category): Candidate => {
          const total = totalOf(log);
          const value = form.value(category.count, total);
          return {
            key: `${log.id}-${category.name}`,
            invalidReason:
              form.value(category.count, total) === form.trapValue(category.count, total)
                ? "the two forms coincide here, so the mistake this question is built around cannot appear"
                : null,
            expectedResponse: () => numeric(form.value(countOf(log, category.name), totalOf(log))),
            build: () => ({
              ...baseOf(form.topic, form.objective, form.skill, 2),
              id: `q.gen.${form.slug}.share.${log.id}-${log.categories.indexOf(category)}`,
              misconceptionIds: [form.misconceptionId],
              parameters: { [form.misconceptionId]: { wrongValue: form.trapValue(category.count, total) } },
              estimatedSeconds: 60,
              accessibilityDescription: `${describeLog(log)} Enter the ${form.noun} that were ${category.name}.`,
              interaction: "numeric-input",
              prompt: `${logSentence(log)} ${category.count} were ${category.name}. ${form.ask}`,
              answer: {
                kind: "numeric",
                value,
                tolerance: form.tolerance,
                ...(form.unit ? { unit: form.unit } : {})
              },
              explanation:
                `${category.count} out of ${total} is ${form.render(value)}. Report it in the form the question asks ` +
                `for: ${form.trapText}.`
            })
          };
        })
      )
  };
}

/** The same count, moved between the two forms. */
function shareConversionFamily(form: ShareForm): GeneratorFamily {
  const other = form === AS_PROPORTION ? AS_PERCENTAGE : AS_PROPORTION;
  return {
    id: `gen.${form.slug}.representation-conversion`,
    topicId: form.topic,
    skillIds: [form.skill],
    reasoningFamily: "representation-conversion",
    description: `Move a share already reported as a ${other.noun} into a ${form.noun}.`,
    enumerate: () =>
      LOGS.flatMap((log) =>
        log.categories.map((category): Candidate => {
          const total = totalOf(log);
          const given = other.value(category.count, total);
          const wanted = form.value(category.count, total);
          return {
            key: `${log.id}-convert-${category.name}`,
            invalidReason:
              given === wanted ? "the two forms coincide here, so nothing is converted" : null,
            expectedResponse: () => numeric(form.value(countOf(log, category.name), totalOf(log))),
            build: () => ({
              ...baseOf(form.topic, form.objective, form.skill, 2),
              id: `q.gen.${form.slug}.convert.${log.id}-${log.categories.indexOf(category)}`,
              estimatedSeconds: 50,
              accessibilityDescription:
                `${log.harbour} reports a ${other.noun} of ${other.render(given)} for ${category.name}. ` +
                `Enter the same share as a ${form.noun}.`,
              interaction: "numeric-input",
              prompt:
                `${log.harbour}'s season report gives the ${other.noun} of ${log.caseNoun} that were ` +
                `${category.name} as ${other.render(given)}. What is that as a ${form.noun}?`,
              answer: {
                kind: "numeric",
                value: wanted,
                tolerance: form.tolerance,
                ...(form.unit ? { unit: form.unit } : {})
              },
              explanation:
                `The same share in two forms: ${other.render(given)} is ${form.render(wanted)}. ` +
                `Nothing about the log changed — only the way the share is written.`
            })
          };
        })
      )
  };
}

/** Which of two harbours had the greater share, on different totals. */
function shareComparisonFamily(form: ShareForm): GeneratorFamily {
  return {
    id: `gen.${form.slug}.comparison`,
    topicId: form.topic,
    skillIds: [form.skill],
    reasoningFamily: "comparison",
    description: `Compare two harbours' shares when their totals differ.`,
    enumerate: () =>
      LOGS.flatMap((a, i) =>
        LOGS.slice(i + 1).map((b): Candidate => {
          const aCat = a.categories[0]!;
          const bCat = b.categories[0]!;
          const aShare = form.value(aCat.count, totalOf(a));
          const bShare = form.value(bCat.count, totalOf(b));
          return {
            key: `${a.id}-vs-${b.id}`,
            invalidReason:
              aShare === bShare
                ? "the two shares are equal, so there is no greater one to name"
                : totalOf(a) === totalOf(b)
                  ? "equal totals let the counts be compared directly, so the share is not needed"
                  : null,
            expectedResponse: () => choose(aShare > bShare ? "ch.a" : "ch.b"),
            build: () => ({
              ...baseOf(form.topic, form.objective, form.skill, 3),
              id: `q.gen.${form.slug}.compare.${a.id}-${b.id}`,
              estimatedSeconds: 70,
              accessibilityDescription:
                `Two harbours with different totals: ${a.harbour} ${aCat.count} of ${totalOf(a)}, ` +
                `${b.harbour} ${bCat.count} of ${totalOf(b)}. Choose the greater ${form.noun}.`,
              interaction: "multiple-choice",
              prompt:
                `${a.harbour} logged ${aCat.count} ${aCat.name} out of ${totalOf(a)} ${a.caseNoun}. ` +
                `${b.harbour} logged ${bCat.count} ${bCat.name} out of ${totalOf(b)} ${b.caseNoun}. ` +
                `Which harbour's ${form.noun} is greater?`,
              choices: [
                { id: "ch.a", text: a.harbour },
                { id: "ch.b", text: b.harbour },
                { id: "ch.same", text: "Neither — the counts decide it, not the totals" }
              ],
              answer: { kind: "choice", correctChoiceIds: [aShare > bShare ? "ch.a" : "ch.b"] },
              explanation:
                `${a.harbour}: ${aCat.count} of ${totalOf(a)} is ${form.render(aShare)}. ` +
                `${b.harbour}: ${bCat.count} of ${totalOf(b)} is ${form.render(bShare)}. ` +
                `The totals differ, so the raw counts cannot be compared directly — that is what the ${form.noun} is for.`
            })
          };
        })
      )
  };
}

/** Everything that is not one category, reported as a share. */
function shareComplementFamily(form: ShareForm): GeneratorFamily {
  return {
    id: `gen.${form.slug}.multi-step`,
    topicId: form.topic,
    skillIds: [form.skill],
    reasoningFamily: "multi-step-reasoning",
    description: `Total the log, subtract one category, then report the rest as a ${form.noun}.`,
    enumerate: () =>
      LOGS.flatMap((log) =>
        log.categories.map((category): Candidate => {
          const total = totalOf(log);
          const others = total - category.count;
          return {
            key: `${log.id}-rest-${category.name}`,
            invalidReason: others === 0 ? "every case falls in this category, so there is no rest" : null,
            expectedResponse: () => {
              let rest = 0;
              for (const c of log.categories) if (c.name !== category.name) rest += c.count;
              return numeric(form.value(rest, totalOf(log)));
            },
            build: () => ({
              ...baseOf(form.topic, form.objective, form.skill, 3),
              id: `q.gen.${form.slug}.rest.${log.id}-${log.categories.indexOf(category)}`,
              estimatedSeconds: 75,
              accessibilityDescription: `${describeLog(log)} Enter the ${form.noun} that were not ${category.name}.`,
              interaction: "numeric-input",
              prompt: `${logSentence(log)} What ${form.noun} of the ${log.caseNoun} was **not** ${category.name}?`,
              answer: {
                kind: "numeric",
                value: form.value(others, total),
                tolerance: form.tolerance,
                ...(form.unit ? { unit: form.unit } : {})
              },
              explanation:
                `${total} ${log.caseNoun} altogether and ${category.count} ${category.name}, so ${others} were not. ` +
                `As a ${form.noun} of the whole log that is ${form.render(form.value(others, total))}.`
            })
          };
        })
      )
  };
}

/** The share used to decide something outside the log. */
function shareApplicationFamily(form: ShareForm): GeneratorFamily {
  return {
    id: `gen.${form.slug}.real-world-application`,
    topicId: form.topic,
    skillIds: [form.skill],
    reasoningFamily: "real-world-application",
    description: `Apply a season's ${form.noun}, stated in its own form, to a number of ${"days"} ahead.`,
    enumerate: () =>
      LOGS.flatMap((log) =>
        [10, 25, 50].map((ahead): Candidate => {
          const total = totalOf(log);
          const category = log.categories[0]!;
          const expected = round4((category.count / total) * ahead);
          return {
            key: `${log.id}-ahead-${ahead}`,
            invalidReason:
              !Number.isInteger(expected)
                ? "the expected number is not whole, and a fractional count of cases reads as an error rather than an estimate"
                : null,
            expectedResponse: () => numeric(round4((countOf(log, category.name) / totalOf(log)) * ahead)),
            build: () => ({
              ...baseOf(form.topic, form.objective, form.skill, 3),
              id: `q.gen.${form.slug}.ahead.${log.id}-${ahead}`,
              estimatedSeconds: 80,
              accessibilityDescription:
                `${describeLog(log)} Using the same ${form.noun}, enter how many of the next ${ahead} ` +
                `${log.caseNoun} would be ${category.name}.`,
              interaction: "numeric-input",
              // The share is *given* in this form's own language rather than
              // computed from the log, so the proportion and percentage versions
              // are different questions. Computing it left both forms producing
              // an identical prompt and answer, and nine of them were rejected
              // as exact duplicates — the validator catching a family that was
              // not really about its own topic.
              prompt:
                `${log.harbour}'s season report gives the ${form.noun} of ${log.caseNoun} that were ` +
                `${category.name} as ${form.render(form.value(category.count, total))}. The harbourmaster expects ` +
                `next season to run the same way. Of the next ${ahead} ${log.caseNoun}, how many would be ` +
                `${category.name}?`,
              answer: { kind: "numeric", value: expected, tolerance: 0.5, unit: log.caseNoun },
              explanation:
                `The season's ${form.noun} of ${category.name} is ${form.render(form.value(category.count, total))}. ` +
                `Applied to ${ahead} ${log.caseNoun} that is ${expected}. It is an expectation, not a promise — ` +
                `the next season is a fresh set of ${log.caseNoun}.`
            })
          };
        })
      )
  };
}

export function countsFamilies(): GeneratorFamily[] {
  return [
    frequencyCountFamily(),
    frequencyComparisonFamily(),
    frequencyComplementFamily(),
    frequencyErrorFamily(),
    frequencyVisualFamily(),
    ...SHARE_FORMS.flatMap((form) => [
      shareCalculationFamily(form),
      shareConversionFamily(form),
      shareComparisonFamily(form),
      shareComplementFamily(form),
      shareApplicationFamily(form)
    ])
  ];
}
