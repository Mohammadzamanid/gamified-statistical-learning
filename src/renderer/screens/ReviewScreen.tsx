/**
 * The review screen: a dedicated pass through what is due, separate from lessons.
 *
 * Every decision lives in `core/spaced-repetition/review-queue` and
 * `state/review-session`; this screen only renders them. Counts are named in
 * words (overdue / due / not yet scheduled) rather than distinguished by colour.
 */
import { useStore } from "../state/store";
import { buildReviewPlan, describeReviewPlan } from "../../core/spaced-repetition/review-queue";
import {
  currentReviewQuestion,
  currentReviewSkillId,
  hasActiveReview,
  reviewProgress
} from "../state/review-session";
import { QuestionInteraction } from "../components/QuestionRenderers";
import { FeedbackPanel } from "../components/FeedbackPanel";

export function ReviewScreen(): JSX.Element {
  const content = useStore((s) => s.content);
  const save = useStore((s) => s.save);
  const feedback = useStore((s) => s.reviewFeedback);
  const beginReview = useStore((s) => s.beginReview);
  const submitReview = useStore((s) => s.submitReview);
  const nextReview = useStore((s) => s.nextReview);
  const exitReview = useStore((s) => s.exitReview);
  const navigate = useStore((s) => s.navigate);

  if (!save) {
    return (
      <section className="stack">
        <h2>Review</h2>
        <p className="muted">Choose a profile first.</p>
      </section>
    );
  }

  const now = new Date();
  const active = hasActiveReview(save);

  if (!active) {
    const plan = buildReviewPlan(content.curriculum, save, now);
    return (
      <section className="stack">
        <h2>Review</h2>
        <p role="status" aria-live="polite">
          {describeReviewPlan(plan)}
        </p>

        {plan.counts.total > 0 ? (
          <>
            <ul className="choice-list">
              <li className="choice" style={{ cursor: "default", justifyContent: "space-between" }}>
                <span>Overdue</span> <span className="data">{plan.counts.overdue}</span>
              </li>
              <li className="choice" style={{ cursor: "default", justifyContent: "space-between" }}>
                <span>Due now</span> <span className="data">{plan.counts.due}</span>
              </li>
              <li className="choice" style={{ cursor: "default", justifyContent: "space-between" }}>
                <span>Not yet scheduled</span> <span className="data">{plan.counts.new}</span>
              </li>
            </ul>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn primary" onClick={beginReview}>
                Start review
              </button>
              <button className="btn ghost" onClick={() => navigate({ name: "world-map" })}>
                Back to the map
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="faint">
              Everything you have practised is scheduled for a later day. Nothing to review right now.
            </p>
            <button className="btn ghost" onClick={() => navigate({ name: "world-map" })}>
              Back to the map
            </button>
          </>
        )}
      </section>
    );
  }

  const question = currentReviewQuestion(content, save);
  const skillId = currentReviewSkillId(save);
  const progress = reviewProgress(save);
  const skillTitle = content.curriculum.skills.find((s) => s.id === skillId)?.title ?? skillId ?? "";

  if (!question) {
    // The frozen queue names a question the content no longer has. End cleanly
    // rather than stranding the learner on a blank screen.
    return (
      <section className="stack">
        <h2>Review</h2>
        <p className="muted">This review item is no longer available.</p>
        <button className="btn primary" onClick={exitReview}>
          End review
        </button>
      </section>
    );
  }

  const position = Math.min((progress?.answered ?? 0) + (feedback ? 0 : 1), progress?.total ?? 0);

  return (
    <section className="stack">
      <h2>Review</h2>
      <p role="status" aria-live="polite" className="faint">
        {`Item ${position} of ${progress?.total ?? 0}. Reviewing ${skillTitle}.`}
      </p>

      <div className="card stack">
        <p>{question.prompt}</p>
        <QuestionInteraction question={question} disabled={feedback !== null} onSubmit={submitReview} />
      </div>

      {feedback && (
        <>
          {/* Review always shows the worked solution: the point is to re-teach,
              not to test blind. */}
          <FeedbackPanel feedback={feedback} onNext={nextReview} showSolution />
          <div>
            <button className="btn ghost" onClick={exitReview}>
              Finish for now
            </button>
          </div>
        </>
      )}
    </section>
  );
}
