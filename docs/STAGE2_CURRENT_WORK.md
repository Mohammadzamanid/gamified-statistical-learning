# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-21 — the Stage 2 closure audit. This is the last unit of the stage.**

Entered from `e924dbee625447e3a49a086048bfcf1dce6fcf52` (remote-verified, clean tree).

## Objective

Make scope §10's twelve closure drift guards enforceable, measure the stage's totals from the repository, run the full
validation sweep, and complete the closure bookkeeping — tag, exports, and an honest record of what is *not* closed.

## Result up front

**S2-21 is Complete, and Stage 2 is closed.** The measured record is `docs/STAGE2_CLOSURE.md`.

| Measure | Value |
|---|---|
| Closure guards enforced | **12 of 12**, each failing independently |
| Tests | **707** / 49 files (695 at the start of the unit) |
| Accessibility checks | 36 / 3 files |
| Topics meeting scope §4 | 41 of 41 |
| Probes | 9; **all nine bite** |
| Units in the stage | S2-01 … S2-21, every one with a verified remote hash |

## Relevant files

| File | Change |
|---|---|
| `tests/audit/stage2-closure.test.ts` | **New.** Scope §10's twelve guards, in the scope's own order |
| `docs/STAGE2_CLOSURE.md` | **New.** The closure record: measured totals, the sweep, what is not closed, and why |
| `docs/STAGE2_RECONSTRUCTION_BACKLOG.md` | S2-21 closed with its verified hashes |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Full validation suite run at the closing commit | **Yes** — every command run, none reported from memory |
| 2 | Measured totals | **Yes** — `STAGE2_CLOSURE.md` §2, computed from the repository |
| 3 | Fresh-save playthrough | **Yes** — both regions, both cases, one save (S2-18) |
| 4 | Save/resume audit | **Yes** — S2-19, 26 checks |
| 5 | Laboratory audit | **Yes** — S2-15, and its shelf is covered by the resume audit |
| 6 | Remote-persistence audit | **Yes** — guard 11 reads it out of the backlog |
| 7 | Closure drift guards enforced | **Yes** — 12 of 12 |
| 8 | Final commit pushed and verified | Yes — see below |
| 9 | `stage-2-complete` tag pushed **or explicitly marked blocked** | **Marked blocked** — HTTP 403 on `refs/tags/*`, as R-00d |
| 10 | Source ZIP + git bundle exported outside history | **Yes** — `../gsl-exports/`, checksummed, bundle verified |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **707 tests / 49 files** |
| `npm run test:a11y` | Pass — 36 tests / 3 files |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 901.05 kB (231.05 kB gzip) |
| `npm run report:coverage` | Ran — 41 of 41 topics meet §4 |

## Work completed

1. **The closure list is enforceable rather than descriptive.** §10 was twelve sentences that several audit files
   happened to satisfy between them. A rule living in another file can be narrowed by a unit that has no idea §10
   depends on it, so each guard is exercised here from the closure list's own wording, naming the file that owns the
   detail.

2. **The two document guards had never been checked by anything.** Every Complete backlog row must carry a local hash,
   a remote hash, the two equal, and a cell recording the verification — read out of the document, because the
   document is the record. And every `npm run` the CI workflow invokes must exist in `package.json`.

3. **The closure record states what is not closed** as plainly as what is: two blocked GitHub operations, one deferred
   dependency triage, Windows, and two items that stay GUI review.

## Corrections made during the unit

1. **A probe was sharper than the guard it aimed at.** Pointing a region achievement at a missing region is refused by
   `loadShippedContent` before any check runs — a stronger outcome, and one that never exercises guard 8. Removing the
   achievement entirely does, and that is the probe now recorded.

2. **Two reads of the coverage report were wrong** in the first draft: `reasoningFamilies` is a list, not a count, and
   the thresholds live in `report.ts` rather than a `thresholds` module. Both found by running it.

## Verification that the guards have teeth

Nine deliberate probes, all reverted. **All nine bite:**

| Probe | Result |
|---|---|
| A completed unit's recorded hashes disagree | **1 check fails** |
| A completed unit records no hash at all | **1 check fails** |
| A completed unit is not verified against the remote | **1 check fails** |
| CI runs a script `package.json` does not define | **1 check fails** |
| A region loses its completion achievement | **1 check fails** |
| A skill is classified into a stage that has not begun | **1 check fails** |
| A region is left owing a boss at closure | **1 check fails** |
| The fresh-save playthrough stops naming a region | **1 check fails** |
| A distractor names a misconception its question never declares | **1 check fails** |

## Remaining work

None. S2-21 is Complete and **Stage 2 is closed**. See `docs/STAGE2_CLOSURE.md`.

## Local commit

`ff22de27080d7b82f5f3dc9ea6d95b66931fd6cf` (the audit), plus this cycle's documentation commit recorded in the
backlog.

## Remote verification

```
LOCAL_HEAD  = ff22de27080d7b82f5f3dc9ea6d95b66931fd6cf
REMOTE_HEAD = ff22de27080d7b82f5f3dc9ea6d95b66931fd6cf
VERIFIED: MATCH
```

## Next unit

**Stage 3.** Its scope is not written yet; `STAGE_HANDOFF.md` §5 says what a Stage 3 opener needs to read first.
