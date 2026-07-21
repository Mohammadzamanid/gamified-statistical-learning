import { retentionNow } from "../../core/mastery/engine";
import { dueItems } from "../../core/spaced-repetition/scheduler";
import { useStore } from "../state/store";
import { MasteryBadge, DifficultyPips } from "../components/MasteryBadge";

export function ProgressScreen(): JSX.Element {
  const content = useStore((s) => s.content);
  const save = useStore((s) => s.save);
  if (!save) return <p className="muted">No profile selected.</p>;

  const now = new Date();
  const due = dueItems(save.reviewQueue, now);
  const skillRows = content.curriculum.skills.map((skill) => ({
    skill,
    state: save.skillStates[skill.id]
  }));
  const attempted = save.attemptLog.length;
  const correct = save.attemptLog.filter((a) => a.correct).length;

  return (
    <div className="stack">
      <div>
        <p className="eyebrow">The logbook</p>
        <h2>{save.profile.name}'s expedition record</h2>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Voyage totals</h3>
          <p className="data">{attempted} questions answered · {correct} correct{attempted > 0 ? ` (${Math.round((correct / attempted) * 100)}%)` : ""}</p>
          <p className="data">⟡ {save.xp} expedition points</p>
          <p className="muted">{due.length === 0 ? "No skills due for review right now." : `${due.length} skill${due.length === 1 ? "" : "s"} due for review — revisit their lessons to keep them sharp.`}</p>
        </div>
        <div className="card">
          <h3>Achievements</h3>
          {save.achievements.length === 0 ? (
            <p className="muted">None yet — the first one is a single answered question away.</p>
          ) : (
            <div className="stack">
              {save.achievements.map((id) => {
                const ach = content.achievements.find((a) => a.id === id);
                return ach ? <span key={id} className="pill gold">★ {ach.title} — {ach.description}</span> : null;
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card stack">
        <h3>Skill chart</h3>
        {skillRows.map(({ skill, state }) => (
          <div key={skill.id} className="row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
            <div>
              <strong>{skill.title}</strong>
              {skill.description && <div className="faint">{skill.description}</div>}
            </div>
            <div className="row">
              {state && state.attempts > 0 && (
                <>
                  <span className="faint data">{state.correct}/{state.attempts}</span>
                  <span className="faint data" title="Estimated retention">mem {Math.round(retentionNow(state, now) * 100)}%</span>
                  <DifficultyPips level={state.difficultyLevel} />
                </>
              )}
              <MasteryBadge level={state?.masteryLevel ?? "unseen"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
