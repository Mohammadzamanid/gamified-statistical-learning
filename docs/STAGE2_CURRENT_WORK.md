# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-13 — Spread and position lessons (cycle 2: percentiles, IQR, and a criterion with nowhere to live)**

Entered from `ddebf441fe47e338e0ffc5e78cfbfede21feac3c` (remote-verified, clean tree).

## Objective

Write `l.r2-percentiles` and `l.r2-iqr` to all 18 of scope §5's requirements, completing `m.r2-spread`.

## Result up front

**S2-13 is Partial: 4 of its 6 lessons are Complete, and `m.r2-spread` is finished entire.** Variance and standard
deviation remain.

**One criterion had no home in the curriculum at all, and now has one.** "Distribution comparison" is named in S2-13's
scope and again in the boss's stage 5, and Region 2 had no lesson, no topic and no skill for it — so the criterion could
not have been met by finishing existing work, and the boss stage the spec promises could not legally have been built
(D-028 forbids a boss asking about a skill no lesson in its region teaches). This cycle adds the skill, objective,
declared topic and a **seeded** lesson at the end of `m.r2-judgement`. **The criterion is still unmet**; what changed is
that it is now possible to meet, and S2-14 is named as owner. (D-041)

## Relevant files

| File | Change |
|---|---|
| `src/content/worlds/curriculum.json` | `l.r2-percentiles` and `l.r2-iqr` written in full; `l.r2-comparing-distributions` seeded |
| `src/content/questions/questions.json` | 232 → **243** authored questions (12 written, 2 seeds replaced, 1 seed added) |
| `src/content/questions/misconceptions.json` | 29 → **31** |
| `src/content/questions/remediations.json` | 28 → **30** |
| `tests/helpers/region2-topics.ts` | 22 → **23** declared topics |
| `tests/audit/region2-architecture.test.ts` | Both declared counts updated deliberately |
| `tests/helpers/complete-lessons.ts` | 28 → **30** lessons declared Complete |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Min/max, range | **Yes** (cycle 1) |
| 2 | Quartiles | **Yes** (cycle 1) |
| 3 | Percentiles, IQR | **Yes** |
| 4 | Variance intuition, standard deviation | No — next cycle; SD must be built as distances → squared distances → their average → square root |
| 5 | Distribution comparison | **No** — the lesson now exists as a seed; writing it is S2-14's (D-041) |
| 6 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **517 tests / 37 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass |
| `npm run report:coverage` | Ran — **17 of 41** topics meet §4; the denominator grew by the new skill, so the ratio fell without any topic losing coverage |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **Percentiles are taught as a statement about company, not size.** The demonstration chalks a mark and reports what
   share of the log sits at or below it; the prediction then logs twenty more readings, all above the mark, and the
   mark falls from the 77.5th percentile to the 62nd without moving a centimetre. The formal notation introduces P25,
   P50 and P75 beside the Q1/Q2/Q3 the previous lesson explained, so the two namings meet.

2. **The IQR is built as the answer to the range's complaint.** `l.spread-1` ended on the range being decided by the
   two readings most likely to be strange. This demonstration covers both outer quarters and measures what is left,
   then re-prices the harbour's dearest berth from 60 coins to 600: the range would jump by 540 and the readout does
   not move. Its teach-back asks what the measure hides, because a lesson that only sells its measure is advocacy.

3. **Two new misconceptions, both engine-reportable from a numeric answer.** `mc.percentile-counts-above` — counting
   from the wrong side, which yields the complement and looks plausible near the middle. `mc.iqr-uses-the-extremes` —
   computing the range and calling it the IQR, which is the same shape of arithmetic on the wrong pair of numbers.

## Corrections made during the unit

1. **The curriculum has no `topics` array.** The first draft of the authoring script appended one, on the assumption
   that a declared topic must exist as data. Topics are derived from the curriculum graph — skill, objective, lesson —
   and `tests/helpers/region2-topics.ts` is the declared list. Caught before it was written to disk.

2. **The coverage denominator moved.** Adding a skill takes §4's topic count from 40 to 41, so the report now reads
   17 of 41. No topic lost coverage; the ratio fell because the population grew. Recorded because the number is
   reported every cycle and an unexplained drop would read as a regression.

## Verification that the guards have teeth

Eight deliberate probes, all reverted:

| Probe | Result |
|---|---|
| The new topic vanishes from the declared list | **2 checks fail** |
| The comparing-distributions seed grows without being declared Complete | **1 check fails** |
| The new skill ships with no stage classification | **5 checks fail** (rejected at load) |
| The new lesson stops reaching its own topic's skill | **1 check fails** |
| The percentile misconception loses its declared wrong value | **1 check fails** |
| The IQR demonstration's stated readout drifts from its formula | **1 check fails** |
| The percentile notation shows a symbol it does not explain | **1 check fails** |
| A control on the percentile demonstration goes inert | **5 checks fail** |

## Remaining work

**2 of S2-13's 6 lessons**: variance and standard deviation, which are `m.r2-variation`'s first two and the last stubs
standing between a learner and the outlier and skew lessons S2-12 wrote. Plus criterion 5, now a seeded lesson owned by
S2-14.

## Local commit

`PENDING`

## Remote verification

`PENDING`

## Next unit

**S2-13 continued — variance and standard deviation.** Not started in this cycle.
