# STAGE_HANDOFF.md — reconstruction handoff

**Supersedes the Stage 1 → Stage 2 handoff.** The original is preserved verbatim in git history at commit `7add4bc`
(`git show 7add4bc:docs/STAGE_HANDOFF.md`). Its still-binding contracts, traps, and priorities are carried forward
below — nothing was discarded.

**Last updated:** 2026-08-06, at the close of S2-08 — **Complete**.

---

## 1. Where this project stands

This repository is a **reconstruction**. The predecessor was developed in an ephemeral environment and everything
after Stage 1 was lost because commits were never pushed to a durable remote. Read
`RECONSTRUCTION_CONTEXT.md` before anything else.

- **Stage 1: surviving, verified, green.** Not re-created — the original commit `7add4bc` was carried forward from the
  archive's own `.git` directory, with authorship intact.
- **Stage 2: in progress, and not recoverable.** Reconstruction began 2026-08-04; S2-01 through S2-08 are complete. Nothing
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
| Test suite | **365 tests / 31 files**, all passing (Stage 1 baseline was 73 / 14) |
| Build | passing (**538.47 kB, 143.73 kB gzip**; baseline was 285.73 kB / 83.82 kB) |
| Source modified since baseline | S2-01 … S2-08 — achievements + region completion, three new interactions, the enforced interaction audit, the review queue, the Region 1 topic architecture, and all 17 Region 1 lessons |
| Curriculum | 2 regions · **6 modules** · **20 lessons** · **23 skills** · **145 questions** (baseline 2/2/3/6/14) |
| Lessons Complete to scope §5 | **17 of 17** Region 1 topic lessons. No skeletons. Two inherited Stage 1 lessons are deliberately excluded — see §5 |
| Misconceptions / remediations | **24 / 23** (baseline 8 / 7) |
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
npm test            # must stay green: 365/365
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

**S2-09 — Region 1 validated content expansion.**

S2-08 is **Complete**: all 17 Region 1 topic lessons in `STAGE2_RECONSTRUCTION_SCOPE.md` §2 satisfy the 18 structure
requirements of §5, enforced by 24 checks per lesson. No skeletons remain.

**Two completions are not the same thing, and this is where they part.** Those lessons are Complete under **§5**
(lesson structure). No *topic* is Complete under **§4**, which requires **≥100 validated interactions each**. Every
Region 1 topic currently carries **7-8 authored questions and zero generator families**. Closing that gap is S2-09, and
it is a much larger unit than any of the four lesson cycles.

What §4 demands, and what closure (§10) will fail on if it is faked:

- ≥100 validated interactions per Complete topic, spanning **several reasoning families** — 100 numeric variants of one
  pattern is explicitly *not* Complete.
- The authoritative topic list comes from the **curriculum graph**, never from the set of generator modules. A topic
  with zero generators must appear in the report as a **failure**, not vanish from it.
- Six distinct metrics reported separately per topic (authored records · generator families · reasoning families · raw
  parameter combinations · valid combinations · final validated generated interactions · total available). They must
  never be used interchangeably.
- Per topic: invalid combinations rejected with reasons · exact duplicates · near duplicates · schema failures ·
  correct-answer failures · missing accessibility descriptions · missing misconception mappings · unreachable
  questions.
- Near-duplicate detection normalises numbers, names, whitespace, punctuation and equivalent phrasing.

### What "Complete" costs for a lesson, measured across all four cycles

Kept for Region 2 (S2-12 … S2-14), which faces the same 18 requirements. Per lesson: a practical narrative purpose ·
a `demonstration` (controls, a named formula, a prediction, an observation, a text equivalent) · a `formalTerm` with
every symbol explained · six questions, one per practice role. Any new misconception needs a remediation **with a
follow-up question**. Adding the lesson id to `tests/helpers/complete-lessons.ts` **is** the completeness claim, and 24
checks in `tests/audit/lesson-structure.test.ts` then have to pass. Add a per-module integration test alongside
`module1-lessons.test.ts` … `module4-lessons.test.ts`, using `tests/helpers/lesson-playthrough.ts` for the mechanics.

Six traps, each of which cost time in Region 1:

- **The demonstration must move.** The audit drives every control to the end of its range through
  `src/core/curriculum/demonstration.ts` and fails if the readout does not change. A decorative control fails.
- **Notation must already be explained.** A symbol may appear in a lesson's prose, questions, hints, solution steps or
  remediations only if that lesson or one of its prerequisites explains it. The counting lesson had to be rewritten
  without `+` and `x` for this reason.
- **A step misconception must also be declared on the question.** `classifyMisconception` walks
  `question.misconceptionIds`, so a `misconceptionValues` entry naming an undeclared id is dead content.
- **Seed prompts are stubs.** All seventeen failed the stub check on first run. Give them real context when promoting
  them to guided practice.
- **Do not guess an API.** The Module 3 keyboard walk was written against an invented `movePoint` signature and cost
  six failing checks. Read the module first.
- **A new formula is a schema change.** Module 4 genuinely needed `table-cell` and `column-total`, and they were added
  properly — enum member, `DEMONSTRATION_ARITY` entry, `apply` case, unit tests, and schema rules tying the selector
  ranges and labels to the table. Do that rather than bending a lesson to fit an existing formula.

**And check your own guards.** A probe in the last cycle found a check I had just written was vacuous: it skipped
controls with no labels, which was the exact defect it existed to catch. Probe every new guard by breaking the thing
it claims to protect.

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
