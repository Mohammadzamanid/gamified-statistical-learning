# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-19 — the save, resume and recovery audit (cycle 1: what an interruption costs)**

Entered from `7e71f99ded8c804367ab72e97dc591d5dae047a3` (remote-verified, clean tree).

## Objective

Interrupt the real engine at each of the five places the criteria name — a lesson, a multi-step calculation, a boss,
the review queue, the laboratory — and at the three moments just after something is earned, then write through a real
`SaveManager` onto a real directory and measure what comes back. Underneath: several profiles, atomic writes, backup
rotation, a corrupt primary, an invalid import, a missing save, and duplicate-award prevention for every trigger kind.

## Result up front

**Cycle 1 is Complete. Two defects found, both fixed; one of them in a test written this cycle.**

| Measure | Value |
|---|---|
| New audit | `tests/integration/save-resume.test.ts` — **20 checks** |
| Tests | **688** / 48 files (668 at the start of the unit) |
| Interruption points covered | **5 of 5**, plus 3 post-award moments |
| Probes | 8; **6 bit immediately, 2 found gaps now closed and re-probed** |

## What survives an interruption, measured

| Interrupted at | Kept | Lost |
|---|---|---|
| A lesson, part-way | Every answer, mastery, review schedule, achievements, **and now the in-progress status** | The position in the question queue |
| A multi-step calculation | Every earlier answer; the question is still answerable afterwards | The half-filled steps (never persisted, by design) |
| A boss, mid-case | The stage reached and every stage already argued | Nothing |
| The review queue | The frozen queue, the index, the counts, the same next question | Nothing |
| The laboratory | The readings, the title, the chart kind and the bin width | The edit trail (deliberate, D-054) |

## Relevant files

| File | Change |
|---|---|
| `tests/integration/save-resume.test.ts` | **New.** The audit: 20 checks across interruption, storage and awards |
| `src/renderer/state/session.ts` | Writes a lesson's `in-progress` status from its first answer (D-064) |
| `src/renderer/screens/RegionScreen.tsx` | Shows it — the pill and "Resume lesson", which the boss below has had since S2-10 |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Interruption at a lesson | **Yes** |
| 2 | Interruption at a multi-step calculation | **Yes** |
| 3 | Interruption at a boss | **Yes** |
| 4 | Interruption at the review queue | **Yes** |
| 5 | Interruption at the laboratory | **Yes** |
| 6 | Interruption after an achievement award | **Yes** |
| 7 | Interruption after a mastery update | **Yes** |
| 8 | Interruption after a settings change | **Yes** |
| 9 | Multiple profiles | **Yes** — isolation, and deletion that spares the other |
| 10 | Atomic writes | **Yes** — the mechanism, not just the absence of leftovers (D-065) |
| 11 | Backup rotation | **Yes** — bounded at `MAX_BACKUPS`, oldest dropped, primary untouched |
| 12 | Corrupt-primary recovery | **Yes** — and the other profile is unaffected |
| 13 | Invalid import | **Yes** — five malformed shapes, none accepted, save undisturbed |
| 14 | Missing save | **Yes** — an error, not a fabricated empty save |
| 15 | Duplicate-achievement prevention, all award kinds | **Yes** |
| 16 | Migration | Covered by `persistence.test.ts` since S2-15; not duplicated |
| 17 | Review-schedule and laboratory-state persistence | **Yes** |
| 18 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **688 tests / 48 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 899.57 kB (230.79 kB gzip) |
| `npm run report:coverage` | Ran — **41 of 41** topics meet §4 |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **The audit interrupts rather than constructs.** `persistence.test.ts` builds its saves by hand; every save here is
   produced by answering questions through the real session engine and then stopping, so what is written is what a
   learner's save would actually contain.

2. **The distinction the file is built on** — earned state versus position. Earned state must survive any
   interruption. Position survives only where something persists it, and the table above says exactly where that is.

3. **Two defects found and fixed** (D-064, D-065), and a third finding about the tests themselves (D-066).

## Corrections made during the unit

1. **A lesson recorded nothing until it was finished** (D-064). The `"in-progress"` status has existed since Stage 1
   and nothing wrote it; `RegionScreen` read the status and then only asked whether it was `"completed"`. Both halves
   fixed.

2. **The atomicity test tested the wrong thing** (D-065). Replacing temp-then-rename with a plain write failed
   nothing. Now the rename is made to fail and the previous contents must still be there.

3. **My own resume test read its expectation through the code under test** (D-066) — the third instance of D-059, this
   time in a persistence unit. Now compared against the stored queue.

4. **Two probes were aimed at paths the behaviour does not take.** The review probe first patched
   `startReviewSession`, which a resume never calls. A probe that fails nothing is not evidence until you have checked
   it is pointed at the right code.

5. **Three mistakes of mine in the first draft**: `shelveExperiment` does not exist (it is `saveExperiment`, and it
   takes a shelf rather than a save); a review session built from one lesson has a single item and ends on the first
   answer, so it cannot be interrupted; and `lessonProgress` was asserted mid-lesson before the write that creates it
   existed — which is how D-064 was found.

## Verification that the guards have teeth

Eight deliberate probes, all reverted. **Six bite; two found gaps now closed and re-probed:**

| Probe | Result |
|---|---|
| A lesson stops recording that it was started | **3 checks fail** |
| Saving stops backing up the previous file | **3 checks fail** |
| Backups are never rotated | **1 check fails** |
| A missing save is answered with a fabricated empty one | **2 checks fail** |
| Import accepts anything that parses as JSON | **2 checks fail** |
| A boss stops advancing past the stage just argued | **13 checks fail** |
| The adapter writes in place instead of temp-then-rename | **0 → 1 check fails** — D-065 |
| The question on resume is picked afresh, not read from the frozen queue | **0 → 1 check fails** — D-066 |

## Remaining work

**Cycle 2: the lesson's position.** A review session persists its queue and index and a boss persists the stage it
reached; a lesson persists neither, so an interrupted lesson restarts at question one. Closing that needs a save-shape
change — `SAVE_SCHEMA_VERSION` 4 → 5 with a migration — and threading through the store and `LessonScreen`. It is
measured and stated in the audit today rather than asserted around, so the gap is visible in the suite.

## Local commit

Recorded in the follow-up commit; see `STAGE2_RECONSTRUCTION_BACKLOG.md`.

## Next unit

**S2-19 cycle 2**, then S2-20 (the accessibility harness, where `test:a11y` becomes real).
