# PROJECT_CONTEXT.md — Statlas

> Read this first in every future stage. Do NOT restart the repository. Build on what exists.

## What Statlas is

Statlas (working title) is a **gamified statistics-learning desktop app for Windows**, built as an offline-first Electron + React + TypeScript application. The learner is a cartographer-explorer charting an archipelago; statistical skills are regions on an expedition chart. The pedagogy centers on **misconception detection and remediation**: wrong answers are diagnosed against a library of known statistical misconceptions, trigger targeted micro-lessons, and inject remediation follow-up questions into the live session.

## Product pillars (from the master spec)

1. **Offline-first.** No network calls at runtime. All content ships in `src/content/`. All persistence is local JSON under Electron `userData`.
2. **Honest engineering.** Features that are not implemented are labeled as such in the UI and in `IMPLEMENTATION_STATUS.md`. Never claim untested platforms (we develop on Linux; Windows packaging is configured but NOT compiled/tested here).
3. **Deterministic mastery.** No black-box scoring. Mastery = streak ≥ 3 AND accuracy ≥ 0.8 AND attempts ≥ 4, with a 14-day half-life retention decay and difficulty adaptation (1–5, floor 1).
4. **Accessibility as core.** Dark/light/high-contrast themes, color-blind-safe palette swap, reduced motion (media query + explicit setting), text scaling (s/m/l/xl), keyboard-first navigation, ARIA on all custom widgets, mastery never signaled by color alone.
5. **Content as data.** Curriculum, questions, datasets, misconceptions, remediations, and achievements are Zod-validated JSON. The engine is content-agnostic.

## Current stage

**Stage 1 complete.** Full vertical slice: one world ("The Counting Shores"), two regions, three lessons, 14 questions, 8 misconceptions, 7 remediations, 4 achievements. 11 of 17 planned interaction types are live. 73 automated tests pass. Linux production build and unpacked package validated. See `IMPLEMENTATION_STATUS.md` for the evidence table and `STAGE_HANDOFF.md` for what Stage 2 should do.

## Repository map

```
src/
  main/         Electron main process (window, IPC, storage wiring)
  preload/      contextBridge — narrow "statlas" API only
  renderer/     React app: state (zustand + pure session logic), screens, components, styles
  core/         Platform-agnostic engines: statistics, questions, misconceptions,
                mastery, spaced-repetition, persistence, curriculum, achievements,
                accessibility
  shared/       Zod schemas, numeric utils, Result type, constants
  content/      Shipped JSON content + loader
tests/          Vitest: unit, statistics, integration, content validation
docs/           This file + status/architecture/decisions/handoff
build/          icon.png (app icon)
```

## Non-negotiable constraints for future stages

- Develop and validate on Linux; `package:win` (NSIS) is configured in `electron-builder.yml` but must only be claimed after real Windows compilation/testing.
- Never break the save-file contract without adding a migration in `src/core/persistence/migrations.ts` and bumping `SAVE_SCHEMA_VERSION`.
- Every new question/misconception/dataset must pass `npm run test:content` (schema + cross-reference integrity).
- Keep `IMPLEMENTATION_STATUS.md` honest after every stage.
