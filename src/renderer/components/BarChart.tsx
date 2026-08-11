import type { Dataset } from "../../shared/schemas";

/**
 * Accessible SVG bar chart for small categorical/numeric datasets.
 * Uses the first categorical column as labels and first numeric column as values.
 */
export function BarChart({ dataset, caption, accessibleDescription, axisMin }: {
  dataset: Dataset;
  caption?: string;
  accessibleDescription?: string;
  /**
   * Where the value axis starts. Defaults to zero, which is the only setting
   * that makes bar *lengths* comparable — a bar twice as tall meaning twice as
   * much is a promise the chart only keeps from a zero baseline.
   *
   * A non-zero value is therefore not a styling preference but the subject of
   * `l.r2-misleading-graphs`: the same honest numbers, drawn so that a small
   * difference fills the frame.
   */
  axisMin?: number;
}): JSX.Element {
  const labelIdx = dataset.columns.findIndex((c) => c.kind === "categorical");
  const valueIdx = dataset.columns.findIndex((c) => c.kind === "numeric");
  const rows = dataset.rows
    .map((r) => ({ label: String(r[labelIdx] ?? ""), value: Number(r[valueIdx] ?? 0) }))
    .filter((r) => Number.isFinite(r.value));

  const width = 520;
  const height = 240;
  const pad = { top: 16, right: 12, bottom: 34, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const base = axisMin ?? 0;
  const maxVal = Math.max(base + 1, ...rows.map((r) => r.value));
  const span = maxVal - base;
  const barW = innerW / rows.length;

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={accessibleDescription ?? caption ?? dataset.title}
        style={{ width: "100%", height: "auto", background: "var(--bg-raise)", borderRadius: "var(--radius-md)", border: "1px solid var(--line)" }}
      >
        {[0, 0.5, 1].map((t) => {
          const y = pad.top + innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--line)" strokeDasharray="3 4" />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-data)">
                {Math.round(base + span * t)}
              </text>
            </g>
          );
        })}
        {rows.map((r, i) => {
          const h = Math.max(0, ((r.value - base) / span) * innerH);
          const x = pad.left + i * barW + barW * 0.18;
          return (
            <g key={r.label + i}>
              <rect
                x={x}
                y={pad.top + innerH - h}
                width={barW * 0.64}
                height={h}
                rx={3}
                fill="var(--accent)"
                opacity={0.9}
              />
              <text x={x + barW * 0.32} y={height - 14} textAnchor="middle" fontSize="11" fill="var(--ink-soft)">
                {r.label}
              </text>
              <text
                x={x + barW * 0.32}
                y={pad.top + innerH - h - 5}
                textAnchor="middle"
                fontSize="11"
                fill="var(--ink)"
                fontFamily="var(--font-data)"
              >
                {r.value}
              </text>
            </g>
          );
        })}
      </svg>
      {caption && <figcaption className="faint" style={{ marginTop: 4 }}>{caption}</figcaption>}
    </figure>
  );
}
