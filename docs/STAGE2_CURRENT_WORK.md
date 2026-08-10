# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-13 — Spread and position lessons (cycle 1: range and quartiles)**

Entered from `dc4969ff4ec8c89fd4d3339d50fd5ee7a21f68e9` (remote-verified, clean tree).

## Objective

Open `m.r2-spread` in module order: re-cut `l.spread-1` (range) — the third and last inherited Stage 1 lesson in
Region 2 — and write `l.r2-quartiles` from its seed, both to all 18 of scope §5's requirements.

## Result up front

**S2-13 is Partial: 2 of its 6 lessons are Complete.** Percentiles, IQR, variance and standard deviation remain.

**The order was changed from the one the last handoff prescribed, because that handoff rested on a false claim.** It
said to write variance and standard deviation first, so the region would not have "a finished module a learner cannot
enter". Driving a save through the real unlock rule shows the whole chain unlocking today — a seeded lesson holds a
real, answerable question, so it can be completed, so it opens the next. Nothing was ever closed. The accurate statement
is that `l.r2-outliers` and `l.r2-skew` sit behind six stub lessons, and the way to fix that is module order from the
module's entry lesson. (D-040)

## Relevant files

| File | Change |
|---|---|
| `src/content/worlds/curriculum.json` | `l.spread-1` re-cut, `l.r2-quartiles` written in full |
| `src/content/questions/questions.json` | 222 → **232** authored questions (11 written, 1 seed replaced) |
| `src/content/questions/misconceptions.json` | 27 → **29** |
| `src/content/questions/remediations.json` | 26 → **28** |
| `tests/audit/lesson-structure.test.ts` | Operator class widened to the Unicode lookalikes |
| `tests/helpers/complete-lessons.ts` | 26 → **28** lessons declared Complete |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Min/max, range | **Yes** — `l.spread-1` |
| 2 | Quartiles | **Yes** — `l.r2-quartiles` |
| 3 | Percentiles, IQR | No — next cycle |
| 4 | Variance intuition, standard deviation | No — a later cycle; SD must be built as distances → squared distances → their average → square root |
| 5 | Distribution comparison | No — no lesson owns it yet; see below |
| 6 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **511 tests / 37 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass |
| `npm run report:coverage` | Ran — 17 of 40 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **Range is taught through what it refuses to look at.** The demonstration is the definition — highest minus lowest —
   and the prediction adds three new readings between the ends. The readout does not move. A learner who has watched
   that has a reason for quartiles to exist before quartiles are introduced.

2. **`l.spread-1` was the third inherited Stage 1 lesson, and needed no redistribution.** It carried one question,
   `q.range-tides`, which teaches range — so unlike the two centre lessons it stayed exactly where it was. The re-cut
   was five new questions around it, not a redistribution.

3. **Quartiles are taught as cutting, not as three separate recipes.** The demonstration deals a sorted row into equal
   groups and reports how many land in each; four groups is the quartile case, and running the control to ten is the
   percentile lesson arriving early. The formal notation introduces Q1, Q2 and Q3 as explained symbols.

4. **Two new misconceptions, both engine-reportable from a numeric answer.** `mc.range-is-the-largest` — reporting the
   maximum, which is a real reading from the set and therefore hard to spot. `mc.quartile-position-as-value` — doing
   the position arithmetic correctly and reporting the index instead of the value at it.

## Corrections made during the unit

1. **The beginner-safety guard could not see the Unicode minus sign, and Stage 1 content had been using it since the
   baseline.** `q.range-tides` wrote "3.4 − 1.2 = 2.2" with U+2212 while every lesson in its chain explains ASCII `-`.
   The operator class listed `-` and not `−`, so the check passed on notation no lesson had introduced. Class widened,
   content normalised. (D-039)

2. **Last cycle's report and handoff both claimed `l.r2-outliers` and `l.r2-skew` were "not yet reachable", and told
   this unit to reorder its work around that.** They are reachable, and were the whole time. See D-040 and the note
   above; the ordering instruction has been removed from the handoff rather than left to mislead again.

## Verification that the guards have teeth

Eight deliberate probes, all reverted:

| Probe | Result |
|---|---|
| Content uses the Unicode minus in place of the explained one | **1 check fails** |
| …the same content, with the operator class narrowed back | **0 checks fail** — the paired probe, proving the widening does the work |
| The range demonstration's stated readout drifts from its formula | **1 check fails** |
| The quartile misconception loses its declared wrong value | **1 check fails** |
| The range misconception is declared where the engine cannot report it | **1 check fails** |
| A control on the quartile demonstration goes inert | **5 checks fail** |
| The quartile notation shows a symbol it does not explain | **1 check fails** |
| A teach-back is no longer a written explanation | **2 checks fail** |

## Remaining work

**4 of S2-13's 6 lessons**: percentiles, IQR, variance, standard deviation. Plus criterion 5 — **distribution
comparison has no lesson in Region 2's declared topic list at all**, so meeting it needs either a new lesson and topic
or a decision that the boss investigation carries it. That is a scope question for the next cycle, recorded here rather
than quietly dropped.

## Local commit

`PENDING`

## Remote verification

`PENDING`

## Next unit

**S2-13 continued — percentiles and IQR.** Not started in this cycle.
