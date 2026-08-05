/**
 * Interaction renderers. Each maps a Question to controls and produces a
 * RawResponse on submit. The registry decides which interactions are live;
 * unimplemented ones render an honest "not yet available" notice.
 */
import { useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import type { Question } from "../../shared/schemas";
import type { RawResponse } from "../../core/questions/types";
import { getInteraction } from "../../core/questions/registry";
import {
  currentStep,
  finalResponse,
  retryCurrentStep,
  revealStepHint,
  startStepRun,
  stepsOf,
  submitStep
} from "../../core/questions/step-calculation";
import {
  clampToField,
  describePoint,
  isPlane,
  pointFieldOf,
  startPosition,
  type PointPosition
} from "../../core/questions/point-placement";

export interface RendererProps {
  question: Question;
  disabled: boolean;
  onSubmit: (raw: RawResponse) => void;
}

function shuffled<T>(items: readonly T[], seed: string): T[] {
  // Deterministic per-question shuffle so re-renders don't reorder.
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function SingleChoice({ question, disabled, onSubmit }: RendererProps): JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="stack">
      <ul className="choice-list" role="radiogroup" aria-label="Answer choices">
        {(question.choices ?? []).map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="choice"
              role="radio"
              aria-checked={selected === c.id}
              aria-pressed={selected === c.id}
              disabled={disabled}
              onClick={() => setSelected(c.id)}
            >
              {c.text}
            </button>
          </li>
        ))}
      </ul>
      <div>
        <button
          className="btn primary"
          disabled={disabled || selected === null}
          onClick={() => selected && onSubmit({ kind: "choice", choiceIds: [selected] })}
        >
          Submit answer
        </button>
      </div>
    </div>
  );
}

function MultiChoice({ question, disabled, onSubmit }: RendererProps): JSX.Element {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  return (
    <div className="stack">
      <p className="faint">Select every answer that applies.</p>
      <ul className="choice-list">
        {(question.choices ?? []).map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="choice"
              aria-pressed={selected.has(c.id)}
              disabled={disabled}
              onClick={() => toggle(c.id)}
            >
              <span aria-hidden="true">{selected.has(c.id) ? "☑" : "☐"}</span> {c.text}
            </button>
          </li>
        ))}
      </ul>
      <div>
        <button
          className="btn primary"
          disabled={disabled || selected.size === 0}
          onClick={() => onSubmit({ kind: "choice", choiceIds: [...selected] })}
        >
          Submit answer
        </button>
      </div>
    </div>
  );
}

function NumericInput({ question, disabled, onSubmit }: RendererProps): JSX.Element {
  const [text, setText] = useState("");
  const unit = question.answer.kind === "numeric" ? question.answer.unit : undefined;
  const placeholder =
    question.interaction === "percentage-input" ? "e.g. 30 or 30%" :
    question.interaction === "fraction-input" ? "e.g. 3/12 or 0.25" : "Your answer";
  return (
    <div className="stack">
      <div className="field" style={{ maxWidth: 280 }}>
        <label htmlFor={`num-${question.id}`}>
          Your answer{unit ? ` (${unit})` : ""}
        </label>
        <input
          id={`num-${question.id}`}
          type="text"
          inputMode="decimal"
          className="data"
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim() && !disabled) onSubmit({ kind: "numeric", text });
          }}
        />
      </div>
      <div>
        <button
          className="btn primary"
          disabled={disabled || text.trim().length === 0}
          onClick={() => onSubmit({ kind: "numeric", text })}
        >
          Submit answer
        </button>
      </div>
    </div>
  );
}

function Ordering({ question, disabled, onSubmit }: RendererProps): JSX.Element {
  const initial = useMemo(() => shuffled(question.items ?? [], question.id), [question]);
  const [order, setOrder] = useState(initial);
  const move = (index: number, dir: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j]!, next[index]!];
      return next;
    });
  };
  return (
    <div className="stack">
      <p className="faint">Use the arrows to arrange the steps from first (top) to last (bottom).</p>
      <ol className="choice-list">
        {order.map((item, i) => (
          <li key={item.id} className="choice" style={{ cursor: "default", justifyContent: "space-between" }}>
            <span><span className="data faint">{i + 1}.</span> {item.text}</span>
            <span className="row" style={{ gap: 4 }}>
              <button className="btn ghost small" aria-label={`Move "${item.text}" up`} disabled={disabled || i === 0} onClick={() => move(i, -1)}>↑</button>
              <button className="btn ghost small" aria-label={`Move "${item.text}" down`} disabled={disabled || i === order.length - 1} onClick={() => move(i, 1)}>↓</button>
            </span>
          </li>
        ))}
      </ol>
      <div>
        <button className="btn primary" disabled={disabled} onClick={() => onSubmit({ kind: "ordering", order: order.map((o) => o.id) })}>
          Submit order
        </button>
      </div>
    </div>
  );
}

function Matching({ question, disabled, onSubmit }: RendererProps): JSX.Element {
  const rights = question.rightItems ?? [];
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const allMatched = (question.items ?? []).every((l) => pairs[l.id]);
  return (
    <div className="stack">
      <p className="faint">Choose the matching description for each item.</p>
      {(question.items ?? []).map((left) => (
        <div key={left.id} className="field">
          <label htmlFor={`match-${question.id}-${left.id}`}>{left.text}</label>
          <select
            id={`match-${question.id}-${left.id}`}
            disabled={disabled}
            value={pairs[left.id] ?? ""}
            onChange={(e) => setPairs((p) => ({ ...p, [left.id]: e.target.value }))}
          >
            <option value="" disabled>Choose…</option>
            {rights.map((r) => (
              <option key={r.id} value={r.id}>{r.text}</option>
            ))}
          </select>
        </div>
      ))}
      <div>
        <button
          className="btn primary"
          disabled={disabled || !allMatched}
          onClick={() =>
            onSubmit({
              kind: "matching",
              pairs: Object.entries(pairs).map(([left, right]) => ({ left, right }))
            })
          }
        >
          Submit matches
        </button>
      </div>
    </div>
  );
}

function ShortText({ question, disabled, onSubmit }: RendererProps): JSX.Element {
  const [text, setText] = useState("");
  return (
    <div className="stack">
      <div className="field">
        <label htmlFor={`text-${question.id}`}>Your explanation</label>
        <textarea
          id={`text-${question.id}`}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div>
        <button className="btn primary" disabled={disabled || text.trim().length < 5} onClick={() => onSubmit({ kind: "text", text })}>
          Submit explanation
        </button>
      </div>
    </div>
  );
}

/**
 * Step-by-step calculation.
 *
 * All run logic lives in core/questions/step-calculation; this component only
 * renders it. Keyboard operation is native throughout — a text input plus
 * buttons, with Enter to submit — and every state change is announced through a
 * polite live region, so correctness is never signalled by colour alone.
 */
function StepByStep({ question, disabled, onSubmit }: RendererProps): JSX.Element {
  const [run, setRun] = useState(() => startStepRun(question));
  const [text, setText] = useState("");
  const [hints, setHints] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);

  const steps = stepsOf(question);
  const step = currentStep(question, run);
  const total = steps.length;
  const attempt = run.lastAttempt;
  const blocked = disabled || run.status === "complete";
  const awaitingRetry = run.status === "awaiting-retry";
  const stepNumber = Math.min(run.currentIndex + 1, total);

  const submit = () => {
    if (!step || blocked || awaitingRetry || text.trim().length === 0) return;
    const result = submitStep(question, run, text);
    setRun(result.state);
    if (result.attempt.correct) {
      setText("");
      setHints([]);
      if (result.explanation) setPassed((p) => [...p, result.explanation as string]);
      if (result.runComplete) onSubmit(finalResponse(result.state));
    }
  };

  const retry = () => {
    setRun((r) => retryCurrentStep(r));
    setText("");
  };

  const takeHint = () => {
    const revealed = revealStepHint(question, run);
    setRun(revealed.state);
    if (revealed.hint) setHints((h) => [...h, revealed.hint as string]);
  };

  return (
    <div className="stack">
      <p className="faint">
        Work through this one step at a time. Each step is checked on its own, so a slip only costs that step.
      </p>

      <ol className="choice-list">
        {steps.map((s, i) => {
          const done = i < run.currentIndex;
          const active = i === run.currentIndex && run.status !== "complete";
          return (
            <li key={s.id} className="choice" style={{ cursor: "default", justifyContent: "space-between" }}>
              <span>
                <span className="data faint">{i + 1}.</span> {s.prompt}
              </span>
              {/* Words, not colour, carry the state. */}
              <span className="faint">{done ? "done" : active ? "current" : "to do"}</span>
            </li>
          );
        })}
      </ol>

      {passed.length > 0 && (
        <div className="stack">
          {passed.map((e, i) => (
            <p key={i} className="faint">
              Step {i + 1}: {e}
            </p>
          ))}
        </div>
      )}

      {step && run.status !== "complete" && (
        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor={`step-${question.id}-${step.id}`}>
            {`Step ${stepNumber} of ${total}: ${step.prompt}${step.unit ? ` (${step.unit})` : ""}`}
          </label>
          <input
            id={`step-${question.id}-${step.id}`}
            type="text"
            inputMode="decimal"
            className="data"
            value={text}
            disabled={blocked || awaitingRetry}
            aria-describedby={`step-status-${question.id}`}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
        </div>
      )}

      {hints.map((h, i) => (
        <p key={i} className="faint">
          Hint {i + 1}: {h}
        </p>
      ))}

      {/* One polite live region: step outcomes and completion are announced. */}
      <p id={`step-status-${question.id}`} role="status" aria-live="polite" className="faint">
        {run.status === "complete"
          ? "All steps complete. Answer submitted."
          : awaitingRetry && attempt
            ? `Not quite on step ${stepNumber}. Try this step again.`
            : `Step ${stepNumber} of ${total}.`}
      </p>

      <div className="row" style={{ gap: 8 }}>
        {awaitingRetry ? (
          <button className="btn primary" disabled={disabled} onClick={retry}>
            {`Retry step ${stepNumber}`}
          </button>
        ) : (
          <button className="btn primary" disabled={blocked || text.trim().length === 0} onClick={submit}>
            {run.currentIndex === total - 1 ? "Submit final step" : "Check step"}
          </button>
        )}
        {step && step.hints.length > run.hintsRevealedThisStep && (
          <button className="btn ghost" disabled={blocked || awaitingRetry} onClick={takeHint}>
            Hint for this step
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Point placement on a number line or coordinate plane.
 *
 * Two equal input paths, both routed through core/questions/point-placement so
 * they cannot diverge: clicking or dragging on the plot, and a native range
 * slider per axis. The sliders are what make this keyboard-operable — arrows,
 * Home/End and PageUp/PageDown all work without any custom key handling — and
 * they carry the accessible name and current value for assistive tech. The
 * marker's position is also announced as text through a polite live region.
 */
function PointPlacement({ question, disabled, onSubmit }: RendererProps): JSX.Element {
  const field = pointFieldOf(question);
  const [pos, setPos] = useState<PointPosition>(() => (field ? startPosition(field) : { x: 0, y: null }));

  if (!field) {
    return (
      <div className="card">
        <p className="muted">This point-placement question is missing its field description.</p>
      </div>
    );
  }

  const plane = isPlane(field);
  const W = 480;
  const H = plane ? 260 : 90;
  const PAD = 36;
  const xToPx = (x: number) => PAD + ((x - field.xMin) / (field.xMax - field.xMin)) * (W - 2 * PAD);
  const yMin = field.yMin ?? 0;
  const yMax = field.yMax ?? 1;
  const yToPx = (y: number) => H - PAD - ((y - yMin) / (yMax - yMin)) * (H - 2 * PAD);
  const markerX = xToPx(pos.x);
  const markerY = plane ? yToPx(pos.y ?? yMin) : H / 2;

  /** Pointer path: map a click on the plot back onto the field grid. */
  const placeFromPointer = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const x = field.xMin + ((px - PAD) / (W - 2 * PAD)) * (field.xMax - field.xMin);
    if (!plane) {
      setPos(clampToField(field, { x, y: null }));
      return;
    }
    const py = ((event.clientY - rect.top) / rect.height) * H;
    const y = yMin + ((H - PAD - py) / (H - 2 * PAD)) * (yMax - yMin);
    setPos(clampToField(field, { x, y }));
  };

  const description = describePoint(field, pos);

  return (
    <div className="stack">
      <p className="faint">
        Place the marker. Drag or click on the plot, or use the sliders below — arrow keys move one step at a time.
      </p>

      {/* Decorative duplicate of the sliders: the sliders below are the accessible control. */}
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${field.accessibleDescription} Marker at ${description}.`}
        style={{ maxWidth: W, cursor: disabled ? "default" : "crosshair" }}
        onClick={placeFromPointer}
      >
        <line x1={PAD} y1={plane ? H - PAD : H / 2} x2={W - PAD} y2={plane ? H - PAD : H / 2} stroke="currentColor" strokeWidth={1.5} />
        {plane && <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="currentColor" strokeWidth={1.5} />}

        {field.xTicks.map((t) => (
          <g key={`x${t}`}>
            <line x1={xToPx(t)} y1={(plane ? H - PAD : H / 2) - 5} x2={xToPx(t)} y2={(plane ? H - PAD : H / 2) + 5} stroke="currentColor" />
            <text x={xToPx(t)} y={(plane ? H - PAD : H / 2) + 20} textAnchor="middle" fontSize={11} fill="currentColor">
              {t}
            </text>
          </g>
        ))}
        {plane &&
          field.yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={PAD - 5} y1={yToPx(t)} x2={PAD + 5} y2={yToPx(t)} stroke="currentColor" />
              <text x={PAD - 9} y={yToPx(t) + 4} textAnchor="end" fontSize={11} fill="currentColor">
                {t}
              </text>
            </g>
          ))}

        {/* The marker is a ring plus a centre dot: shape, not colour alone. */}
        <circle cx={markerX} cy={markerY} r={8} fill="none" stroke="currentColor" strokeWidth={2} />
        <circle cx={markerX} cy={markerY} r={2.5} fill="currentColor" />
      </svg>

      <div className="field" style={{ maxWidth: 360 }}>
        <label htmlFor={`pt-x-${question.id}`}>{field.xLabel}</label>
        <input
          id={`pt-x-${question.id}`}
          type="range"
          min={field.xMin}
          max={field.xMax}
          step={field.xStep}
          value={pos.x}
          disabled={disabled}
          aria-valuetext={`${field.xLabel} ${pos.x}`}
          aria-describedby={`pt-status-${question.id}`}
          onChange={(e) => setPos((p) => clampToField(field, { ...p, x: Number(e.target.value) }))}
        />
      </div>

      {plane && (
        <div className="field" style={{ maxWidth: 360 }}>
          <label htmlFor={`pt-y-${question.id}`}>{field.yLabel}</label>
          <input
            id={`pt-y-${question.id}`}
            type="range"
            min={yMin}
            max={yMax}
            step={field.yStep ?? 1}
            value={pos.y ?? yMin}
            disabled={disabled}
            aria-valuetext={`${field.yLabel ?? "y"} ${pos.y ?? yMin}`}
            aria-describedby={`pt-status-${question.id}`}
            onChange={(e) => setPos((p) => clampToField(field, { ...p, y: Number(e.target.value) }))}
          />
        </div>
      )}

      <p id={`pt-status-${question.id}`} role="status" aria-live="polite" className="faint">
        Marker at {description}.
      </p>

      <div>
        <button
          className="btn primary"
          disabled={disabled}
          onClick={() => onSubmit(plane ? { kind: "point", x: pos.x, y: pos.y ?? yMin } : { kind: "point", x: pos.x })}
        >
          Submit placement
        </button>
      </div>
    </div>
  );
}

export function QuestionInteraction(props: RendererProps): JSX.Element {
  const descriptor = getInteraction(props.question.interaction);
  if (!descriptor || !descriptor.implemented) {
    return (
      <div className="card">
        <p className="muted">
          This interaction type ({props.question.interaction}) is planned but not yet available in this build.
        </p>
      </div>
    );
  }
  switch (props.question.interaction) {
    case "multiple-choice":
    case "graph-interpretation":
    case "error-identification":
    case "method-selection":
      return <SingleChoice {...props} />;
    case "multiple-selection":
      return <MultiChoice {...props} />;
    case "numeric-input":
    case "percentage-input":
    case "fraction-input":
      return <NumericInput {...props} />;
    case "ordering":
      return <Ordering {...props} />;
    case "matching":
      return <Matching {...props} />;
    case "short-explanation":
      return <ShortText {...props} />;
    case "step-by-step-calculation":
      return <StepByStep {...props} />;
    case "point-placement":
      return <PointPlacement {...props} />;
    default:
      return (
        <div className="card">
          <p className="muted">This interaction type is planned but not yet available in this build.</p>
        </div>
      );
  }
}
