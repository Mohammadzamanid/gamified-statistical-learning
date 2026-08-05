import { DemonstrationPanel } from "../components/DemonstrationPanel";
import { useStore } from "../state/store";

/** The practice sections of a lesson, in the order scope §5 requires them. */
const PRACTICE_SECTIONS = [
  { key: "guidedQuestionIds", title: "Guided practice", note: "Worked through with hints available from the start." },
  { key: "independentQuestionIds", title: "Independent practice", note: "The same idea, this time on your own." },
  { key: "misconceptionQuestionIds", title: "Watch your step", note: "This one targets a mistake that catches people out." },
  { key: "applicationQuestionIds", title: "Out in the world", note: "Where this shows up away from the page." },
  { key: "teachBackQuestionIds", title: "Teach it back", note: "Explain it in your own words." },
  { key: "masteryCheckQuestionIds", title: "Mastery check", note: "Passing this is what marks the skill as learned." }
] as const;

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

          {lesson.demonstration && <DemonstrationPanel demo={lesson.demonstration} />}

          {lesson.concepts.map((c) => (
            <div key={c.id} className="card">
              <h3>{c.title}</h3>
              <p className="faint">{c.summary}</p>
              <p className="muted">{c.body}</p>
            </div>
          ))}

          {lesson.formalTerm && (
            <div className="card stack">
              <p className="eyebrow">The word for it</p>
              <h3>{lesson.formalTerm.term}</h3>
              <p className="muted">{lesson.formalTerm.definition}</p>
              {lesson.formalTerm.notation && (
                <>
                  <p>
                    Written as <strong>{lesson.formalTerm.notation}</strong>
                  </p>
                  <ul>
                    {lesson.formalTerm.symbols.map((s) => (
                      <li key={s.symbol}>
                        <strong>{s.symbol}</strong> — {s.meaning}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Named sections rather than one undifferentiated list: the learner can
              see that guided practice, the misconception challenge and the mastery
              check are doing different jobs. Sections a lesson has not filled in
              yet simply do not appear. */}
          {PRACTICE_SECTIONS.some((s) => lesson[s.key].length > 0) && (
            <div className="card stack">
              <p className="eyebrow">What practice covers</p>
              {PRACTICE_SECTIONS.filter((s) => lesson[s.key].length > 0).map((s) => (
                <p key={s.key} className="muted">
                  <strong>{s.title}</strong> ({lesson[s.key].length}) — {s.note}
                </p>
              ))}
              <p className="faint">
                Whatever you answer here is scheduled for spaced review, so it comes back before you forget it.
              </p>
            </div>
          )}

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
