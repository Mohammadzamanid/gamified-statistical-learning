# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-17 — Region 2 validated content expansion (cycle 2: the centre module)**

Entered from `dd6f7e71a67ebdd63055143817f4554cb485a75d` (remote-verified, clean tree).

## Objective

Bring mean, median, mode and choosing measures to scope §4.

## Result up front

**S2-17 is Partial: 7 of Region 2's 24 topics now meet §4.** The measured figure moved **20 → 24 of 41 topics**.

| Topic | Available | Reasoning families | Largest shape |
|---|---|---|---|
| `skill.mean` | **120** | 4 | 2% |
| `skill.median` | **283** | 4 | 0% |
| `skill.r2-mode` | **293** | 4 | 0% |
| `skill.choose-measure` | **263** | 4 | 0% |

## Relevant files

| File | Change |
|---|---|
| `src/content/generators/centre.ts` | **New.** Sixteen families over one corpus of 23 catch lists |
| `src/content/generators/index.ts` | Registers them |
| `tests/unit/centre-generators.test.ts` | **New** — 9 checks pinning the generators' arithmetic to hand-worked values (D-059) |
| `tests/helpers/complete-topics.ts` | 20 → **24** topics declared to meet §4 |
| `docs/{CONTENT_COVERAGE.md,content-coverage.json}` | Regenerated |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | ≥100 validated interactions per completed Region 2 topic | **Yes for 7 of 24** |
| 2 | Diverse reasoning families (≥4) | **Yes** — four each |
| 3 | The remaining 17 Region 2 topics | No — later cycles |
| 4 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **655 tests / 47 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 873.48 kB (224.42 kB gzip) |
| `npm run report:coverage` | Ran — **24 of 41** topics meet §4, up from 20; 7,908 validated generated interactions, 8,249 available |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **One corpus again** (D-058's pattern): 23 catch lists, because a list has a mean, a median and a mode, and
   choosing between them is the fourth topic rather than a fourth corpus.

2. **Sixteen families across eight reasoning patterns** — calculation, multi-step reasoning, prediction, error
   identification, ordering, comparison, recognition, real-world application. Largest single shape: 2%.

3. **The generators' arithmetic is now pinned to hand-worked numbers** (D-059), after two probes showed that two
   agreeing routes prove agreement rather than correctness.

## Corrections made during the unit

1. **I repeated the previous cycle's mistake in a new family.** The mean's error-identification family tagged its
   *correct* option with `mc.sum-not-mean`, firing the diagnosis on a right answer. The same check caught it again.

2. **Then the fix was wrong too, for a different reason.** Moving the tag to the option that agrees with the clerk
   still failed: `mc.sum-not-mean`'s detector is `confused-statistic`, which reads a **number**, so on a choice
   question it can never fire. The declaration was removed rather than forced — a tag that cannot fire inflates a
   count and does nothing else (D-025, D-057). It stays on the numeric family, where the wrong value can be typed.

3. **A rule of mine rejected seven lists out of ten.** The mode family invalidated any list whose first repeated
   figure was already the mode. The question is sound on those lists; only the declared *mistake* has nowhere to
   show. It is declared conditionally now, and the candidates are kept.

## Verification that the guards have teeth

Seven deliberate probes, all reverted. **Five bite, one found a gap now closed and re-probed, one is a stated limit:**

| Probe | Result |
|---|---|
| The mean is computed by dividing by one too few | **4 checks fail** |
| The mode question stops declaring its wrong value | **1 check fails** |
| The choose-measure question recommends the mean for a dragged log | **3 checks fail** |
| A centre topic is declared under §4 without its families | **3 checks fail** |
| The ordering family publishes a shuffled correct order | **3 checks fail** |
| The median is taken from the unsorted list | **0 → 1 check fails** — closed by D-059. It failed nothing because the disagreement turned candidates *invalid* rather than into answer failures, and the topic still cleared 100 on its other families |
| The independent route is replaced by the answer key | **0 checks fail — and no guard was added.** Whether two code paths are independent is a property of how they were written; a test cannot see it. What independence protects — that both are right — is now checked directly |

## Remaining work

**17 of Region 2's 24 topics**: range, quartiles, percentiles, IQR, variance, standard deviation, outliers, skew, the
six graph topics, comparing distributions, misleading graphs, and data literacy.

## Local commit

`e81fc2d66bec46fbebf500f002f3d6e37ac6cdb2`

## Remote verification

```
LOCAL_HEAD  = e81fc2d66bec46fbebf500f002f3d6e37ac6cdb2
REMOTE_HEAD = e81fc2d66bec46fbebf500f002f3d6e37ac6cdb2
VERIFIED: MATCH
```

## Next unit

**S2-17 continued — the spread module.** Not started in this cycle.
