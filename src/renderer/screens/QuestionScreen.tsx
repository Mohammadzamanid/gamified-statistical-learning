import { currentQuestion } from "../state/session";
import { useStore } from "../state/store";
import { QuestionInteraction } from "../components/QuestionRenderers";
import { FeedbackPanel } from "../components/FeedbackPanel";
import { BarChart } from "../components/BarChart";
import { DifficultyPips } from "../components/MasteryBadge";

export function QuestionScreen(): JSX.Element {
  const content = useStore((s) => s.content);
  const session = useStore((s) => s.session);
  const submit = useStore((s) => s.submit);
  const requestHint = useStore((s) => s.requestHint);
  const next = useStore((s) => s.next);
  const exitLesson = useStore((s) => s.exitLesson);

  if (!session) return <p className="muted">No active lesson.</p>;
  const question = currentQuestion(content, session);
  if (!question) return <p className="muted">Question not found.</p>;

  const lesson = content.curriculum.lessons.find((l) => l.id === session.lessonId);
  const progress = session.questionQueue.length > 0 ? session.currentIndex / session.questionQueue.length : 0;
  const sortedHints = [...question.hints].sort((a, b) => a.level - b.level);
  const revealedHints = sortedHints.slice(0, session.hintsUsedThisQuestion);
  const hintsRemain = session.hintsUsedThisQuestion < sortedHints.length;
  const dataset = question.visual.kind !== "none" && question.visual.datasetId
    ? content.datasets.get(question.visual.datasetId)
    : undefined;

  return (
    <div className="stack" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="faint">{lesson?.title} · question {session.currentIndex + 1} of {session.questionQueue.length}</span>
        <button className="btn ghost small" onClick={exitLesson}>Abandon voyage</button>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Lesson progress">
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="card stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="pill accent">{question.interaction.replace(/-/g, " ")}</span>
          <DifficultyPips level={question.difficulty} />
        </div>
        <p style={{ fontSize: "var(--fs-lg)" }}>{question.prompt}</p>

        {dataset && question.visual.kind === "bar-chart" && (
          <BarChart dataset={dataset} caption={question.visual.caption} accessibleDescription={question.visual.accessibleDescription} />
        )}

        {revealedHints.length > 0 && (
          <div className="stack" role="note" aria-label="Hints">
            {revealedHints.map((h) => (
              <p key={h.level} className="muted">💡 Hint {h.level}: {h.text}</p>
            ))}
          </div>
        )}

        <QuestionInteraction
          question={question}
          disabled={session.answeredCurrent}
          onSubmit={(raw) => submit(raw)}
        />

        {!session.answeredCurrent && (
          <div>
            <button className="btn ghost small" disabled={!hintsRemain} onClick={requestHint}>
              {hintsRemain ? "Ask for a hint" : "No more hints"}
            </button>
          </div>
        )}

        {session.lastFeedback && (
          <FeedbackPanel feedback={session.lastFeedback} onNext={next} showSolution={true} />
        )}
      </div>
    </div>
  );
}
