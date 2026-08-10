# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-14 — Data-visualization lessons (cycle 1: bar charts, histograms, and a renderer that drew one chart in eight)**

Entered from `b9a6911172790ae07cd2a3442bc819a6c0baa7e8` (remote-verified, clean tree).

## Objective

Establish what the build can actually draw, then write `l.r2-bar-charts` and `l.r2-histograms` to all 18 of scope §5's
requirements.

## Result up front

**S2-14 is Partial: 2 of its 9 lessons are Complete.** Dot plots, box plots, scatterplots, choosing graphs, misleading
graphs and comparing distributions remain.

**The visual system promised more than it delivered, and the graph lessons are the first content that would have walked
into it.** `VisualSpecSchema` accepts eight visual kinds; `QuestionScreen` drew exactly one. A question declaring
`histogram` or `box-plot` passed every check in the repository and then rendered nothing — no chart, and no text
either, since the accessible description is carried by the chart component. Nothing had shipped in that state only
because no content had used those kinds. Fixed by the device interactions already had: a declared list of what the
screen draws, consulted by the screen and defended by an audit. (D-043)

## Relevant files

| File | Change |
|---|---|
| `src/renderer/components/rendered-visuals.ts` | **New.** The kinds the screen can draw |
| `src/renderer/components/Histogram.tsx` | **New.** Touching bars over binned intervals |
| `src/renderer/screens/QuestionScreen.tsx` | Histograms drawn; a notice where a dataset fails to load |
| `src/shared/schemas/question.ts` | `VisualSpec` type exported |
| `tests/audit/interaction-audit.test.ts` | Three checks binding content to what renders |
| `tests/unit/histogram.test.ts` | **New.** The binning the lesson's claims depend on |
| `src/content/datasets/datasets.json` | 1 → **2** datasets |
| `src/content/questions/questions.json` | 253 → **262** authored questions |
| `src/content/questions/misconceptions.json` | 33 → **35**; remediations 32 → **34** |
| `tests/helpers/staged-inherited.ts` | 4 → **2** staged questions; ceiling tightened to match |
| `tests/helpers/complete-lessons.ts` | 32 → **34** lessons declared Complete |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Bar charts, histograms | **Yes** |
| 2 | Dot plots, box plots, scatterplots | No — later cycles, and each needs a renderer first |
| 3 | Choosing graphs, misleading graphs | No — later cycles |
| 4 | `l.r2-comparing-distributions` (inherited from S2-13) | No — belongs last, after the graph lessons it draws on |
| 5 | Staged inherited questions cleared | **Partly** — `l.r2-bar-charts` cleared; two remain in scatterplots and misleading graphs |
| 6 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **538 tests / 38 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass |
| `npm run report:coverage` | Ran — 17 of 41 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **A declared list of drawable visual kinds, defended by an audit.** Three checks: no shipped question may name a
   kind with no renderer; every shown visual must name a dataset that exists and carry words for a reader who cannot
   see it; and the list must remain a subset of the schema, so the gap it describes stays real. (D-043)

2. **A histogram renderer**, separate from `BarChart` rather than a flag on it. Its bars touch and have no inset,
   because a chart drawn with gaps while the lesson explains that histograms have none would teach one thing and show
   another. Binning lives in the component and is exported and unit-tested against the shipped dataset — the lesson
   asserts exact bin contents, and those claims are only true if the code produces them. (D-044)

3. **Bar charts taught as lengths, and the gaps taught as meaning.** Its demonstration compares two bars as a ratio,
   and raising the *shorter* bar changes the comparison while the taller one stands still. `mc.bar-gap-means-missing`
   catches the reading that the spaces are absent data.

4. **Histograms taught as intervals, and bin width taught as a choice.** The demonstration doubles the bin width and
   halves the bar count with no reading added or removed — the hinge the misleading-graphs lesson will turn on.

5. **The first staged debt is paid.** `q.graph-tallest-bar` and `q.dd-build-bar-chart` have roles and the lesson's
   skill, and their entry is gone from `STAGED_INHERITED`. The ceiling in the audit came down from 4 to 2 with them,
   so the list can still only shrink.

## Corrections made during the unit

1. **I orphaned a seed question rather than deleting it.** `q.seed.r2-bar-charts` stopped being asked when the lesson's
   question list was rewritten, and stayed in `questions.json` reachable by nobody. The reachability audit named it on
   the first run. The established pattern is that a seed is replaced *and* removed; this is the second time that
   second half has been the easy one to forget.

## Verification that the guards have teeth

Seven deliberate probes, all reverted:

| Probe | Result |
|---|---|
| A question declares a chart no renderer draws | **1 check fails** |
| …the same content, with `box-plot` declared drawable | **0 checks fail** — the paired probe, proving the list does the work |
| A chart loses its accessible description | **6 checks fail** (rejected at load) |
| A chart names a dataset that is not there | **1 check fails** |
| The staging list is cleared without the question being given a role | **1 check fails** |
| The dataset drifts from the bin counts the lesson states | **1 check fails** |
| The bar-chart misconception loses its tagged distractor | **1 check fails** |

## Remaining work

**7 of S2-14's 9 lessons.** Dot plots, box plots and scatterplots each need a renderer built before their lesson can be
written honestly — that is now a visible cost rather than a silent one. Choosing graphs and misleading graphs follow,
then `l.r2-comparing-distributions` last, which is what meets S2-13's criterion 5 and makes the boss's stage 5 legal.

## Local commit

`c1b949a7978e08e8ba87f065514c5e99b01f1ffb`

## Remote verification

```
LOCAL_HEAD  = c1b949a7978e08e8ba87f065514c5e99b01f1ffb
REMOTE_HEAD = c1b949a7978e08e8ba87f065514c5e99b01f1ffb
VERIFIED: MATCH
```

## Next unit

**S2-14 continued — dot plots and box plots**, each with the renderer it needs. Not started in this cycle.
