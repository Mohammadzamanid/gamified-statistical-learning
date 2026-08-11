/**
 * S2-15 cycle 2: two benches side by side.
 *
 * `l.r2-comparing-distributions` teaches that comparing two sets means
 * comparing their centre, their spread and their shape, and that agreement on
 * any one of the three is not agreement between the datasets. The bench asks
 * exactly those three questions, in that order, and reports each separately —
 * so a learner who drags two sets to the same median watches the comparison
 * refuse to call them alike.
 *
 * Shape is read the way the lessons read it: a mean above the median is a tail
 * on the high side. That is the reading `l.r2-skew` teaches and the one
 * `q.r2-comparing-distributions-mastery` turns on, so the bench cannot answer
 * it differently from the questions.
 */
import { summarise, type LabSummary } from "./experiment";

export type LabComparisonQuestion = "centre" | "spread" | "shape";

export interface LabComparisonFinding {
  readonly question: LabComparisonQuestion;
  /** True when the two sets answer this question the same way. */
  readonly agree: boolean;
  readonly reading: string;
}

export interface LabComparison {
  readonly a: LabSummary;
  readonly b: LabSummary;
  readonly findings: readonly LabComparisonFinding[];
  /** The sentence the bench shows and announces. */
  readonly verdict: string;
}

function say(value: number): string {
  return String(Math.round(value * 10000) / 10000);
}

/** Left, right, or level — the direction of a skew, by the taught reading. */
function skewOf(summary: LabSummary): "right" | "left" | "symmetric" {
  if (summary.mean === null || summary.median === null) return "symmetric";
  if (summary.mean > summary.median) return "right";
  if (summary.mean < summary.median) return "left";
  return "symmetric";
}

const SKEW_WORDS: Record<ReturnType<typeof skewOf>, string> = {
  right: "a tail of high readings",
  left: "a tail of low readings",
  symmetric: "no tail either way"
};

/**
 * The three comparisons, each answered on its own.
 *
 * Both benches must hold readings; with either empty there is nothing to
 * compare and the bench says so rather than answering from one side.
 */
export function compareExperiments(
  aValues: readonly number[],
  bValues: readonly number[],
  names: { a: string; b: string } = { a: "A", b: "B" }
): LabComparison {
  const a = summarise(aValues);
  const b = summarise(bValues);

  if (a.count === 0 || b.count === 0) {
    return {
      a,
      b,
      findings: [],
      verdict: "Both benches need readings before they can be compared."
    };
  }

  const centreAgree = a.median === b.median;
  const spreadAgree = a.iqr === b.iqr;
  const shapeA = skewOf(a);
  const shapeB = skewOf(b);
  const shapeAgree = shapeA === shapeB;

  const findings: LabComparisonFinding[] = [
    {
      question: "centre",
      agree: centreAgree,
      reading: centreAgree
        ? `Both sit at a median of ${say(a.median!)}.`
        : `${names.a} has a median of ${say(a.median!)}, ${names.b} ${say(b.median!)}.`
    },
    {
      question: "spread",
      agree: spreadAgree,
      reading: spreadAgree
        ? `Both middle halves span ${say(a.iqr!)}.`
        : `${names.a}'s middle half spans ${say(a.iqr!)}, ${names.b}'s ${say(b.iqr!)} — ` +
          `${say(Math.abs(b.iqr! - a.iqr!))} ${b.iqr! > a.iqr! ? "wider" : "narrower"}.`
    },
    {
      question: "shape",
      agree: shapeAgree,
      reading: shapeAgree
        ? `Both show ${SKEW_WORDS[shapeA]}.`
        : `${names.a} shows ${SKEW_WORDS[shapeA]}, ${names.b} ${SKEW_WORDS[shapeB]}.`
    }
  ];

  const differing = findings.filter((f) => !f.agree);
  const verdict =
    differing.length === 0
      ? "Centre, spread and shape all agree. On these three readings the two sets are alike — which is a statement about the three, not a promise that every reading matches."
      : differing.length === 3
        ? "All three comparisons differ: these are two different distributions on every count."
        : `They agree on ${findings.filter((f) => f.agree).map((f) => f.question).join(" and ")}, ` +
          `and differ on ${differing.map((f) => f.question).join(" and ")}. ` +
          "A comparison that stopped at the agreeing measure would have called them the same.";

  return { a, b, findings, verdict };
}
