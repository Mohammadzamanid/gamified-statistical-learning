# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-19 — the save, resume and recovery audit (cycle 2: the lesson's position)**

Entered from `6198825f2c2792ad6be9434f8b4a8eda44898d2e` (remote-verified, clean tree).

## Objective

Close the one gap cycle 1 measured and could not close: an interrupted lesson restarted at its first question, while a
review session had persisted its frozen queue since S2-06 and a boss the stage it reached since S2-10.

## Result up front

**S2-19 is Complete.** A lesson now keeps its place across an interruption, and "start over" is something a learner
asks for rather than what always happens.

| Measure | Value |
|---|---|
| Save schema | **4 → 5**, with a migration lifting older saves to `null` |
| The audit | `tests/integration/save-resume.test.ts` — 20 → **26 checks** |
| Tests | **695** / 48 files (688 at the start of the cycle) |
| Probes | 9; **5 bit immediately, 4 found gaps now closed and re-probed** |

## What changed

`SaveFile` gains `lessonSession`: the lesson id, the question queue, the index of the next **unanswered** question,
and the counts. Written by `submitAnswer` and again by `advance` — the second is not redundant, because `advance` is
where a remediation follow-up is spliced into the queue.

`resumeLesson` sits beside `startLesson` rather than replacing it. The map resumes; "start over" starts over and
clears the kept position on disk. The lesson screen says which it is about to do.

## Relevant files

| File | Change |
|---|---|
| `src/shared/schemas/profile.ts` | **New.** `LessonSessionStateSchema`, and `lessonSession` on the save |
| `src/shared/constants/app.ts` | `SAVE_SCHEMA_VERSION` 4 → **5** |
| `src/core/persistence/migrations.ts` | **New.** The 4 → 5 step, lifting to an explicit `null` |
| `src/renderer/state/session.ts` | `resumeLesson`; the position written on answer and on advance |
| `src/renderer/state/store.ts` | The map's entry resumes; `restartLesson` added; every advance is persisted |
| `src/renderer/screens/LessonScreen.tsx` | "Resume practice · question 3 of 6", with "Start over" beside it |
| `tests/integration/save-resume.test.ts` | Cycle 1's "no position is kept" case rewritten into six that describe what resuming does |
| `tests/integration/persistence.test.ts` | The 4 → 5 step on a save that genuinely lacks the field |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | An interrupted lesson resumes where it stopped | **Yes** — after a real round trip through the manager |
| 2 | No answer is logged twice by resuming | **Yes** — the attempt log after a resumed run has no repeats |
| 3 | An earned remediation follow-up survives the interruption | **Yes** — earned by a diagnosed error, not hand-built |
| 4 | A finished lesson keeps no position | **Yes** |
| 5 | An untrustworthy record falls back to a fresh start | **Yes** — wrong lesson, missing questions, index past the end |
| 6 | A boss still resumes by stage, and only by stage | **Yes** — checked mid-stage, which is the only place it can be |
| 7 | Save-shape change carries a migration | **Yes** — 4 → 5, exercised on a save without the field |
| 8 | Starting over is still available and clears the position | **Yes** |
| 9 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **695 tests / 48 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 901.05 kB (231.05 kB gzip) |
| `npm run report:coverage` | Ran — **41 of 41** topics meet §4 |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **The queue is stored, not only the index** (D-067), for the reason the review session stores its own: a follow-up
   spliced into the queue changes what every later index means.

2. **The position is the next unanswered question**, so a crash on the feedback panel does not re-ask what was just
   answered — which would log the attempt twice.

3. **Two entry points, because both are things a learner asks for.** `startLesson` is unchanged; `resumeLesson` is
   new. The screen names which one the button will do.

4. **Cycle 1's honest "no position is kept" case was rewritten, not deleted**, into the six cases that now describe
   resuming — including the fresh start that "start over" still means.

## Corrections made during the unit

1. **Cycle 1's case was pinned to the wrong function.** It asserted `startLesson` returns index 0 — still true after
   this cycle — so the whole suite stayed green when resume landed. A test aimed at the path the behaviour does not
   take proves nothing, which is the second time this unit has said so.

2. **A line of defence nobody could check was removed** rather than kept. Clearing the position at completion could
   not be made to fail: `submitAnswer` had already recorded one past the last question, which is null by construction.

3. **The follow-up case hand-built the queue it was meant to be testing.** It now earns the follow-up by giving the
   answer that expresses the misconception — an ordinary wrong answer does not produce one, because remediation is
   recommended on a diagnosed error.

4. **The boss assertion was in the wrong place** — after a completed stage, where the record is null whether the
   guard exists or not. Moved mid-stage.

## Verification that the guards have teeth

Nine deliberate probes, all reverted. **Five bite; four found coverage gaps now closed and re-probed (D-068):**

| Probe | Result |
|---|---|
| Resuming ignores the kept position | **3 checks fail** |
| The resumed index is one too far | **3 checks fail** |
| The queue is rebuilt from the lesson rather than read from the save | **1 check fails** |
| A kept queue naming missing questions is resumed onto anyway | **1 check fails** |
| The save version is bumped without a migration | **6 checks fail** |
| The position is recorded at the question just answered | **0 → 2 checks fail** |
| Advancing stops recording the new position | **0 → 1 check fails** |
| Finishing a lesson leaves its position behind | **0 fails — the line was unprovable and was removed** |
| A boss step starts persisting a position too | **0 → 1 check fails** |

## Remaining work

None. S2-19 is Complete.

## Local commit

`a3ea17d6217e98856ba418a36ce3a522230100e2`

## Remote verification

```
LOCAL_HEAD  = a3ea17d6217e98856ba418a36ce3a522230100e2
REMOTE_HEAD = a3ea17d6217e98856ba418a36ce3a522230100e2
VERIFIED: MATCH
```

## Next unit

**S2-20 — the accessibility harness**, where `test:a11y` becomes a real script. Not started in this cycle.
