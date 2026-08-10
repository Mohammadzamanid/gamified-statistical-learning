# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-12 — Central tendency lessons (cycle 3: the redistribution, and the two Stage 1 re-cuts)**

Entered from `ee06f7586de19d9af758a14e18f9978a76eb0235` (remote-verified, clean tree).

## Objective

Redistribute the inherited Stage 1 questions to the Region 2 lessons whose topics they serve, then re-cut
`l.reading-tallies` (mean) and `l.middle-harbor` (median) to all 18 of scope §5's requirements.

## Result up front

**S2-12 remains Partial.** **7 of its 9 lessons are Complete**, up from 5. The two lessons deferred in the previous
cycle are now Complete, and the redistribution that blocked them is done.

What is left of S2-12 is outlier effects and skew effects in `m.r2-variation` — a genuinely separate module, not a
residue of this work.

## Relevant files

| File | Change |
|---|---|
| `src/content/worlds/curriculum.json` | Fourteen inherited questions re-homed; both centre lessons re-cut; `dem.r2-choosing-measures` rebuilt |
| `src/content/questions/questions.json` | 212 authored questions, unchanged in count — ten accessibility descriptions, one explanation, one notation fix, one misconception tag |
| `tests/helpers/staged-inherited.ts` | **New.** The four questions with no lesson to move to yet, declared |
| `tests/audit/region2-architecture.test.ts` | Six checks bounding staged inheritance |
| `tests/audit/lesson-structure.test.ts` | Two new checks; requirement 13 widened past the misconception role |
| `tests/helpers/complete-lessons.ts` | 22 → **24** lessons declared Complete |
| `tests/integration/*.test.ts` | Four playthroughs repointed at the lessons their questions now live in |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Frequency, proportion, percentage | **Yes** (cycle 1) |
| 2 | Mean, median, mode, measure selection | **Yes** — all four Complete |
| 3 | Outlier effects, skew effects | No — `m.r2-variation`, a later cycle |
| 4 | Draggable/editable datasets | No — control-driven demonstrations; editable datasets are S2-15 |
| 5 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **474 tests / 36 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass |
| `npm run report:coverage` | Ran — 17 of 40 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **The redistribution.** `l.reading-tallies` and `l.middle-harbor` asked 17 and 14 questions between them, and most
   taught percentages, bar charts or data literacy rather than centre. Ten moved to the Region 2 lesson whose topic they
   serve, each gaining that lesson's skill so answering it schedules review. Two objectives moved with their questions:
   `obj.read-data` to `l.r2-frequency`, `obj.choose-measure` to `l.r2-choosing-measures`. (D-033)

2. **Four had nowhere to go, and are staged rather than parked.** Their topics belong to `m.r2-pictures` and
   `m.r2-judgement`, whose lessons are still seeds. `tests/helpers/staged-inherited.ts` declares them and six new checks
   bound the exemption: nothing undeclared may sit in a skeleton, nothing declared may be missing, staging may not hold
   newly authored content, may not grow, and may not survive its lesson being declared Complete. Staged questions are
   still held to an accessible description and a real explanation. (D-034)

3. **Both centre lessons re-cut.** The mean is demonstrated by sharing a fixed total across a changing number of days —
   adding a day the harbour caught nothing on still lowers the average, which is the reading that shows the mean counts
   every day rather than every catch. The median is demonstrated by the gap between the two middle prices in a sorted
   row of ten: at zero the median is a price someone paid, and away from zero it is not.

## Corrections made during the unit

1. **A demonstration declared Complete last cycle described a readout its formula never computed.**
   `dem.r2-choosing-measures` claimed "the mean value across all ten buildings" and a starting value of 436 coins; the
   formula produced 1600.00. Every existing check passed. Rebuilt on `quotient`, and a new check now requires the
   readout at the initial settings to be stated in words — which also improved two Region 1 demonstrations that had
   never said what their panel began at. (D-035)

2. **A lesson could claim an objective none of its questions practised.** The probe that leaves a stale objective behind
   failed nothing, which is precisely the slip the redistribution could have left. Now one check. (D-036)

3. **F-6 is closed, and the finding's own diagnosis was wrong.** It recorded `q.error-id-causation` as needing its
   options redesigned because "the misconception is the correct answer". It is not: a learner who believes correlation
   establishes causation does not see the causal leap as the flaw, so they pick a different one. Tagging `ch.sample` was
   the whole fix. All 46 authored misconception declarations are now engine-reportable.

4. **Requirement 13 was widened past the misconception role.** It only ever checked the one question filling that role,
   so an application or mastery question could carry a tag the engine could never report. Measured before widening: every
   Complete lesson already passed, so the guard costs no content debt.

5. **The first attempt parked the four homeless questions in skeletons silently**, and the skeleton-honesty guard caught
   it. The guard was right; the parking was the defect. That episode is what produced D-034.

## Verification that the guards have teeth

Eight deliberate probes, all reverted:

| Probe | Result |
|---|---|
| An undeclared question appears in a staging lesson | **2 checks fail** |
| The staging list names a question the lesson does not ask | **4 checks fail** |
| A staged question stops describing itself in words | **1 check fails** |
| Newly authored content is staged instead of written into a lesson | **3 checks fail** |
| A demonstration states a readout its formula does not produce | **1 check fails** |
| A non-role question's misconception becomes unreportable | **2 checks fail** (nothing before requirement 13 was widened) |
| A staging lesson is declared Complete without clearing its staged questions | **12 checks fail** |
| A re-cut lesson keeps an objective none of its questions carries | **0 → 1 check fails** (the probe found the gap; the check was added) |

## Remaining work

**2 of S2-12's 9 lessons**: outlier effects and skew effects in `m.r2-variation`. Both are new lessons written from
their seeds, with no inherited content to redistribute first.

## Local commit

Recorded in the follow-up commit below.

## Remote verification

Recorded in the follow-up commit below.

## Next unit

**S2-12 continued — `m.r2-variation`: outlier effects and skew effects.** Not started in this cycle.
