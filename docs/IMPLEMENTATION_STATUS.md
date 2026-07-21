# IMPLEMENTATION_STATUS.md — Stage 1 (2026-07-21)

Legend: ✅ Implemented & tested · 🟡 Partial · ⛔ Not started · 🔧 Configured only (not validated)

| Feature | Status | Evidence |
|---|---|---|
| Zod schema layer (profiles, saves, questions, curriculum, content) | ✅ | `src/shared/schemas/*`; `tests/unit/schemas.test.ts` |
| Statistics engine (descriptive, probability, relationships) | ✅ | `src/core/statistics/*`; 3 test files incl. Anscombe I r≈0.8164, Kahan 100k sum |
| Question engine — 11 interaction types | ✅ | `src/core/questions/registry.ts` (`implemented: true` × 11); `tests/unit/question-engine.test.ts` |
| Question engine — remaining 6 interaction types (drag-and-drop, point-placement, formula-construction, simulation-prediction, step-by-step-calculation, confidence-rating) | ⛔ | Registered with `implemented: false`; renderer shows honest "not yet available" notice |
| Misconception detection + remediation pipeline | ✅ | 8 built-in detectors, per-question parameter overrides; `tests/unit/misconceptions.test.ts`, `tests/integration/session-flow.test.ts` (wrong answer → micro-lesson → injected follow-up) |
| Deterministic mastery engine + difficulty adaptation | ✅ | `src/core/mastery/engine.ts`; `tests/unit/mastery.test.ts` (14-day retention, floor 1) |
| Spaced repetition (SM-2-style, 365-day cap) | ✅ | `src/core/spaced-repetition/scheduler.ts`; `tests/unit/spaced-repetition.test.ts` |
| Persistence: atomic writes, backups (10), corrupt-file recovery, migrations, import/export, guest mode, path-escape guard | ✅ | `src/core/persistence/*`; `tests/integration/persistence.test.ts` (corrupt-primary→backup recovery, migration 0→1, newer-version rejection) |
| Curriculum loader + cross-reference integrity | ✅ | `src/core/curriculum/loader.ts`; `tests/content/content.test.ts` (broken-ref detection) |
| Achievements engine | 🟡 | Question/lesson triggers live (`tests/unit/achievements.test.ts`); **region-completed trigger stubbed** (returns false) |
| App shell — 10 screens (Welcome, Profiles, World Map, Region, Lesson, Question, Lab, Progress/Logbook, Settings, About) | ✅ | `src/renderer/screens/*`; manual launch validated (dev + built + packaged) |
| SVG expedition chart (world map) with keyboard-accessible region seals | ✅ | `WorldMapScreen.tsx` |
| Design system: 3 themes + colorblind-safe + reduced motion + text scale | ✅ | `src/renderer/styles/tokens.css`; `tests/unit/accessibility.test.ts`; live-applied from Settings |
| Laboratory | 🟡 | Descriptive Bench (paste data → full summary via core engine) works; **simulation instruments are planned-only** and labeled as such in UI |
| Multi-profile + guest mode | ✅ | `ProfileScreen.tsx`; persistence tests |
| Test suite | ✅ | **73/73 passing, 14 files** — `npm test` (2026-07-21) |
| TypeScript strict typecheck (renderer + electron configs) | ✅ | `npm run typecheck` clean |
| ESLint | ✅ | `npm run lint` clean (0 errors, 0 warnings) |
| Production build (Vite renderer + tsc electron) | ✅ | `npm run build` — 285.7 kB JS (83.8 kB gzip) |
| Linux unpacked package + launch | ✅ | `npm run package:linux` → `release/linux-unpacked/statlas`; launched under xvfb (cosmetic dbus/GPU warnings only) |
| **Windows NSIS installer** | 🔧 | `electron-builder.yml` target configured. **NOT compiled, NOT tested — Linux container cannot validate Windows builds.** Must be built and smoke-tested on a real Windows machine. |
| App icon | ✅ | `build/icon.png` (512×512, generated) |

## Known defects / gaps

1. Region-completed achievement trigger is stubbed (always false) — wire in Stage 2.
2. 6 interaction types unimplemented (see table) — renderer degrades honestly.
3. Lab simulations (sampling distribution, CLT explorer) are placeholders.
4. Only one world of content; curriculum breadth is Stage 2+ work.
5. `eslint.config.js` triggers a Node module-type warning (cosmetic; adding `"type": "module"` to package.json would require ESM migration of electron build — deferred, see DECISIONS.md).
