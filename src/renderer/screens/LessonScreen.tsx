import { useStore } from "../state/store";

export function LessonScreen({ lessonId }: { lessonId: string }): JSX.Element {
  const content = useStore((s) => s.content);
  const save = useStore((s) => s.save);
  const session = useStore((s) => s.session);
  const startLesson = useStore((s) => s.startLesson);
  const navigate = useStore((s) => s.navigate);
  const exitLesson = useStore((s) => s.exitLesson);
  const lesson = content.curriculum.lessons.find((l) => l.id === lessonId);
  if (!lesson || !save) return <p className="muted">Lesson not found.</p>;

  const justFinished = session?.finished && session.lessonId === lessonId;
  const moduleOf = content.curriculum.modules.find((m) => m.id === lesson.moduleId);

  return (
    <div className="stack" style={{ maxWidth: 720, margin: "0 auto" }}>
      <button
        className="btn ghost small"
        onClick={() => {
          exitLesson();
          navigate({ name: "region", regionId: moduleOf?.regionId ?? "" });
        }}
      >
        ← Back to {moduleOf?.title ?? "the region"}
      </button>

      {justFinished ? (
        <div className="card stack" style={{ textAlign: "center" }}>
          <p className="eyebrow">Voyage complete</p>
          <h2>{lesson.title} — charted</h2>
          <p className="muted">
            {session.correctCount} of {session.attemptedCount} answers correct
            {session.newAchievements.length > 0 && " · new achievement earned!"}
          </p>
          {session.newAchievements.map((id) => {
            const ach = content.achievements.find((a) => a.id === id);
            return ach ? <span key={id} className="pill gold">★ {ach.title} — {ach.description}</span> : null;
          })}
          <div className="row" style={{ justifyContent: "center" }}>
            <button className="btn primary" onClick={() => { exitLesson(); }}>Return to the chart</button>
            <button className="btn" onClick={() => startLesson(lessonId)}>Sail it again</button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <p className="eyebrow">Lesson</p>
            <h2>{lesson.title}</h2>
            {lesson.narrativeIntro && <p className="muted" style={{ fontStyle: "italic" }}>{lesson.narrativeIntro}</p>}
          </div>

          {lesson.concepts.map((c) => (
            <div key={c.id} className="card">
              <h3>{c.title}</h3>
              <p className="faint">{c.summary}</p>
              <p className="muted">{c.body}</p>
            </div>
          ))}

          <div className="row" style={{ justifyContent: "center" }}>
            <button className="btn primary" onClick={() => startLesson(lesson.id)}>
              Start practice · {lesson.questionIds.length} questions
            </button>
          </div>
        </>
      )}
    </div>
  );
}
