# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-17 — Region 2 validated content expansion (cycle 4: the pictures, and the last eleven topics)**

Entered from `708ac45ebed488d3d45f45b99610707dab3f1826` (remote-verified, clean tree).

## Objective

Bring the six graph topics, outliers, skew, comparing distributions, misleading graphs and data literacy to scope §4 —
the last eleven of Region 2's twenty-four.

## Result up front

**S2-17 is Complete. Every topic in the curriculum meets scope §4: 41 of 41.** The measured figure has moved
17 → 20 → 24 → 30 → **41** across the unit's four cycles.

| Measure | Value |
|---|---|
| Topics meeting §4 | **41 of 41** |
| Smallest topic | **120** available interactions (floor 100) |
| Fewest reasoning families on any topic | **4** (floor 4) |
| Largest single-shape share anywhere | **37%** (ceiling 50%) |
| Validated generated interactions | **12,889** (6,607 at the start of the unit) |
| Total available | **13,230** |

## Relevant files

| File | Change |
|---|---|
| `src/content/generators/pictures.ts` | **New.** Thirty-four families over the catch lists, plus eleven paired logs for the scatterplots |
| `src/content/generators/index.ts` | Registers them |
| `tests/audit/content-coverage.test.ts` | The zero-generator rule, proved against an empty family set now that no shipped topic exercises it |
| `tests/unit/centre-generators.test.ts` | `skewOf` and `directionOf` pinned to hand-worked cases |
| `tests/helpers/complete-topics.ts` | 30 → **41** topics declared to meet §4 |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | ≥100 validated interactions per completed Region 2 topic | **Yes** — all 24, smallest 120 |
| 2 | Diverse reasoning families | **Yes** — four or more everywhere |
| 3 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **662 tests / 47 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 873.56 kB (224.47 kB gzip) |
| `npm run report:coverage` | Ran — **41 of 41** topics meet §4 |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **One corpus, a fourth time** (D-058): a dot plot, a histogram and a box plot are three pictures of one catch
   list, as its mean, median and mode were three summaries of it. Scatterplots needed the one thing no earlier corpus
   held — pairs — so eleven paired logs were added.

2. **Thirty-four families** across nine reasoning patterns, most of them from three small builders, because the
   families differ chiefly in what is read off each log.

3. **The zero-generator rule was rewritten rather than left vacuous.** With every topic generated, no shipped row
   exercises "a topic with zero generators must be reported as a failure", so it is now proved against a report built
   from no families at all — D-048's habit applied to a check.

## Corrections made during the unit

Every one repeated something already written down, which is the finding worth keeping (D-061).

1. **A family stated a numeric response for a question publishing a choice** — 72 answer failures. The third time in
   four cycles.

2. **Two families built the same question many times over**: a bar-chart prompt that ignored its list (22 exact
   duplicates), and a comparing-distributions prompt keyed only on the median (4).

3. **Two misconception tags could not fire where they were put**: `mc.dot-height-read-as-value` is a
   tagged-distractor and was declared on a numeric question; `mc.axis-misread` was declared with no option expressing
   it. Both removed rather than forced (D-025, D-057). A third, `mc.outlier-mean`, needed an option to sit on and got
   one.

## Verification that the guards have teeth

Eight deliberate probes, all reverted. **Six bite, two found gaps now closed and re-probed:**

| Probe | Result |
|---|---|
| The outlier fence drops the one-and-a-half | **3 checks fail** |
| A box plot's box is described by the whiskers | **3 checks fail** |
| The histogram interval counts readings on both bounds | **1 check fails** |
| The misleading-graphs answer says nothing is wrong | **1 check fails** |
| A topic quietly stops being declared under §4 | **1 check fails** |
| The zero-generator rule is proved against the shipped report again | **1 check fails** |
| The skew direction is read the wrong way round | **0 → 1 check fails** — `skewOf` fed both the answer and its check |
| The scatterplot direction is declared rather than read | **0 → 1 check fails** — same, for `directionOf` |

## Remaining work

None. S2-17 is Complete.

## Local commit

Recorded in `STAGE2_RECONSTRUCTION_BACKLOG.md` on the S2-17 row.

## Next unit

**S2-18 — the Region 2 boss investigation.** Not started in this cycle.
