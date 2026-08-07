# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-09 — Region 1 validated content expansion (cycle 3: ratios, the position group, and misconceptions that fire)**

Entered from `0c74f185240722203cea40e440a6d1928a9f2464` (remote-verified, clean tree).

## Objective

Take ratios and the position group — negatives, number lines, coordinates — past the
`STAGE2_RECONSTRUCTION_SCOPE.md` §4 bar, and make the misconception-mapping half of §4 mean something: until this cycle
every shipped generator declared an empty list, so only the *rejecting* side of that gate had ever run.

## Result up front

**S2-09 remains Partial.** **13 of the 22 curriculum topics** now meet §4, up from 9. The other **9 are reported as
failures with reasons**. Every Region 1 topic outside the data group now passes.

| Topic | Total available | Reasoning families | Largest single shape |
|---|---:|---:|---:|
| Counting | 855 | 8 | 12% |
| Addition | 807 | 8 | 10% |
| Subtraction | 804 | 8 | 10% |
| Multiplication | 768 | 8 | 10% |
| **Ratios** | **460** | **8** | **22%** |
| **Coordinates** | **329** | **6** | **17%** |
| Division | 291 | 6 | 13% |
| Fractions / Decimals / Percentages / Proportions | 271 each | 6 | 37% |
| **Negative numbers** | **174** | **6** | **26%** |
| **Number lines** | **162** | **5** | **18%** |

**5,642 validated generated interactions** (was 4,545).

## Relevant files

| File | Change |
|---|---|
| `src/content/generators/ratios.ts` | **New.** Eight families; the first generator to declare misconceptions |
| `src/content/generators/position.ts` | **New.** Seventeen families across negatives, number lines and coordinates |
| `src/content/generators/index.ts` | Both modules wired in |
| `tests/helpers/complete-topics.ts` | The four new topics declared Complete under §4 |
| `tests/audit/content-coverage.test.ts` | 29 checks (was 27): the engine-driven misconception audit |
| `docs/CONTENT_COVERAGE.md`, `docs/content-coverage.json` | Regenerated |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | ≥100 validated interactions per completed topic | **No — 13 of 22 topics.** The other 9 are reported as failures |
| 2 | Multiple reasoning families per completed topic | Yes — 5 to 8 each, against a required 4 |
| 3 | Duplicate and near-duplicate gates | Yes |
| 4 | Misconception mappings validated | Yes — **and now exercised on the accepting side**, by the real engine |
| 5 | Accessibility descriptions validated | Yes |
| 6 | Machine- and human-readable reports | Yes — regenerated this cycle |
| 7 | Topic list from the curriculum, zero-generator topics reported as failures | Yes |
| 8 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **413 tests / 33 files** (was 411 / 33) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 538.47 kB (143.72 kB gzip) |
| `npm run report:coverage` | Ran — 13 of 22 topics meet §4 |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **A declared misconception now has to be one the engine can actually report.** Every generated question that
   declares one is driven through the real evaluator and the real classifier with the answer a learner holding that
   misconception would give, and the engine has to name it. Four separate ways of getting this wrong each fail that
   check — see the probe table.

2. **Which misconception can go on which question is decided by its detector, not by its subject.**
   `mc.negative-magnitude` is detected from a **tagged distractor**, so it appears only on multiple-choice;
   `mc.tick-counted-not-scaled` and `mc.axes-swapped` are classified **geometrically from a placement**, so they appear
   only on point-placement — as a `misconceptionPoints` entry and as `swappedAxesMisconceptionId`. The coordinates
   recognition family deliberately declares *nothing*, because a tag naming a point detector on a multiple-choice would
   be inert. This is written down as D-025.

3. **Symmetric cases are rejected, not shipped.** Placing (4, 4) the wrong way round gives the same point, so a
   swapped-axes misconception could never fire there. 40 coordinate combinations are rejected for that reason, with it
   stated.

4. **Ratios is the topic the part/whole module could not cover**, because a ratio is not a part of a whole. Its two
   named misconceptions both become answerable options: the share-of-the-whole family offers `3/5` where `3/8` is
   right, and the scaling family offers the mix grown by adding rather than multiplying.

## Corrections made during the unit

1. **Every rejection guard in the first `ratios.ts` was dead code.** The report said `invalidCombinations: 0` — not a
   pass, an absence. The mix grid contained no equal-parts mix, and the range limits were set well above anything the
   grid could reach, so four guards were decoration. Equal-parts mixes were added deliberately and the limits tied to
   the range the lesson's own demonstration shows; 15 combinations are now rejected across four live reasons.

2. **Two guards in `position.ts` could never fire either** — "counting the marks lands on the right value" needs a line
   whose step is one, and every scale in the list steps by more than one. Removed rather than left as ornament, with
   the reason recorded where they were.

3. **A first attempt tagged `mc.axes-swapped` on a multiple-choice distractor.** It reads correctly and would never
   have worked: that misconception is classified from placement geometry, so on a choice question the tag would inflate
   a mapping count and reach no learner. Caught while wiring the detectors, then made unmissable by check 1 above.

## Verification that the guards have teeth

Six deliberate probes, all reverted. All six bit on the first run:

| Probe | Result |
|---|---|
| A misconception declared with no way for a learner to express it | **1 check fails** |
| The misconception tag moved onto the correct option | **1 check fails** |
| The tick-counting wrong placement set to the right position | **1 check fails** |
| Symmetric coordinate pairs no longer rejected | **1 check fails** |
| Ratio scaling done by adding instead of multiplying | **3 checks fail** |
| A topic that does not clear the bar declared Complete | **3 checks fail** |

## Open finding, measured not fixed

**One authored question declares a misconception the engine can never report.** `q.error-id-causation` declares
`mc.correlation-causation`, whose detector is `tagged-distractor`, but none of its three options carries the tag — the
misconception *is* the correct answer there. Measured by driving the real engine with every wrong choice, every
detector's own declared trigger value, and every single-item misplacement: 46 authored declarations, 45 reachable, that
one not. It is a Region 2 data-literacy question and fixing it means redesigning its options, so it belongs to
**S2-17**, not to a cycle about Region 1 generators. Recorded in the backlog.

## Remaining work

**9 of 22 topics do not meet §4**, all for the same reason: no generator families yet.

- Region 1, 4 topics — the data group: tables, variables, cases, categorical/numerical. All four need a **dataset** to
  read from, which none of the three generator modules so far has needed. That is the next cycle.
- Region 2 inheritance, 5 topics: mean, median, range, choosing measures, data literacy. These belong to S2-17.

## Local commit

Recorded in the follow-up commit below.

## Remote verification

Recorded in the follow-up commit below.

## Next unit

**S2-09 continued — generators for the data group.** Not started in this cycle, per the one-unit-per-cycle rule.
