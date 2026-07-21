# STAGE_HANDOFF.md — from Stage 1 to Stage 2

## State at handoff (2026-07-21)

- 73/73 tests passing (14 files). Typecheck clean, lint clean.
- `npm run build` and `npm run package:linux` validated; packaged binary launches.
- Windows installer **not** built (Linux environment). Configured in `electron-builder.yml`.
- Repo is a working vertical slice: profile → world map → region → lesson → questions with misconception remediation → logbook, with full persistence.

## How to resume

```bash
npm install
npm test            # must stay green
npm run typecheck && npm run lint
npm run dev         # renderer + electron dev
```

Read `PROJECT_CONTEXT.md`, then `IMPLEMENTATION_STATUS.md`, then this file. **Do not restart the repo.**

## Stage 2 priorities (ordered)

1. **Wire region-completed achievement trigger** (`src/core/achievements/engine.ts` — currently stubbed false; add tests).
2. **Implement next interaction types** by pedagogy value: `step-by-step-calculation`, `point-placement`, `drag-and-drop` (registry flags flip to true; add evaluator + renderer + tests per type).
3. **Content breadth**: World 2 (spread & shape: variance, sd, outliers, skew) reusing the schema; every addition gated by `npm run test:content`.
4. **Lab simulations**: sampling-distribution / CLT explorer instruments (currently placeholders in `LabScreen.tsx`); keep them driven by `src/core/statistics`.
5. **Review mode**: a dedicated "Due today" flow surfacing `dueItems` from the scheduler (data already computed on Logbook screen).
6. **Windows validation**: on a real Windows machine run `npm run package:win`, smoke-test installer + save paths, then update `IMPLEMENTATION_STATUS.md`.

## Contracts you must not break

- `SAVE_SCHEMA_VERSION` + `MIGRATIONS` — any save-shape change requires a migration and round-trip tests.
- Preload API surface (`window.statlas`) — additive changes only.
- Content JSON schemas — additive; removals require a content-migration note in DECISIONS.md.
- Accessibility invariants: keyboard reachability, ARIA on custom widgets, never color-only signaling.

## Known traps

- `/bin/sh` is dash in the dev container — use bash heredocs.
- Electron headless needs `--no-sandbox` + xvfb; dbus/GPU errors are cosmetic.
- Vitest and Electron tsconfigs are separate; run both typechecks.
