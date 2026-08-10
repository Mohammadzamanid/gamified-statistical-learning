# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-13 — Spread and position lessons (cycle 3: variance, standard deviation, and a formula the model lacked)**

Entered from `04adcd25ef0745d8b06b56096deb307b36e2ae65` (remote-verified, clean tree).

## Objective

Write `l.r2-variance` and `l.r2-standard-deviation` to all 18 of scope §5's requirements, completing S2-13's lessons.

## Result up front

**All 6 of S2-13's lessons are Complete**, and with them `m.r2-spread` and `m.r2-variation` entire. **No stub now
stands between a learner and any written Region 2 lesson.**

**S2-13 remains Partial**, because one criterion is unmet and is not being claimed: distribution comparison, seeded in
cycle 2 at the end of `m.r2-judgement` with S2-14 named as owner (D-041).

## Relevant files

| File | Change |
|---|---|
| `src/shared/schemas/curriculum.ts` | `square-root` formula added, with a range guard for its domain |
| `src/core/curriculum/demonstration.ts` | The readout case for it |
| `src/content/worlds/curriculum.json` | `l.r2-variance` and `l.r2-standard-deviation` written in full |
| `src/content/questions/questions.json` | 243 → **253** authored questions (12 written, 2 seeds replaced) |
| `src/content/questions/misconceptions.json` | 31 → **33** |
| `src/content/questions/remediations.json` | 30 → **32** |
| `tests/helpers/complete-lessons.ts` | 30 → **32** lessons declared Complete |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Min/max, range | **Yes** (cycle 1) |
| 2 | Quartiles | **Yes** (cycle 1) |
| 3 | Percentiles, IQR | **Yes** (cycle 2) |
| 4 | Variance intuition, standard deviation | **Yes** |
| 5 | Distribution comparison | **No** — seeded lesson, owned by S2-14 (D-041) |
| 6 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **523 tests / 37 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass |
| `npm run report:coverage` | Ran — 17 of 41 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **Variance is taught by showing the naive measure fail.** Its demonstration adds one distance above the mean to one
   below, and the readout sits at 0 at every balanced setting. Push both days from 6 out to 15 and it is still 0 — the
   week became far more variable and the measure did not notice. Squaring arrives as the repair for that, not as a
   rule to memorise.

2. **A `square-root` formula was added to the demonstration model.** The scope's sequence for this pair ends in a
   square root and the enum had none, so the demonstration could only have narrated the step while showing something
   else. Arity 1, like `negate`; the exhaustive readout switch found the second half of the change; a matching range
   guard forbids a control feeding a root from reaching below zero. (D-042)

3. **Standard deviation is taught as a change of scale, not a new measure.** One control, the variance in squared
   crates; one readout, the spread in crates. Quadrupling the variance doubles the readout, which is the fact its
   application question turns on: "four times as variable" is a claim the variance supports and the data does not.

## Corrections made during the unit

1. **The banned-word guard caught this cycle's own first draft.** `l.r2-variance`'s narrative intro said the clerk
   "tries the obvious thing"; scope §5 forbids calling an idea obvious, and the check named the lesson and the field.
   Reworded to "the first thing anyone would", along with a concept body that said the same.

2. **One misconception question was written inverted, and would have been inert.** `q.r2-variance-misconception` first
   asked what averaging the raw distances gives — for which the correct answer *is* zero, so a learner holding the
   misconception would have answered correctly and the engine would have had nothing to report. Rewritten to ask for
   the variance, with zero as the declared wrong value. Caught by reading it against D-025 before it was written to
   disk, not by a check.

## Verification that the guards have teeth

Eight deliberate probes, all reverted:

| Probe | Result |
|---|---|
| The square-root control is allowed to go negative | **5 checks fail** (rejected at load) — the guard added with the formula |
| The square-root demonstration is given two controls | **5 checks fail** (rejected at load) |
| The standard-deviation demonstration's stated readout drifts | **1 check fails** |
| The variance misconception loses its declared wrong value | **1 check fails** |
| The root sign is used in prose without being explained | **1 check fails** |
| A lesson calls its idea obvious | **1 check fails** |
| A control on the variance demonstration goes inert | **5 checks fail** |
| The standard-deviation lesson claims a skill it does not practise | **3 checks fail**, two through the save |

## Remaining work

None inside S2-13 except criterion 5, which is a seeded lesson owned by S2-14. The next unit is **S2-14**.

## Local commit

`968bc5865d145e2cbecc082ae0e20ffd55586da7`

## Remote verification

```
LOCAL_HEAD  = 968bc5865d145e2cbecc082ae0e20ffd55586da7
REMOTE_HEAD = 968bc5865d145e2cbecc082ae0e20ffd55586da7
VERIFIED: MATCH
```

## Next unit

**S2-14 — data-visualization lessons.** Not started in this cycle.
