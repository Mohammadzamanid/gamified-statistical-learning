/**
 * Generator families for the data group: tables, variables, cases, variable kinds.
 *
 * The first module that needs a **dataset**. Every generator before this one
 * built its question from a handful of loose numbers; here the question is
 * *about* a table, so the table has to exist first and the question has to be
 * answerable from it alone. Ledgers are therefore written out in full below and
 * rendered into the prompt as prose — the convention the authored questions in
 * these lessons already use, and the one that keeps a table question readable
 * without a rendered grid.
 *
 * All four topics carry a named misconception, and each goes where its own
 * **detector** can report it — not where its subject fits (D-025). Three use
 * `known-wrong-answer`, which on a numeric question means declaring the value
 * the mistake produces under `question.parameters`, since there is no distractor
 * to tag. The fourth does not, and assuming it did was this module's one real
 * mistake:
 *
 *  - `mc.wrong-column-read` — the right row, the neighbouring column's number.
 *    Declared as a `wrongValue` on the cell-reading family.
 *  - `mc.cases-counted-as-observations` — rows times columns, when rows was
 *    asked. Declared as a `wrongValue` on the case-counting family.
 *  - `mc.constant-counted-as-variable` — a column saying the same thing on every
 *    row, counted among the variables. Declared as a `wrongValue` twice.
 *  - `mc.digits-mean-numerical` — a boat number treated as a quantity because it
 *    is written with digits. Its detector is **`placement-mapping`**, so it can
 *    only be reported from a sorting question, as a declared wrong *placement*.
 *    It was first written as a tagged distractor on a multiple-choice, which
 *    reads correctly and can never fire.
 *
 * `expectedResponse` is stated by the family and never read back out of the
 * question it built (D-020); cell values are reached by walking the row rather
 * than by indexing the same array the answer key was built from.
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
// Ledgers
// --------------------------------------------------------------------------

/** One recorded property. `kind` is what the *values mean*, not how they look. */
interface Column {
  name: string;
  kind: "numerical" | "categorical";
  unit: string;
}

interface Ledger {
  id: string;
  /** What one row stands for — the case. */
  caseNoun: string;
  casePlural: string;
  /** Row labels, one per case. */
  labels: readonly string[];
  columns: readonly Column[];
  /** rows[r][c] lines up with labels[r] and columns[c]. */
  rows: ReadonlyArray<readonly number[]>;
}

/**
 * Six ledgers, written out rather than computed.
 *
 * Explicit data because a table question is only honest if the table is real:
 * a formula would make every ledger a rescaling of one ledger, and the reader of
 * this file could not check an answer by eye.
 */
const LEDGERS: readonly Ledger[] = [
  {
    id: "week",
    caseNoun: "day",
    casePlural: "days",
    labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    columns: [
      { name: "Boats out", kind: "numerical", unit: "boats" },
      { name: "Crates landed", kind: "numerical", unit: "crates" },
      { name: "Hours at sea", kind: "numerical", unit: "hours" }
    ],
    rows: [
      [3, 12, 7],
      [5, 20, 9],
      [2, 6, 4],
      [4, 18, 8],
      [6, 27, 11]
    ]
  },
  {
    id: "boats",
    caseNoun: "boat",
    casePlural: "boats",
    labels: ["Kittiwake", "Gannet", "Fulmar", "Petrel", "Skua"],
    columns: [
      { name: "Crew aboard", kind: "numerical", unit: "crew" },
      { name: "Nets carried", kind: "numerical", unit: "nets" },
      { name: "Crates landed", kind: "numerical", unit: "crates" }
    ],
    rows: [
      [4, 9, 22],
      [6, 14, 35],
      [3, 7, 15],
      [5, 11, 28],
      [7, 16, 41]
    ]
  },
  {
    id: "deliveries",
    caseNoun: "delivery",
    casePlural: "deliveries",
    labels: ["First run", "Second run", "Third run", "Fourth run", "Fifth run"],
    columns: [
      { name: "Barrels carried", kind: "numerical", unit: "barrels" },
      { name: "Miles travelled", kind: "numerical", unit: "miles" },
      { name: "Coins taken", kind: "numerical", unit: "coins" }
    ],
    rows: [
      [8, 13, 24],
      [12, 21, 39],
      [5, 9, 16],
      [15, 26, 48],
      [10, 17, 31]
    ]
  },
  {
    id: "sheds",
    caseNoun: "curing shed",
    casePlural: "curing sheds",
    labels: ["North shed", "Harbour shed", "Old shed", "West shed", "Long shed"],
    columns: [
      { name: "Salt in pounds", kind: "numerical", unit: "pounds" },
      { name: "Fish cured", kind: "numerical", unit: "fish" },
      { name: "Days to cure", kind: "numerical", unit: "days" }
    ],
    rows: [
      [40, 120, 6],
      [65, 195, 9],
      [25, 75, 4],
      [50, 150, 7],
      [80, 240, 11]
    ]
  },
  {
    id: "markets",
    caseNoun: "market day",
    casePlural: "market days",
    labels: ["Lammas", "Michaelmas", "Candlemas", "Whitsun", "Martinmas"],
    columns: [
      { name: "Stalls open", kind: "numerical", unit: "stalls" },
      { name: "Crates sold", kind: "numerical", unit: "crates" },
      { name: "Coins taken", kind: "numerical", unit: "coins" }
    ],
    rows: [
      [9, 34, 68],
      [14, 52, 104],
      [6, 21, 42],
      [11, 43, 86],
      [17, 61, 122]
    ]
  },
  {
    id: "crews",
    caseNoun: "crew",
    casePlural: "crews",
    labels: ["Aitken's crew", "Baird's crew", "Cursiter's crew", "Drever's crew", "Flett's crew"],
    columns: [
      { name: "Hands", kind: "numerical", unit: "hands" },
      { name: "Shifts worked", kind: "numerical", unit: "shifts" },
      { name: "Crates landed", kind: "numerical", unit: "crates" }
    ],
    rows: [
      [5, 12, 30],
      [8, 18, 47],
      [4, 9, 23],
      [6, 15, 38],
      [9, 21, 55]
    ]
  }
];

/**
 * The value in one cell, reached by walking the row.
 *
 * The long way round on purpose: `build()` indexes the row directly, so if the
 * two ever disagree — a transposed table, an off-by-one column — the answer
 * check catches it rather than a learner (D-020).
 */
function cellByWalking(ledger: Ledger, row: number, column: number): number {
  let index = 0;
  for (const value of ledger.rows[row]!) {
    if (index === column) return value;
    index += 1;
  }
  return Number.NaN;
}

/** The ledger written out the way the authored questions write one. */
function ledgerText(ledger: Ledger): string {
  return ledger.labels
    .map((label, r) => `${label} ${ledger.columns.map((c, i) => `${ledger.rows[r]![i]} ${c.unit}`).join(", ")}`)
    .join("; ");
}

function ledgerDescription(ledger: Ledger): string {
  return `a ledger with one row per ${ledger.caseNoun} for ${ledger.labels.length} ${ledger.casePlural}, and columns for ${ledger.columns.map((c) => c.name).join(", ")}`;
}

// ==========================================================================
// Reading tables
// ==========================================================================

const TABLES = { skill: "skill.r1-tables", topic: "t.r1-tables", objective: "obj.r1-tables" };

/**
 * Read one named cell, with the neighbouring column's value declared as the
 * mistake.
 *
 * `mc.wrong-column-read` is detected from the number typed, so the wrong value
 * is declared under `question.parameters` rather than sitting on a distractor —
 * the other half of how `known-wrong-answer` reaches a learner.
 */
function tableCellFamily(): GeneratorFamily {
  return {
    id: "gen.r1-tables.visual-interpretation",
    topicId: TABLES.topic,
    skillIds: [TABLES.skill],
    reasoningFamily: "visual-interpretation",
    description: "Find one value in a ledger by naming its row and its column.",
    enumerate: () =>
      LEDGERS.flatMap((ledger) =>
        ledger.labels.flatMap((label, row) =>
          ledger.columns.map((column, c): Candidate => {
            const value = ledger.rows[row]![c]!;
            const neighbourIndex = c === 0 ? 1 : c - 1;
            const neighbour = ledger.rows[row]![neighbourIndex]!;
            return {
              key: `${ledger.id}-${row}-${c}`,
              invalidReason:
                neighbour === value
                  ? "the neighbouring column holds the same value here, so the wrong-column mistake is invisible"
                  : null,
              expectedResponse: () => numeric(cellByWalking(ledger, row, c)),
              build: () => ({
                ...baseOf(TABLES.topic, TABLES.objective, TABLES.skill, 2),
                id: `q.gen.r1-tables.cell.${ledger.id}-${row}-${c}`,
                misconceptionIds: ["mc.wrong-column-read"],
                // The mistake this question invites: right row, wrong column.
                parameters: { "mc.wrong-column-read": { wrongValue: neighbour } },
                estimatedSeconds: 50,
                accessibilityDescription: `A question about ${ledgerDescription(ledger)}. Find the ${column.name.toLowerCase()} recorded for ${label} and enter it as a number.`,
                interaction: "numeric-input",
                prompt: `A ledger records, for each ${ledger.caseNoun}: ${ledgerText(ledger)}. How many ${column.unit} does ${label} record under ${column.name}?`,
                answer: { kind: "numeric", value, tolerance: 0, unit: column.unit },
                explanation: `Find the ${label} row first, then the ${column.name} column: they meet at ${value} ${column.unit}. The neighbouring column holds ${neighbour}, which is what reading along the wrong column gives.`
              })
            };
          })
        )
      )
  };
}

/** Which case holds the largest value in a named column. */
function tableComparisonFamily(): GeneratorFamily {
  return {
    id: "gen.r1-tables.comparison",
    topicId: TABLES.topic,
    skillIds: [TABLES.skill],
    reasoningFamily: "comparison",
    description: "Find which case carries the largest value in one column of a ledger.",
    enumerate: () =>
      LEDGERS.flatMap((ledger) =>
        ledger.columns.map((column, c): Candidate => {
          const values = ledger.labels.map((_, r) => ledger.rows[r]![c]!);
          const best = Math.max(...values);
          const winners = values.filter((v) => v === best).length;
          const winnerRow = values.indexOf(best);
          return {
            key: `${ledger.id}-${c}`,
            invalidReason: winners > 1 ? "two cases tie for the largest value, so there is no single answer" : null,
            expectedResponse: () => choose(`ch.${winnerRow}`),
            build: () => ({
              ...baseOf(TABLES.topic, TABLES.objective, TABLES.skill, 3),
              id: `q.gen.r1-tables.max.${ledger.id}-${c}`,
              misconceptionIds: [],
              estimatedSeconds: 55,
              accessibilityDescription: `A multiple-choice question about ${ledgerDescription(ledger)}, asking which ${ledger.caseNoun} recorded the most under ${column.name}.`,
              interaction: "multiple-choice",
              prompt: `A ledger records, for each ${ledger.caseNoun}: ${ledgerText(ledger)}. Which ${ledger.caseNoun} recorded the most under ${column.name}?`,
              choices: ledger.labels.map((label, r) => ({ id: `ch.${r}`, text: label })),
              answer: { kind: "choice", correctChoiceIds: [`ch.${winnerRow}`] },
              explanation: `Reading down the ${column.name} column gives ${values.join(", ")}, and the largest is ${best} — ${ledger.labels[winnerRow]}.`
            })
          };
        })
      )
  };
}

/** Two cells, then something done with both. */
function tableMultiStepFamily(): GeneratorFamily {
  return {
    id: "gen.r1-tables.multi-step-reasoning",
    topicId: TABLES.topic,
    skillIds: [TABLES.skill],
    reasoningFamily: "multi-step-reasoning",
    description: "Read two cells from a ledger and report the difference between them.",
    enumerate: () =>
      LEDGERS.flatMap((ledger) =>
        ledger.labels.flatMap((label, row) =>
          ledger.columns.slice(0, 1).map((column, c): Candidate => {
            const otherRow = (row + 2) % ledger.labels.length;
            const here = ledger.rows[row]![c]!;
            const there = ledger.rows[otherRow]![c]!;
            return {
              key: `${ledger.id}-${row}-${c}`,
              invalidReason: here === there ? "the two rows record the same value, so the difference is zero" : null,
              expectedResponse: () => {
                // Counted up from the smaller to the larger, not subtracted.
                let steps = 0;
                let at = Math.min(cellByWalking(ledger, row, c), cellByWalking(ledger, otherRow, c));
                const target = Math.max(cellByWalking(ledger, row, c), cellByWalking(ledger, otherRow, c));
                while (at < target) {
                  at += 1;
                  steps += 1;
                }
                return numeric(steps);
              },
              build: () => ({
                ...baseOf(TABLES.topic, TABLES.objective, TABLES.skill, 4),
                id: `q.gen.r1-tables.diff.${ledger.id}-${row}-${c}`,
                misconceptionIds: [],
                estimatedSeconds: 75,
                accessibilityDescription: `A two-step question about ${ledgerDescription(ledger)}: read ${column.name} for ${label} and for ${ledger.labels[otherRow]}, then give the difference.`,
                interaction: "numeric-input",
                prompt: `A ledger records, for each ${ledger.caseNoun}: ${ledgerText(ledger)}. How many more ${column.unit} under ${column.name} does ${here > there ? label : ledger.labels[otherRow]} record than ${here > there ? ledger.labels[otherRow] : label}?`,
                answer: { kind: "numeric", value: Math.abs(here - there), tolerance: 0, unit: column.unit },
                explanation: `${label} records ${here} and ${ledger.labels[otherRow]} records ${there}, a difference of ${Math.abs(here - there)} ${column.unit}. Two cells have to be found before anything can be worked out.`
              })
            };
          })
        )
      )
  };
}

/** Right row, wrong column — named as the mistake it is. */
function tableErrorFamily(): GeneratorFamily {
  return {
    id: "gen.r1-tables.error-identification",
    topicId: TABLES.topic,
    skillIds: [TABLES.skill],
    reasoningFamily: "error-identification",
    description: "Judge a reading taken from the right row and the wrong column.",
    enumerate: () =>
      LEDGERS.flatMap((ledger) =>
        ledger.labels.flatMap((label, row) =>
          ledger.columns.slice(1).map((column, ci): Candidate => {
            const c = ci + 1;
            const value = ledger.rows[row]![c]!;
            const neighbour = ledger.rows[row]![c - 1]!;
            return {
              key: `${ledger.id}-${row}-${c}`,
              invalidReason:
                neighbour === value ? "the two columns hold the same value here, so there is no error to spot" : null,
              expectedResponse: () => choose("ch.column"),
              build: () => ({
                ...baseOf(TABLES.topic, TABLES.objective, TABLES.skill, 3),
                id: `q.gen.r1-tables.err.${ledger.id}-${row}-${c}`,
                misconceptionIds: [],
                estimatedSeconds: 60,
                accessibilityDescription: `An error-identification question about a clerk who answered ${neighbour} when asked for the ${column.name.toLowerCase()} recorded by ${label}. Choose what went wrong.`,
                interaction: "error-identification",
                prompt: `A ledger records, for each ${ledger.caseNoun}: ${ledgerText(ledger)}. Asked for ${label}'s ${column.name}, a clerk answers ${neighbour}. What has gone wrong?`,
                choices: [
                  { id: "ch.column", text: `The right row was found but the value was read from the ${ledger.columns[c - 1]!.name} column` },
                  { id: "ch.row", text: "The right column was found but the wrong row was read" },
                  { id: "ch.fine", text: "Nothing — that is the right value" }
                ],
                answer: { kind: "choice", correctChoiceIds: ["ch.column"] },
                explanation: `${neighbour} is ${label}'s ${ledger.columns[c - 1]!.name}, not its ${column.name}, which is ${value}. The row was right; naming the column is the half that was skipped.`
              })
            };
          })
        )
      )
  };
}

/** The same reading, off a ledger that is nothing to do with a harbour. */
function tableTransferFamily(): GeneratorFamily {
  return {
    id: "gen.r1-tables.transfer",
    topicId: TABLES.topic,
    skillIds: [TABLES.skill],
    reasoningFamily: "transfer",
    description: "Read a cell from a table in a setting the lesson never mentions.",
    enumerate: () =>
      LEDGERS.flatMap((ledger) =>
        ledger.labels.map((label, row): Candidate => {
          const value = ledger.rows[row]![1]!;
          return {
            key: `${ledger.id}-${row}`,
            invalidReason: null,
            expectedResponse: () => numeric(cellByWalking(ledger, row, 1)),
            build: () => ({
              ...baseOf(TABLES.topic, TABLES.objective, TABLES.skill, 4),
              id: `q.gen.r1-tables.transfer.${ledger.id}-${row}`,
              misconceptionIds: [],
              estimatedSeconds: 55,
              accessibilityDescription: `A question about a school register with one row per class and columns for pupils, books issued and trips taken, asking for one named value.`,
              interaction: "numeric-input",
              prompt: `A school register has one row per class: ${ledger.labels
                .map((l, r) => `Class ${r + 1} ${ledger.rows[r]![0]} pupils, ${ledger.rows[r]![1]} books issued, ${ledger.rows[r]![2]} trips taken`)
                .join("; ")}. How many books were issued to Class ${row + 1}?`,
              answer: { kind: "numeric", value, tolerance: 0, unit: "books" },
              explanation: `Nothing here is a harbour, but a table is read the same way: down to the Class ${row + 1} row, across to books issued, which is ${value}. (${label} held the same figure in the harbour ledger.)`
            })
          };
        })
      )
  };
}

// ==========================================================================
// Data, cases and observations
// ==========================================================================

const CASES = { skill: "skill.r1-cases", topic: "t.r1-cases", objective: "obj.r1-cases" };

/** Ledger shapes described in prose, the way the authored questions describe them. */
const ROW_COUNTS = [4, 6, 7, 9, 12, 15, 20, 24];
const COL_COUNTS = [2, 3, 4, 5, 6];
const CASE_NOUNS: ReadonlyArray<{ singular: string; plural: string }> = [
  { singular: "boat", plural: "boats" },
  { singular: "day", plural: "days" },
  { singular: "delivery", plural: "deliveries" },
  { singular: "crew", plural: "crews" }
];

/** How many rows — with rows times columns declared as the mistake. */
function caseCountFamily(): GeneratorFamily {
  return {
    id: "gen.r1-cases.calculation",
    topicId: CASES.topic,
    skillIds: [CASES.skill],
    reasoningFamily: "calculation",
    description: "Count the cases in a ledger of a described shape.",
    enumerate: () =>
      CASE_NOUNS.flatMap((noun, ni) =>
        ROW_COUNTS.flatMap((rows) =>
          COL_COUNTS.map((cols): Candidate => ({
            key: `${ni}-${rows}-${cols}`,
            invalidReason:
              cols === 1 ? "a single column makes cases and observations the same number" : null,
            expectedResponse: () => numeric(rows),
            build: () => ({
              ...baseOf(CASES.topic, CASES.objective, CASES.skill, 2),
              id: `q.gen.r1-cases.cases.${ni}-${rows}-${cols}`,
              misconceptionIds: ["mc.cases-counted-as-observations"],
              // Counting every recorded value instead of every row.
              parameters: { "mc.cases-counted-as-observations": { wrongValue: rows * cols } },
              estimatedSeconds: 45,
              accessibilityDescription: `A question about a ledger with one row per ${noun.singular}, covering ${rows} ${noun.plural}, with ${cols} columns. Enter the number of cases.`,
              interaction: "numeric-input",
              prompt: `A ledger has one row per ${noun.singular}, covers ${rows} ${noun.plural}, and records ${cols} things about each. How many CASES does it hold?`,
              answer: { kind: "numeric", value: rows, tolerance: 0, unit: "cases" },
              explanation: `One row is one case, and there are ${rows} rows, so ${rows} cases. ${rows * cols} is the number of recorded values — the observations.`
            })
          }))
        )
      )
  };
}

/** How many recorded values — the other half of the same distinction. */
function observationCountFamily(): GeneratorFamily {
  return {
    id: "gen.r1-cases.multi-step-reasoning",
    topicId: CASES.topic,
    skillIds: [CASES.skill],
    reasoningFamily: "multi-step-reasoning",
    description: "Count the observations in a ledger of a described shape.",
    enumerate: () =>
      CASE_NOUNS.flatMap((noun, ni) =>
        ROW_COUNTS.flatMap((rows) =>
          COL_COUNTS.map((cols): Candidate => ({
            key: `${ni}-${rows}-${cols}`,
            invalidReason: cols === 1 ? "a single column makes cases and observations the same number" : null,
            expectedResponse: () => {
              // Counted a row at a time rather than multiplied.
              let total = 0;
              for (let r = 0; r < rows; r++) total += cols;
              return numeric(total);
            },
            build: () => ({
              ...baseOf(CASES.topic, CASES.objective, CASES.skill, 3),
              id: `q.gen.r1-cases.obs.${ni}-${rows}-${cols}`,
              misconceptionIds: [],
              estimatedSeconds: 60,
              accessibilityDescription: `A question about a ledger with one row per ${noun.singular}, covering ${rows} ${noun.plural}, with ${cols} columns. Enter the number of observations.`,
              interaction: "numeric-input",
              prompt: `A ledger has one row per ${noun.singular}, covers ${rows} ${noun.plural}, and records ${cols} things about each. How many OBSERVATIONS does it hold?`,
              answer: { kind: "numeric", value: rows * cols, tolerance: 0, unit: "observations" },
              explanation: `Every ${noun.singular} contributes ${cols} recorded values, and there are ${rows} of them, so ${rows * cols} observations. The number of cases is just ${rows}.`
            })
          }))
        )
      )
  };
}

/** What one row stands for, when the description makes it ambiguous. */
function caseRecognitionFamily(): GeneratorFamily {
  return {
    id: "gen.r1-cases.recognition",
    topicId: CASES.topic,
    skillIds: [CASES.skill],
    reasoningFamily: "recognition",
    description: "Name what one row of a described ledger stands for.",
    enumerate: () =>
      CASE_NOUNS.flatMap((noun, ni) =>
        ROW_COUNTS.map((rows): Candidate => ({
          key: `${ni}-${rows}`,
          invalidReason: null,
          expectedResponse: () => choose("ch.case"),
          build: () => ({
            ...baseOf(CASES.topic, CASES.objective, CASES.skill, 2),
            id: `q.gen.r1-cases.what.${ni}-${rows}`,
            misconceptionIds: [],
            estimatedSeconds: 45,
            accessibilityDescription: `A multiple-choice question asking what one row stands for in a ledger holding one row per ${noun.singular} across ${rows} ${noun.plural}.`,
            interaction: "multiple-choice",
            prompt: `A ledger keeps one row for every ${noun.singular}, and covers ${rows} ${noun.plural}. What is the CASE in this dataset?`,
            choices: [
              { id: "ch.case", text: `One ${noun.singular}` },
              { id: "ch.value", text: "One recorded value" },
              { id: "ch.whole", text: `All ${rows} ${noun.plural} together` }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.case"] },
            explanation: `The case is whatever one row represents, and here each row is one ${noun.singular}. A single recorded value is an observation, and the whole set of ${rows} is the dataset.`
          })
        }))
      )
  };
}

/** Which of two ledgers records more, when neither is bigger on both counts. */
function caseComparisonFamily(): GeneratorFamily {
  return {
    id: "gen.r1-cases.comparison",
    topicId: CASES.topic,
    skillIds: [CASES.skill],
    reasoningFamily: "comparison",
    description: "Compare two ledgers on observations when one has more rows and the other more columns.",
    enumerate: () =>
      ROW_COUNTS.flatMap((rows, ri) =>
        COL_COUNTS.map((cols): Candidate => {
          const otherRows = ROW_COUNTS[(ri + 3) % ROW_COUNTS.length]!;
          const otherCols = cols + 2;
          const here = rows * cols;
          const there = otherRows * otherCols;
          return {
            key: `${rows}-${cols}`,
            invalidReason:
              here === there
                ? "the two ledgers hold the same number of observations, so there is nothing to compare"
                : rows > otherRows && cols > otherCols
                  ? "one ledger is larger on both counts, so no reading is needed"
                  : null,
            expectedResponse: () => choose(here > there ? "ch.first" : "ch.second"),
            build: () => ({
              ...baseOf(CASES.topic, CASES.objective, CASES.skill, 4),
              id: `q.gen.r1-cases.cmp.${rows}-${cols}`,
              misconceptionIds: [],
              estimatedSeconds: 70,
              accessibilityDescription: `A multiple-choice question comparing a ledger of ${rows} rows by ${cols} columns with one of ${otherRows} rows by ${otherCols} columns, asking which holds more observations.`,
              interaction: "multiple-choice",
              prompt: `One ledger has ${rows} rows and ${cols} columns. Another has ${otherRows} rows and ${otherCols} columns. Which holds more OBSERVATIONS?`,
              choices: [
                { id: "ch.first", text: `The ${rows}-row ledger` },
                { id: "ch.second", text: `The ${otherRows}-row ledger` },
                { id: "ch.equal", text: "They hold the same number" }
              ],
              answer: { kind: "choice", correctChoiceIds: [here > there ? "ch.first" : "ch.second"] },
              explanation: `${rows} by ${cols} is ${here} observations; ${otherRows} by ${otherCols} is ${there}. Counting rows alone would answer a different question.`
            })
          };
        })
      )
  };
}

// ==========================================================================
// Variables
// ==========================================================================

const VARS = { skill: "skill.r1-variables", topic: "t.r1-variables", objective: "obj.r1-variables" };

/** Columns that say the same thing on every row, so they are not variables. */
const CONSTANT_COLUMNS = [
  { name: "Harbour", value: "Kirkwall" },
  { name: "Year", value: "1887" },
  { name: "Recorded by", value: "the harbourmaster" },
  { name: "Region", value: "Orkney" }
];

/** How many of a ledger's columns can actually explain a difference. */
function variableCountFamily(): GeneratorFamily {
  return {
    id: "gen.r1-variables.recognition",
    topicId: VARS.topic,
    skillIds: [VARS.skill],
    reasoningFamily: "recognition",
    description: "Count the columns of a ledger that genuinely vary between cases.",
    enumerate: () =>
      LEDGERS.flatMap((ledger) =>
        CONSTANT_COLUMNS.map((constant, ci): Candidate => {
          const varying = ledger.columns.length;
          const total = varying + 1;
          return {
            key: `${ledger.id}-${ci}`,
            invalidReason: varying < 2 ? "a ledger with one varying column has nothing to count" : null,
            expectedResponse: () => {
              // Counted one column at a time from the list that excludes the
              // constant, rather than reading the length the answer key uses.
              let count = 0;
              for (const column of ledger.columns) if (column.name !== constant.name) count += 1;
              return numeric(count);
            },
            build: () => ({
              ...baseOf(VARS.topic, VARS.objective, VARS.skill, 3),
              id: `q.gen.r1-variables.count.${ledger.id}-${ci}`,
              misconceptionIds: ["mc.constant-counted-as-variable"],
              // Counting the constant column among the variables.
              parameters: { "mc.constant-counted-as-variable": { wrongValue: total } },
              estimatedSeconds: 60,
              accessibilityDescription: `A question about ${ledgerDescription(ledger)} with an extra ${constant.name} column reading ${constant.value} on every row. Enter how many columns are variables.`,
              interaction: "numeric-input",
              prompt: `A ledger has one row per ${ledger.caseNoun} and ${total} columns: ${constant.name}, which reads "${constant.value}" on every single row, and ${ledger.columns.map((c) => c.name).join(", ")}. How many of its columns are VARIABLES?`,
              answer: { kind: "numeric", value: varying, tolerance: 0, unit: "variables" },
              explanation: `${varying}. A variable has to differ between cases, and ${constant.name} says "${constant.value}" on every row — it describes the whole ledger, so it can never explain why one ${ledger.caseNoun} differs from another. Counting it would give ${total}.`
            })
          };
        })
      )
  };
}

/** Which column could account for a difference between two cases. */
function variableExplainsFamily(): GeneratorFamily {
  return {
    id: "gen.r1-variables.comparison",
    topicId: VARS.topic,
    skillIds: [VARS.skill],
    reasoningFamily: "comparison",
    description: "Pick the column that could account for a difference between two cases.",
    enumerate: () =>
      LEDGERS.flatMap((ledger) =>
        CONSTANT_COLUMNS.map((constant, ci): Candidate => ({
          key: `${ledger.id}-${ci}`,
          invalidReason: null,
          expectedResponse: () => choose("ch.varying"),
          build: () => ({
            ...baseOf(VARS.topic, VARS.objective, VARS.skill, 4),
            id: `q.gen.r1-variables.explains.${ledger.id}-${ci}`,
            misconceptionIds: [],
            estimatedSeconds: 60,
            accessibilityDescription: `A multiple-choice question asking which column of a ledger could explain why two ${ledger.casePlural} landed different amounts, where one column is the same on every row.`,
            interaction: "multiple-choice",
            prompt: `A ledger of ${ledger.casePlural} has a ${constant.name} column reading "${constant.value}" on every row, alongside ${ledger.columns.map((c) => c.name).join(" and ")}. Two ${ledger.casePlural} landed very different amounts. Which column could help explain why?`,
            choices: [
              { id: "ch.varying", text: ledger.columns[0]!.name },
              { id: "ch.constant", text: constant.name },
              { id: "ch.neither", text: "Neither column can explain anything" }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.varying"] },
            explanation: `${constant.name} reads "${constant.value}" for both ${ledger.casePlural}, so it cannot be what makes them different. ${ledger.columns[0]!.name} varies, so it can.`
          })
        }))
      )
  };
}

/** A count that swept the constant column in with the rest. */
function variableErrorFamily(): GeneratorFamily {
  return {
    id: "gen.r1-variables.error-identification",
    topicId: VARS.topic,
    skillIds: [VARS.skill],
    reasoningFamily: "error-identification",
    description: "Judge a variable count that included a column holding one value.",
    enumerate: () =>
      LEDGERS.flatMap((ledger) =>
        CONSTANT_COLUMNS.map((constant, ci): Candidate => {
          const total = ledger.columns.length + 1;
          return {
            key: `${ledger.id}-${ci}`,
            invalidReason: null,
            expectedResponse: () => choose("ch.constant"),
            build: () => ({
              ...baseOf(VARS.topic, VARS.objective, VARS.skill, 4),
              id: `q.gen.r1-variables.err.${ledger.id}-${ci}`,
              misconceptionIds: [],
              estimatedSeconds: 65,
              accessibilityDescription: `An error-identification question about a clerk who counted ${total} variables in a ledger whose ${constant.name} column reads the same on every row.`,
              interaction: "error-identification",
              prompt: `A ledger of ${ledger.casePlural} has ${total} columns, one of them ${constant.name}, which reads "${constant.value}" on every row. A clerk reports ${total} variables. What has gone wrong?`,
              choices: [
                { id: "ch.constant", text: `${constant.name} holds one value throughout, so it is not a variable` },
                { id: "ch.rows", text: "The rows were counted instead of the columns" },
                { id: "ch.fine", text: "Nothing — every column is a variable" }
              ],
              answer: { kind: "choice", correctChoiceIds: ["ch.constant"] },
              explanation: `A column earns the name variable only if its value actually differs between cases. ${constant.name} does not, so the count is ${ledger.columns.length}, not ${total}.`
            })
          };
        })
      )
  };
}

/**
 * How many recorded values the *variables* account for.
 *
 * Enumerated over described shapes rather than over the six ledgers, because
 * every ledger here has three columns and five rows: running this over them
 * would ask the same arithmetic six times with the same numbers, and the
 * near-duplicate gate would correctly throw five of them away. Varying the shape
 * is what makes these different questions rather than the same one renamed.
 */
function variableObservationsFamily(): GeneratorFamily {
  return {
    id: "gen.r1-variables.multi-step-reasoning",
    topicId: VARS.topic,
    skillIds: [VARS.skill],
    reasoningFamily: "multi-step-reasoning",
    description: "Count a ledger's variables, then the observations those variables account for.",
    enumerate: () =>
      CONSTANT_COLUMNS.flatMap((constant, ci) =>
        ROW_COUNTS.flatMap((rows) =>
          COL_COUNTS.map((cols): Candidate => {
            const varying = cols - 1;
            return {
              key: `${ci}-${rows}-${cols}`,
              invalidReason:
                varying < 2
                  ? "with one varying column there is no counting step before the multiplication"
                  : null,
              expectedResponse: () => {
                // Counted a row at a time over the varying columns only.
                let total = 0;
                for (let r = 0; r < rows; r++) total += cols - 1;
                return numeric(total);
              },
              build: () => ({
                ...baseOf(VARS.topic, VARS.objective, VARS.skill, 4),
                id: `q.gen.r1-variables.obs.${ci}-${rows}-${cols}`,
                misconceptionIds: [],
                estimatedSeconds: 85,
                accessibilityDescription: `A two-step question about a ledger of ${rows} rows and ${cols} columns, one of which reads the same on every row. Enter how many observations its variables account for.`,
                interaction: "numeric-input",
                prompt: `A ledger has ${rows} rows and ${cols} columns. One column is ${constant.name}, which reads "${constant.value}" on every single row. How many observations do its VARIABLES account for?`,
                answer: { kind: "numeric", value: rows * varying, tolerance: 0, unit: "observations" },
                explanation: `${constant.name} is not a variable, so ${varying} of the ${cols} columns are. Each of the ${rows} rows contributes ${varying} values, giving ${rows * varying}. Counting all ${cols} columns would give ${rows * cols}.`
              })
            };
          })
        )
      )
  };
}

/** The same judgement about a register that has nothing to do with a harbour. */
function variableTransferFamily(): GeneratorFamily {
  return {
    id: "gen.r1-variables.transfer",
    topicId: VARS.topic,
    skillIds: [VARS.skill],
    reasoningFamily: "transfer",
    description: "Count the variables in a register from a setting the lesson never mentions.",
    enumerate: () =>
      ROW_COUNTS.flatMap((rows) =>
        COL_COUNTS.map((cols): Candidate => ({
          key: `${rows}-${cols}`,
          invalidReason: cols < 3 ? "too few columns for a constant and more than one variable" : null,
          expectedResponse: () => {
            let count = 0;
            for (let c = 0; c < cols; c++) if (c > 0) count += 1;
            return numeric(count);
          },
          build: () => ({
            ...baseOf(VARS.topic, VARS.objective, VARS.skill, 4),
            id: `q.gen.r1-variables.transfer.${rows}-${cols}`,
            misconceptionIds: ["mc.constant-counted-as-variable"],
            parameters: { "mc.constant-counted-as-variable": { wrongValue: cols } },
            estimatedSeconds: 60,
            accessibilityDescription: `A question about a school register of ${rows} rows and ${cols} columns, one of which names the same school on every row. Enter how many columns are variables.`,
            interaction: "numeric-input",
            prompt: `A school register lists ${rows} pupils with ${cols} columns about each. One column is School, and every pupil in it attends the same school. How many of the ${cols} columns are VARIABLES?`,
            answer: { kind: "numeric", value: cols - 1, tolerance: 0, unit: "variables" },
            explanation: `Nothing here is a harbour ledger, but the rule has not changed: a column that says the same thing on every row cannot distinguish one pupil from another. So ${cols - 1} of the ${cols} are variables.`
          })
        }))
      )
  };
}

// ==========================================================================
// Categorical and numerical variables
// ==========================================================================

const KINDS = { skill: "skill.r1-variable-kinds", topic: "t.r1-variable-kinds", objective: "obj.r1-variable-kinds" };

/**
 * Columns and what they really are.
 *
 * `digits` marks the ones written with numerals that are still categorical —
 * the whole point of the lesson, and the misconception this topic carries.
 */
const KIND_COLUMNS: ReadonlyArray<{ name: string; numerical: boolean; digits: boolean; why: string }> = [
  { name: "Crates landed", numerical: true, digits: true, why: "two catches added together is a meaningful total" },
  { name: "Hours at sea", numerical: true, digits: true, why: "two spells at sea added together is a meaningful total" },
  { name: "Crew aboard", numerical: true, digits: true, why: "two crews added together is a meaningful total" },
  { name: "Coins taken", numerical: true, digits: true, why: "two takings added together is a meaningful total" },
  { name: "Boat number", numerical: false, digits: true, why: "boat 3 plus boat 7 is not boat 10 — the number is a name" },
  { name: "Berth number", numerical: false, digits: true, why: "berth 2 plus berth 5 is not berth 7 — the number is a label" },
  { name: "Postcode", numerical: false, digits: true, why: "adding two postcodes gives a number that points nowhere" },
  { name: "Year recorded", numerical: false, digits: true, why: "1887 plus 1888 is not a year at all" },
  { name: "Home port", numerical: false, digits: false, why: "ports cannot be added" },
  { name: "Weather", numerical: false, digits: false, why: "weather cannot be added" },
  { name: "Skipper's name", numerical: false, digits: false, why: "names cannot be added" },
  { name: "Catch sold to", numerical: false, digits: false, why: "buyers cannot be added" }
];

/**
 * Which kind is this column, with the digits trap offered and tagged.
 *
 * `mc.digits-mean-numerical` sits on the "numerical" option, and only where the
 * column is written with digits but is not numerical — offering it anywhere else
 * would tag an option nobody would pick for that reason.
 */
function kindRecognitionFamily(): GeneratorFamily {
  return {
    id: "gen.r1-variable-kinds.recognition",
    topicId: KINDS.topic,
    skillIds: [KINDS.skill],
    reasoningFamily: "recognition",
    description: "Say whether a column is numerical or categorical, digits notwithstanding.",
    enumerate: () =>
      LEDGERS.flatMap((ledger) =>
        KIND_COLUMNS.map((column): Candidate => {
          return {
            key: `${ledger.id}-${column.name}`,
            invalidReason: null,
            expectedResponse: () => choose(column.numerical ? "ch.numerical" : "ch.categorical"),
            build: () => ({
              ...baseOf(KINDS.topic, KINDS.objective, KINDS.skill, 3),
              id: `q.gen.r1-variable-kinds.what.${ledger.id}-${column.name.replace(/[^a-z]/gi, "-").toLowerCase()}`,
              // No misconception declared, though this is exactly the question
              // `mc.digits-mean-numerical` is about. Its detector is
              // `placement-mapping`, which reads the evaluator's placement
              // signals, so it cannot fire for a choice answer however apt the
              // tag reads — D-025. The sorting family below is its home.
              misconceptionIds: [],
              estimatedSeconds: 50,
              accessibilityDescription: `A multiple-choice question asking whether the ${column.name} column of a ledger of ${ledger.casePlural} is a numerical or a categorical variable.`,
              interaction: "multiple-choice",
              prompt: `A ledger of ${ledger.casePlural} records a column called ${column.name}. Is that a numerical variable or a categorical one?`,
              choices: [
                { id: "ch.numerical", text: "Numerical — its values are quantities that can sensibly be added" },
                { id: "ch.categorical", text: "Categorical — its values sort cases into groups" },
                { id: "ch.neither", text: "Neither — a column can be left unclassified" }
              ],
              answer: { kind: "choice", correctChoiceIds: [column.numerical ? "ch.numerical" : "ch.categorical"] },
              explanation: `${column.name} is ${column.numerical ? "numerical" : "categorical"}: ${column.why}. The test is never whether the values are written with digits.`
            })
          };
        })
      )
  };
}

/** Which column can honestly be totalled. */
function kindMethodFamily(): GeneratorFamily {
  return {
    id: "gen.r1-variable-kinds.comparison",
    topicId: KINDS.topic,
    skillIds: [KINDS.skill],
    reasoningFamily: "comparison",
    description: "Choose which of two columns a total may honestly be taken over.",
    enumerate: () =>
      KIND_COLUMNS.filter((c) => c.numerical).flatMap((good) =>
        KIND_COLUMNS.filter((c) => !c.numerical).map((bad): Candidate => ({
          key: `${good.name}-vs-${bad.name}`,
          invalidReason: null,
          expectedResponse: () => choose("ch.good"),
          build: () => ({
            ...baseOf(KINDS.topic, KINDS.objective, KINDS.skill, 3),
            id: `q.gen.r1-variable-kinds.total.${good.name.replace(/[^a-z]/gi, "-").toLowerCase()}-${bad.name.replace(/[^a-z]/gi, "-").toLowerCase()}`,
            misconceptionIds: [],
            estimatedSeconds: 55,
            accessibilityDescription: `A multiple-choice question asking which of the columns ${good.name} and ${bad.name} a total can honestly be taken over.`,
            interaction: "method-selection",
            prompt: `A ledger holds a ${good.name} column and a ${bad.name} column. A total is to be taken. Which column can it honestly be taken over?`,
            choices: [
              { id: "ch.good", text: good.name },
              { id: "ch.bad", text: bad.name },
              { id: "ch.both", text: "Both — the arithmetic works either way" }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.good"] },
            explanation: `${good.name}: ${good.why}. A total over ${bad.name} would run without complaint and mean nothing — ${bad.why}.`
          })
        }))
      )
  };
}

/** Someone averaged the boat numbers. */
function kindErrorFamily(): GeneratorFamily {
  return {
    id: "gen.r1-variable-kinds.error-identification",
    topicId: KINDS.topic,
    skillIds: [KINDS.skill],
    reasoningFamily: "error-identification",
    description: "Judge a summary taken over a column that cannot carry one.",
    enumerate: () =>
      LEDGERS.flatMap((ledger) =>
        KIND_COLUMNS.filter((c) => !c.numerical).map((column): Candidate => ({
          key: `${ledger.id}-${column.name}`,
          invalidReason: null,
          expectedResponse: () => choose("ch.categorical"),
          build: () => ({
            ...baseOf(KINDS.topic, KINDS.objective, KINDS.skill, 4),
            id: `q.gen.r1-variable-kinds.err.${ledger.id}-${column.name.replace(/[^a-z]/gi, "-").toLowerCase()}`,
            misconceptionIds: [],
            estimatedSeconds: 65,
            accessibilityDescription: `An error-identification question about an average taken over the ${column.name} column of a ledger of ${ledger.casePlural}. Choose what went wrong.`,
            interaction: "error-identification",
            prompt: `A clerk reports the average ${column.name} across the ledger's ${ledger.casePlural}, and the calculator gave an answer without complaint. What is wrong with the report?`,
            choices: [
              { id: "ch.categorical", text: `${column.name} sorts cases into groups, so its average refers to nothing` },
              { id: "ch.rounding", text: "The average is right but should have been rounded" },
              { id: "ch.fine", text: "Nothing — the calculator returned a number" }
            ],
            answer: { kind: "choice", correctChoiceIds: ["ch.categorical"] },
            explanation: `The arithmetic will run on anything. ${column.why[0]!.toUpperCase()}${column.why.slice(1)}, so the average is a number about nothing.`
          })
        }))
      )
  };
}

/** Classifying a column well away from the harbour. */
function kindTransferFamily(): GeneratorFamily {
  return {
    id: "gen.r1-variable-kinds.transfer",
    topicId: KINDS.topic,
    skillIds: [KINDS.skill],
    reasoningFamily: "transfer",
    description: "Classify a column in a setting the lesson never mentions.",
    enumerate: () => {
      const school: ReadonlyArray<{ name: string; numerical: boolean; why: string }> = [
        { name: "Pupils in the class", numerical: true, why: "two class sizes added together is a meaningful total" },
        { name: "Books issued", numerical: true, why: "two counts of books added together is a meaningful total" },
        { name: "Minutes late", numerical: true, why: "two latenesses added together is a meaningful total" },
        { name: "Room number", numerical: false, why: "room 4 plus room 9 is not room 13 — the number is a name" },
        { name: "Register number", numerical: false, why: "register numbers identify pupils, they do not measure them" },
        { name: "Favourite subject", numerical: false, why: "subjects cannot be added" }
      ];
      return school.flatMap((column, i) =>
        CASE_NOUNS.map((_noun, ni): Candidate => ({
          key: `${i}-${ni}`,
          invalidReason: ni > 1 ? "only two framings of this question are distinct; the rest repeat one of them" : null,
          expectedResponse: () => choose(column.numerical ? "ch.numerical" : "ch.categorical"),
          build: () => ({
            ...baseOf(KINDS.topic, KINDS.objective, KINDS.skill, 4),
            id: `q.gen.r1-variable-kinds.transfer.${i}-${ni}`,
            misconceptionIds: [],
            estimatedSeconds: 50,
            accessibilityDescription: `A multiple-choice question asking whether the ${column.name} column of a school register is numerical or categorical.`,
            interaction: "multiple-choice",
            prompt: `${ni === 0 ? "A school register" : "A school's end-of-term summary"} records a column called ${column.name}. Is it numerical or categorical?`,
            choices: [
              { id: "ch.numerical", text: "Numerical — its values are quantities that can sensibly be added" },
              { id: "ch.categorical", text: "Categorical — its values sort pupils or classes into groups" },
              { id: "ch.neither", text: "Neither — a column can be left unclassified" }
            ],
            answer: { kind: "choice", correctChoiceIds: [column.numerical ? "ch.numerical" : "ch.categorical"] },
            explanation: `Nothing here is a harbour, but the test has not changed: ${column.why}. So ${column.name} is ${column.numerical ? "numerical" : "categorical"}.`
          })
        }))
      );
    }
  };
}

/**
 * Sorting columns into kinds — the one interaction `mc.digits-mean-numerical`
 * can actually be reported from.
 *
 * Its detector is `placement-mapping`, which reads the evaluator's placement
 * signals, so the misconception has to be declared as a wrong *placement*: a
 * digits-written label dropped into the numerical zone. A first attempt tagged
 * it on a multiple-choice distractor instead, which read perfectly and could
 * never fire.
 */
function kindSortingFamily(): GeneratorFamily {
  const numericalColumns = KIND_COLUMNS.filter((c) => c.numerical);
  const digitLabels = KIND_COLUMNS.filter((c) => c.digits && !c.numerical);
  const wordLabels = KIND_COLUMNS.filter((c) => !c.digits);
  const slug = (name: string): string => name.replace(/[^a-z]/gi, "-").toLowerCase();

  return {
    id: "gen.r1-variable-kinds.visual-interpretation",
    topicId: KINDS.topic,
    skillIds: [KINDS.skill],
    reasoningFamily: "visual-interpretation",
    description: "Sort a ledger's columns into numerical and categorical, with a digits-written label among them.",
    enumerate: () =>
      digitLabels.flatMap((trap, ti) =>
        numericalColumns.flatMap((numerical, ni) =>
          wordLabels.map((worded, wi): Candidate => ({
            key: `${ti}-${ni}-${wi}`,
            invalidReason:
              numerical.name === trap.name
                ? "the same column cannot be both the quantity and the label"
                : null,
            expectedResponse: () => ({
              kind: "placement",
              zones: [
                { zoneId: "z.numerical", itemIds: ["it.quantity"] },
                { zoneId: "z.categorical", itemIds: ["it.trap", "it.worded"] }
              ]
            }),
            build: () => ({
              ...baseOf(KINDS.topic, KINDS.objective, KINDS.skill, 3),
              id: `q.gen.r1-variable-kinds.sort.${slug(trap.name)}-${slug(numerical.name)}-${slug(worded.name)}`,
              misconceptionIds: ["mc.digits-mean-numerical"],
              estimatedSeconds: 85,
              accessibilityDescription: `Sort three ledger columns — ${numerical.name}, ${trap.name} and ${worded.name} — into a numerical group and a categorical group.`,
              interaction: "drag-and-drop",
              prompt: `A ledger records these three things about every catch. Sort each into the right kind of variable.`,
              items: [
                { id: "it.quantity", text: numerical.name },
                { id: "it.trap", text: `${trap.name} (written with digits)` },
                { id: "it.worded", text: worded.name }
              ],
              dropZones: [
                { id: "z.numerical", label: "Numerical", description: "Values are quantities you could add or average." },
                { id: "z.categorical", label: "Categorical", description: "Values sort cases into groups." }
              ],
              answer: {
                kind: "placement",
                zones: [
                  { zoneId: "z.numerical", itemIds: ["it.quantity"] },
                  { zoneId: "z.categorical", itemIds: ["it.trap", "it.worded"] }
                ],
                orderMatters: false,
                // The whole point of the topic, declared where the evaluator can
                // classify it: the digits-written label dropped in as a quantity.
                misconceptionPlacements: [
                  { itemId: "it.trap", zoneId: "z.numerical", misconceptionId: "mc.digits-mean-numerical" }
                ]
              },
              explanation: `${numerical.name} is numerical: ${numerical.why}. ${trap.name} is written with digits and is still categorical — ${trap.why}. ${worded.name} is categorical too: ${worded.why}.`
            })
          }))
        )
      )
  };
}

/** Every family in the data group. */
export function dataFamilies(): GeneratorFamily[] {
  return [
    tableCellFamily(),
    tableComparisonFamily(),
    tableMultiStepFamily(),
    tableErrorFamily(),
    tableTransferFamily(),
    caseCountFamily(),
    observationCountFamily(),
    caseRecognitionFamily(),
    caseComparisonFamily(),
    variableCountFamily(),
    variableExplainsFamily(),
    variableErrorFamily(),
    variableObservationsFamily(),
    variableTransferFamily(),
    kindRecognitionFamily(),
    kindMethodFamily(),
    kindErrorFamily(),
    kindSortingFamily(),
    kindTransferFamily()
  ];
}

export { LEDGERS, KIND_COLUMNS, cellByWalking, ledgerText };
