import type { MasteryLevel } from "../../shared/constants/app";

const LABELS: Record<MasteryLevel, string> = {
  unseen: "Uncharted",
  introduced: "Sighted",
  practicing: "Charting",
  proficient: "Charted",
  mastered: "Mastered"
};

const SYMBOLS: Record<MasteryLevel, string> = {
  unseen: "◌",
  introduced: "◔",
  practicing: "◑",
  proficient: "◕",
  mastered: "●"
};

/** Mastery is always shown as symbol + text, never color alone. */
export function MasteryBadge({ level }: { level: MasteryLevel }): JSX.Element {
  const isTop = level === "mastered";
  return (
    <span className={`pill ${isTop ? "gold" : ""}`} aria-label={`Mastery: ${LABELS[level]}`}>
      <span aria-hidden="true">{SYMBOLS[level]}</span> {LABELS[level]}
    </span>
  );
}

export function DifficultyPips({ level }: { level: number }): JSX.Element {
  return (
    <span className="pill" aria-label={`Difficulty ${level} of 5`}>
      <span aria-hidden="true">{"▮".repeat(level)}{"▯".repeat(Math.max(0, 5 - level))}</span> D{level}
    </span>
  );
}
