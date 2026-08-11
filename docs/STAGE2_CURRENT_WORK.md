# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-14 — Data-visualization lessons (cycle 3: scatterplots, and a chart that would have drawn a perfect lie)**

Entered from `a6c284466110c0b488c36ae41bd784b61cf6bfd3` (remote-verified, clean tree).

## Objective

Build the scatter renderer, write `l.r2-scatterplots` to all 18 of scope §5's requirements, and clear the question
staged in it since S2-12.

## Result up front

**S2-14 is Partial: 5 of its 9 lessons are Complete, and `m.r2-pictures` is finished entire.** Graph selection,
misleading graphs and comparing distributions remain.

**Staged inheritance is down to one.** `q.point-thursday-catch` became this lesson's guided practice rather than
being parked in it; only `q.error-id-causation` in `l.r2-misleading-graphs` is left.

## Relevant files

| File | Change |
|---|---|
| `src/renderer/components/ScatterPlot.tsx` | **New.** Two columns, resolved explicitly and refused when absent |
| `src/renderer/components/rendered-visuals.ts` | 4 → **5** drawable kinds |
| `tests/audit/interaction-audit.test.ts` | A visual's dataset must be able to feed its chart kind |
| `tests/unit/scatter-plot.test.ts` | **New.** The pairing, and the refusal |
| `src/content/*` | 276 authored questions; 38 misconceptions; 37 remediations; 4 datasets |
| `tests/helpers/staged-inherited.ts` | 2 → **1** staged question; ceiling tightened to match |
| `tests/helpers/complete-lessons.ts` | 36 → **37** lessons declared Complete |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Bar charts, histograms | **Yes** (cycle 1) |
| 2 | Dot plots, box plots | **Yes** (cycle 2) |
| 3 | Scatterplots | **Yes** |
| 4 | Graph selection, truncated axes, bin-width effects, misleading framing | No — next cycles; no new renderer needed |
| 5 | `l.r2-comparing-distributions` (inherited from S2-13) | No — belongs last |
| 6 | Staged inherited questions cleared | **Partly** — one remains, in misleading graphs |
| 7 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **567 tests / 41 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass |
| `npm run report:coverage` | Ran — 17 of 41 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **A scatter renderer that refuses rather than guesses.** Every other chart reads the first numeric column and
   ignores the rest; this is the first needing two. Taking "the next numeric column, or the first again" would plot a
   one-variable dataset against itself and draw a flawless diagonal — in a lesson about reading a relationship out of
   a cloud, the worst available failure. `numericPair` returns null instead, and a unit test pins the refusal.
   (D-046)

2. **Scatterplots taught as one point carrying two readings**, with the pattern located in the cloud rather than in
   any point, and association separated from cause. The demonstration reads a boat's catch per hour, so the fleet's
   odd trip — nine hours for six crates — is a number the learner computes rather than a dot they are told about.

3. **The staged question was promoted, not just moved.** `q.point-thursday-catch` plots a point on a day-against-catch
   grid, which is the construction the lesson opens on, so it became the guided practice. That obliged it to gain the
   worked steps every guided question owes, and the lesson's skill so answering it schedules review.

## Corrections made during the unit

1. **A remediation pointed at a question that does not exist.** `rem.a-point-carries-two` named `q.r2-scatterplots`,
   an id I never created — the lesson's guided slot is the inherited question. Caught by cross-reference validation on
   the first run, and repointed at `q.point-thursday-catch`, which is where a learner who read one coordinate should
   in fact be sent.

2. **The promoted question had hints but no worked steps**, which requirement 11 demands of guided practice. Written
   as the two readings a scatterplot point carries, so the steps teach the lesson's own point rather than just
   satisfying the check.

## Verification that the guards have teeth

Seven deliberate probes, all reverted. **Five bite; one found a gap now closed; one was itself wrong** — recorded
rather than dressed up:

| Probe | Result |
|---|---|
| The scatter pairs a single numeric column with itself | **2 checks fail** |
| A scatter question names a dataset with one numeric column | **0 → 1 check fails** — the gap; the check was added and re-probed |
| The trip dataset drifts from the readings the lesson quotes | **1 check fails** |
| The last staging entry is cleared while its question is still parked | **2 checks fail** |
| The promoted question loses its worked steps | **1 check fails** |
| The scatter misconception loses its tagged distractor | **1 check fails** |
| The promoted question loses the lesson's skill | **0 checks fail — the probe was wrong.** The lesson also declares `obj.read-data`, which that question genuinely practises, so it still carries a taught skill. No defect; no guard needed |

## Remaining work

**4 of S2-14's 9 lessons**, none of which needs a new renderer: graph selection and misleading graphs choose among the
five charts now built, and `l.r2-comparing-distributions` goes last. One staged question comes out with misleading
graphs.

## Local commit

`PENDING`

## Remote verification

`PENDING`

## Next unit

**S2-14 continued — choosing graphs and misleading graphs.** Not started in this cycle.
