# STAGE_HANDOFF.md — reconstruction handoff

**Supersedes the Stage 1 → Stage 2 handoff.** The original is preserved verbatim in git history at commit `7add4bc`
(`git show 7add4bc:docs/STAGE_HANDOFF.md`). Its still-binding contracts, traps, and priorities are carried forward
below — nothing was discarded.

**Last updated:** 2026-08-06, at the close of S2-08 cycle 3 (still Partial).

---

## 1. Where this project stands

This repository is a **reconstruction**. The predecessor was developed in an ephemeral environment and everything
after Stage 1 was lost because commits were never pushed to a durable remote. Read
`RECONSTRUCTION_CONTEXT.md` before anything else.

- **Stage 1: surviving, verified, green.** Not re-created — the original commit `7add4bc` was carried forward from the
  archive's own `.git` directory, with authorship intact.
- **Stage 2: in progress, and not recoverable.** Reconstruction began 2026-08-04; S2-01 through S2-07 are complete and S2-08 is **Partial**. Nothing
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
| Last unit completed | **S2-07** — Region 1 curriculum architecture (`dd39d38`, remote-verified) |
| Last unit attempted | **S2-08** — Region 1 lessons and interactions — **Partial**: 10 of 17 lessons Complete (cycles `629dd74`, `2f1ec31`, `def8b1d`, all remote-verified; see §5) |
| Head of `main` | read it live: `git rev-parse HEAD` vs `git ls-remote origin refs/heads/main` — these must match |
| Milestone snapshot commit | `d4e250434c465f85e4307a226a9af2cbc9788c17` — the commit the exports were built from |
| Stage tag | `stage-1-baseline` — **created locally, NOT on GitHub** (unit R-00d, blocked; see §2.1) |
| Milestone exports | `../gsl-exports/` — source ZIP + git bundle + manifest + SHA-256 checksums |
| Working tree | clean |
| Node / npm used | v22.22.2 / 10.9.7 |
| Test suite | **337 tests / 30 files**, all passing (Stage 1 baseline was 73 / 14) |
| Build | passing (**493.11 kB, 133.34 kB gzip**; baseline was 285.73 kB / 83.82 kB) |
| Source modified since baseline | S2-01 … S2-08 — achievements + region completion, three new interactions, the enforced interaction audit, the review queue, the Region 1 topic architecture, and Module 1's finished lessons |
| Curriculum | 2 regions · **6 modules** · **20 lessons** · **23 skills** · **121 questions** (baseline 2/2/3/6/14) |
| Lessons Complete to scope §5 | **13 of 17** Region 1 topic lessons — Modules 1, 2 and 3. 4 remain skeletons (§5) |
| Misconceptions / remediations | **21 / 20** (baseline 8 / 7) |
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
npm test            # must stay green: 337/337
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

**S2-08 continued — Module 4 (`m.r1-data`): reading tables, variables, cases and observations, categorical versus
numerical.**

S2-07 built Region 1's shape; S2-08 has since finished **Modules 1, 2 and 3** (`m.r1-counting`, `m.r1-parts`,
`m.r1-position`) to all 18 structure requirements in `STAGE2_RECONSTRUCTION_SCOPE.md` §5. One module remains, and S2-08
stays **Partial** until it lands:

`l.r1-tables` · `l.r1-variables` · `l.r1-cases` · `l.r1-variable-kinds` — module `m.r1-data`

Each still holds one concept and one seed question — enough to be reachable and ordered, deliberately no more.

**Expect this module to be harder than the three before it.** A table, a variable and a case are *structures*, not
quantities, and every demonstration so far has had a number for a readout. The existing `DemonstrationFormula` members
may not express "which column is this value in" without a new one — and if a new member is genuinely needed, add it
properly (one enum member, one `DEMONSTRATION_ARITY` entry, one `case` in `apply`, one unit test) rather than bending a
lesson to fit an arithmetic formula that does not describe it.

### What "Complete" costs, measured from Modules 1-3

Per lesson: a practical narrative purpose · a `demonstration` (controls, a named formula, a prediction, an observation,
a text equivalent) · a `formalTerm` with every symbol explained · six questions, one per practice role. Any new
misconception needs a remediation with a follow-up question. Adding the lesson id to
`tests/helpers/complete-lessons.ts` **is** the completeness claim, and 24 checks in
`tests/audit/lesson-structure.test.ts` then have to pass. Add a per-module integration test alongside
`module1-lessons.test.ts` … `module3-lessons.test.ts`, using `tests/helpers/lesson-playthrough.ts` for the mechanics —
it only needs the module's own misconception slips.

Five traps that have cost time so far:

- **The demonstration must move.** The audit drives every control to the end of its range through
  `src/core/curriculum/demonstration.ts` and fails if the readout does not change. A decorative control fails.
- **Notation must already be explained.** A symbol may appear in a lesson's prose, questions, hints, solution steps or
  remediations only if that lesson or one of its prerequisites explains it. The counting lesson had to be rewritten
  without `+` and `x` for exactly this reason. If a lesson needs a symbol nothing upstream explains, explain it in that
  lesson's `formalTerm` — do not weaken the check.
- **A step misconception must also be declared on the question.** `classifyMisconception` walks
  `question.misconceptionIds`, so a `misconceptionValues` entry naming an id the question does not declare is dead
  content. The S2-05 interaction audit catches it.
- **Seed prompts are stubs.** Every one of the thirteen seed questions has failed the audit's stub check on first run
  ("Which temperature is COLDER?"). Give them harbour context when promoting them to guided practice.
- **Do not guess an API.** The Module 3 keyboard walk was written against an invented `movePoint` signature and cost
  six failing checks; the real one is `movePoint(field, position, axis, steps)` and `PointPosition.y` is
  `number | null`. Read the module before calling it.

A lesson of explanatory text plus questions is **not** Complete, and neither is one with placeholder controls.

**Do not conflate two different completions.** These thirteen lessons are Complete under scope **§5** (lesson
structure). No *topic* is Complete under scope **§4**, which needs ≥100 validated interactions each — the Complete
lessons carry 7-8 authored questions per topic and zero generator families. That is S2-09.

Do **not** start S2-09 in the same cycle.

### Open findings from the interaction audit

Recorded in `docs/INTERACTION_AUDIT.md` §3; each is owned by a later unit and none is fixed yet.

| Finding | Owner |
|---|---|
| F-1 `multiple-selection`, `ordering`, `matching`, `short-explanation` have no misconception mapping | S2-16 |
| F-2 in-progress interaction state is not persisted (steps, point, placement) | S2-19 |
| F-3 three types remain genuine stubs; `simulation-prediction` waits on the laboratory | S2-15 / later |
| F-4 `q.remed-mean-basic` is reachable only via remediation — by design | none |
| F-5 keyboard operability is structural, not browser-verified | S2-20 |

### Stage 1 known defects — current state

| # | Defect | State |
|---|---|---|
| 1 | Region-completed achievement trigger stubbed `false` | **Fixed in S2-01** |
| 2 | Six interaction types unimplemented | **Partly fixed** — `step-by-step-calculation` (S2-02), `point-placement` (S2-03) and `drag-and-drop` (S2-04) live; 3 remain |
| 3 | Laboratory simulations are placeholders | Open — S2-15 |
| 4 | Only one world of content | Open — S2-07 … S2-14. Region 1 architecture done; **13 of 17** lessons finished |
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
