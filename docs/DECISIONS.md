# DECISIONS.md — Statlas

Numbered, append-only. Future stages add entries; do not rewrite history.

**D-001 — Electron + React + TS + Vite + Zod + zustand + Vitest.**
Offline-first Windows desktop target with web-stack velocity. Zod gives runtime validation at every trust boundary (IPC, disk, content). zustand chosen over Redux for minimal ceremony; session logic kept in pure functions so the store stays thin.

**D-002 — CommonJS electron build, ESM renderer.**
`tsconfig.electron.json` emits CJS for main/preload (broadest Electron compatibility); renderer is ESM via Vite. Cost: a cosmetic Node warning from `eslint.config.js` module detection. Migrating package.json to `"type": "module"` would force ESM in the electron build — deferred until Electron ESM support matures in our toolchain.

**D-003 — Deterministic mastery over IRT/Elo.**
Mastery thresholds (streak 3, accuracy 0.8, min 4 attempts) with exponential retention decay are explainable to learners and trivially testable. Adaptive difficulty is a bounded integer 1–5.

**D-004 — Misconception parameters live on questions.**
The same misconception (e.g., mean/median confusion) yields different wrong values per question, so `question.parameters[misconceptionId]` overrides `misconception.detectorParams` at pipeline time. (Added after test evidence: fixed 3 failures.)

**D-005 — Honest interaction registry.**
All 17 planned interaction types are registered; unimplemented ones carry `implemented: false` and the renderer shows a plain "not yet available" notice instead of faking. Prevents silent content breakage and keeps status auditable.

**D-006 — Atomic writes + rotating backups instead of a database.**
Plain JSON with tmp+fsync+rename, 10 rotating backups, and corrupt-primary→backup recovery is inspectable by users and sufficient at this data size. SQLite reconsidered only if attempt logs grow beyond the 500-entry cap.

**D-007 — SM-2-style scheduler with hard caps.**
Ease capped at 3.0, lapse floor 1.3, interval capped at 365 days (uncapped intervals overflowed `Date` in testing).

**D-008 — Linux is the validation platform.**
Windows NSIS packaging is configured but never claimed as tested until run on real Windows. All "it works" claims in docs are backed by Linux runs (dev, built, packaged-unpacked).

**D-009 — Per-question deterministic shuffle.**
Ordering/choice shuffles are seeded from the question id so a learner sees a stable arrangement across re-renders, and tests are reproducible.
