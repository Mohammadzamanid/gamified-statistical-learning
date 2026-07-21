import type { FeedbackPlan } from "../../core/misconceptions/engine";

export function FeedbackPanel({ feedback, onNext, showSolution }: {
  feedback: FeedbackPlan;
  onNext: () => void;
  showSolution: boolean;
}): JSX.Element {
  return (
    <div
      className={`feedback ${feedback.correct ? "correct" : "incorrect"}`}
      role="status"
      aria-live="polite"
    >
      <p className="verdict">
        <span aria-hidden="true">{feedback.correct ? "✓" : "✕"}</span>
        {feedback.correct ? "Correct" : feedback.misconception ? feedback.misconception.title : "Not quite"}
      </p>
      <p>{feedback.message}</p>

      {!feedback.correct && feedback.remediation?.microLesson && (
        <details>
          <summary>Micro-lesson: {feedback.remediation.title}</summary>
          <p className="muted">{feedback.remediation.microLesson}</p>
        </details>
      )}

      {showSolution && (
        <>
          <p className="muted">{feedback.explanation}</p>
          {feedback.solutionSteps.length > 0 && (
            <ol className="muted">
              {feedback.solutionSteps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          )}
        </>
      )}

      <div style={{ marginTop: "var(--sp-3)" }}>
        <button className="btn primary" onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}
