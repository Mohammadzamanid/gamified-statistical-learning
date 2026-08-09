# STAGE_HANDOFF.md — reconstruction handoff

**Supersedes the Stage 1 → Stage 2 handoff.** The original is preserved verbatim in git history at commit `7add4bc`
(`git show 7add4bc:docs/STAGE_HANDOFF.md`). Its still-binding contracts, traps, and priorities are carried forward
below — nothing was discarded.

**Last updated:** 2026-08-07, at the close of S2-12 cycle 1 (**Partial**).

---

## 1. Where this project stands

This repository is a **reconstruction**. The predecessor was developed in an ephemeral environment and everything
after Stage 1 was lost because commits were never pushed to a durable remote. Read
`RECONSTRUCTION_CONTEXT.md` before anything else.

- **Stage 1: surviving, verified, green.** Not re-created — the original commit `7add4bc` was carried forward from the
  archive's own `.git` directory, with authorship intact.
- **Stage 2: in progress, and not recoverable.** Reconstruction began 2026-08-04; S2-01 through S2-08, S2-10 and S2-11 are complete and S2-12 is **Partial** (cycle 1, `8065791`, remote-verified); S2-09 is **Partial**, and only because §4 is stated over all 22 topics — every Region 1 topic meets it. Nothing
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
| Last unit completed | **S2-08** — Region 1 lessons and interactions, all 17 topic lessons (`629dd74`, `2f1ec31`, `def8b1d`, `615e7c4`; all remote-verified) |
| Head of `main` | read it live: `git rev-parse HEAD` vs `git ls-remote origin refs/heads/main` — these must match |
| Milestone snapshot commit | `d4e250434c465f85e4307a226a9af2cbc9788c17` — the commit the exports were built from |
| Stage tag | `stage-1-baseline` — **created locally, NOT on GitHub** (unit R-00d, blocked; see §2.1) |
| Milestone exports | `../gsl-exports/` — source ZIP + git bundle + manifest + SHA-256 checksums |
| Working tree | clean |
| Node / npm used | v22.22.2 / 10.9.7 |
| Test suite | **466 tests / 36 files**, all passing (Stage 1 baseline was 73 / 14) |
| Build | passing (**538.47 kB, 143.72 kB gzip**; baseline was 285.73 kB / 83.82 kB) |
| Source modified since baseline | S2-01 … S2-08 — achievements + region completion, three new interactions, the enforced interaction audit, the review queue, the Region 1 topic architecture, and all 17 Region 1 lessons |
| Curriculum | 2 regions · **6 modules** · **20 lessons** · **23 skills** · **145 questions** (baseline 2/2/3/6/14) |
| Lessons Complete to scope §5 | **17 of 17** Region 1 topic lessons. No skeletons. Two inherited Stage 1 lessons are deliberately excluded — see §5 |
| Misconceptions / remediations | **24 / 23** (baseline 8 / 7) |
| Validated generated interactions | **6,607**, available to spaced review (baseline 0) |
| Topics meeting scope §4 | **17 of 40** — every Region 1 topic. The denominator grew at S2-11 when Region 2's 18 topics were declared; their generators are S2-17 |
| Save schema version | **2** (baseline was 1) — migration `1 -> 2` adds `reviewSession` |
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
npm test            # must stay green: 403/403
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

**S2-12 continued — `m.r2-centre`.**

Cycle 1 finished `m.r2-counts`: frequency, proportion and percentage are Complete under §5. **6 of S2-12's 9 lessons
remain** — mean, median, mode and choosing a measure in `m.r2-centre`, then outlier and skew effects in
`m.r2-variation`.

**Two of the four in `m.r2-centre` are Stage 1 lessons, not seeds.** `l.reading-tallies` (mean) and `l.middle-harbor`
(median) carry real content and several questions already, so they are re-cut to §5 rather than written from scratch —
the skeleton shape does not apply to them and the architecture audit exempts them by name.

**Draggable/editable datasets are still not built.** The three finished demonstrations are control-driven, which meets
requirement 4 but is not the same thing. Editable datasets belong with the laboratory work in S2-15; if S2-12 is to
claim them, that is the cycle to do it in.

**The lessons already exist as skeletons — you are filling them in, not creating them.** `m.r2-counts` and
`m.r2-centre` hold seven of them, and `tests/audit/region2-architecture.test.ts` asserts every seeded lesson still has
exactly one question and no demonstration. The moment you grow one past that, it must go into
`tests/helpers/complete-lessons.ts`, and `tests/audit/lesson-structure.test.ts` will then hold it to all 18 of scope
§5's requirements. That is the same contract S2-08 worked under for Region 1, and the same guard.

Three of Region 2's lessons are **inherited from Stage 1** — `l.reading-tallies` (mean), `l.middle-harbor` (median) and
`l.spread-1` (range). They carry real content and more than one question, so the skeleton shape does not apply to them,
but none of them meets §5 either. S2-12 owns the first two; S2-13 owns the third.

`docs/REGION2_BOSS_SPEC.md` maps the boss's five stages onto this module sequence. It is worth reading before writing
lessons, because the case is what the lessons have to make answerable.

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
while still listed as owing it.

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
| 3 | Laboratory simulations are placeholders | Open — S2-15 |
| 4 | Only one world of content | Open — S2-07 … S2-14. Region 1 fully authored: **17 of 17** lessons finished. Region 2 remains |
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

- **`test:a11y` does not exist.** Accessibility runs via `tests/unit/accessibility.test.ts` under `npm test`. Adding an
  a11y script requires editing `package.json` *and* the CI workflow together (unit S2-14).
- **Windows cannot be validated here.** Reconstruction runs on Linux. `package:win` is configured but never compiled.
  A green CI build proves buildability only, never that the GUI was manually exercised (unit X-02, Blocked).
- `npm ci` reports 21 dependency advisories in the `electron-builder` toolchain. Left untouched on purpose so the
  recorded baseline equals the surviving artifact; tracked as unit R-01.
