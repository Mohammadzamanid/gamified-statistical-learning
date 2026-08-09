import { isLessonUnlocked, lessonStatus } from "../../core/curriculum/progress";
import { investigationForRegion, investigationStatus, isInvestigationUnlocked } from "../../core/investigations/engine";
import { useStore } from "../state/store";

export function RegionScreen({ regionId }: { regionId: string }): JSX.Element {
  const content = useStore((s) => s.content);
  const save = useStore((s) => s.save);
  const navigate = useStore((s) => s.navigate);
  const openInvestigation = useStore((s) => s.openInvestigation);
  const region = content.curriculum.regions.find((r) => r.id === regionId);
  if (!region || !save) return <p className="muted">Region not found.</p>;

  const modules = content.curriculum.modules.filter((m) => region.moduleIds.includes(m.id));
  const boss = investigationForRegion(content.curriculum, regionId);

  return (
    <div className="stack">
      <button className="btn ghost small" onClick={() => navigate({ name: "world-map" })}>← Back to the chart</button>
      <div>
        <p className="eyebrow">{region.tagline}</p>
        <h2>{region.title}</h2>
        <p className="muted">{region.description}</p>
      </div>

      {modules.map((mod) => (
        <div key={mod.id} className="card stack">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3>{mod.title}</h3>
            <span className="pill">difficulty {mod.difficulty}/5</span>
          </div>
          <p className="muted">{mod.description}</p>
          <div className="stack">
            {mod.lessonIds.map((lessonId) => {
              const lesson = content.curriculum.lessons.find((l) => l.id === lessonId);
              if (!lesson) return null;
              const unlocked = isLessonUnlocked(content.curriculum, save, lessonId);
              const status = lessonStatus(save, lessonId);
              const done = status === "completed";
              return (
                <div key={lessonId} className="card raised row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <strong>{lesson.title}</strong>
                    <div className="faint">
                      {lesson.questionIds.length} questions · ~{lesson.estimatedMinutes} min
                      {done && <span className="pill gold" style={{ marginLeft: 8 }}>★ completed</span>}
                    </div>
                  </div>
                  <button
                    className={`btn ${unlocked && !done ? "primary" : ""}`}
                    disabled={!unlocked}
                    onClick={() => navigate({ name: "lesson", lessonId })}
                  >
                    {!unlocked ? "Locked" : done ? "Revisit" : "Open lesson"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* The boss sits after the modules and outside them: it belongs to the
          region, gates its achievement, and is not a sixth lesson. */}
      {boss && (() => {
        const unlocked = isInvestigationUnlocked(content.curriculum, save, boss.id);
        const status = investigationStatus(save, boss.id);
        return (
          <div className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h3>{boss.title}</h3>
              <span className="pill">investigation</span>
            </div>
            <p className="muted">
              The region's case. It draws on every lesson here at once, runs in {boss.steps.length} stages, and can be
              left and resumed a stage at a time.
            </p>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="faint">
                ~{boss.estimatedMinutes} min
                {status === "completed" && <span className="pill gold" style={{ marginLeft: 8 }}>★ closed</span>}
                {status === "in-progress" && <span className="pill" style={{ marginLeft: 8 }}>in progress</span>}
              </span>
              <button
                className={`btn ${unlocked && status !== "completed" ? "primary" : ""}`}
                disabled={!unlocked}
                onClick={() => openInvestigation(boss.id)}
              >
                {!unlocked ? "Sealed until every lesson is charted" : status === "completed" ? "Reopen the case" : status === "in-progress" ? "Resume the case" : "Open the case"}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
