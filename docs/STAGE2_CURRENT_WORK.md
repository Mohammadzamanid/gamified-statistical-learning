# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-15 — Descriptive-statistics laboratory (cycle 2: charts on the bench, and two sets side by side)**

Entered from `63f77b31eab1f4e68d5575afef997d85d41bd2fa` (remote-verified, clean tree).

## Objective

Draw the bench's readings, let the learner change how they are drawn, and compare two sets the way
`l.r2-comparing-distributions` teaches.

## Result up front

**S2-15 is Partial: 10 of its 12 criteria are met.** The bench draws its readings as a histogram, dot plot or box
plot; the bin width is a control; and a second set can be copied, edited and compared on centre, spread and shape
separately. Only saved experiments and exported summaries remain, and both belong to cycle 3 with the save-schema
migration they need.

**Two statistics were found living inside chart components** and moved to the core — see Corrections. The audit that
was supposed to prevent exactly that could not see them (D-052).

## Relevant files

| File | Change |
|---|---|
| `src/core/statistics/binning.ts` | **New.** `buildBins` and `stackDots`, moved out of the two chart components |
| `src/core/laboratory/charts.ts` | **New.** Which kinds the bench offers, why the other two are refused, and the live description |
| `src/core/laboratory/comparison.ts` | **New.** The three questions, answered separately |
| `src/renderer/components/{Histogram,DotPlot}.tsx` | Import their arithmetic instead of defining it |
| `src/renderer/screens/LabScreen.tsx` | Chart picker, bin-width control, second bench, comparison table |
| `tests/unit/laboratory-charts.test.ts` | **New** — 13 checks |
| `tests/audit/core-purity.test.ts` | `buildBins` and `stackDots` added to the banned-definition list |
| `tests/unit/{histogram,dot-plot}.test.ts` | Import from the core the functions now live in |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1–7 | Create/edit, add/remove, sort, outliers, live statistics, reset, accessible text | **Yes** (cycle 1) |
| 8 | Compare two datasets | **Yes** — centre, spread and shape, each reported on its own |
| 9 | Change graph type | **Yes** — three kinds; the other two are refused with reasons |
| 10 | Change bins | **Yes** — and the description always states the width it drew |
| 11 | Save / reload experiments | No — cycle 3; needs a save-schema migration |
| 12 | Export summaries | No — cycle 3 |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **612 tests / 44 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 867.65 kB (222.74 kB gzip) |
| `npm run report:coverage` | Ran — 17 of 41 topics meet §4, unchanged (no content changed) |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **The bench draws through the components the lessons draw through.** No new drawing code: the readings become a
   one-column dataset and go to `Histogram`, `DotPlot` or `BoxPlot` (D-043, D-044).

2. **Its description is regenerated on every edit** rather than authored once, because the picture changes under the
   learner's hands. A box plot's words carry all five of its numbers (D-049) and a histogram states its bin width,
   which a finished histogram never shows (D-047) — both kept by construction, both probed. (D-053)

3. **Three kinds are offered and two are refused with reasons.** A bar chart needs a name per bar, a scatterplot a
   second measurement per reading; the bench has neither, so it says so instead of offering a control that draws a
   wrong picture.

4. **Comparison asks three questions and answers each separately.** Two channels sharing a median are reported as
   agreeing on centre and differing on spread — "A comparison that stopped at the agreeing measure would have called
   them the same." Shape is read as `l.r2-skew` reads it, so the bench cannot contradict the lesson.

## Corrections made during the unit

1. **Two statistics were living in views.** `buildBins` was defined in `Histogram.tsx` and `stackDots` in
   `DotPlot.tsx`. The core cannot import a `.tsx`, so the compiler surfaced it the moment the bench needed to draw its
   own readings. Both moved to `src/core/statistics/binning.ts`; `stackDots` is now built on the `frequencyTable` it
   had been duplicating. **D-051's audit did not catch them because it knew only the names the core already owned** —
   a guard written from an inventory inherits that inventory's gaps (D-052). Both names are now in the list.

2. **My own test asserted guessed quartiles.** Channel B's halves give 7 / 8 / 10 / 13 / 15, not the 7.5 and 14 the
   first draft expected. The code was right; the expectation was written without doing the arithmetic.

## Verification that the guards have teeth

Seven deliberate probes, all reverted. **Six bite, one was a bad probe and is reported as such:**

| Probe | Result |
|---|---|
| The histogram's words stop stating the bin width | **2 checks fail** (D-047) |
| The description ignores the bin width it was given | **2 checks fail** |
| The bench offers a bar chart it cannot honestly draw | **1 check fails** |
| The comparison answers centre and calls that the comparison | **2 checks fail** |
| Skew is read the wrong way round | **1 check fails** |
| Binning moves back into the view it came from | **1 check fails** — the rule D-052 widened |
| The box plot's words drop a quartile | **0 checks fail — the probe was wrong.** It removed the *labels* while the "box spans 8 to 13" sentence still carried both numbers, so nothing was lost |
| *(paired)* The box plot's words lose the quartile **numbers** | **1 check fails** — the real defect does bite |

## Remaining work

**2 of S2-15's 12 criteria**: saved experiments and exported summaries, in cycle 3, which needs `SAVE_SCHEMA_VERSION`
2 → 3 and a migration.

## Local commit

`4566d93197cb7c51b61d186a26478984fda66b2d`

## Remote verification

```
LOCAL_HEAD  = 4566d93197cb7c51b61d186a26478984fda66b2d
REMOTE_HEAD = 4566d93197cb7c51b61d186a26478984fda66b2d
VERIFIED: MATCH
```

## Next unit

**S2-15 continued — saved experiments and exported summaries.** Not started in this cycle.
