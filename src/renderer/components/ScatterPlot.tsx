import type { Dataset } from "../../shared/schemas";

/**
 * Accessible SVG scatterplot of two numeric columns against one another.
 *
 * Every other chart component in this build reads *the first* numeric column and
 * ignores the rest, which is fine when a picture summarises one variable. A
 * scatterplot is the first that needs two, and taking "the first two numeric
 * columns" by position is how a dataset with one numeric column silently plots
 * that column against itself and draws a perfect straight line — a chart that
 * looks like a strong relationship and is an artefact of the reader.
 *
 * So the pair is resolved explicitly and the component refuses rather than
 * guesses: fewer than two numeric columns produces the accessible description in
 * words instead of a misleading picture.
 */
export function ScatterPlot({
  dataset,
  caption,
  accessibleDescription
}: {
  dataset: Dataset;
  caption?: string;
  accessibleDescription?: string;
}): JSX.Element {
  const pair = numericPair(dataset);

  if (!pair) {
    return (
      <figure style={{ margin: 0 }}>
        <p className="muted" role="note">
          {accessibleDescription ??
            "This chart needs two numeric columns and its dataset does not have them."}
        </p>
      </figure>
    );
  }

  const points = dataset.rows
    .map((r) => ({ x: Number(r[pair.xIndex]), y: Number(r[pair.yIndex]) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

  const width = 520;
  const height = 300;
  const pad = { top: 16, right: 18, bottom: 44, left: 46 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xLo = Math.min(...xs);
  const xHi = Math.max(...xs);
  const yLo = Math.min(...ys);
  const yHi = Math.max(...ys);
  const xSpan = xHi - xLo || 1;
  const ySpan = yHi - yLo || 1;

  const px = (x: number): number => pad.left + ((x - xLo) / xSpan) * innerW;
  const py = (y: number): number => pad.top + innerH - ((y - yLo) / ySpan) * innerH;

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
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={pad.top + innerH * (1 - t)}
              y2={pad.top + innerH * (1 - t)}
              stroke="var(--line)"
              strokeDasharray="3 4"
            />
            <text
              x={pad.left - 6}
              y={pad.top + innerH * (1 - t) + 4}
              textAnchor="end"
              fontSize="10"
              fill="var(--ink-faint)"
              fontFamily="var(--font-data)"
            >
              {trim(yLo + ySpan * t)}
            </text>
          </g>
        ))}
        {points.map((p, i) => (
          <circle key={i} cx={px(p.x)} cy={py(p.y)} r={5} fill="var(--accent)" opacity={0.85} />
        ))}
        {[xLo, xHi].map((v) => (
          <text
            key={`x-${v}`}
            x={px(v)}
            y={height - 26}
            textAnchor="middle"
            fontSize="10"
            fill="var(--ink-faint)"
            fontFamily="var(--font-data)"
          >
            {trim(v)}
          </text>
        ))}
        <text x={pad.left + innerW / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--ink-soft)">
          {dataset.columns[pair.xIndex]?.name ?? "x"} against {dataset.columns[pair.yIndex]?.name ?? "y"}
        </text>
      </svg>
      {caption && <figcaption className="faint">{caption}</figcaption>}
    </figure>
  );
}

/**
 * The two distinct numeric columns a scatterplot needs, or null.
 *
 * Exported for the unit tests. Returning null for a one-column dataset is the
 * behaviour worth pinning: the alternative — falling back to the first numeric
 * column twice — draws a flawless diagonal that no reader could tell from a real
 * finding.
 */
export function numericPair(dataset: Dataset): { xIndex: number; yIndex: number } | null {
  const numeric: number[] = [];
  dataset.columns.forEach((c, i) => {
    if (c.kind === "numeric") numeric.push(i);
  });
  if (numeric.length < 2) return null;
  return { xIndex: numeric[0]!, yIndex: numeric[1]! };
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
