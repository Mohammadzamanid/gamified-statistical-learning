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

**D-010 — Multi-step calculations are a distinct answer kind, not prose.**
`solutionSteps` is display-only text, so step-by-step work got a real `steps` answer kind: ordered numeric steps, each
with its own tolerance, unit, hints, explanation, and misconception map. The schema makes the `step-by-step-calculation`
interaction and the `steps` answer imply each other, so neither can be authored without the other. Run logic lives in
`src/core/questions/step-calculation.ts` as pure functions (per D-001), leaving the renderer a thin shell and making the
whole state machine testable without a DOM. A completed run submits one `steps` response through the ordinary session
pipeline, so mastery, review scheduling, and achievements still update exactly once per question. (S2-02)

**D-011 — Step misconceptions are declared per step, and outrank question-level detectors.**
Question-level detectors inspect a single response and all decline a `steps` response, so a step declares its own
`misconceptionValues` mapping a wrong value to a misconception id. The evaluator emits `stepMisconceptionIds` and
`classifyMisconception` honours those before falling back to detectors. This keeps step errors inside the existing
remediation pipeline — micro-lesson, guided retry, injected follow-up — rather than creating a second, parallel feedback
path. The content loader validates these ids so a step cannot classify to something no remediation covers. (S2-02)

**D-012 — Lesson demonstrations are content, not one component per lesson.**
Scope §5 requires an interactive visual demonstration in every Complete lesson, and placeholder controls do not count.
Seventeen bespoke widgets in Region 1 alone would be seventeen things to keep accessible, keyboard-operable and tested,
so a demonstration is instead a `Demonstration` record: labelled controls with ranges and steps, a **named** formula,
a prediction, and an observation. `DEMONSTRATION_ARITY` ties each formula to the number of controls it consumes, and
the schema refuses a divisor whose range reaches zero. The arithmetic lives in `src/core/curriculum/demonstration.ts`
(per D-001), so `DemonstrationPanel` computes nothing — the visible readout and the screen-reader text are generated
from the same call and cannot drift apart. Adding a lesson needs no new React; adding a *new kind* of relationship
needs one enum member and one `case`. (S2-08)

**D-013 — The prediction gates the controls.**
Requirement 5 asks for a learner prediction before the reveal, and a prediction made after seeing the answer is not a
prediction. The panel therefore starts with the controls disabled: the reveal note, the live readout and the
observation appear only once a prediction is locked in. This is a deliberate friction, and it is why the demonstration
carries the prediction rather than the question bank. (S2-08)

**D-014 — Completeness is a declared list a test has to defend.**
`tests/helpers/complete-lessons.ts` names the lessons claiming all 18 structure requirements. Two audits read it:
`lesson-structure` holds everything on the list to the 18 checks, and `region1-architecture` holds everything off it to
the skeleton shape S2-07 delivered. A lesson therefore cannot sit in between — growing a skeleton past its seed question
fails the second audit, and adding an id without the content fails the first. Beginner safety is enforced the same way:
a symbol may only appear in a lesson's prose, questions or remediations if that lesson or one of its prerequisites
explains it, which is why the counting lesson is written without `+`. (S2-08)

**D-015 — One lesson-completeness claim, one shared playthrough.**
Per-module integration tests (`module1-lessons.test.ts`, `module2-lessons.test.ts`, …) each drive their module through
the real session engine, but the *mechanics* of doing that live once in `tests/helpers/lesson-playthrough.ts`. A module
file therefore carries only what is genuinely module-specific: the misconceptions it declares and the exact wrong
answer that triggers each one. Those slips stay hand-written on purpose — a generic wrong answer proves a question can
be failed, not that the **named** error was diagnosed. The Complete-list assertion in each module file is a *subset*
check, never an equality one, so finishing a later module cannot break an earlier module's test. (S2-08)

**D-016 — A guard that cannot tell punctuation from notation is not shipped.**
Extending the beginner-safety scanner to treat `:` between numbers as notation was tried and immediately flagged
"Count on 5: 8, 9, 10, 11, 12" — a colon ending a clause. Rather than special-case around the false positive, `:` and
`=` are both left out of the prose scan and the reasoning is recorded in the test itself. Neither goes unchecked
overall: requirement 10 still forces any lesson whose **notation** contains them — ratios, proportions — to explain
them. A narrower guard that is always right beats a broader one that has to be argued with. (S2-08)
