# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-14 — Data-visualization lessons (cycle 4: choosing graphs, misleading graphs, and the end of a temporary rule)**

Entered from `c14d5e7c1574c5a8c7817b310dac1284b89588ff` (remote-verified, clean tree).

## Objective

Write `l.r2-choosing-graphs` and `l.r2-misleading-graphs` to all 18 of scope §5's requirements, and clear the last
staged inherited question.

## Result up front

**S2-14 is Partial: 8 of its 9 lessons are Complete.** Every graph lesson is written. Only
`l.r2-comparing-distributions` remains — inherited from S2-13, and belonging last because it draws on everything.

**Staged inheritance is finished, and the mechanism is deleted.** `STAGED_INHERITED` carried an audit clause requiring
its own removal once empty, and a ceiling tightened at each clearance — 4, then 2, then 1. `q.error-id-causation` took
the misconception role in `l.r2-misleading-graphs`, the map emptied, and the helper and its whole audit block went with
it. (D-048)

## Relevant files

| File | Change |
|---|---|
| `src/shared/schemas/question.ts` | `axisMin` and `binWidth`, each rejected on the kinds they mean nothing to |
| `src/renderer/components/BarChart.tsx` | Honours `axisMin`; zero stays the default |
| `tests/audit/interaction-audit.test.ts` | A presentation setting must be stated in the chart's words, both ways |
| `tests/unit/scatter-plot.test.ts` | The port landings both lessons argue from |
| `tests/helpers/staged-inherited.ts` | **Deleted**, with its audit block |
| `src/content/*` | 285 authored questions; 39 misconceptions; 38 remediations; 5 datasets |
| `tests/helpers/complete-lessons.ts` | 37 → **39** lessons declared Complete |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Bar charts, histograms | **Yes** (cycle 1) |
| 2 | Dot plots, box plots | **Yes** (cycle 2) |
| 3 | Scatterplots | **Yes** (cycle 3) |
| 4 | Graph selection | **Yes** |
| 5 | Truncated axes, bin-width effects, misleading framing | **Yes** — drawn, not described |
| 6 | `l.r2-comparing-distributions` (inherited from S2-13) | No — belongs last |
| 7 | Staged inherited questions cleared | **Yes** — and the mechanism deleted |
| 8 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **570 tests / 41 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass |
| `npm run report:coverage` | Ran — 17 of 41 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **The misleading-graphs lesson draws a truncated chart rather than describing one.** `VisualSpec` gained `axisMin`
   and `binWidth` — the two presentation choices the lesson criticises — each rejected by the schema on kinds it means
   nothing to. Five ports landing 48 to 53 crates are shown from an axis starting at 47, where the tallest bar stands
   six times the shortest from a real difference of about a tenth, and again from zero, where they are level. (D-047)

2. **Choosing a graph is taught as choosing a loss.** Its demonstration reports how many readings share each distinct
   value: at 5.00 a dot plot reads clearly, and at 1.00 — the surveyor measuring to the centimetre — every column is
   one dot high and the picture says nothing. That is the boundary where pooling into intervals stops costing
   anything, stated as a number rather than a rule of thumb.

3. **The staging mechanism reached its declared end and was deleted.** Not merely emptied: helper, audit block and the
   `1 + staged.length` allowance all removed, and skeleton honesty is back to the single line it was before. (D-048)

## Corrections made during the unit

1. **The matching question was written against the wrong schema shape.** `MatchingAnswerSchema` requires both sides to
   be declared ids, and the right-hand options live in a `rightItems` array rather than as free text on the pair.
   Caught before it reached disk by reading an existing matching question rather than assuming.

2. **My own new check flagged the honest chart.** The reverse rule — prose claiming a truncated axis must have the
   setting behind it — matched "starting at zero", which is the honest default saying so out loud. The pattern was too
   eager, not the content wrong; it now means a start that is not zero.

## Verification that the guards have teeth

Seven deliberate probes, all reverted. **Four bite, two found gaps now closed and re-probed, one repeated a wrong
hypothesis from last cycle:**

| Probe | Result |
|---|---|
| `axisMin` is set on a histogram, where it means nothing | **8 checks fail** (rejected at load) |
| `binWidth` is set on a bar chart, where it means nothing | **8 checks fail** (rejected at load) |
| The truncated chart is redrawn from zero while the prose still describes it | **0 → 1 check fails** — the gap this cycle's most important guard closes |
| The port dataset drifts from the figures the lesson quotes | **0 → 2 checks fail** — closed by a dataset test, as for the other four datasets |
| The promoted causation question loses the lesson's skill | **0 checks fail — the probe was wrong again.** The lesson also declares `obj.read-data`, which that question practises. The same wrong hypothesis as cycle 3; a lesson may teach more than its title |
| The truncated-axis misconception loses its tagged distractor | **1 check fails** |
| The last seeded lesson grows past its seed | **1 check fails** — the rule the staging deletion restored |

## Remaining work

**1 of S2-14's 9 lessons**: `l.r2-comparing-distributions`, which meets S2-13's outstanding criterion 5 and makes the
boss's stage 5 legal under D-028. It needs no new renderer.

## Local commit

`PENDING`

## Remote verification

`PENDING`

## Next unit

**S2-14 continued — `l.r2-comparing-distributions`, the last lesson of Region 2's teaching.** Not started in this
cycle.
