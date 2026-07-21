# Statlas ⚓

A gamified, offline-first statistics-learning desktop app. You are a cartographer charting the **Counting Shores** — each region is a statistical skill, each lesson a voyage, and every wrong answer is diagnosed against a library of known misconceptions and remediated on the spot.

**Stack:** Electron 33 · React 18 · TypeScript (strict) · Vite · Zod · zustand · Vitest · electron-builder

## Quick start

```bash
npm install
npm run dev        # Vite dev server + Electron
npm test           # 73 tests (unit, statistics, integration, content)
npm run typecheck  # renderer + electron tsconfigs
npm run lint
npm run build          # production renderer + main/preload
npm run package:linux  # unpacked Linux build → release/linux-unpacked/
npm run package:win    # NSIS installer — run on Windows only (not validated in CI/dev container)
```

## Highlights

- **Misconception pipeline** — wrong answers matched to detectors (mean/median confusion, sum-not-mean, decimal/percent slips, reversed fractions…), triggering micro-lessons and injecting follow-up questions into the live session.
- **Deterministic mastery** — streak/accuracy/attempt thresholds, 14-day retention half-life, adaptive difficulty 1–5. No black boxes.
- **Spaced repetition** — SM-2-style scheduler feeding a review queue.
- **Bulletproof saves** — Zod-validated JSON, atomic writes, 10 rotating backups, corrupt-file recovery, versioned migrations, import/export, guest mode.
- **Accessibility first** — dark/light/high-contrast themes, color-blind-safe palette, reduced motion, text scaling, keyboard-first, symbols + text (never color alone).
- **Honest status** — unimplemented interactions say so in the UI; see [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md).

## Documentation

| Doc | Purpose |
|---|---|
| [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) | What this is, pillars, constraints — read first |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Process model, engines, state, build pipeline |
| [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md) | Honest feature table with evidence |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Numbered decision log |
| [`docs/STAGE_HANDOFF.md`](docs/STAGE_HANDOFF.md) | How to resume; Stage 2 priorities |

## Platform status

Developed and validated on Linux (dev run, production build, unpacked package, headless launch). Windows NSIS packaging is configured in `electron-builder.yml` but has **not** been compiled or tested — do that on a real Windows machine.
