/**
 * The interactive demonstration inside a lesson (scope §5 requirements 3-6, 18).
 *
 * Three phases, in the order the requirements demand:
 *   predict -> the learner commits to an answer while the controls are locked
 *   explore -> the controls unlock and the readout responds live
 *   observed -> the "what to notice" note appears once the learner has moved something
 *
 * Locking the controls until a prediction is submitted is the whole point: a
 * prediction made after seeing the answer is not a prediction. The panel holds
 * no arithmetic — every number it shows comes from
 * `src/core/curriculum/demonstration.ts`.
 */
import { useMemo, useState } from "react";
import type { Demonstration } from "../../shared/schemas";
import {
  clampToControl,
  describeDemonstration,
  formatControlValue,
  formatReadout,
  initialValues,
  setControlValue
} from "../../core/curriculum/demonstration";

type Phase = "predict" | "explore";

export function DemonstrationPanel({ demo }: { demo: Demonstration }): JSX.Element {
  const [values, setValues] = useState<number[]>(() => initialValues(demo));
  const [phase, setPhase] = useState<Phase>("predict");
  const [choice, setChoice] = useState<string | null>(null);
  const [moved, setMoved] = useState(false);

  const readout = useMemo(() => formatReadout(demo, values), [demo, values]);
  const description = useMemo(() => describeDemonstration(demo, values), [demo, values]);
  const predictedCorrectly = choice === demo.prediction.correctOptionId;
  const locked = phase === "predict";

  return (
    <section className="card stack" aria-labelledby={`${demo.id}-title`}>
      <div>
        <p className="eyebrow">Try it</p>
        <h3 id={`${demo.id}-title`}>{demo.title}</h3>
        <p className="muted">{demo.experience}</p>
      </div>

      <p className="faint">{demo.accessibleDescription}</p>

      <fieldset className="stack" disabled={locked}>
        <legend className="faint">{locked ? "Controls unlock once you have predicted" : "Controls"}</legend>
        {demo.controls.map((control, i) => {
          const inputId = `${demo.id}-${control.id}`;
          return (
            <div key={control.id} className="row" style={{ alignItems: "center", gap: 12 }}>
              <label htmlFor={inputId} style={{ minWidth: 220 }}>
                {control.label}
              </label>
              <input
                id={inputId}
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={values[i]}
                aria-valuetext={formatControlValue(control, values[i]!)}
                onChange={(e) => {
                  setValues(setControlValue(demo, values, i, Number(e.target.value)));
                  setMoved(true);
                }}
              />
              <output htmlFor={inputId} className="pill">
                {formatControlValue(control, values[i]!)}
              </output>
              {/* A labelled control picks a thing, so there is no number to type. */}
              {control.valueLabels.length === 0 && (
                <input
                  type="number"
                  aria-label={`${control.label}, exact value`}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={values[i]}
                  style={{ width: 90 }}
                  onChange={(e) => {
                    setValues(setControlValue(demo, values, i, clampToControl(control, Number(e.target.value))));
                    setMoved(true);
                  }}
                />
              )}
            </div>
          );
        })}
      </fieldset>

      {locked ? (
        <div className="stack">
          <p>
            <strong>Predict first.</strong> {demo.prediction.prompt}
          </p>
          <ul className="choice-list" role="radiogroup" aria-label="Your prediction">
            {demo.prediction.options.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  className="choice"
                  role="radio"
                  aria-checked={choice === o.id}
                  onClick={() => setChoice(o.id)}
                >
                  {o.text}
                </button>
              </li>
            ))}
          </ul>
          <div>
            <button className="btn primary" disabled={choice === null} onClick={() => setPhase("explore")}>
              Lock in my prediction
            </button>
          </div>
        </div>
      ) : (
        <div className="stack">
          <p className={predictedCorrectly ? "pill accent" : "pill"}>
            {predictedCorrectly ? "Your prediction was right." : "Not quite what you predicted — look at why."}
          </p>
          <p className="muted">{demo.prediction.revealNote}</p>

          <div className="row" style={{ alignItems: "baseline", gap: 12 }}>
            <span className="eyebrow">{demo.readoutLabel}</span>
            <strong style={{ fontSize: "1.6rem" }}>{readout}</strong>
          </div>

          {/* One live region for the whole widget: the readout and the controls
              that produced it are announced together, so a screen-reader user
              hears the same pairing a sighted user sees. */}
          <p aria-live="polite" className="sr-only">
            {description}
          </p>

          {moved && (
            <p className="muted">
              <strong>Notice:</strong> {demo.observation}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
