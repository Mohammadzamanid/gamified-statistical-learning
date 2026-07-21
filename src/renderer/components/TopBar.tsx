import { useStore } from "../state/store";

export function TopBar(): JSX.Element {
  const save = useStore((s) => s.save);
  const screen = useStore((s) => s.screen);
  const navigate = useStore((s) => s.navigate);
  const session = useStore((s) => s.session);
  const clientMode = useStore((s) => s.client.mode);

  const inLesson = screen.name === "question" && session && !session.finished;

  return (
    <header className="topbar">
      <span className="brand" aria-label="Statlas">
        Stat<em>las</em>
      </span>
      {clientMode === "memory" && (
        <span className="pill" title="Running without Electron; progress is kept in memory only">
          browser preview — saves not on disk
        </span>
      )}
      <span className="spacer" />
      {save && !inLesson && (
        <>
          <span className="pill gold" aria-label={`${save.xp} expedition points`}>
            ⟡ {save.xp} XP
          </span>
          <nav className="row" aria-label="Main navigation">
            <button className="btn ghost small" onClick={() => navigate({ name: "world-map" })}>Chart</button>
            <button className="btn ghost small" onClick={() => navigate({ name: "lab" })}>Laboratory</button>
            <button className="btn ghost small" onClick={() => navigate({ name: "progress" })}>Logbook</button>
            <button className="btn ghost small" onClick={() => navigate({ name: "settings" })}>Settings</button>
            <button className="btn ghost small" onClick={() => navigate({ name: "about" })}>About</button>
          </nav>
        </>
      )}
    </header>
  );
}
