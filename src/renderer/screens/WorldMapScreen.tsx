import { isRegionCompleted, isRegionUnlocked } from "../../core/curriculum/progress";
import { useStore } from "../state/store";

/** The signature screen: the expedition chart with route, compass, and region seals. */
export function WorldMapScreen(): JSX.Element {
  const content = useStore((s) => s.content);
  const save = useStore((s) => s.save);
  const navigate = useStore((s) => s.navigate);
  const recovered = useStore((s) => s.recoveredFromBackup);
  if (!save) return <p className="muted">No profile selected.</p>;

  const world = content.curriculum.worlds[0]!;
  const regions = content.curriculum.regions.filter((r) => r.worldId === world.id);

  return (
    <div className="stack">
      {recovered && (
        <div className="feedback correct" role="status">
          <p className="verdict"><span aria-hidden="true">✓</span> Save restored</p>
          <p>Your main save file could not be read, so the most recent backup was restored automatically.</p>
        </div>
      )}
      <div>
        <p className="eyebrow">{world.tagline}</p>
        <h2>{world.title}</h2>
        <p className="muted">{world.description}</p>
      </div>

      <div className="map-wrap">
        <svg className="map-svg" viewBox="0 0 100 62" role="group" aria-label={`Expedition chart of ${world.title}`}>
          {/* graticule */}
          {[15, 31, 47].map((y) => (
            <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--line)" strokeWidth="0.15" strokeDasharray="0.8 1.4" />
          ))}
          {[20, 40, 60, 80].map((x) => (
            <line key={x} x1={x} x2={x} y1="0" y2="62" stroke="var(--line)" strokeWidth="0.15" strokeDasharray="0.8 1.4" />
          ))}
          {/* compass rose */}
          <g transform="translate(88, 10)" aria-hidden="true">
            <circle r="6" fill="none" stroke="var(--ink-faint)" strokeWidth="0.3" />
            <path d="M0,-5.2 L1.1,0 L0,5.2 L-1.1,0 Z" fill="var(--accent)" opacity="0.85" />
            <path d="M-5.2,0 L0,1.1 L5.2,0 L0,-1.1 Z" fill="var(--ink-faint)" />
            <text y="-7.4" textAnchor="middle" fontSize="2.6" fill="var(--ink-soft)" fontFamily="var(--font-display)">N</text>
          </g>
          {/* voyage route */}
          {regions.length > 1 && (
            <polyline
              points={regions.map((r) => `${r.mapX},${r.mapY * 0.62}`).join(" ")}
              fill="none"
              stroke="var(--route)"
              strokeWidth="0.5"
              strokeDasharray="1.6 1.6"
              opacity="0.7"
            />
          )}
          {/* region seals */}
          {regions.map((region) => {
            const unlocked = isRegionUnlocked(content.curriculum, save, region.id);
            const completed = isRegionCompleted(content.curriculum, save, region.id);
            const cx = region.mapX;
            const cy = region.mapY * 0.62;
            return (
              <g
                key={region.id}
                className={`region-node ${unlocked ? "" : "locked"}`}
                tabIndex={0}
                role="button"
                aria-label={`${region.title}: ${completed ? "completed" : unlocked ? "available" : "locked — complete previous regions first"}`}
                aria-disabled={!unlocked}
                onClick={() => unlocked && navigate({ name: "region", regionId: region.id })}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && unlocked) {
                    e.preventDefault();
                    navigate({ name: "region", regionId: region.id });
                  }
                }}
              >
                <circle className="node-ring" cx={cx} cy={cy} r="5.5" fill="var(--panel)" stroke={completed ? "var(--gold)" : unlocked ? "var(--accent)" : "var(--ink-faint)"} strokeWidth="0.7" />
                <text x={cx} y={cy + 1.4} textAnchor="middle" fontSize="4" fill={unlocked ? "var(--ink)" : "var(--ink-faint)"} aria-hidden="true">
                  {completed ? "★" : unlocked ? "⚓" : "🔒"}
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize="2.7" fill="var(--ink-soft)" fontFamily="var(--font-display)">
                  {region.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid-2">
        {regions.map((region) => {
          const unlocked = isRegionUnlocked(content.curriculum, save, region.id);
          return (
            <div key={region.id} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3>{region.title}</h3>
                {!unlocked && <span className="pill">locked</span>}
              </div>
              <p className="faint">{region.tagline}</p>
              <p className="muted">{region.description}</p>
              <button className="btn" disabled={!unlocked} onClick={() => navigate({ name: "region", regionId: region.id })}>
                {unlocked ? "Open region" : "Locked — chart the previous region first"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
