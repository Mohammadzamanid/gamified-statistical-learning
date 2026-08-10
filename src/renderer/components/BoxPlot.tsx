import type { Dataset } from "../../shared/schemas";
import { fiveNumberSummary } from "../../core/statistics/descriptive";

/**
 * Accessible SVG box plot of a dataset's five-number summary.
 *
 * The five numbers come from `src/core/statistics`, under the convention the
 * curriculum teaches — median-of-halves, not interpolation (D-045). Drawing them
 * here from a second implementation is exactly how a chart ends up disagreeing
 * with the lesson that taught a learner to compute them, which is the defect
 * this cycle found on the laboratory panel.
 */
export function BoxPlot({
  dataset,
  caption,
  accessibleDescription
}: {
  dataset: Dataset;
  caption?: string;
  accessibleDescription?: string;
}): JSX.Element {
  const valueIdx = dataset.columns.findIndex((c) => c.kind === "numeric");
  const values = dataset.rows
    .map((r) => Number(r[valueIdx] ?? Number.NaN))
    .filter((v) => Number.isFinite(v));

  const width = 520;
  const height = 190;
  const pad = { top: 24, right: 24, bottom: 44, left: 24 };
  const innerW = width - pad.left - pad.right;
  const midY = pad.top + (height - pad.top - pad.bottom) / 2;
  const boxH = 46;

  if (values.length === 0) {
    return (
      <figure style={{ margin: 0 }}>
        <p className="muted">{accessibleDescription ?? "No readings to plot."}</p>
      </figure>
    );
  }

  const s = fiveNumberSummary(values);
  const span = s.max - s.min || 1;
  const at = (v: number): number => pad.left + ((v - s.min) / span) * innerW;

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={accessibleDescription ?? caption ?? dataset.title}
        style={{
          width: "100%",
          height: "auto",
          background: "var(--bg-raise)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--line)"
        }}
      >
        {/* Whiskers: min to Q1, and Q3 to max. */}
        <line x1={at(s.min)} x2={at(s.q1)} y1={midY} y2={midY} stroke="var(--ink-faint)" />
        <line x1={at(s.q3)} x2={at(s.max)} y1={midY} y2={midY} stroke="var(--ink-faint)" />
        {[s.min, s.max].map((v) => (
          <line key={`cap-${v}`} x1={at(v)} x2={at(v)} y1={midY - boxH / 3} y2={midY + boxH / 3} stroke="var(--ink-faint)" />
        ))}
        {/* The box is the middle half: Q1 to Q3, which is the interquartile range. */}
        <rect
          x={at(s.q1)}
          y={midY - boxH / 2}
          width={Math.max(1, at(s.q3) - at(s.q1))}
          height={boxH}
          fill="var(--accent)"
          opacity={0.28}
          stroke="var(--accent)"
        />
        <line x1={at(s.median)} x2={at(s.median)} y1={midY - boxH / 2} y2={midY + boxH / 2} stroke="var(--accent)" strokeWidth={3} />
        {([["min", s.min], ["Q1", s.q1], ["median", s.median], ["Q3", s.q3], ["max", s.max]] as const).map(
          ([label, v], i) => (
            <text
              key={label}
              x={at(v)}
              y={i % 2 === 0 ? height - 24 : height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="var(--ink-faint)"
              fontFamily="var(--font-data)"
            >
              {trim(v)}
            </text>
          )
        )}
      </svg>
      {caption && <figcaption className="faint">{caption}</figcaption>}
    </figure>
  );
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
