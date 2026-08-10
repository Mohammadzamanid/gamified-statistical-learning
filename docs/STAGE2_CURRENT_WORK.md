# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-14 — Data-visualization lessons (cycle 2: dot plots, box plots, and a bench that contradicted its own lesson)**

Entered from `7ecabc09b180716ea364365a5b47256ef757635f` (remote-verified, clean tree).

## Objective

Build the dot-plot and box-plot renderers, then write `l.r2-dot-plots` and `l.r2-box-plots` to all 18 of scope §5's
requirements.

## Result up front

**S2-14 is Partial: 4 of its 9 lessons are Complete.** Scatterplots, choosing graphs, misleading graphs and comparing
distributions remain.

**The laboratory reported quartiles a learner had just been taught to compute differently.** `src/core/statistics` used
R-7 linear interpolation; `l.r2-quartiles` teaches median-of-halves. They disagree on **every dataset the shipped
lessons use** — the guided question's eight readings give Q1 = 4.5 in the lesson and 4.75 in the core. `LabScreen`
showed the interpolated figures, so a learner checking their own working on the bench was told they were wrong, with
nothing on screen to say why. Found while wiring the box plot, which would have been the third surface showing it.
(D-045)

## Relevant files

| File | Change |
|---|---|
| `src/core/statistics/descriptive.ts` | `quartilesByHalves`, `interquartileRangeByHalves`, `fiveNumberSummary` |
| `src/renderer/screens/LabScreen.tsx` | Reports the taught convention |
| `src/renderer/components/DotPlot.tsx` | **New.** One dot per reading, stacked |
| `src/renderer/components/BoxPlot.tsx` | **New.** Five numbers from `src/core`, one call |
| `src/renderer/components/rendered-visuals.ts` | 2 → **4** drawable kinds |
| `tests/unit/quartile-conventions.test.ts` | **New.** Both conventions pinned, including that they differ |
| `tests/unit/dot-plot.test.ts` | **New.** The stacking the lesson's claims depend on |
| `src/content/*` | 272 authored questions; 37 misconceptions; 36 remediations; 3 datasets |
| `tests/helpers/complete-lessons.ts` | 34 → **36** lessons declared Complete |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Bar charts, histograms | **Yes** (cycle 1) |
| 2 | Dot plots, box plots | **Yes** |
| 3 | Scatterplots | No — next cycle, and it needs a renderer first |
| 4 | Graph selection, truncated axes, bin-width effects, misleading framing | No — later cycles |
| 5 | `l.r2-comparing-distributions` (inherited from S2-13) | No — belongs last |
| 6 | Staged inherited questions cleared | **Partly** — two remain, in scatterplots and misleading graphs |
| 7 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **557 tests / 40 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass |
| `npm run report:coverage` | Ran — 17 of 41 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **Two quartile conventions, named and chosen per surface.** Both are defensible; shipping one in the lessons and
   the other on the instrument panel was the defect. The taught rule now drives the laboratory and the box plot, the
   interpolated one is kept for agreement with spreadsheets, and a test asserts they **differ** on the lessons' own
   data so neither can be folded into the other. (D-045)

2. **A dot-plot renderer that draws dots.** Implemented as individual marks rather than bars of counts — a dot plot
   built as a bar chart would be a histogram with round corners, and the lesson would be describing something not on
   screen.

3. **A box-plot renderer that takes all five numbers from one call** to `fiveNumberSummary`. Computing the pieces
   separately is how a chart ends up drawing its median from one rule and its hinges from another.

4. **Dot plots taught as the picture that keeps every reading**, with its own limit stated: 900 readings that rarely
   repeat make 900 columns one dot high. Box plots taught as five numbers built for comparison, with the mistake the
   picture invites — reading width as quantity — as its misconception.

## Corrections made during the unit

1. **A question in the misconception role declared no misconception, and the audit named it on the first run.** The
   dot-plot lesson's misconception slot held an outlier-reading question with no tag at all, so the role promised a
   challenge the engine could not diagnose. Rewritten as the mode-versus-stack-height question, with
   `mc.dot-height-read-as-value` on the distractor — which is the error the lesson's own mastery question warns
   about, so the slot now carries the misconception the content was already circling.

2. **Removing that question meant removing an objective with it.** `obj.r2-outliers` was declared by the lesson and no
   longer practised by anything it asks; the D-036 check would have caught it, and it was dropped in the same edit.

## Verification that the guards have teeth

Seven deliberate probes, all reverted:

| Probe | Result |
|---|---|
| The taught quartile rule is swapped for the interpolated one | **5 checks fail** |
| The five-number summary stops using one convention throughout | **1 check fails** |
| The crew dataset drifts from the stack heights the lesson states | **2 checks fail** |
| A question declares a `scatter`, which no renderer draws | **1 check fails** |
| The box-plot misconception loses its tagged distractor | **1 check fails** |
| The misconception role holds a question that targets nothing | **2 checks fail** |
| The dot-plot lesson claims outliers again without practising them | **3 checks fail**, two through the save |

## Remaining work

**5 of S2-14's 9 lessons.** Scatterplots needs the last renderer; choosing graphs and misleading graphs follow, and
`l.r2-comparing-distributions` goes last. Two staged inherited questions come out with the lessons that absorb them.

## Local commit

`996d8a3a45b3a83443b9bacabb09d547b522e30f`

## Remote verification

```
LOCAL_HEAD  = 996d8a3a45b3a83443b9bacabb09d547b522e30f
REMOTE_HEAD = 996d8a3a45b3a83443b9bacabb09d547b522e30f
VERIFIED: MATCH
```

## Next unit

**S2-14 continued — scatterplots, with the renderer they need.** Not started in this cycle.
