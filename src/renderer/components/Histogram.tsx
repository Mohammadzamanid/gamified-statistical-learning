import { buildBins } from "../../core/statistics/binning";
import type { Dataset } from "../../shared/schemas";

/**
 * Accessible SVG histogram over the first numeric column of a dataset.
 *
 * A histogram is not a bar chart with the labels removed, and the difference is
 * what `l.r2-histograms` teaches: bars here stand for *intervals* of a numeric
 * variable and touch one another, because the intervals are adjacent and the
 * axis is continuous. So this is a separate component rather than a flag on
 * `BarChart` — a chart drawn with gaps while a lesson explains that histograms
 * have none would be teaching one thing and showing another.
 *
 * Binning is a property of the picture rather than of the content: the dataset
 * holds readings, and `binWidth` is a rendering choice a question can vary while
 * the data stays put — exactly the point the misleading-graphs lesson needs.
 * The arithmetic itself lives in `src/core/statistics/binning.ts`, where the
 * laboratory bench reads it too; it was defined in this file until S2-15 found
 * that a view was computing (D-052).
 */
export function Histogram({
  dataset,
  binWidth,
  caption,
  accessibleDescription
}: {
  dataset: Dataset;
  binWidth?: number;
  caption?: string;
  accessibleDescription?: string;
}): JSX.Element {
  const valueIdx = dataset.columns.findIndex((c) => c.kind === "numeric");
  const values = dataset.rows
    .map((r) => Number(r[valueIdx] ?? Number.NaN))
    .filter((v) => Number.isFinite(v));

  const width = 520;
  const height = 240;
  const pad = { top: 16, right: 12, bottom: 38, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const bins = buildBins(values, binWidth);
  const maxCount = Math.max(1, ...bins.map((b) => b.count));
  const barW = bins.length > 0 ? innerW / bins.length : innerW;

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
        {[0, 0.5, 1].map((t) => {
          const y = pad.top + innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--line)" strokeDasharray="3 4" />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-data)">
                {Math.round(maxCount * t)}
              </text>
            </g>
          );
        })}
        {bins.map((bin, i) => {
          const h = (bin.count / maxCount) * innerH;
          // No gap between bars, and none of the bar-chart inset: adjacent
          // intervals share an edge, which is the visual fact the lesson is about.
          const x = pad.left + i * barW;
          return (
            <g key={`${bin.from}-${bin.to}`}>
              <rect
                x={x}
                y={pad.top + innerH - h}
                width={barW}
                height={h}
                fill="var(--accent)"
                opacity={0.9}
                stroke="var(--bg-raise)"
              />
              <text x={x} y={height - 20} textAnchor="middle" fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-data)">
                {trim(bin.from)}
              </text>
            </g>
          );
        })}
        {bins.length > 0 && (
          <text x={pad.left + innerW} y={height - 20} textAnchor="middle" fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-data)">
            {trim(bins[bins.length - 1]!.to)}
          </text>
        )}
        <text x={pad.left + innerW / 2} y={height - 4} textAnchor="middle" fontSize="11" fill="var(--ink-soft)">
          {dataset.columns[valueIdx]?.name ?? "Value"}
        </text>
      </svg>
      {caption && <figcaption className="faint">{caption}</figcaption>}
    </figure>
  );
}

/** Axis labels: whole numbers stay whole, the rest get one decimal place. */
function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
