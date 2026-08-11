# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-15 — Descriptive-statistics laboratory (cycle 1: the bench becomes a learning environment)**

Entered from `8e8e49591e564156357e4c625a9ff59973a7a149` (remote-verified, clean tree).

## Objective

Replace Stage 1's calculator bench with the core of the laboratory the scope asks for: editable readings, and an
account of what each edit moves.

## Result up front

**S2-15 is Partial: 7 of its 12 criteria are met.** The bench now holds readings you can add to, edit, remove, sort and
push an outlier into, and every one of those actions reports what it moved *and what it left alone* — which is the
whole difference between a learning environment and a calculator (D-050). Graphs, two-dataset comparison, saved
experiments and exported summaries are the remaining five and belong to later cycles.

## Relevant files

| File | Change |
|---|---|
| `src/core/laboratory/experiment.ts` | **New.** The experiment model, its edits, and the change narration — all pure |
| `src/core/laboratory/index.ts` | **New.** Barrel |
| `src/renderer/screens/LabScreen.tsx` | Rewritten against the core; arranges and announces, computes nothing |
| `tests/unit/laboratory.test.ts` | **New** — 20 checks |
| `tests/audit/core-purity.test.ts` | **New** — 4 checks enforcing scope §7's centralisation rule (D-051) |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Create / edit datasets | **Yes** — start blank, from the bench's own set, or from any shipped numeric dataset |
| 2 | Add / remove values | **Yes** |
| 3 | Sort | **Yes** — and it reports that no measure changed |
| 4 | Add outliers | **Yes** — derived from the data's own 1.5-IQR fence |
| 5 | Live statistics | **Yes** — under the taught quartile convention (D-045) |
| 6 | Reset | **Yes** — clear the bench, or start again |
| 7 | Accessible text descriptions | **Yes** for every edit; the chart descriptions arrive with the charts |
| 8 | Compare two datasets | No — cycle 2 |
| 9 | Change graph type | No — cycle 2 |
| 10 | Change bins | No — cycle 2 |
| 11 | Save / reload experiments | No — cycle 3; needs a save-schema migration |
| 12 | Export summaries | No — cycle 3 |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **599 tests / 43 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 861.47 kB (220.85 kB gzip) |
| `npm run report:coverage` | Ran — 17 of 41 topics meet §4, unchanged (no content changed this cycle) |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **Every edit is an event carrying the summary either side of it.** `describeChange` turns one into a sentence
   naming what moved and what did not. Measured, not paraphrased:

   > Added an outlier at 18.75: sum 25 to 43.75; mean 5 to 7.2917; median 4 to 5; range 7 to 16.75; first quartile 3
   > to 4; third quartile 7.5 to 9; largest value 9 to 18.75; interquartile range 4.5 to 5; sample variance 7 to
   > 37.1104; sample standard deviation 2.6458 to 6.0918. **Unchanged: mode, smallest value.**

   The account is complete rather than a selection, which is what makes the "Unchanged" half worth trusting. The same
   string goes to the live region, so a screen-reader user is told what changed rather than told a table exists
   (D-050, scope §6).

2. **Sorting is kept as an operation precisely because it moves nothing.** Every measure the bench reports is
   order-independent, so its log line reads "No measure changed — every one of them ignores the order of the
   readings." A bench that reordered silently would leave a learner guessing whether it mattered.

3. **The outlier button offers the data's own outlier**, a further interquartile range past the 1.5-IQR fence
   `l.r2-outliers` teaches — and offers nothing when the middle half has zero width, where the rule is degenerate.

4. **The bench withholds rather than substitutes.** One reading has no sample spread, so variance and standard
   deviation read "—" with a line saying why; reporting 0 would be a population answer wearing a sample label
   (scope §7).

5. **Scope §7's centralisation rule became a test** after a probe showed an inline fold in the view failed nothing
   (D-051).

## Corrections made during the unit

1. **The suggested outlier was a number the bench invented.** With a zero-width middle half the fence rule is
   degenerate, and the first draft fell back on the maximum to pick a distance — arithmetic derived from nothing,
   in a button whose whole claim is that it comes from the data. Its own test caught it; the bench now declines and
   the control says why.

## Verification that the guards have teeth

Six deliberate probes, all reverted. **Five bite, one found a gap now closed and re-probed twice:**

| Probe | Result |
|---|---|
| The summary switches to the interpolated quartile convention | **1 check fails** (D-045) |
| The change report drops the measures that held still | **1 check fails** |
| Sorting stops being logged | **1 check fails** |
| The suggested outlier becomes a number of the bench's own choosing | **2 checks fail** |
| Variance is reported as 0 for a single reading | **1 check fails** |
| The view folds its own mean instead of asking the core | **0 → 1 check fails** — closed by D-051 |
| *(re-probe)* The view defines its own `standardDeviation` | **2 checks fail** |

## Remaining work

**5 of S2-15's 12 criteria**: comparison, graph type, bin width (cycle 2); saved experiments and exported summaries
(cycle 3, which needs a save-schema migration).

## Local commit

`22e8c981b4754e15fb6bc078aea0711bcfe51e86`

## Remote verification

```
LOCAL_HEAD  = 22e8c981b4754e15fb6bc078aea0711bcfe51e86
REMOTE_HEAD = 22e8c981b4754e15fb6bc078aea0711bcfe51e86
VERIFIED: MATCH
```

## Next unit

**S2-15 continued — charts on the bench, and two datasets side by side.** Not started in this cycle.
