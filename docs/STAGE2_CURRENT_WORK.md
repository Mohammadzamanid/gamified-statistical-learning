# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-12 — Central tendency lessons (cycle 1: `m.r2-counts`, the three counting lessons)**

Entered from `abc734eeabc1af858878f155e85cc16627b0e65f` (remote-verified, clean tree).

## Objective

Write Region 2's first module to all 18 of `STAGE2_RECONSTRUCTION_SCOPE.md` §5's requirements — the same bar S2-08 held
Region 1's lessons to, and the same one-module-per-cycle rhythm.

## Result up front

**S2-12 is Partial.** **3 of its 9 lessons are Complete**: frequency, proportion and percentage, the whole of
`m.r2-counts`. The remaining six — mean, median, mode, choosing a measure, outlier effects, skew effects — are named
below and are the next cycles.

Every one of the three carries a working demonstration, a formal term, and all six practice roles. They share one
twenty-morning weather log, so a learner meets the same data three times and watches it answer three different
questions.

## Relevant files

| File | Change |
|---|---|
| `src/content/worlds/curriculum.json` | Three lessons filled in; Region 2's entry lesson reaches back into Region 1 |
| `src/content/questions/questions.json` | 179 → **194** authored questions (18 new, 3 seeds retired) |
| `src/content/questions/misconceptions.json` | 24 → **25** |
| `src/content/questions/remediations.json` | 23 → **24** |
| `tests/helpers/complete-lessons.ts` | The three lessons declared Complete |
| `tests/audit/region2-architecture.test.ts` | Skeleton guard updated for a partly-written region |
| `tests/audit/region1-architecture.test.ts` | Complete-list check scoped to Region 1 |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Frequency, proportion, percentage | **Yes** |
| 2 | Mean, median, mode, measure selection | No — next cycles |
| 3 | Outlier effects, skew effects | No — next cycles |
| 4 | Draggable/editable datasets | No — the demonstrations are control-driven; editable datasets arrive with the laboratory work in S2-15 |
| 5 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **466 tests / 36 files** (was 463 / 36) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 617.33 kB (160.55 kB gzip) |
| `npm run report:coverage` | Ran — 17 of 40 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **One dataset, three lessons.** The same twenty-morning log is counted in the frequency lesson, divided in the
   proportion lesson and scaled in the percentage lesson. A learner who has just counted eleven calm mornings meets
   those eleven again as 0.55 and again as 55%, which is the point the module exists to make.

2. **Each demonstration drives a different formula.** Frequency uses `tally` — struck groups of five, so the readout
   climbs in fives from one control and ones from the other. Proportion uses `quotient`, where holding the count still
   and raising the whole makes the share fall. Percentage uses `percent-of`, where the same reported figure stands for
   four times as many mornings when the whole is four times larger.

3. **One new misconception, because requirement 13 needs a detectable one.** `mc.frequency-counts-categories` — asked
   how many mornings were rough, the learner answers 3, the number of words the log uses. Proportion and percentage
   reuse `mc.percent-vs-decimal` and `mc.decimal-vs-percent`, which describe exactly the confusion those two lessons
   are built around. Region 2's full misconception library is still **S2-16**.

## Corrections made during the unit

1. **Region 2's entry lesson inherited nothing from Region 1.** The beginner-safety guard rejected `+` in a frequency
   explanation, because it walks *lesson* prerequisites and `l.r2-frequency` had none — the region-level prerequisite
   is invisible to it. This is D-031 one level up: a dependency that only exists between regions is not in the currency
   the lesson-level rules read. Fixed by making the entry lesson depend on the last lesson of every Region 1 module,
   and the architecture audit gained a check that **nothing** in Region 2 opens before Region 1 is charted.

2. **Two skeleton guards had to be updated, deliberately.** "No Region 2 lesson is Complete yet" and "every seeded
   lesson is a skeleton" were true when S2-11 wrote them and false the moment a lesson was finished. They became "every
   lesson *not declared Complete* still looks like a skeleton", plus a new mirror check that a declared lesson has
   genuinely outgrown its seed — the same pair S2-08 arrived at for Region 1.

3. **A probe was wrong, not the guard it tested.** The notation probe added `+` to a Region 2 intro and failed nothing —
   correctly, since fixing correction 1 made `+` genuinely explained upstream. Re-run with a summation sign, which no
   lesson in the curriculum explains, it fails the check. The third time a probe has needed correcting rather than the
   code it was aimed at (D-019).

## Verification that the guards have teeth

Eight deliberate probes, all reverted:

| Probe | Result |
|---|---|
| A demonstration control is inert | **5 checks fail** |
| The misconception challenge targets nothing | **1 check fails** |
| The mastery check is easier than the practice | **1 check fails** |
| Unexplained notation reaches the learner | **1 check fails** (after the probe itself was corrected) |
| Teach-it-back is not written in words | **1 check fails** |
| A practice role is left empty | **3 checks fail** |
| A finished lesson is undeclared | **1 check fails** |
| Region 2 stops depending on Region 1 | **3 checks fail** |

## Remaining work

**6 of S2-12's 9 lessons.** `m.r2-centre` holds four — mean (`l.reading-tallies`), median (`l.middle-harbor`), mode and
choosing a measure — and the first two are Stage 1 lessons that need re-cutting to §5 rather than writing from a seed.
Outlier effects and skew effects live in `m.r2-variation` and can be written any time after the centre module.

## Local commit

`80657919a356d2370965f9bcd8cdd0c069fc3b2d`

## Remote verification

```
LOCAL_HEAD  = 80657919a356d2370965f9bcd8cdd0c069fc3b2d
REMOTE_HEAD = 80657919a356d2370965f9bcd8cdd0c069fc3b2d
VERIFIED: MATCH
```

## Next unit

**S2-12 continued — `m.r2-centre`.** Not started in this cycle, per the one-unit-per-cycle rule.
