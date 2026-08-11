# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-17 — Region 2 validated content expansion (cycle 3: the spread module, and a convention the bench had wrong)**

Entered from `0732acb83b6fe374cf6b074f3f283b62a5931074` (remote-verified, clean tree).

## Objective

Bring range, quartiles, percentiles, IQR, variance and standard deviation to scope §4.

## Result up front

**S2-17 is Partial: 13 of Region 2's 24 topics now meet §4.** The measured figure moved **24 → 30 of 41 topics**.

| Topic | Available | Reasoning families | Largest shape |
|---|---|---|---|
| `skill.range` | **307** | 4 | 0% |
| `skill.r2-quartiles` | **325** | 4 | 0% |
| `skill.r2-percentiles` | **371** | 4 | 2% |
| `skill.r2-iqr` | **310** | 4 | 0% |
| `skill.r2-variance` | **338** | 5 | 0% |
| `skill.r2-standard-deviation` | **324** | 4 | 0% |

**And the cycle found something bigger than its own topics.** Deciding which variance convention the generators should
answer by exposed that **the laboratory had been reporting the sample variance while the lessons teach the population
one** — D-045's defect in a second measure, shipped since S2-15 (D-060).

## Relevant files

| File | Change |
|---|---|
| `src/content/generators/spread.ts` | **New.** Twenty-one families, reusing the centre module's corpus |
| `src/core/laboratory/experiment.ts` | Reports the **taught** variance denominator (D-060) |
| `src/renderer/screens/LabScreen.tsx`, `src/core/laboratory/shelf.ts` | Labels and export name the convention |
| `tests/unit/{laboratory,laboratory-shelf,centre-generators}.test.ts` | Pinned to the lesson's own published figures |
| `tests/helpers/complete-topics.ts` | 24 → **30** topics declared to meet §4 |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | ≥100 validated interactions per completed Region 2 topic | **Yes for 13 of 24** |
| 2 | Diverse reasoning families (≥4) | **Yes** — four or five each |
| 3 | The remaining 11 Region 2 topics | No — later cycles |
| 4 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **660 tests / 47 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 873.56 kB (224.47 kB gzip) |
| `npm run report:coverage` | Ran — **30 of 41** topics meet §4, up from 24; 9,836 validated generated interactions, 10,177 available |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **The spread module reuses the centre module's corpus outright** — the same catch list has a mean and a range, a
   median and quartiles. Two corpora would be two things to keep true.

2. **Twenty-one families**, eight of them from two small builders, because four topics needed a pairwise comparison
   and six needed a recognition or prediction question and those differ only in what is read off each log.

3. **Both taught conventions are used and pinned**: quartiles as the median of each half (D-045), variance as the
   average of the squared distances (D-060). A generator answering the other way would mark a learner wrong for doing
   what the lesson said.

## Corrections made during the unit

1. **The laboratory reported the sample variance while the lessons teach the population one** (D-060). `l.r2-variance`
   publishes 10 for 3, 5, 9, 11 and 8 for 4, 6, 8, 10, 12; the bench answered 13.33 and 10. Shipped since S2-15 and
   found only by having to choose a convention for the generators. The bench, its labels and its export are corrected
   and pinned to the lesson's own figures. A single reading now reports a variance of 0 — the definition's own answer.

2. **A declared trap coincided with the correct answer.** At the 50th percentile, counting the readings above gives
   the same number as counting those below, so the "mistake" was the right answer and the diagnosis fired on it. It is
   declared conditionally now — the pattern the mode family already needed.

3. **A misconception id I invented did not exist.** `mc.variance-not-squared` is not in the library; the lesson's
   misconception is `mc.distances-average-to-spread`, whose detector wants the wrong value declared under
   `parameters`.

## Verification that the guards have teeth

Seven deliberate probes, all reverted. **All seven bite:**

| Probe | Result |
|---|---|
| The bench goes back to the sample variance | **3 checks fail** |
| The generator uses the sample denominator instead | **5 checks fail** |
| Quartile halves start including the median | **2 checks fail** |
| The IQR is computed from the extremes | **3 checks fail** |
| The percentile counts the readings above instead | **1 check fails** |
| The standard deviation forgets the root | **3 checks fail** |
| The spread families are unregistered | **3 checks fail** |

## Remaining work

**11 of Region 2's 24 topics**: the six graph topics, outliers, skew, comparing distributions, misleading graphs, and
data literacy.

## Local commit

Recorded in `STAGE2_RECONSTRUCTION_BACKLOG.md` on the S2-17 row.

## Next unit

**S2-17 continued — the shape and graph topics.** Not started in this cycle.
