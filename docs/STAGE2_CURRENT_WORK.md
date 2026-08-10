# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-12 — Central tendency lessons (cycle 4: outlier effects and skew effects)**

Entered from `960e192a06cf3d3934fae7714b093690e421d605` (remote-verified, clean tree).

## Objective

Write `l.r2-outliers` and `l.r2-skew` — the last two lessons S2-12 owns — to all 18 of scope §5's requirements.

## Result up front

**S2-12 is Complete.** All **9 of its 9 lessons** are Complete: `m.r2-counts` entire, `m.r2-centre` entire, and the two
lessons of `m.r2-variation` this unit owns.

**One acceptance criterion is still unmet and is not being claimed:** draggable/editable datasets. The demonstrations
are control-driven, which meets requirement 4; editable datasets are S2-15.

`m.r2-variation` is now half-written by design. Variance and standard deviation sit ahead of outliers and skew in the
prerequisite chain and belong to **S2-13** — Region 2 teaches spread before shape, and the unit boundary cuts across
that module. So these two lessons are finished but not yet reachable by a learner, which is true of every lesson written
ahead of its prerequisites and is stated here rather than left to be discovered.

## Relevant files

| File | Change |
|---|---|
| `src/content/worlds/curriculum.json` | `l.r2-outliers` and `l.r2-skew` written in full |
| `src/content/questions/questions.json` | 212 → **222** authored questions (12 written, 2 seeds replaced) |
| `src/content/questions/misconceptions.json` | 26 → **27** |
| `src/content/questions/remediations.json` | 25 → **26** |
| `tests/integration/region2-lessons.test.ts` | **New.** Every Complete Region 2 lesson, played through the session engine |
| `tests/helpers/complete-lessons.ts` | 24 → **26** lessons declared Complete |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Frequency, proportion, percentage | **Yes** (cycle 1) |
| 2 | Mean, median, mode, measure selection | **Yes** (cycles 2–3) |
| 3 | Outlier effects, skew effects | **Yes** |
| 4 | Draggable/editable datasets | **No** — control-driven demonstrations; editable datasets are S2-15 |
| 5 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **505 tests / 37 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass |
| `npm run report:coverage` | Ran — 17 of 40 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **Outliers is taught as a gap, not a size.** Its demonstration sets the suspect reading beside the highest of the
   others and measures the space between them. A second boat landing 44 crates makes a reading of 46 unremarkable
   without the suspect reading changing at all — outlier is a description of a value's position among the others, never
   a property the number carries alone. That is deliberately *not* the "extreme value drags the mean" demonstration,
   which `l.r2-choosing-measures` already owns.

2. **Skew is taught by how much of the data the average leaves behind.** The readout is the share of readings below the
   mean: near 50 in a balanced log, 70 in the one on screen. A right tail pushes the mean past the bulk, so the posted
   average describes almost nobody — which is the argument the lesson opens with.

3. **A new misconception with the teeth to be reported.** `mc.skew-named-by-the-bulk` — naming a distribution after
   where the crowd sits rather than where the tail runs — is the most common skew error and is exactly backwards. Its
   detector is `tagged-distractor`, so it sits on a tagged choice (D-025).

## Corrections made during the unit

1. **Nine Region 2 lessons had been declared Complete without anything ever playing one.** Region 1 has had per-module
   playthroughs since S2-08. The audits read the content; nothing ran it. Closed by
   `tests/integration/region2-lessons.test.ts`, which iterates the declared list so S2-13's lessons are covered without
   the file being edited. (D-037)

2. **That new test's first docstring claimed more than the test delivers, and a probe caught it.** Changing a Complete
   lesson's mastery answer to a wrong number failed nothing: the helper builds each response from the question's own
   declared answer, so the two move together. The header now states exactly what round-trips through the engine and
   what does not — authored answers have no independent derivation to check against, unlike generated ones under D-020.
   The probe is the only reason the stronger claim did not ship. (D-038)

3. **A trailing comma made a remediation's `explanation` a list rather than a string.** Caught by the content schema on
   the first run, before any check that would have read it as prose.

## Verification that the guards have teeth

Ten deliberate probes, all reverted:

| Probe | Result |
|---|---|
| A Complete lesson's mastery answer is changed to a wrong number | **0 checks fail** — the finding above; the header now says so |
| A teach-back forbids a word it also requires | **4 checks fail**, three naming the lesson |
| A numeric answer's tolerance excludes its own value | **5 checks fail** (rejected at load) |
| A choice question names a correct option it does not offer | **5 checks fail** (rejected at load) |
| The skew misconception loses its tagged distractor | **1 check fails** |
| The outlier demonstration's stated readout drifts from its formula | **1 check fails** |
| A control on the skew demonstration stops moving the readout | **5 checks fail** |
| The skew lesson claims a skill its questions do not carry | **3 checks fail**, two through the save |
| A re-cut lesson loses its misconception role | **2 checks fail** |
| A Complete lesson asks a question with no declared role | **2 checks fail** |

## Remaining work

None inside S2-12 except criterion 4, which is S2-15's. The next unit is **S2-13**.

## Local commit

`08f1c371038650f51bb4b48d19bd194122e11dbf`

## Remote verification

```
LOCAL_HEAD  = 08f1c371038650f51bb4b48d19bd194122e11dbf
REMOTE_HEAD = 08f1c371038650f51bb4b48d19bd194122e11dbf
VERIFIED: MATCH
```

## Next unit

**S2-13 — spread and position lessons.** Not started in this cycle.
