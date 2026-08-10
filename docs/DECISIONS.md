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

**D-027 — A generated dataset is written out, not computed.**
The data-group generators are the first whose questions are *about a table*, so the table has to exist before the
question does. The six ledgers in `src/content/generators/data.ts` are literal data rather than a formula over row and
column indices, for two reasons that pull the same way. A formula makes every ledger a rescaling of one ledger, which
the near-duplicate gate would rightly collapse — the numbers differ, the question does not. And a reader of the file
cannot check an answer by eye against a formula, which matters more here than anywhere else, because a table question
whose table is wrong is wrong in a way no schema can see. The corollary is the second half of the decision: where the
question is about a table's *shape* rather than its contents — how many cases, how many observations, how many columns
vary — the family enumerates over described shapes instead, because all six ledgers are five rows by three columns and
asking the same arithmetic six times with the same numbers is the degenerate case §4 exists to stop. (S2-09)

**D-028 — A boss investigation is a first-class thing, and it gates its region.**
It would have been cheaper to make the Region 1 boss a nineteenth lesson at the end of a module, and it would have been
wrong in three ways that all matter. A boss **gates** its region — the region achievement is the reward for arguing the
case, not for finishing the last lesson — so `isRegionCompleted` requires it, and completing every Region 1 lesson no
longer awards `ach.harbor-charted`. A boss is **resumed a stage at a time**, because it is long enough to be
interrupted, so the save carries `investigationProgress` (schema 2 → 3) and `beginInvestigation` is idempotent; a
version that rewrote the record whenever the briefing was opened would look like working code and cost a learner every
stage they had argued. And a boss **may only ask about skills its region has already taught**, which is checkable and
is checked. What it is *not* is a second engine: a step is an ordinary `LessonSession` over that step's questions, so
mastery, spaced review, misconception detection and achievements behave identically inside a case and inside a lesson.
Only the record written on completion differs. (S2-10)

**D-029 — A boss question belongs to no lesson, and the reachability rule says so.**
The questions in an investigation are not filed under any lesson, because a case combines skills the lessons taught
separately and filing its questions under one lesson would misreport which topic they practise. That made all fifteen
of them orphans under the S2-03 rule, which is the third time that rule has had to be widened — lesson, then "lesson or
remediation follow-up" (D-017), now "lesson, investigation step, or remediation follow-up". Each widening was made
because a new legitimate route existed, and each is recorded at the point it happened, so the rule's history reads as a
list of routes rather than a list of exceptions. The complementary check is that a boss may never re-use a question a
lesson already asks: sharing one would make the case a review round in costume and would double-count its practice.
(S2-10)

**D-030 — Every skill declares its stage, and the field has no default.**
`STAGE2_RECONSTRUCTION_SCOPE.md` §10 makes "a new skill has no stage classification" a closure failure, and S2-11 adds
eighteen skills at once — so the field arrives with them rather than being retrofitted across forty-one later. It is
required with **no default**, which is the whole decision: a default would satisfy the rule's letter and defeat its
purpose, because every new skill would then classify itself correctly-looking and silently. Stage 1 marks the six
skills inherited from the baseline; Stage 2 marks everything this stage wrote. The field also makes a second closure
guard checkable — "a Stage 3 topic appears before Stage 3 begins" is now a comparison rather than a judgement. (S2-11)

**D-031 — A prerequisite graph is only real where the unlock rule reads it.**
Region 2's modules declared prerequisites and the region still opened six doors at once, because `isLessonUnlocked`
reads *lesson* prerequisites and nothing else. A module-level graph that no rule consults is documentation with the
shape of a constraint. The fix is the convention Region 1 already used: a module's first lesson depends on the last
lesson of every module that module depends on, so the module graph is expressed in the currency the engine spends. What
found it was an audit that computed availability **through the real unlock rule** instead of reading the JSON it had
just been given — a check that asserted the declared prerequisites matched the file would have passed on the bug. (S2-11)

**D-032 — The laboratory's gate belongs to the curriculum.**
The descriptive bench is a free tool, not a lesson, so it has no place in the module graph — but "free" is not the same
as "always". Handing a learner a bare instrument before they have met a summary is a blank table, not freedom. The gate
is therefore declared in the curriculum (`laboratoryUnlock`) and enforced by a pure predicate, rather than hard-coded
in `LabScreen` where no audit looks. A curriculum that declares no gate leaves the bench open, so the mechanism can
never seal it by accident — the failure mode of a gate is a locked door nobody meant to lock. (S2-11)

**D-033 — A question outlives the lesson it was written for; a lesson does not outlive its questions.**
Re-cutting the two Stage 1 centre lessons to scope §5 meant accounting for every question they asked, and most of what
they asked taught percentages, bar charts or data literacy rather than the mean and the median. Three options existed.
Delete the strays: that removes playable content to make a cycle close. Keep them and declare the lessons Complete
anyway: that files a scatterplot question under a lesson about the mean, and §5's "every question has a role" becomes a
formality satisfied by lying about the role. Or move each question to the lesson whose topic it actually serves, which
is what happened — ten of the fourteen had such a lesson already written. The rule this settles: **a lesson's question
list is decided by what the lesson teaches, never by which lesson happened to hold the question first.** Its corollary
is that redistribution is design work with consequences for the receiving lessons — a moved question has to carry a
skill the new lesson teaches, or answering it schedules nothing — and it is why the two re-cuts were deferred a cycle
rather than done as a formatting pass. (S2-12)

**D-034 — Content with no lesson to live in yet is staged, declared and audited, never parked.**
Four inherited questions had no Region 2 lesson to move to: their topics belong to modules S2-14 will write. Parking
them in those modules' seeded skeletons is the obvious thing to do and was, on the first attempt, done silently — which
broke the skeleton-honesty guard, correctly, because a skeleton that accumulates content is a lesson no structure audit
inspects. The resolution is not to weaken that guard but to make the exemption **declared**:
`tests/helpers/staged-inherited.ts` names every staged question and the lesson holding it, and
`tests/audit/region2-architecture.test.ts` checks both directions — an undeclared question in a skeleton fails, and a
declaration naming a question the lesson does not ask fails. Staging cannot be used to hide new authorship (a staged
question must carry only Stage 1 skills), cannot double-home a question, cannot grow, and cannot survive its lesson
being declared Complete. What it does **not** buy is a quality exemption: a staged question is still held to an
accessible description and a real explanation, because a learner meets it today. Only the lesson-level structure around
it is deferred. (S2-12)

**D-035 — A demonstration has to state the number its own formula produces.**
`dem.r2-choosing-measures` shipped Complete in the previous cycle describing "the mean value across all ten buildings",
with a prediction that opened "nine cottages at 40 coins and a house at 4000 give a mean of 436 coins". Its formula
computed `(40 / 100) x 4000`, so the panel read 1600.00. Every existing check passed: the controls moved the readout,
the prediction had a correct option, the prose was well written and internally consistent. The divergence was invisible
because nothing compared the author's arithmetic to the model's. The new check is small and mechanical — the readout at
the initial control settings must appear in the prediction prompt, the accessible description or the observation — and
it does two jobs at once. It forces the author to run the demonstration, and it means a learner who cannot see the panel
is still told the starting state the prediction asks them to reason from. Applying it found the one defect and improved
two Region 1 demonstrations that had never said what their readout began at. The demonstration itself was rebuilt on
`quotient`, which computes the mean the lesson is about; the previous formula was the closest available, and prose was
written to describe what was wanted rather than what was there. (S2-12)

**D-036 — An objective is a promise the lesson's own questions have to keep.**
Requirement 17 checked that every question a lesson asks carries a skill the lesson teaches. The reverse — that every
skill the lesson *claims* is practised by a question the lesson asks — was checked only against the whole repository, so
it stayed true however the lessons were shuffled. That gap is exactly what the redistribution walked into:
`l.reading-tallies` declared `obj.read-data` because it used to ask the data-literacy questions, and after they moved
the objective was a claim nothing in the lesson supported. A probe leaving a stale objective behind failed nothing. It
now fails one check. The learner-facing cost is what makes it worth a guard rather than a convention: a lesson that
promises "you will learn to read data" and then asks eight questions about the mean has told them something untrue, and
their mastery of the promised skill never moves. (S2-12)

**D-037 — A lesson is not finished until something has played it.**
Nine Region 2 lessons were declared Complete across three cycles, each surviving all 18 structure checks, and not one had
ever been driven through the session engine. Region 1 has had per-module playthroughs since S2-08; Region 2 had nothing,
because the audits were written first and read like coverage. They are not: every check in
`tests/audit/lesson-structure.test.ts` reads the content, and a lesson that cannot be finished is the first failure a
learner meets. `tests/integration/region2-lessons.test.ts` closes it, and iterates `COMPLETE_LESSONS` rather than naming
lessons, so the next lesson S2-13 writes is covered without the file being edited. (S2-12)

**D-038 — A playthrough proves round-tripping, not arithmetic, and the distinction has to be written down.**
The playthrough above was probed with a Complete lesson whose mastery answer was changed to a wrong number. **Nothing
failed.** `correctResponseFor` builds each response from the question's own declared answer, so changing the answer
changes the response too and the pair still agrees. What the playthrough genuinely proves is that content round-trips
through the real evaluator, session and save: the session terminates and completes, each declared answer survives
normalization, every claimed skill gains an attempt and a review entry, and the misconception surfaces with its
remediation. It caught a teach-back forbidding a word it also required — a defect no other check sees. What it cannot
see is an answer that is simply wrong about the mathematics. Authored questions have no independent derivation to check
against; that is precisely what D-020's family-stated `expectedResponse` buys generated ones, and the asymmetry is now
recorded in the test's own header rather than left for the next author to discover by trusting it too far. The first
draft of that header claimed the stronger guarantee, and the probe is the only reason it does not ship. (S2-12)

**D-039 — A guard that names its characters must name their lookalikes too.**
`q.range-tides` shipped from the Stage 1 baseline writing "3.4 − 1.2 = 2.2" with U+2212, the Unicode minus sign. Every
lesson in its chain explains ASCII `-`; no lesson explains U+2212; and the beginner-safety check saw nothing, because
its operator class listed `-` and not `−`. A guard written as a character list is only as good as the list, and a
learner-facing string can bypass it with a keystroke that looks identical on screen. The class now includes U+2212 and
the two division slashes, and the content was normalised to the form the curriculum teaches — the same resolution as
`×` versus `x` in S2-12, and for the same reason: two characters for one operation is worse teaching than either alone.
En and em dashes are deliberately still excluded, on the reasoning already recorded for `=` and `:` — 278 of them in
this repository are prose. The paired probe is what proves the widening does the work: identical content fails one check
with the wider class and none with the old one. (S2-13)

**D-040 — "Unreachable" is a claim about the unlock rule, and has to be checked against it.**
S2-12 cycle 4 reported that `l.r2-outliers` and `l.r2-skew` were "finished but not yet reachable by a learner", and the
handoff told the next unit to write variance and standard deviation first so that the region would not have "a finished
module a learner cannot enter". **Both statements were wrong.** Driving a save through `isLessonUnlocked` shows the whole
chain from `l.spread-1` to `l.r2-outliers` unlocking today: a seeded lesson holds a real, answerable question, so it can
be completed, so it opens the next one. Nothing was ever closed. What is true is narrower and less dramatic — those two
lessons sit behind six lessons that are still stubs, so a learner reaches them through six rounds of one question each.
The correction changes the work: S2-13's job is not to unblock a gate but to replace stubs, and the order that does most
for a learner is plain module order from the module's entry lesson, not the order that finishes a module soonest.
The lesson for the next unit is the general one: reachability is computed by a rule in `src/core`, so a claim about it
is checkable in about fifteen lines, and asserting it from the shape of the graph is guessing. (S2-13)
