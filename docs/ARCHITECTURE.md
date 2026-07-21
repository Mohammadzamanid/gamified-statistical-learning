# ARCHITECTURE.md — Statlas

## Process model

```
┌────────────────────────────┐   IPC (validated)   ┌──────────────────────────┐
│ Electron main (src/main)   │◄───────────────────►│ Renderer (src/renderer)  │
│  • BrowserWindow 1280×800  │  profiles:* save:*  │  React 18 + zustand      │
│  • NodeStorageAdapter      │  settings:* app:*   │  Pure session functions  │
│    → userData/statlas-data │                     │  10 screens              │
└────────────┬───────────────┘                     └────────────┬─────────────┘
             │                                                  │
   src/preload/preload.ts — contextBridge exposes ONLY window.statlas
```

- `contextIsolation: true`, `nodeIntegration: false`. The preload exposes a narrow, promise-based API; every IPC handler in main re-validates payloads with Zod (`SaveFileSchema` etc.) before touching disk.
- External links are denied in-window and opened in the system browser.

## Core engines (`src/core/`) — platform-agnostic, no DOM, no Electron

| Engine | Responsibility |
|---|---|
| `statistics` | Kahan-summed descriptive stats, R-7 percentiles, probability, correlation/regression |
| `questions` | Normalization (comma decimals, %, fractions), evaluation per interaction type, registry of 17 types with honest `implemented` flags |
| `misconceptions` | Detector registry (8 built-ins), `runFeedbackPipeline` merges per-question `parameters[misconceptionId]` over defaults, returns diagnosis + remediation + follow-up question ids |
| `mastery` | Deterministic levels (streak 3 / accuracy 0.8 / min 4 attempts), 14-day half-life retention, difficulty 1–5 adaptation |
| `spaced-repetition` | SM-2-style: 1d → 3d → ×ease; lapse floor 1.3, ease cap 3.0, interval cap 365d |
| `persistence` | `StorageAdapter` interface; `MemoryStorageAdapter` (tests/browser preview) and `NodeStorageAdapter` (atomic tmp+fsync+rename, path-escape guard); save-manager with 10-slot backup rotation, corrupt-primary→backup recovery, forward migrations, newer-version rejection |
| `curriculum` | Loads + cross-validates content bundle (every referenced skill/dataset/question/misconception must exist); progress/unlock computation |
| `achievements` | Trigger evaluation (question-correct, lesson-completed; region-completed stubbed) |
| `accessibility` | Applies settings to `document.documentElement` data-attributes |

## Renderer state

- **zustand store** (`state/store.ts`): navigation, boot (settings → theme attributes → profiles → auto-select), profile CRUD, settings live-apply, lesson lifecycle with autosave after every answer.
- **Pure session logic** (`state/session.ts`): `startLesson` / `submitAnswer` / `advance` are pure `(content, save, session, …) → new state` functions — fully unit-testable without React. `submitAnswer` runs the feedback pipeline, updates mastery per skill, schedules reviews, awards XP (10/5/1), caps the attempt log at 500, and queues remediation follow-ups that `advance` injects right after the current question.
- **Persistence client** (`state/persistence-client.ts`): uses `window.statlas` when present; otherwise falls back to an in-memory client and the TopBar shows a "browser preview — saves not on disk" pill.

## Design system

CSS custom properties in `styles/tokens.css`; themes and options are `data-*` attributes on `<html>`:
`data-theme` (chartroom | paper | high-contrast), `data-colorblind`, `data-reduced-motion`, `--scale` for text size. Reduced motion honors both the OS media query and the explicit setting. Mastery levels always pair symbol + text (◌ → ●), never color alone.

## Content pipeline

JSON in `src/content/` → `loadShippedContent()` → Zod parse → curriculum cross-ref integrity check → typed `ContentBundle` consumed by session logic. `npm run test:content` gates content changes.

## Build pipeline

- Dev: Vite dev server + electron pointing at it.
- Prod: `vite build` (renderer → `dist/`) + `tsc -p tsconfig.electron.json` (main/preload → `dist-electron/`) → `electron-builder` (`--linux dir` validated; `nsis` for Windows configured only).
