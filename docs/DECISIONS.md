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

**D-041 — A scope criterion with nowhere in the curriculum to live is a structural gap, and gets a seed before it gets a lesson.**
"Distribution comparison" is named in S2-13's acceptance criteria and again in the boss's stage 5, and Region 2 had no
lesson, no topic and no skill for it. That is worse than an unwritten lesson: the criterion could never be met by
finishing existing work, and D-028 forbids the boss from asking about a skill no Region 2 lesson teaches, so the stage
the boss spec already promises could not legally have been built. S2-13 therefore adds the skill, the objective, the
declared topic and a seeded lesson — and **does not write it**, because it belongs at the end of `m.r2-judgement`,
behind the graph and shape lessons it draws on, and writing it ahead of them would repeat exactly the ordering mistake
D-040 records. The criterion is reported **unmet**, with the lesson now existing to be written and S2-14 named as its
owner. The general rule: when a criterion has no home, create the home in the declared lists — where the audits can see
it in both directions — rather than either writing the lesson out of order or letting the criterion lapse by going
unmentioned. (S2-13)

**D-042 — When the teaching sequence needs an operation the model lacks, grow the model rather than narrate around it.**
The scope's instruction for the standard-deviation lesson is a sequence: distances, then squared distances, then their
average, then the square root. `DemonstrationFormulaSchema` had no square root, so the demonstration could only have
shown something else while the prose described the step — which is precisely the divergence D-035 exists to catch, and
this time it would have been designed in rather than slipped in. `"square-root"` was added instead, with arity 1 like
`negate`. Two things made it cheap and safe. The readout switch in `src/core/curriculum/demonstration.ts` is exhaustive
over the enum, so the compiler located the second half of the change the moment the first half landed. And the schema
already had a precedent for constraining a control's range to a formula's domain — the divide-by-zero guard — so the
root got the matching one: a control feeding a square root may not reach below zero, because a setting with no answer
is a defect in the content rather than something the panel should discover at run time and render as NaN. Growing a
closed enum is the expensive-looking option that turned out to cost four lines and a guard. (S2-13)

**D-043 — A schema that accepts more than the renderer draws is a promise the build does not keep.**
`VisualSpecSchema` accepted eight visual kinds and `QuestionScreen` drew exactly one. A question declaring `histogram`
or `box-plot` would have passed every check in the repository and then rendered **nothing** — no chart, and no text
either, because the accessible description is carried by the chart component, so a screen-reader user would not even
have been told a picture was missing. The learner would have met a prompt referring to a graph that was not there.
Nothing had shipped in that state only because no content had used those kinds yet, and S2-14's graph lessons are the
first work that walks straight into it. The fix is the device `rendered-interactions.ts` already used for interactions
(D-005): a declared list of what the screen can actually draw, consulted by the screen and defended by an audit that
fails when shipped content names a kind that is not on it. So a lesson cannot outrun the renderer silently — it fails
loudly, and the fix is to write the renderer. `histogram` joined the list this cycle by being built; `dot-plot`,
`box-plot`, `scatter`, `table` and `image` are still only schema. (S2-14)

**D-044 — Binning is arithmetic behind a taught picture, so it is tested directly.**
`l.r2-histograms` states exact bin contents in its questions and again in the chart's accessible description — six
soundings between 6 and 10 metres, and so on. Those claims are true only if the renderer bins the way the content says
it does, and nothing about an SVG makes that checkable. `buildBins` is therefore exported and tested against the
shipped dataset, in the same spirit as D-001 keeping the demonstration readout out of React: a number a learner reads
is content, and content is checked. The test earns its place immediately — a probe adding one sounding to the dataset
fails it by name, which is exactly the drift that would otherwise leave a lesson confidently wrong about its own
picture. (S2-14)

**D-045 — One taught number, one convention, and the bench must agree with the lesson.**
`src/core/statistics` computed quartiles by R-7 linear interpolation, matching NumPy and spreadsheets.
`l.r2-quartiles` teaches the median-of-halves rule. They disagree on **every dataset the shipped lessons use** — for
the eight readings the guided question works through, the lesson computes Q1 = 4.5 and the core returns 4.75; the IQR
lesson's twelve readings give 12.5 against 11.25. That was not latent: `LabScreen` reported the interpolated figures,
so a learner who had just been taught to compute Q1 by hand could type the same data into the descriptive bench and be
told a different answer, with nothing on screen to say why. A bench that contradicts the lesson a learner has just
finished is worse than no bench.

Neither convention is a bug and both are worth having, so the fix is to name them and choose per surface.
`quartilesByHalves`, `interquartileRangeByHalves` and `fiveNumberSummary` implement the taught rule and are what the
laboratory reports and the box plot draws; `quartiles` keeps the interpolated rule for agreement with the tools a
learner meets outside. `tests/unit/quartile-conventions.test.ts` pins both, including an assertion that they **differ**
on the lessons' own data — so neither can be quietly "fixed" into the other, which is exactly how one surface would
drift back into contradicting another. The box plot then takes all five of its numbers from one call rather than
computing the pieces separately, because a chart drawing its median from one rule and its hinges from another is the
same defect one component further down. (S2-14)

**D-046 — A component that needs two columns must be given them, not left to guess.**
Every chart built before the scatterplot reads *the first* numeric column of its dataset and ignores the rest, which
is correct when a picture summarises one variable. The scatterplot is the first that needs two, and the tempting
implementation — take the first numeric column, then the next, falling back to the first again — fails silently and
spectacularly: a one-variable dataset plots against itself and draws a flawless diagonal that no reader could tell from
a real finding. In a lesson whose whole subject is reading a relationship out of a cloud of points, that is the worst
available failure. `numericPair` therefore returns null rather than a fallback, the component renders its accessible
description in words instead of a misleading picture, and a unit test pins the refusal so it cannot be "simplified"
into a fallback later.

The audit gained the matching content-side rule in the same cycle, after a probe pointing a scatter question at a
one-variable dataset failed **nothing**: a visual's dataset must be able to feed its chart kind, not merely exist.
That is D-043 one level further in — the schema promised kinds the renderer could not draw, and content could still
promise a chart the renderer could not draw *from that data*. (S2-14)

**D-047 — How a chart is drawn is content, and has to be sayable, settable and stated.**
`l.r2-misleading-graphs` teaches that two honest pictures of identical data can carry opposite impressions. Teaching
that from prose while the screen drew one untruncated chart would be describing something not on screen — D-035's rule,
one level out from the demonstration. So `VisualSpec` gained the two presentation choices the lesson criticises:
`axisMin` for a bar chart's baseline and `binWidth` for a histogram's intervals. Each is meaningless on the other
kinds, which the schema rejects rather than silently ignoring.

Making them settable was not enough, and a probe proved it: removing `axisMin` from the lesson's chart failed
**nothing**, while the prompt, the hints, the explanation and the accessible description all went on describing an axis
starting at 47. The check added in response runs both ways — a setting must be stated in the chart's words, because a
screen-reader user has only those words and the setting is exactly what changes the picture; and words claiming a
non-zero start must have the setting behind them. Its first draft flagged the *honest* chart, whose description says
"starting at zero", which is the pattern being too eager rather than the content being wrong; the fix was to make the
claim mean a start that is not zero. (S2-14)

**D-048 — A declared exemption is finished when it is empty, and finishing it means deleting it.**
`STAGED_INHERITED` was introduced in S2-12 to hold four inherited questions whose lessons did not exist yet, and its
own audit carried the clause `expect(STAGED_QUESTION_IDS.length, "STAGED_INHERITED is empty — delete the staging
mechanism").toBeGreaterThan(0)` plus a ceiling that was tightened at each clearance: 4, then 2, then 1. S2-14 cycle 4
gave the last staged question a role, and the mechanism was deleted — helper, audit block and all — rather than left as
scaffolding that passes vacuously. The skeleton-honesty rule went back to the single line it was before the exemption
existed. That the exemption specified its own end condition, and that the end condition fired, is the part worth
keeping: a temporary rule with no defined exit becomes permanent by default. (S2-14)

**D-049 — A number a learner is judged by must be stated in the words beside it.**
Two probes in S2-14 cycle 5 failed nothing, and both were the same defect at different addresses. Changing a numeric
question's declared answer while its explanation went on working to the old figure broke no check: a learner would be
marked wrong and then shown working that ends somewhere else, in the one place they go to find out why. Changing a box
plot's accessible description so its median no longer matched the dataset broke no check either: for a reader who
cannot see the chart that description *is* the chart, so the drift ships two different pictures to two audiences.

Both are now audited. A numeric answer must appear in its own explanation, as digits or as the written word — all 143
numeric questions state theirs one way or the other today, several as "twelve crates" or "Exactly one of them", so
accepting both forms costs no exception list. A box plot's words must carry all five of its dataset's five-number
summary, computed by `fiveNumberSummary` so the convention settled in D-045 is not re-implemented in a test.

The first check's limit is written into it rather than left to be found: an answer swapped for another figure the same
explanation already quotes as an intermediate step still passes, which a paired probe confirmed. It catches drift away
from the prose, not drift within it. Recording that is the point — a guard whose reach is unstated gets trusted for
more than it does. (S2-14)

**D-050 — The laboratory's subject is what an edit moves, not what the numbers are.**
Stage 1's bench took a list and printed a table, which is a calculator: it answers a question a learner already knows
how to ask. Scope §7 asks for a learning environment instead, and the difference is not more statistics. Every edit on
the bench is now a logged event carrying the summary either side of it, and the bench reports **both halves** — what
moved and what held still. Adding one extreme reading drags the mean much harder than the median; sorting rearranges
the whole picture and changes no measure at all, so its log line reads "No measure changed" rather than nothing at all.
Those are the facts `l.r2-outliers`, `l.r2-skew` and `l.r2-choosing-measures` teach, and on the bench a learner does
them instead of reading them.

The same sentence is the accessible output: it goes to a live region verbatim, so a screen-reader user is told what
changed rather than told that a table exists (scope §6).

The outlier button offers a value derived from the readings on the bench — a further interquartile range past the
1.5-IQR fence `l.r2-outliers` teaches — and offers **nothing** when the middle half has zero width, because there the
fence rule is degenerate and any distance would be the bench's own invention. The first draft did invent one, out of
the maximum, and its own test caught it before it shipped. (S2-15)

**D-051 — Scope §7's centralisation rule is now a test, not a habit.**
"All statistical computation is centralised in `src/core/statistics`; important quantities are never recomputed inside
React components" has been true since Stage 1 and checked by nothing. A probe replacing the laboratory's mean with an
inline fold over the readings failed **no** test — a screen whose headline number came from somewhere other than the
engine the lessons grade with, and no guard between it and a release.

`tests/audit/core-purity.test.ts` enforces it in the shape the defect takes: no `.reduce(` in a view, since that is
what every hand-rolled sum, mean and variance is written as; no `Math.sqrt`/`Math.pow`, the signatures of a standard
deviation; and no *definition* of a symbol named after a measure the core owns. Importing one is the intended path and
is untouched. All three read zero across `src/renderer` today, so the audit pins current fact rather than aspiring to
it. With two quartile conventions deliberately in the codebase (D-045), a second implementation is exactly how one of
them quietly becomes three. (S2-15)

**D-052 — Two statistics were living in views, and the audit that should have caught them did not know their names.**
D-051 had just made scope §7's centralisation rule enforceable, and one cycle later the laboratory needed `buildBins`
to draw a histogram of its own readings — from the core, which cannot import a `.tsx`. `buildBins` was defined inside
`Histogram.tsx`, and `stackDots` inside `DotPlot.tsx`. Both are statistics: binning chooses the intervals a histogram's
whole argument turns on, and stacking is a frequency table wearing display clothes — it counted occurrences a second
time, next to a `frequencyTable` the core already had.

They moved to `src/core/statistics/binning.ts` rather than being copied; the components import them, the bench imports
them, and `stackDots` is now built on `frequencyTable`. The audit's banned-definition list gained both names, because
the reason it missed them is instructive: it knew the names `src/core/statistics` already owned, so a computation could
evade it simply by never having been centralised. A rule about centralisation that only recognises what is already
central will always have undeclared exceptions.

The general lesson, and the reason this is a decision rather than a tidy-up: **a guard written from an inventory
inherits that inventory's gaps.** The probe that found this was not a probe at all — it was the compiler refusing to let
core import a view. (S2-15)

**D-053 — A bench's chart description is a live claim, not a caption.**
A lesson's visual is fixed, so its accessible description can be authored once and checked against the dataset
(D-049). On the bench the picture changes under the learner's hands, so the description is regenerated from the current
readings on every edit and the two lesson-side rules are kept by construction: a box plot's words carry all five of its
numbers, and a histogram states the bin width that a finished histogram never shows (D-047).

The bench offers three of the five kinds that draw. A bar chart needs a name for each bar and a scatterplot a second
measurement per reading; the bench holds one column of numbers and has neither, so it names both exclusions and their
reasons on screen rather than presenting a control that produces a wrong picture — the refusal `numericPair` makes,
one level out (D-046).

Its comparison asks `l.r2-comparing-distributions`'s three questions separately and reports each on its own, so two
sets dragged to the same median are told they agree on centre and differ on spread, never that they are alike. Reading
the shape uses the same rule as `l.r2-skew` — a mean above the median is a tail on the high side — so the bench cannot
answer a question differently from the lesson that taught it. (S2-15)

**D-054 — A saved experiment keeps the readings and the picture, and deliberately not the trail.**
Scope §7's "save/reload experiments" makes the laboratory shelf part of the save file, so it is a schema change with a
migration behind it — `SAVE_SCHEMA_VERSION` 3 → 4, the same path S2-06 took for the review queue. A shelf entry carries
the readings, the title, the chart kind and the bin width, because an experiment that came back drawn as a different
picture would have lost half of what was being explored.

It does **not** carry the edit log. The log is the trail of one sitting at the bench (D-050); a reloaded experiment has
not had those edits made to it, and presenting them as what just changed would be a lie about the readings in front of
the learner. The bench says so when it loads one.

The shelf is bounded at `LABORATORY_SHELF_LIMIT`, and a full shelf is **refused with the limit named** rather than
silently rotated. The learner chose to keep every one of those; a save file that grows without limit is a persistence
defect wearing a feature's clothes.

The export is plain text — every measure, the readings in full, and the chart's description, because words are the only
form of the picture that survives a paste. It names the quartile convention that produced its numbers: two conventions
live here on purpose (D-045), and a summary that travels without saying which one is unreadable by anyone checking it
against a spreadsheet. (S2-15)

**D-055 — The migration chain is checked against the schema version, not trusted to accompany it.**
Two probes in cycle 3 failed nothing, and both pointed at the same missing invariant. Setting `SAVE_SCHEMA_VERSION`
back to 3 while `savedExperiments` remained in the schema broke no test, because Zod's `.default([])` filled the field
in — the version bump and its migration were, for this field, not load-bearing at all. The pairing of "schema change"
and "migration" was a contract in prose (§6) and a habit in practice, with nothing between it and a save-corrupting
omission on the first field that has no sensible default.

`tests/integration/persistence.test.ts` now asserts that the registered migrations are exactly the steps 1 …
`SAVE_SCHEMA_VERSION - 1` — no gaps and nothing beyond. It fails in both directions: a version bumped without a
migration, and a migration left behind after the version was rolled back.

The other zero-fail probe was a weak test rather than a missing one. "Does not share arrays with the shelf entry"
checked that adding a reading left the entry unchanged, which passes either way because every bench operation
allocates. It now asserts identity. **A test that names a property without checking it is worse than no test**: it
occupies the space where the real check would have gone. (S2-15)

**D-056 — The nine parts of a misconception are declared, because the original list did not survive.**
S2-16's criterion reads "each remediation with all 9 required parts". The number is in the backlog cell; **the list is
in no surviving document** — it went with the original specification. Inventing one and presenting it as recovered
would be exactly the fabrication this reconstruction forbids, and ignoring the criterion would be worse.

So the nine are declared in `tests/audit/misconception-library.test.ts` as `REQUIRED_PARTS`, marked in the file as a
reconstruction, and each is checked. Five belong to the misconception — a name, a description of the learner's
reasoning, a registered detector, the remediation it names, a trigger a learner can reach — and four to the
remediation: an immediate explanation, a micro-lesson, a follow-up question, and the skills it reinforces. The test of
whether a "part" is real is that the running app consumes it: the session engine injects the follow-up, mastery and
the review queue are keyed by the skills, the panel shows the explanation. A field nothing reads would be paperwork.

The count itself is asserted, so a future revision has to change the number deliberately rather than let the list
drift. (S2-16)

**D-057 — A tag that cannot be triggered is a tag that inflates a count.**
The unit also asks for reverse validation. Three of its rules — no undeclared distractor misconceptions, no orphaned
remediations, no dangling detector names — were already enforced in `tests/audit/interaction-audit.test.ts` and are
deliberately not duplicated. The fourth was not enforced anywhere: a question can list a misconception in
`misconceptionIds` while offering the learner no way to express it, and the declaration still counts everywhere
declarations are counted.

It is now checked by construction rather than by inspection. `tests/helpers/misconception-triggers.ts` builds the
wrong answer each declaration implies — a tagged distractor, a declared wrong point or placement, a step value, a
`wrongValue` from the merged parameters, or, for the detectors that recognise a wrong answer by its relationship to
the right one, that arithmetic applied to the expected value — and the audit puts it through the **real** pipeline,
requiring the engine to name that misconception and hand back its remediation.

It found one: `q.boss.r1-variable` declared `mc.constant-counted-as-variable` with neither distractor tagged, so a
learner picking either wrong column got no diagnosis at all. Both distractors say the same thing — that a column
reading "Kirkwall" on every row could still tell two days apart — and both are tagged now.

**The check's limit is written into the file.** It proves a declaration is expressible and diagnosable; it cannot
prove the declared wrong answer is the one a confused learner would give. A probe moving a `wrongValue` a thousand
away from the question's own numbers failed nothing and should have: the trigger is derived from the same parameter
the detector reads, so the machinery stays self-consistent while the content stops making sense. No heuristic was
added, because one guessing at plausibility would fire on legitimate content — the failure the truncated-axis pattern
already demonstrated (D-047). (S2-16)

**D-058 — One corpus, three topics: a frequency, a proportion and a percentage are three readings of the same tally.**
Region 2's counts module is the first to get generators, and it comes first because its three topics share their
material entirely. Twelve calm mornings out of twenty is a frequency of 12, a proportion of 0.6 and a percentage of
60%; what separates the topics is what the question asks for, not what it is about. So `counts.ts` carries one corpus
of season logs and each topic reads it its own way — which is also the misconception the module teaches against, so
the traps are shared: a proportion reported as a percentage, and a percentage left as a decimal.

This is deliberately *not* Region 1's `parts.ts`, which asks the same three conversions about a quantity stated in the
prompt ("15 of 60 crates were damaged"). Here the count comes from tallying cases, which is the Region 2 framing and
the reason these questions sit after data literacy rather than before it. Different topic ids, different skills,
different corpus.

Three defects surfaced in one run of the validator, and each was found by a check that exists because an earlier unit
was wrong about something:

 - **24 answer failures** in the chart family: it stated a numeric response for a question that publishes a choice.
   `expectedResponse` is stated by the family and never read back out of the question (D-020), which is the only
   reason a mismatch can be seen at all.
 - **9 exact duplicates** in the application family: it computed the share from the log instead of stating it, so the
   proportion and percentage versions built the identical question. A family that produces the same question for two
   topics is not really about either.
 - **A diagnosis firing on a correct answer**: the error-identification family tagged its *correct* option with the
   misconception. The learner holding it agrees with the clerk, so the tag belongs on the option that says the clerk
   was right. (S2-16's D-057 rule is the mirror of this one, and this is the case that rule cannot catch — the tag was
   triggerable, it was just on the wrong side.)

A fourth was a content ambiguity rather than a bug: where two categories share a column height, "which column is the
frequency of X" offers two identical options. Those candidates are now invalid with that reason, which is what the
raw-versus-valid distinction in scope §4 is for. (S2-17)

**D-059 — Two routes to an answer prove agreement, not correctness. Pin one of them to a hand-worked number.**
Every generator family states its `expectedResponse` separately from the answer its question publishes, and the
validator rejects the candidate when the two disagree (D-020). The centre module took that seriously — a mean by
summing and dividing against a running average, a median by sorting and indexing against peeling the extremes — and
two probes then showed what the arrangement does *not* cover.

Replacing the independent route with the answer key made the two agree trivially and failed **no** test. Breaking
`medianOf` so it never sorted also failed no test, for a subtler reason: the disagreement turned its candidates into
*invalid* ones rather than answer failures, and the topic still cleared 100 interactions on its other four families.
A rejection path can swallow the very disagreement it exists to report.

`tests/unit/centre-generators.test.ts` closes both by pinning the corpus's means, medians and modes to values worked
out by hand, and by asserting the two routes agree across every list in one named place rather than only per
candidate. The unsorted-median probe now fails.

**The first probe still fails nothing, and that is stated rather than fixed.** Whether two code paths are genuinely
independent is a property of how they were written; a test cannot see it. What the independence was protecting is
that both are right, and that is now checked directly. (S2-17)

**D-060 — The laboratory reported the sample variance while the lessons taught the population one.**
`l.r2-variance` teaches the variance as *the average of the squared distances* and publishes the figures that follow
from it: 3, 5, 9, 11 has a variance of 10; 4, 6, 8, 10, 12 has 8. Those are the population denominator. The bench
built in S2-15 called `variance(values)`, whose default is the **sample** form, and reported 13.33 and 10 for the same
lists — so a learner who worked the lesson's own rule on their own readings and checked the bench found a different
number every time.

This is D-045 exactly, in a second measure, and found the same way: by writing generators for the spread topics and
having to decide which convention they answer by. Scope §7 is explicit that the population-versus-sample choice must
be documented and used consistently across lessons and the laboratory, and it was not.

The bench now reports the taught convention, its labels say "Variance" rather than "Sample variance", and the export
names the denominator beside the quartile rule it already named. `variance(data, true)` keeps the sample form for
anything that wants it, exactly as `quartiles` (R-7) is kept beside `quartilesByHalves`. Two tests pin the bench to
the lesson's own published figures, and a probe reverting the bench to the sample form now fails three checks.

One consequence, taken deliberately: a single reading now reports a variance of **0** rather than being withheld.
Under the population definition that is the definition's own answer, not a stand-in for a missing one. (S2-17)
