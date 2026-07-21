import { useStore } from "../state/store";

export function WelcomeScreen(): JSX.Element {
  const navigate = useStore((s) => s.navigate);
  const profiles = useStore((s) => s.profiles);
  return (
    <div className="stack" style={{ maxWidth: 640, margin: "8vh auto 0", textAlign: "center" }}>
      <p className="eyebrow">An expedition into statistics</p>
      <h1>Every dataset is a coastline waiting to be charted.</h1>
      <p className="muted">
        Statlas takes you from your first tally to confident statistical reasoning — one region,
        one voyage, one honest mistake at a time. Works fully offline; your progress stays on this machine.
      </p>
      <div className="row" style={{ justifyContent: "center" }}>
        <button className="btn primary" onClick={() => navigate({ name: "profiles" })}>
          {profiles.length > 0 ? "Choose an explorer" : "Begin the expedition"}
        </button>
      </div>
    </div>
  );
}
