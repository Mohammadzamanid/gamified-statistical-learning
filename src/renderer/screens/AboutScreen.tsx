import { listInteractions } from "../../core/questions/registry";
import { APP_NAME } from "../../shared/constants/app";
import { useStore } from "../state/store";

export function AboutScreen(): JSX.Element {
  const content = useStore((s) => s.content);
  const interactions = listInteractions();
  const live = interactions.filter((i) => i.implemented).length;

  return (
    <div className="stack" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div>
        <p className="eyebrow">About</p>
        <h2>{APP_NAME} 0.1.0</h2>
      </div>
      <div className="card stack">
        <p className="muted">
          An offline-first, gamified expedition through statistics — from first tallies to
          statistical reasoning. All progress stays on this machine; nothing is sent anywhere.
        </p>
        <p className="faint data">
          Content: {content.curriculum.worlds.length} world · {content.curriculum.regions.length} regions ·{" "}
          {content.curriculum.lessons.length} lessons · {content.questions.size} questions ·{" "}
          {content.misconceptions.length} misconception detectors wired
        </p>
        <p className="faint data">
          Interaction types: {live} live of {interactions.length} planned
        </p>
      </div>
    </div>
  );
}
