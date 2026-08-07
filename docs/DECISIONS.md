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

**D-017 — Reachable means "from a lesson or from a remediation".**
The S2-03 point-placement audit required every placement question to appear in some lesson's `questionIds`. That held
until Module 3 added remediation-only placements — questions a learner meets *because* they got something wrong, never
in the ordinary run of a lesson. That pattern is deliberate and already recorded as interaction-audit finding F-4, so
the rule was widened rather than removed: a question is reachable if a lesson lists it **or** a remediation names it as
a follow-up, and content reachable from neither still fails. Widening a rule to admit a legitimate case is not the same
as weakening it — the orphan probe still fails three checks. (S2-08)

**D-018 — A demonstration may index data, not only compute over it.**
Region 1's last module teaches tables, variables and cases — structures rather than quantities — and every formula up
to that point produced a number from two numbers. Rather than bend those lessons to fit arithmetic that does not
describe them, `Demonstration` gained an optional `table` and two formulas that read it: `table-cell` (row × column)
and `column-total`. Controls gained `valueLabels`, so a selector shows "Thursday" instead of "4" in both the panel and
the spoken description — both call the same `formatControlValue`, so the two cannot drift. The schema ties a table
selector's range **and** its labels to the table itself, which means an unnamed or out-of-range selector cannot ship.
`apply` now takes the whole demonstration rather than two numbers, which is what made a data-reading readout possible
at all. (S2-08)

**D-019 — Probe every new guard by breaking what it protects.**
A probe in the last S2-08 cycle found that a check written minutes earlier was vacuous: "table selectors name their
positions" skipped controls that had no labels, which is precisely the defect it existed to catch. The probe habit is
therefore not a formality at the end of a unit — it is the only thing that distinguishes a guard from a comment. Two
consequences are now standing practice: a new check is probed by removing the thing it asserts, and the probe harness
counts failed *suites* as well as failed checks, because content the schema rejects stops every suite loading and was
previously being reported as zero failures. (S2-08)

**D-020 — A generator states its answer; it never reads one back.**
`Candidate.expectedResponse` is mandatory, and the pipeline evaluates *that* against the question the generator built.
The obvious alternative — derive the correct response from `question.answer`, then check it against `question.answer` —
is tautological for every answer kind, and it was in the code until a probe deleted the entire answer check and no test
noticed. Where a second independent computation exists it is supplied: every arithmetic operation carries an
`applyIndependently` that reaches the same number by a different route (repeated addition against multiplication,
counting down against subtraction), so a typo in either route makes the two disagree and the combination is rejected.
Where no independent computation exists — a question about matching a description to a situation — stating the intended
option still catches a `build()` that marks a different one correct. (S2-09)

**D-021 — Three fingerprints, because §4 names two different rules.**
"Near-duplicate detection normalises numbers, names, whitespace, punctuation and equivalent phrasing" and "a topic with
100 numeric variants of one reasoning pattern is not Complete" are a *rejection* rule and a *diversity* rule, and they
cannot share a fingerprint: the first attempt used one, and 800 valid combinations collapsed to 9 because every numeric
variant looked like a duplicate of every other. So `exactFingerprint` catches the same question twice (a generator bug),
`nearDuplicateFingerprint` keeps the numbers and strips the scenery — catching the rename-the-objects trick, and
rejecting it — and `reasoningShape` strips everything particular and is *reported*, feeding a ceiling of 50% on any
single shape per topic. (S2-09)

**D-022 — Generated practice is merged at load, not committed as JSON.**
`loadPlayableContent()` runs the generators once and merges the accepted questions into the bundle; `loadShippedContent()`
returns only what the JSON files declare. Two reasons for the split. Committing 3,000 generated records would put two
copies of the same content in the repository, free to drift. And every audit that reasons about hand-written content —
lesson structure, reachability, the interaction audit — keeps working from the authored bundle, so generated practice
can never quietly satisfy a check about authored content. Generated ids are prefixed `q.gen.`, a check fails if one ever
appears in a lesson, and another proves the spaced-review queue can pick them — which is what makes "available" honest
rather than a number in a report. (S2-09)

**D-023 — A rejection is either a design decision or a defect, and the report must not blur them.**
The generation pipeline discards candidates for six reasons, and they are not the same kind of fact. A generator saying
"that combination is not a question this topic should ask" is design, and is reported with its reason. The pipeline
saying "this question's answer disagrees with the family's own working", or "the schema refuses it", or "it has no text
equivalent", or "it names a misconception nobody declared", or "this is a question already emitted" is a *defect in a
shipped generator*, and must be zero. Written after a probe made one form's second, independent working repeat the very
mistake its own trap describes: sixty-eight answers disagreed with their own keys, all sixty-eight were silently
dropped, and the topic still cleared every §4 bar — 203 interactions, 4 reasoning families, a 49% largest shape — and
reported no failures. Discarding bad output quietly is indistinguishable from producing good output unless something
counts the discards. (S2-09)

**D-024 — A question's fingerprint covers everything the learner reads.**
`exactFingerprint` originally identified a question by its interaction, prompt, answer and choices. An ordering
question carries its content in its *items*, and its family gives every question the same prompt, so identity reduced
to the prompt plus one of six permutations — and whole families collapsed onto six questions while every value on
screen differed. It was found by reading a coverage report that claimed 25 exact duplicates in a topic whose
generators emit no clones, not by a failing test; the fix recovered questions in every topic (counting 796 → 855,
multiplication 688 → 768). The rule that follows: a fingerprint that omits a field the learner can see will silently
throw away valid content, and silently is the problem. (S2-09)

**D-025 — A misconception goes where its detector can fire, not where its subject fits.**
`misconceptionIds` is not a topic tag. The engine walks that list, runs each misconception's named detector, and can
only report one the detector actually recognises — so which questions may declare a misconception is decided by its
**detector**, not by what it is about. `known-wrong-answer` reaches a learner through a tagged distractor, so it belongs
on multiple-choice; `point-geometry` is classified from placement geometry by the evaluator, so it belongs on
point-placement, as a `misconceptionPoints` entry or as `swappedAxesMisconceptionId`. The coordinates recognition family
declares nothing at all for this reason: `mc.axes-swapped` on one of its choices would read perfectly and never fire.
An inert declaration is worse than none — it inflates a mapping count while the learner gets a bare "incorrect" — and
reading the tag back off the question could never catch it, so `tests/audit/content-coverage.test.ts` drives the real
evaluator and the real classifier with the answer a holder of that misconception would give and requires the engine to
name it. Four separate ways of getting this wrong were probed; each fails that one check. (S2-09)

**D-026 — A rejection reason that cannot fire is decoration, and the report says which.**
A generator declaring `invalidReason` for combinations it will not ask about is how §4's raw-versus-valid counts stay
honest — but a reason no combination can trigger is not a guard, it is a comment that looks like one. The first
`ratios.ts` reported `invalidCombinations: 0`, which reads like cleanliness and was actually four dead branches: the mix
grid held no equal-parts mix and the range limits sat above anything the grid could reach. The fix is to make the grid
reach them — equal-parts mixes added on purpose, limits tied to the range the lesson's own demonstration shows — or to
delete the branch, as two guards in `position.ts` were deleted because no scale in the list steps by one. So a zero in
that column is a question, not a result: either the grid is too narrow or the reason is ornamental. (S2-09)
