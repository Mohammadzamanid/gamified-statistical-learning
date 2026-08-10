import { useMemo, useState } from "react";
import * as stats from "../../core/statistics";
import { isLaboratoryUnlocked } from "../../core/curriculum/progress";
import { useStore } from "../state/store";
import { parseUserNumber, roundTo } from "../../shared/utilities/numeric";

/**
 * Statistics Laboratory entry. Stage 1 ships one working instrument — the
 * Descriptive Bench — and honestly labels the simulations planned for later.
 */
export function LabScreen(): JSX.Element {
  const content = useStore((s) => s.content);
  const save = useStore((s) => s.save);
  const navigate = useStore((s) => s.navigate);
  const [raw, setRaw] = useState("2, 4, 4, 6, 9");
  const data = useMemo(
    () => raw.split(/[\s,;]+/).map((t) => parseUserNumber(t)).filter((n): n is number => n !== null),
    [raw]
  );

  let summary: Array<[string, string]> = [];
  let note: string | null = null;
  try {
    if (data.length === 0) {
      note = "Enter at least one number to run the instruments.";
    } else {
      // The taught convention, not the interpolated one: a learner who has just
      // finished l.r2-quartiles must be able to check their own working here (D-045).
      const q = stats.quartilesByHalves(data);
      summary = [
        ["Count", String(data.length)],
        ["Sum", String(roundTo(stats.sum(data), 4))],
        ["Mean", String(roundTo(stats.mean(data), 4))],
        ["Median", String(roundTo(stats.median(data), 4))],
        ["Mode", stats.mode(data).join(", ")],
        ["Range", String(roundTo(stats.range(data), 4))],
        ["Q1 / Q2 / Q3", `${roundTo(q.q1, 4)} / ${roundTo(q.q2, 4)} / ${roundTo(q.q3, 4)}`],
        ["IQR", String(roundTo(stats.interquartileRangeByHalves(data), 4))]
      ];
      if (data.length >= 2) {
        summary.push(
          ["Sample variance", String(roundTo(stats.variance(data), 4))],
          ["Sample std. dev.", String(roundTo(stats.standardDeviation(data), 4))]
        );
      } else {
        note = "Add a second value to unlock variance and standard deviation.";
      }
    }
  } catch (e) {
    note = (e as Error).message;
  }

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

  return (
    <div className="stack" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div>
        <p className="eyebrow">Statistics laboratory</p>
        <h2>The Descriptive Bench</h2>
        <p className="muted">Paste any list of numbers and the bench computes its summary using the same engine the lessons grade with.</p>
      </div>

      <div className="card stack">
        <div className="field">
          <label htmlFor="lab-data">Your data (separated by spaces or commas)</label>
          <textarea id="lab-data" className="data" value={raw} onChange={(e) => setRaw(e.target.value)} />
        </div>
        {note && <p className="muted">{note}</p>}
        {summary.length > 0 && (
          <table className="data" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {summary.map(([k, v]) => (
                <tr key={k}>
                  <td className="muted" style={{ padding: "4px 16px 4px 0", borderBottom: "1px solid var(--line)" }}>{k}</td>
                  <td style={{ padding: "4px 0", borderBottom: "1px solid var(--line)" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Planned instruments</h3>
        <p className="faint">These simulations are designed but not yet built in this stage:</p>
        <div className="row">
          <span className="pill">Coin-flip long run — planned</span>
          <span className="pill">Sampling distributions — planned</span>
          <span className="pill">Regression playground — planned</span>
        </div>
      </div>
    </div>
  );
}
