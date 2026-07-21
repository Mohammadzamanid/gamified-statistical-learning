import { isLessonUnlocked, lessonStatus } from "../../core/curriculum/progress";
import { useStore } from "../state/store";

export function RegionScreen({ regionId }: { regionId: string }): JSX.Element {
  const content = useStore((s) => s.content);
  const save = useStore((s) => s.save);
  const navigate = useStore((s) => s.navigate);
  const region = content.curriculum.regions.find((r) => r.id === regionId);
  if (!region || !save) return <p className="muted">Region not found.</p>;

  const modules = content.curriculum.modules.filter((m) => region.moduleIds.includes(m.id));

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
    </div>
  );
}
