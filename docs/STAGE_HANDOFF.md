# STAGE_HANDOFF.md — reconstruction handoff

**Supersedes the Stage 1 → Stage 2 handoff.** The original is preserved verbatim in git history at commit `7add4bc`
(`git show 7add4bc:docs/STAGE_HANDOFF.md`). Its still-binding contracts, traps, and priorities are carried forward
below — nothing was discarded.

**Last updated:** 2026-08-07, at the close of S2-12 cycle 2 (**Partial**).

---

## 1. Where this project stands

This repository is a **reconstruction**. The predecessor was developed in an ephemeral environment and everything
after Stage 1 was lost because commits were never pushed to a durable remote. Read
`RECONSTRUCTION_CONTEXT.md` before anything else.

- **Stage 1: surviving, verified, green.** Not re-created — the original commit `7add4bc` was carried forward from the
  archive's own `.git` directory, with authorship intact.
- **Stage 2: in progress, and not recoverable.** Reconstruction began 2026-08-04; S2-01 through S2-08, S2-10 and S2-11 are complete and S2-12 is **Partial** (all 9 lessons Complete, editable datasets deferred to S2-15) and S2-13 is **Partial** (all 6 lessons Complete, distribution comparison deferred to S2-14) and S2-14 is **Partial** (cycle 4, `74b091e`, remote-verified); S2-09 is **Partial**, and only because §4 is stated over all 22 topics — every Region 1 topic meets it. Nothing
  in it is recovered source.
- **Stages 3–6: not started, and not recoverable.** They must be **reconstructed** from the surviving Stage 1 source,
  the specifications, and the known defect history. They may never be described as recovered source, and no metric may
  be recalled from prior reports — every count must be measured from this repository.

## 2. Exact state at handoff

| Fact | Value |
|---|---|
| Remote | `https://github.com/Mohammadzamanid/gamified-statistical-learning` — **currently public**; private was requested (unit R-00e, blocked) |
| Default branch | `main` |
| Pristine Stage 1 import | `7add4bc` — pushed and remote-verified |
| Baseline docs + CI | `1b0a5dd` — pushed and remote-verified |
| Last unit completed | **S2-21** — the Stage 2 closure audit. **Stage 2 is closed**; see `docs/STAGE2_CLOSURE.md` |
| Head of `main` | read it live: `git rev-parse HEAD` vs `git ls-remote origin refs/heads/main` — these must match |
| Milestone snapshot commit | `d4e250434c465f85e4307a226a9af2cbc9788c17` — the commit the exports were built from |
| Stage tags | `stage-1-baseline` and `stage-2-complete` — **both created locally, NEITHER on GitHub** (HTTP 403 on `refs/tags/*`; unit R-00d, blocked). Both are preserved in the exported bundle |
| Milestone exports | `../gsl-exports/` — source ZIP + git bundle + manifest + SHA-256 checksums |
| Working tree | clean |
| Node / npm used | v22.22.2 / 10.9.7 |
| Test suite | **707 tests / 49 files**, all passing, plus 36 accessibility checks (Stage 1 baseline was 73 / 14) |
| Build | passing (**873.56 kB, 224.47 kB gzip**; baseline was 285.73 kB / 83.82 kB) |
| Source modified since baseline | S2-01 … S2-08 — achievements + region completion, three new interactions, the enforced interaction audit, the review queue, the Region 1 topic architecture, and all 17 Region 1 lessons |
| Curriculum | 2 regions · **10 modules** · **40 lessons** · **42 skills** · **290 questions** (baseline 2/2/3/6/14) |
| Lessons Complete to scope §5 | **40** — all 17 Region 1 topic lessons, all 20 Region 2 lessons, and the 3 Stage 1 lessons re-cut into Region 2. **No skeletons in either region** |
| Misconceptions / remediations | **40 / 39** (baseline 8 / 7) — every one reachable, and each held to the nine declared parts (D-056) |
| Validated generated interactions | **12,889**, available to spaced review (baseline 0) |
| Topics meeting scope §4 | **41 of 41** — every topic in the curriculum (S2-17, four cycles). Smallest topic 120 interactions against a floor of 100 |
| Save schema version | **4** (baseline was 1) — `1->2` adds `reviewSession`, `2->3` adds `investigationProgress`, `3->4` adds `savedExperiments`. The chain is asserted against this number (D-055) |
| Interaction types implemented | **14 of 17** (baseline 11); still stubbed: `formula-construction`, `simulation-prediction`, `confidence-rating` |
| Stage 2 | **in progress** — see `STAGE2_RECONSTRUCTION_SCOPE.md`, `STAGE2_RECONSTRUCTION_BACKLOG.md`, `STAGE2_CURRENT_WORK.md` |

Full measured baseline — content counts, interaction coverage, validation results — is in
`RECONSTRUCTION_CONTEXT.md` §4. Do not restate those numbers from memory; re-measure or cite that section.

### 2.1 One thing is deliberately unfinished

The `stage-1-baseline` tag exists locally and inside the exported git bundle, but **is not on GitHub**. The hosted
reconstruction session cannot write tags or releases: `git push` of `refs/tags/*` returns 403 while `refs/heads/*`
succeeds, and both the `git/tags`/`git/refs` and `releases` REST endpoints are refused by the session proxy. This is an
environment restriction, not a permissions problem — the commit the tag points at is on GitHub and verified.

Backlog unit **R-00d** tracks it. It needs the owner's own credentials:

```bash
git tag -a stage-1-baseline d4e250434c465f85e4307a226a9af2cbc9788c17 \
  -m "Verified surviving Stage 1 reconstruction baseline"
git push origin stage-1-baseline
git ls-remote --tags origin        # verify
```

If a future session finds tags still unpushable, do not silently skip tagging and do not claim it was done — record it
as blocked, exactly as R-00d does.

## 3. How to resume (read in this order)

```bash
git clone https://github.com/Mohammadzamanid/gamified-statistical-learning.git
cd gamified-statistical-learning
git status
git rev-parse HEAD
git ls-remote origin refs/heads/main | awk '{print $1}'   # must match
npm ci
npm test            # must stay green: 662/662
npm run typecheck && npm run lint
npm run dev         # renderer + electron dev
```

Then read:

1. `docs/RECONSTRUCTION_CONTEXT.md` — what happened and what is real
2. `docs/REMOTE_PERSISTENCE_POLICY.md` — **the rules; non-negotiable**
3. `docs/RECONSTRUCTION_BACKLOG.md` — pick exactly one unit
4. `docs/CURRENT_WORK_UNIT.md` — what was in flight
5. `docs/INTERACTION_AUDIT.md` — what each interaction type actually has, and 5 open findings
6. Surviving Stage 1 docs: `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `IMPLEMENTATION_STATUS.md`

**Do not restart the repository.** Build on what exists.

## 4. The one rule that matters most

The predecessor was lost to local-only commits. Therefore: **a work unit is not Complete until its commit is pushed
and `git rev-parse HEAD` is verified equal to `git ls-remote origin refs/heads/main`.** Record both hashes in the
backlog. Then stop — one unit per cycle. Destructive git operations (force push, hard reset, clean, history rewriting,
branch/tag deletion) are forbidden without explicit owner permission. See `REMOTE_PERSISTENCE_POLICY.md`.

## 5. Next unit

**Stage 2 is closed.** S2-01 through S2-21 are Complete, each with a commit pushed and a remote hash verified before
it was recorded. `docs/STAGE2_CLOSURE.md` is the measured record: totals computed from the repository, the closing
validation sweep, scope §10's twelve guards, and — as plainly as the rest — everything that is **not** closed.

**Stage 3 has no scope document yet.** Writing one is the first unit. `STAGE2_RECONSTRUCTION_SCOPE.md` is the model to
follow, and the two sections that earned their keep are §9 (a status vocabulary where **Partial** must name exactly
what is missing and may never count toward closure) and §10 (closure guards written as conditions a test must *fail*
on — which is what made them enforceable in S2-21 rather than aspirational).

**What Stage 3 inherits, and must not silently break.**

- **Two regions, both complete**: 40 lessons, 2 boss investigations, 309 authored questions, 210 generator families,
  12,889 validated generated interactions, 41 of 41 topics meeting scope §4.
- **Save schema version 5**, with a migration for every step from 1. Any shape change needs one, and D-055 checks the
  chain against the version rather than trusting the two to travel together.
- **Six declared-completeness lists**, each defended in both directions: `complete-lessons.ts`, `complete-topics.ts`,
  `complete-bosses.ts` (its "owing" list is empty and must stay accounted for), the nine misconception parts, the
  no-modals claim, and the backlog's own Complete rows.
- **Nine audit files plus the closure audit.** Adding a region, an interaction type or a chart kind means extending
  them; scope §10 guards 8, 9 and 3 exist to make forgetting fail loudly.
- **The laboratory's two conventions**: quartiles by median-of-halves (D-045), variance by the population denominator
  (D-060). Both are what the lessons teach and both are pinned to the lessons' own published figures.

**The three habits worth carrying, each of which cost a unit to learn.** They are written out at the end of
`STAGE2_CLOSURE.md` too, because that is the document a Stage 3 opener will read:

1. *A guard is not evidence until something has been broken in front of it* — D-063, D-068, D-070 were all guards that
   read correctly and could not fail.
2. *A test that reads its expectation through the code under test is not a test* — D-059, D-066.
3. *A completeness claim is a declared list defended by an audit, not a sentence in a document* — D-014.

**And the rule the whole reconstruction exists because of:** a unit is not Complete until its commit is pushed and
`git rev-parse HEAD` is verified equal to `git ls-remote origin refs/heads/main`. Since S2-21 that is machine-checked
— guard 11 reads every Complete row out of the backlog and fails if the hashes disagree, are missing, or were never
verified.

### Region 2's architecture, and two rules it added

Every skill now declares a `stage`, required with no default (D-030) — Stage 1 for the six inherited from the baseline,
Stage 2 for everything this stage wrote. A default would have satisfied the closure rule while defeating it.

A module prerequisite graph gates nothing on its own: `isLessonUnlocked` reads **lesson** prerequisites, so a module's
first lesson must depend on the last lesson of every module that module depends on (D-031). Region 2 opened six doors
at once until an audit computed availability through the real unlock rule instead of reading the JSON.

The laboratory's gate is declared in the curriculum, not in `LabScreen` (D-032). A curriculum with no gate leaves the
bench open, so the mechanism cannot seal it by accident.

### Boss investigations, if you are adding or changing one

A boss is not a lesson (D-028). It gates its region — `isRegionCompleted` requires it, so a region achievement is not
awarded until the case is closed — it is resumed a stage at a time from `save.investigationProgress`, and it may only
ask about skills its own region teaches. It is **not** a second engine: a step is an ordinary `LessonSession` over that
step's questions, and only the record written on completion differs. Two engines would drift, and the untested one
would be the second.

Its questions belong to no lesson, which is why the orphan-reachability rule has a third route (D-029), and a boss may
never re-use a lesson's question. `tests/helpers/complete-bosses.ts` splits every region into "has one" and "owes one",
and the audit fails if a region is missing from both, appears in both, claims a boss it lacks, or quietly acquires one
while still listed as owing it. Since S2-18 the "owes one" list is **empty** — both regions have a case — so the next
region added to the curriculum has to land in one list or the other before the suite goes green again.

The trap that route created: because boss questions are in no lesson, every audit that filtered on "questions some
lesson lists" silently skipped them for eight units (D-062). Both files that need the wider set now build it the same
way, from lessons **and** investigation steps.

**What `parts.ts` learned the hard way, and what it costs to ignore.** Its first version let only the conversion family
use the topic's form, so four topics emitted *identical* questions and the near-duplicate gate collapsed three of them
to almost nothing — correctly. A generator module shared across topics must make every family speak in its own topic's
terms, or the topics are one topic. And keep an eye on the parameter grid: the application family had a seven-value
totals list that pushed one reasoning shape to 49% of the topic, a whisker under the 50% ceiling.

### How the machinery works, and the one thing that will bite

Run `npm run report:coverage` to regenerate both report forms. A topic is Complete under §4 when it has ≥100 validated
available interactions across ≥4 reasoning families, with no single reasoning *shape* above 50% and nothing
unreachable. Declaring it means adding its skill id to `tests/helpers/complete-topics.ts`, which
`tests/audit/content-coverage.test.ts` then enforces.

**A misconception goes where its detector can fire, not where its subject fits (D-025).** This was written down at the
end of cycle 3 and broken in the first module of cycle 4 — `mc.digits-mean-numerical` tagged on a multiple-choice
distractor when its detector is `placement-mapping`. It read perfectly. Only the check caught it, which is the argument
for the check. `misconceptionIds` is not a
topic tag — the engine runs each misconception's named detector, so a declaration the detector cannot recognise is
inert: it inflates a mapping count and the learner still gets a bare "incorrect". `known-wrong-answer` needs a tagged
distractor, so it belongs on multiple-choice; `point-geometry` is classified from placement geometry, so it belongs on
point-placement via `misconceptionPoints` or `swappedAxesMisconceptionId`. Reading the tag back off the question could
never catch a mistake here, so the audit drives the **real evaluator and classifier** with the answer a holder of that
misconception would give and requires the engine to name it. When adding a generator that declares one, check the
misconception's `detector` field first.

**A zero in `invalidCombinations` is a question, not a result (D-026).** It means either the parameter grid never
reaches the cases the guards describe, or the guards are ornamental. Both were true of the first `ratios.ts`.

**Defect-class rejections must be zero (D-023).** `invalidCombinations` is a generator declaring a combination
unaskable — design, reported with a reason. `schemaFailures`, `answerFailures`, `missingAccessibility`,
`missingMisconceptionMapping` and `exactDuplicates` are the pipeline catching a broken generator, and
`tests/audit/content-coverage.test.ts` requires each to be 0. Fix the generator; do not relax the check. A probe showed
a generator with 68 wrong answer keys clearing all three §4 bars before this existed, because the bad output was
dropped quietly and the topic had interactions to spare.

**`Candidate.expectedResponse` is mandatory and must be stated, never read back out of the question you built.** This
is the trap: deriving the "correct" response from `question.answer` and evaluating it against `question.answer` cannot
fail, for any answer kind. A probe deleting the whole answer check failed no test until this was fixed. Where a second
independent computation exists, supply one — each arithmetic operation carries a `applyIndependently` that works the
sum out a different way, so a typo in either route makes them disagree.

Three fingerprints do three different jobs, and merging them breaks everything:
`exactFingerprint` (same question twice — a bug), `nearDuplicateFingerprint` (same numbers, renamed scenery —
rejected), and `reasoningShape` (task with particulars stripped — *reported*, never rejected). Collapsing near-duplicate
onto shape reduced 800 valid combinations to 9 on the first attempt. All three must cover **every field the learner
reads** (D-024): `exactFingerprint` omitted `items`, so ordering families — one fixed prompt, six permutations of three
items — collapsed onto six questions and the rest were thrown away as duplicates. Restoring it recovered questions in
every topic.

### Region 1's two deliberate exceptions

`l.reading-tallies` and `l.middle-harbor` sit inside the Region 1 container but are **not** Complete. They teach
tallies and centre, which the Stage 2 scope places in **Region 2**, so re-cutting them is **S2-11**. A check in
`tests/audit/region1-architecture.test.ts` asserts they are the *only* two un-Complete lessons in Region 1, so the
exception cannot grow quietly.

Do **not** start S2-10 in the same cycle as S2-09.

### Open findings from the interaction audit

Recorded in `docs/INTERACTION_AUDIT.md` §3; each is owned by a later unit and none is fixed yet.

| Finding | Owner |
|---|---|
| F-1 `multiple-selection`, `ordering`, `matching`, `short-explanation` have no misconception mapping | S2-16 |
| F-2 in-progress interaction state is not persisted (steps, point, placement) | S2-19 |
| F-3 three types remain genuine stubs; `simulation-prediction` waits on the laboratory | S2-15 / later |
| F-4 `q.remed-mean-basic` is reachable only via remediation — by design | none |
| F-5 keyboard operability is structural, not browser-verified | S2-20 |
| F-6 `q.error-id-causation` declares `mc.correlation-causation`, which no option carries, so the engine can never report it. Measured against the real engine: 46 authored declarations, 45 reachable | S2-17 |

### Stage 1 known defects — current state

| # | Defect | State |
|---|---|---|
| 1 | Region-completed achievement trigger stubbed `false` | **Fixed in S2-01** |
| 2 | Six interaction types unimplemented | **Partly fixed** — `step-by-step-calculation` (S2-02), `point-placement` (S2-03) and `drag-and-drop` (S2-04) live; 3 remain |
| 3 | Laboratory simulations are placeholders | **Placeholders removed in S2-15**, and the descriptive bench is a real learning environment. The *simulation* instruments the Stage 1 card advertised — sampling distributions, a CLT explorer — remain unbuilt **by design**: scope §3 excludes them from Stage 2 and assigns them to Stages 3–6. Nothing on screen now claims them |
| 4 | Only one world of content | **Both regions authored** — 17 of 17 Region 1 topic lessons (S2-08) and all 20 Region 2 lessons (S2-12 … S2-14), each held to scope §5's 18 structure checks. Region 2's §4 interaction counts (S2-17) and its boss (S2-18) are both **done**; every topic meets §4 and both regions have a case |
| 5 | Cosmetic `MODULE_TYPELESS_PACKAGE_JSON` lint warning | Open by choice (D-002) |

## 6. Contracts you must not break

Carried forward from Stage 1 and still binding:

- **`SAVE_SCHEMA_VERSION` + `MIGRATIONS`** — any save-shape change requires a migration in
  `src/core/persistence/migrations.ts` plus round-trip tests.
- **Preload API surface (`window.statlas`)** — additive changes only.
- **Content JSON schemas** — additive; removals require a content-migration note in `DECISIONS.md`.
- **Accessibility invariants** — keyboard reachability, ARIA on custom widgets, never colour-only signalling.
- **Honest interaction registry (D-005)** — unimplemented types stay `implemented: false` and the renderer shows a
  plain "not yet available" notice. Never fake an interaction.
- **Honest status reporting (D-008, pillar 2)** — never claim an untested platform. `IMPLEMENTATION_STATUS.md` must
  stay truthful after every stage.

## 7. Remaining Stage 2 priorities from the original handoff

Preserved for continuity; now decomposed into units S2-01 … S2-17 in `RECONSTRUCTION_BACKLOG.md`.

1. Wire region-completed achievement trigger → **S2-01**
2. Implement interaction types by pedagogy value: `step-by-step-calculation`, `point-placement`, `drag-and-drop`
   → **S2-02 … S2-04**
3. Content breadth: World 2 (spread & shape — variance, sd, outliers, skew), every addition gated by
   `npm run test:content` → **S2-09**
4. Lab simulations: sampling-distribution / CLT explorer, kept driven by `src/core/statistics` → **S2-11**
5. Review mode: "Due today" flow surfacing scheduler `dueItems` → **S2-13**
6. Windows validation on a real Windows machine → **X-02 (Blocked — needs the owner's hardware)**

## 8. Known traps

From Stage 1, confirmed still relevant:

- `/bin/sh` is dash in the dev container — use bash heredocs.
- Electron headless needs `--no-sandbox` + xvfb; dbus/GPU errors are cosmetic.
- Vitest and Electron tsconfigs are separate — run **both** typechecks (`npm run typecheck` does this).
- `eslint.config.js` emits a cosmetic `MODULE_TYPELESS_PACKAGE_JSON` warning. Adding `"type": "module"` would force an
  ESM migration of the electron build — deferred deliberately (D-002). Do not "fix" it casually.

Added during reconstruction:

- **`test:a11y` exists as of S2-20** and runs in CI. It is a *separate* vitest config
  (`vitest.a11y.config.ts`, jsdom, `tests/a11y/**/*.test.tsx`) because the other suite runs in `node` on a pure core.
  It sees roles, accessible names, live regions, tab order and keyboard operation; it does **not** see contrast,
  layout or paint, and anything needing those stays GUI review.
- **Windows cannot be validated here.** Reconstruction runs on Linux. `package:win` is configured but never compiled.
  A green CI build proves buildability only, never that the GUI was manually exercised (unit X-02, Blocked).
- `npm ci` reports 21 dependency advisories in the `electron-builder` toolchain. Left untouched on purpose so the
  recorded baseline equals the surviving artifact; tracked as unit R-01.
