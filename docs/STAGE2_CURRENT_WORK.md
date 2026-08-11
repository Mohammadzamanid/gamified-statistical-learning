# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-17 — Region 2 validated content expansion (cycle 1: the counts module)**

Entered from `92206de602b42768ca1143f9668b257203b89b65` (remote-verified, clean tree).

## Objective

Bring Region 2's first three topics — frequency, proportion, percentage — to scope §4: at least 100 validated
available interactions each, across at least four reasoning families, with no single shape above half.

## Result up front

**S2-17 is Partial: 3 of Region 2's 24 topics now meet §4.** The measured figure moved **17 → 20 of 41 topics**, the
first Region 2 topics ever to pass. Each of the three has five reasoning families and a largest-shape share of 1–2%,
far under the 50% ceiling.

| Topic | Available | Reasoning families | Largest shape |
|---|---|---|---|
| `skill.r2-frequency` | **124** | 5 | 1% |
| `skill.r2-proportion` | **143** | 5 | 2% |
| `skill.r2-percentage` | **143** | 5 | 2% |

## Relevant files

| File | Change |
|---|---|
| `src/content/generators/counts.ts` | **New.** Ten families over one corpus of ten season logs |
| `src/content/generators/index.ts` | Registers them |
| `tests/helpers/complete-topics.ts` | 17 → **20** topics declared to meet §4 |
| `docs/{CONTENT_COVERAGE.md,content-coverage.json}` | Regenerated |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | ≥100 validated interactions per completed Region 2 topic | **Yes for 3 of 24** — frequency, proportion, percentage |
| 2 | Diverse reasoning families (≥4) | **Yes** — five each |
| 3 | The remaining 21 Region 2 topics | No — later cycles |
| 4 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **646 tests / 46 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 873.48 kB (224.42 kB gzip) |
| `npm run report:coverage` | Ran — **20 of 41** topics meet §4, up from 17; 6,993 validated generated interactions, 7,334 available |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **One corpus, three topics** (D-058). Ten season logs — sea state, gear, berth, grade, weather, crew, buyer,
   repairs, tide — feed all three, because a frequency, a proportion and a percentage are three readings of the same
   tally. The traps are shared for the same reason.

2. **Ten families across six reasoning patterns**: calculation, comparison, multi-step reasoning, error
   identification, visual interpretation, representation conversion, real-world application. No topic leans on one
   shape; the highest share is 2%.

3. **Every generated question carries the module's misconception where its detector can report it.**
   `mc.frequency-counts-categories` is a `known-wrong-answer`, so on the numeric families the wrong value is declared
   under `parameters`; on the error-identification family it is a tagged distractor.

## Corrections made during the unit

All four were mine, and each was caught by a check an earlier unit added.

1. **The chart family stated a numeric response for a question that publishes a choice** — 24 answer failures.
   Visible only because `expectedResponse` is stated by the family and never read back out of the question (D-020).

2. **The application family computed the share instead of stating it**, so the proportion and percentage versions
   built the identical question — 9 exact duplicates. It now gives the share in each form's own language.

3. **The error-identification family tagged its *correct* option with the misconception**, so the diagnosis fired on a
   right answer. The learner holding it agrees with the clerk, so the tag belongs on the option saying the clerk was
   right. Note this is the case S2-16's D-057 rule cannot catch: the tag was triggerable, it was on the wrong side.

4. **Two categories of equal column height gave the learner two identical options.** Those candidates are invalid now,
   with that reason — the raw-versus-valid distinction §4 asks for.

## Verification that the guards have teeth

Six deliberate probes, all reverted. **All six bite:**

| Probe | Result |
|---|---|
| A family states an answer its question does not publish | **3 checks fail** |
| The percentage family reports the proportion instead | **3 checks fail** |
| The frequency trap value becomes the correct answer | **1 check fails** |
| A topic with no generator is declared Complete under §4 | **3 checks fail** |
| The counts families are unregistered | **3 checks fail** |
| The ambiguous chart candidates come back | **1 check fails** |

## Remaining work

**21 of Region 2's 24 topics.** Centre (mean, median, mode, choosing measures), spread (range, quartiles, percentiles,
IQR, variance, standard deviation), shape (outliers, skew), the six graph topics, comparing distributions, misleading
graphs, and data literacy.

## Local commit

Recorded in `STAGE2_RECONSTRUCTION_BACKLOG.md` on the S2-17 row.

## Next unit

**S2-17 continued — the centre module.** Not started in this cycle.
