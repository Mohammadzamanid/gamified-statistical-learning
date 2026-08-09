# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-12 — Central tendency lessons (cycle 2: `m.r2-centre`, and a gap in requirement 13)**

Entered from `d8b6b51653ea7f57abca9e239fa1127f279871f5` (remote-verified, clean tree).

## Objective

Write `m.r2-centre` — mean, median, mode and choosing a measure — to all 18 of scope §5's requirements.

## Result up front

**S2-12 remains Partial.** **5 of its 9 lessons are Complete**, up from 3: `m.r2-counts` entire, plus **mode** and
**choosing a measure**.

**The two Stage 1 lessons in this module were not re-cut, and that is a scope finding rather than a shortfall of
effort.** `l.reading-tallies` and `l.middle-harbor` carry 13 and 10 inherited questions, and several of those teach
percentages, bar charts and data literacy rather than centre. A Complete lesson must account for *every* question it
asks — role, skill, explanation, text equivalent — so declaring these two Complete means first **redistributing that
content to the Region 2 lessons whose topics it actually serves**. That is design work with consequences for four other
lessons, not a formatting pass, and doing it badly to close a cycle would have been worse than saying so.

Both lessons did gain this cycle's eight new mean and median questions, so the work is reachable and playable; they are
simply not declared Complete.

## Relevant files

| File | Change |
|---|---|
| `src/content/worlds/curriculum.json` | `l.r2-mode` and `l.r2-choosing-measures` written in full |
| `src/content/questions/questions.json` | 194 → **212** authored questions |
| `src/content/questions/misconceptions.json` | 25 → **26** |
| `src/content/questions/remediations.json` | 24 → **25** |
| `tests/audit/lesson-structure.test.ts` | **Requirement 13 now drives the real engine** |
| `tests/helpers/complete-lessons.ts` | Two lessons declared; the two deferrals recorded with their reason |
| `tests/integration/session-flow.test.ts` | Answers for the questions the mean lesson gained |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Frequency, proportion, percentage | **Yes** (cycle 1) |
| 2 | Mean, median, mode, measure selection | **Partly** — mode and measure selection yes; mean and median deferred, reason above |
| 3 | Outlier effects, skew effects | No — `m.r2-variation`, a later cycle |
| 4 | Draggable/editable datasets | No — control-driven demonstrations; editable datasets are S2-15 |
| 5 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **466 tests / 36 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass |
| `npm run report:coverage` | Ran — 17 of 40 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **Mode is taught as the measure that survives categories — and that can be plural.** Its demonstration reads the
   *difference* between two category piles, so zero is the interesting reading: the point where the mode stops being a
   single value. A dataset with two modes is a shape data genuinely takes, not a defect.

2. **Choosing a measure is taught as a claim about the data.** Its demonstration holds nine cottages steady and grows
   the tenth: the mean climbs steeply while the median does not move at all. "Resistant to outliers" becomes something
   the learner watched happen rather than a phrase.

3. **Requirement 13 now drives the real engine.** See the correction below — this is the substantial change of the
   cycle, and it applies to every Complete lesson in the repository, Region 1 included.

## Corrections made during the unit

1. **Requirement 13 could not tell a working misconception from an inert one.** It checked that the named misconception
   was declared, had a registered detector, and had a remediation — never that the *question* gave a learner any way to
   express it. A probe removing a question's declared trigger value failed nothing. Generated questions have been held
   to the engine-driven check since S2-09 (D-025); authored ones never were. Requirement 13 now runs the real evaluator
   and the real classifier, and requires the engine to name the misconception.

2. **That check then found a defect in this cycle's own content, on its first run.**
   `q.r2-choosing-measures-misconception` declared `mc.outlier-mean` while none of its three options embodied it. The
   option was rewritten to be the one a learner holding that belief would actually pick.

3. **The new check's helper knew fewer routes than exist — twice over.** It first reported a perfectly good Region 1
   question as unreachable, because some detectors read the *typed value* rather than any tag. An incomplete helper
   looks exactly like broken content, so value-derived routes were added for the four numeric detectors.

4. **I orphaned 19 inherited questions mid-cycle** by replacing the two Stage 1 lessons' question lists rather than
   extending them. Caught by the reachability audit and the integration tests. Restored, and the episode is what
   established that re-cutting these two properly is a redistribution job.

## Verification that the guards have teeth

Six deliberate probes, all reverted:

| Probe | Result |
|---|---|
| A demonstration control is inert | **5 checks fail** |
| The misconception loses its declared trigger value | **1 check fails** (after requirement 13 was extended; it found nothing before) |
| Guided practice has no worked steps | **1 check fails** |
| The mastery check is easier than the practice | **1 check fails** |
| A Complete lesson asks an unroled question | **2 checks fail** |
| A Stage 1 lesson is declared Complete before its re-cut | **15 checks fail** |

## Remaining work

**4 of S2-12's 9 lessons**: the mean and median re-cuts, and outlier and skew effects in `m.r2-variation`. The re-cut
needs the inherited questions redistributed first — `q.pct-rainy-days` and `q.fraction-quarter` to `l.r2-percentage`,
the bar-chart and categorical questions to `l.r2-bar-charts` and the data-literacy lessons — which is the next cycle's
first task.

## Local commit

`34a63f97a570d9c6c6f3a65f9be6ed9969162715`

## Remote verification

```
LOCAL_HEAD  = 34a63f97a570d9c6c6f3a65f9be6ed9969162715
REMOTE_HEAD = 34a63f97a570d9c6c6f3a65f9be6ed9969162715
VERIFIED: MATCH
```

## Next unit

**S2-12 continued — redistribute the inherited questions, then re-cut mean and median.** Not started in this cycle.
