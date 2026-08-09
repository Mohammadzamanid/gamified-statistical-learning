import {
  currentStepIndex,
  investigationAccuracy,
  investigationStatus,
  isInvestigationUnlocked
} from "../../core/investigations/engine";
import { useStore } from "../state/store";

/**
 * A boss investigation: the case, its steps, and where the learner had got to.
 *
 * Every step is listed from the start, including the ones still ahead. A case
 * whose shape is hidden reads as a corridor of questions; seeing that there are
 * five stages and which one you are on is what makes leaving and coming back
 * feel like resuming rather than restarting.
 */
export function InvestigationScreen({ investigationId }: { investigationId: string }): JSX.Element {
  const content = useStore((s) => s.content);
  const save = useStore((s) => s.save);
  const navigate = useStore((s) => s.navigate);
  const startStep = useStore((s) => s.startInvestigationStep);

  const investigation = content.curriculum.investigations.find((i) => i.id === investigationId);
  if (!investigation || !save) return <p className="muted">Investigation not found.</p>;

  const unlocked = isInvestigationUnlocked(content.curriculum, save, investigationId);
  const status = investigationStatus(save, investigationId);
  const resumeAt = currentStepIndex(save, investigation);
  const progress = save.investigationProgress[investigationId];
  const done = status === "completed";
  const accuracy = investigationAccuracy(save, investigationId);

  return (
    <div className="stack" style={{ maxWidth: 760, margin: "0 auto" }}>
      <button
        className="btn ghost small"
        onClick={() => navigate({ name: "region", regionId: investigation.regionId })}
      >
        ← Back to the region
      </button>

      <div>
        <p className="eyebrow">Investigation</p>
        <h2>{investigation.title}</h2>
        <p className="muted" style={{ fontStyle: "italic" }}>{investigation.briefing}</p>
      </div>

      {!unlocked && (
        <div className="card">
          <p className="muted">
            The case is sealed until every lesson in this region is charted. It draws on all of them at once, which is
            the point of it.
          </p>
        </div>
      )}

      {done && (
        <div className="card stack">
          <p className="eyebrow">Case closed</p>
          <p className="muted">{investigation.debrief}</p>
          <p className="faint">Across {progress?.stepAccuracy.length ?? 0} stages: {Math.round(accuracy * 100)}% correct.</p>
        </div>
      )}

      <div className="stack">
        {investigation.steps.map((step, index) => {
          const argued = (progress?.stepAccuracy[index] ?? null) !== null;
          const isNext = !done && resumeAt === index;
          // Steps run in order: a case argued out of sequence is not an
          // investigation, it is a quiz with a story on the front.
          const playable = unlocked && (isNext || argued);
          return (
            <div key={step.id} className="card raised stack">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong>
                    Stage {index + 1} of {investigation.steps.length} · {step.title}
                  </strong>
                  <div className="faint">
                    {step.questionIds.length} questions
                    {argued && (
                      <span className="pill gold" style={{ marginLeft: 8 }}>
                        ★ {Math.round((progress?.stepAccuracy[index] ?? 0) * 100)}%
                      </span>
                    )}
                    {isNext && <span className="pill" style={{ marginLeft: 8 }}>next</span>}
                  </div>
                </div>
                <button
                  className={`btn ${isNext ? "primary" : ""}`}
                  disabled={!playable}
                  onClick={() => startStep(investigationId, index)}
                >
                  {!unlocked ? "Sealed" : argued ? "Re-argue" : isNext ? "Open stage" : "Not yet"}
                </button>
              </div>
              <p className="muted">{step.brief}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
