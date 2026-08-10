import type { Dataset } from "../../shared/schemas";

/**
 * Accessible SVG dot plot: one dot per reading, stacked over its value.
 *
 * The picture a histogram gives up. A histogram pools readings into intervals
 * and shows a shape; a dot plot keeps every reading visible and shows the shape
 * as a by-product of where the dots pile up. That is the whole content of
 * `l.r2-dot-plots`, so the component draws individual marks rather than bars —
 * a "dot plot" implemented as a bar chart of counts would be a histogram with
 * round corners, and the lesson would be describing something not on screen.
 */
export function DotPlot({
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
  const height = 220;
  const pad = { top: 14, right: 16, bottom: 38, left: 16 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const stacks = stackDots(values);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const tallest = Math.max(1, ...stacks.map((s) => s.height));
  const dotR = Math.min(7, innerH / (tallest * 2.6));

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
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + innerH}
          y2={pad.top + innerH}
          stroke="var(--line)"
        />
        {stacks.map((s) => {
          const x = pad.left + ((s.value - lo) / span) * innerW;
          return (
            <g key={`${s.value}-${s.height}`}>
              {Array.from({ length: s.height }, (_, i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={pad.top + innerH - dotR - i * dotR * 2.2}
                  r={dotR}
                  fill="var(--accent)"
                  opacity={0.9}
                />
              ))}
            </g>
          );
        })}
        {[lo, hi].map((v) => (
          <text
            key={v}
            x={pad.left + ((v - lo) / span) * innerW}
            y={height - 20}
            textAnchor="middle"
            fontSize="10"
            fill="var(--ink-faint)"
            fontFamily="var(--font-data)"
          >
            {v}
          </text>
        ))}
        <text x={pad.left + innerW / 2} y={height - 4} textAnchor="middle" fontSize="11" fill="var(--ink-soft)">
          {dataset.columns[valueIdx]?.name ?? "Value"}
        </text>
      </svg>
      {caption && <figcaption className="faint">{caption}</figcaption>}
    </figure>
  );
}

/**
 * One entry per distinct value, with how many readings share it, ascending.
 *
 * Exported for the unit tests: a dot plot's claim is that the tallest stack is
 * the mode and that every reading is visible, and both are properties of this
 * function rather than of the SVG (D-044).
 */
export function stackDots(values: readonly number[]): Array<{ value: number; height: number }> {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].map(([value, height]) => ({ value, height })).sort((a, b) => a.value - b.value);
}
