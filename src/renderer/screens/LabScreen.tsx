import { useMemo, useState } from "react";
import {
  addOutlier,
  addValue,
  createExperiment,
  describeChange,
  experimentFromDataset,
  removeValueAt,
  replaceValueAt,
  resetExperiment,
  sortValues,
  suggestedOutlier,
  summarise,
  type LabExperiment,
  type LabSummary
} from "../../core/laboratory";
import { isLaboratoryUnlocked } from "../../core/curriculum/progress";
import { useStore } from "../state/store";
import { parseUserNumber, roundTo } from "../../shared/utilities/numeric";

/**
 * Statistics Laboratory. S2-15 replaces the Stage 1 bench — paste numbers, read
 * a table — with the learning environment the scope asks for: every edit is a
 * button, and every button reports what it moved and what it left alone.
 *
 * All arithmetic and all narration come from `src/core/laboratory`, which in
 * turn recomputes nothing of its own (D-001). This file arranges and announces.
 */
const STARTING_VALUES = [2, 4, 4, 6, 9];

function readNumber(value: number | null): string {
  return value === null ? "—" : String(roundTo(value, 4));
}

function summaryRows(s: LabSummary): Array<[string, string]> {
  return [
    ["Count", String(s.count)],
    ["Sum", readNumber(s.sum)],
    ["Mean", readNumber(s.mean)],
    ["Median", readNumber(s.median)],
    ["Mode", s.mode.length === 0 ? "—" : s.mode.join(", ")],
    ["Range", readNumber(s.range)],
    ["Min / Q1 / Q3 / Max", `${readNumber(s.min)} / ${readNumber(s.q1)} / ${readNumber(s.q3)} / ${readNumber(s.max)}`],
    ["IQR", readNumber(s.iqr)],
    ["Sample variance", readNumber(s.variance)],
    ["Sample std. dev.", readNumber(s.standardDeviation)]
  ];
}

export function LabScreen(): JSX.Element {
  const content = useStore((s) => s.content);
  const save = useStore((s) => s.save);
  const navigate = useStore((s) => s.navigate);
  const [experiment, setExperiment] = useState<LabExperiment>(() =>
    createExperiment("Bench readings", STARTING_VALUES)
  );
  const [entry, setEntry] = useState("");

  const summary = useMemo(() => summarise(experiment.values), [experiment.values]);
  const latest = experiment.log[0];
  const outlier = suggestedOutlier(experiment.values);

  // The gate is declared by the curriculum (S2-11), not hard-coded here, so the
  // decision about when a learner is ready for a bare instrument stays with the
  // content. A curriculum that declares no gate leaves the bench open.
  if (save && !isLaboratoryUnlocked(content.curriculum, save)) {
    return (
      <div className="stack" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div>
          <p className="eyebrow">Statistics laboratory</p>
          <h2>The Descriptive Bench</h2>
        </div>
        <div className="card stack">
          <p className="muted">{content.curriculum.laboratoryUnlock?.sealedNote}</p>
          <button className="btn primary" onClick={() => navigate({ name: "world-map" })}>
            Back to the chart
          </button>
        </div>
      </div>
    );
  }

  function submitEntry(): void {
    const value = parseUserNumber(entry);
    if (value === null) return;
    setExperiment((e) => addValue(e, value));
    setEntry("");
  }

  const numericDatasets = [...content.datasets.values()].filter((d) =>
    d.columns.some((c) => c.kind === "numeric")
  );

  return (
    <div className="stack" style={{ maxWidth: 820, margin: "0 auto" }}>
      <div>
        <p className="eyebrow">Statistics laboratory</p>
        <h2>The Descriptive Bench</h2>
        <p className="muted">
          Change the readings and watch which measures follow. Every edit is reported below — including the ones that
          move nothing, which is as much of the lesson as the ones that do.
        </p>
      </div>

      <div className="card stack">
        <h3>Readings</h3>
        <ul className="row" style={{ flexWrap: "wrap", listStyle: "none", padding: 0, gap: 8 }}>
          {experiment.values.map((value, index) => (
            <li key={`${index}-${value}`} className="row" style={{ gap: 4, alignItems: "center" }}>
              <label className="sr-only" htmlFor={`lab-value-${index}`}>
                Reading {index + 1} of {experiment.values.length}
              </label>
              <input
                id={`lab-value-${index}`}
                className="data"
                style={{ width: "6rem" }}
                defaultValue={String(value)}
                onBlur={(e) => {
                  const next = parseUserNumber(e.target.value);
                  if (next !== null) setExperiment((exp) => replaceValueAt(exp, index, next));
                }}
              />
              <button
                className="btn"
                aria-label={`Remove reading ${index + 1}, ${value}`}
                onClick={() => setExperiment((exp) => removeValueAt(exp, index))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        {experiment.values.length === 0 && <p className="muted">The bench is empty. Add a reading to begin.</p>}

        <div className="field">
          <label htmlFor="lab-entry">Add a reading</label>
          <div className="row" style={{ gap: 8 }}>
            <input
              id="lab-entry"
              className="data"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitEntry();
              }}
            />
            <button className="btn primary" onClick={submitEntry}>
              Add
            </button>
          </div>
        </div>

        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => setExperiment((e) => sortValues(e, "ascending"))}>
            Sort ascending
          </button>
          <button className="btn" onClick={() => setExperiment((e) => sortValues(e, "descending"))}>
            Sort descending
          </button>
          <button
            className="btn"
            disabled={outlier === null}
            onClick={() => setExperiment((e) => addOutlier(e))}
          >
            {outlier === null ? "Add an outlier — needs a wider middle half" : `Add an outlier (${roundTo(outlier, 4)})`}
          </button>
          <button className="btn" onClick={() => setExperiment((e) => resetExperiment(e))}>
            Clear the bench
          </button>
          <button
            className="btn"
            onClick={() => setExperiment(createExperiment("Bench readings", STARTING_VALUES))}
          >
            Start again
          </button>
        </div>
      </div>

      <div className="card stack">
        <h3>What that changed</h3>
        <p role="status" aria-live="polite">
          {latest ? describeChange(latest) : "Nothing yet — the summary below is of the readings as they stand."}
        </p>
        {experiment.log.length > 1 && (
          <details>
            <summary>Earlier edits ({experiment.log.length - 1})</summary>
            <ol className="stack" style={{ paddingLeft: "1.25rem" }}>
              {experiment.log.slice(1).map((event, i) => (
                <li key={`${event.action}-${i}`} className="faint">
                  {describeChange(event)}
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>

      <div className="card stack">
        <h3>Summary</h3>
        <p className="faint">
          Quartiles use the rule the lessons teach — the median of each half — so your paper working and the bench
          agree.
        </p>
        <table className="data" style={{ borderCollapse: "collapse" }}>
          <tbody>
            {summaryRows(summary).map(([k, v]) => (
              <tr key={k}>
                <td className="muted" style={{ padding: "4px 16px 4px 0", borderBottom: "1px solid var(--line)" }}>{k}</td>
                <td style={{ padding: "4px 0", borderBottom: "1px solid var(--line)" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {summary.count === 1 && (
          <p className="muted">A single reading has no sample spread, so variance and standard deviation are withheld.</p>
        )}
      </div>

      <div className="card stack">
        <h3>Bring a dataset from the lessons</h3>
        <p className="faint">Loads its first numeric column onto the bench, replacing what is there.</p>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {numericDatasets.map((dataset) => (
            <button
              key={dataset.id}
              className="btn"
              onClick={() => {
                const loaded = experimentFromDataset(dataset);
                if (loaded) setExperiment(loaded);
              }}
            >
              {dataset.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
