# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-08 — Region 1 lessons and interactions (cycle 3 of 4: Module 3, `m.r1-position`)**

Entered from `ee03ecfc22563ec8e90e1c1ff31be3f2d1897dae` (remote-verified, clean tree).

## Objective

Bring **Module 3 — Position** (negative numbers, number lines, coordinates) up to all **18 structure requirements** in
`STAGE2_RECONSTRUCTION_SCOPE.md` §5.

## Result up front

**S2-08 remains Partial.** **13 of the 17** Region 1 topic lessons are now Complete — Modules 1, 2 and 3. **4 remain
skeletons**, all in `m.r1-data`, and are named in "Remaining work".

## Relevant files

| File | Change |
|---|---|
| `src/content/worlds/curriculum.json` | Three lessons fully authored: narrative purpose, demonstration, formal term, six practice roles |
| `src/content/questions/questions.json` | 103 → **121** questions; the three seed questions upgraded to guided practice |
| `src/content/questions/misconceptions.json` | 19 → **21** |
| `src/content/questions/remediations.json` | 18 → **20**, and `rem.axes-order` gained the follow-up it never had |
| `tests/helpers/complete-lessons.ts` | Three lessons added to the Complete list |
| `tests/integration/module3-lessons.test.ts` | **New.** 19 checks, including a keyboard walk to every shipped target |
| `tests/integration/point-placement-flow.test.ts` | Reachability rule widened **deliberately** — see Corrections |
| `tests/audit/region1-architecture.test.ts` | Skeleton count 7 → 4, **updated deliberately** |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Every Region 1 lesson satisfies all 18 structure requirements | **No — 13 of 17.** Modules 1, 2 and 3 |
| 2 | Lessons that do claim completeness genuinely satisfy all 18 | Yes — the 24 checks now cover 13 lessons |
| 3 | Demonstrations are interactive, not placeholders | Yes — the audit drives every control and fails an inert one |
| 4 | Misconception challenges reach a real remediation | Yes — all 3 Module 3 slips driven through the session engine |
| 5 | Skeleton lessons cannot be mistaken for finished ones | Yes — guard updated, still fails in both directions |
| 6 | Commit pushed and remote hash verified | Yes |

## Required tests

```bash
npm run typecheck && npm run lint && npm test
npm run test:statistics && npm run test:content && npm run build
```

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **337 tests / 30 files** (was 318 / 29) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 493.11 kB (133.34 kB gzip); was 462.75 kB / 126.18 kB |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **Three lessons finished to the 18 requirements.** Negative numbers, number lines and coordinates each have a
   practical narrative purpose, a manipulable harbour demonstration, a prediction and observation, a formal term with
   every symbol explained, and six questions — one per practice role.

2. **`negate` finally earns its place.** It has existed in the formula enum since cycle 1 without a single use; the
   sounding-line demonstration is what it was for. Paying out line drives the height reading further below zero, which
   is the lesson's whole point: digits measure distance from zero, the sign says which way.

3. **The number-line demonstration teaches direction, not just distance.** Two markers on a rule with the readout as
   `red - blue`: slide both together and nothing moves, cross them over and the sign flips.

4. **The coordinates demonstration argues for its own necessity.** The readout is the number of steps walked, so
   (3, 2) and (2, 3) give the same 5 — and land on different crates. A single number provably cannot fix a place on a
   grid, which is why the pair and its order exist.

5. **Every shipped position target is walked to by keyboard in a test.** Position is taught almost entirely through
   `point-placement`, so "the learner can reach the answer" is a claim about a widget. The module test steps to each
   target with the same operation the arrow keys perform and submits the result through the real engine.

6. **Two new misconceptions, and Stage 1's `mc.axes-swapped` reused.** Negatives ordered by their digits, and marks
   counted as if each were worth one unit when the rule is scaled in twos. `rem.axes-order` — which had explained the
   axis swap since Stage 1 without ever offering a retry — now has a follow-up question.

7. **Two checks that stop misconception counts inflating.** A merely-wrong placement must not be reported as the named
   error, and a coordinate misplaced to (2, 4) must not be reported as an axes swap.

## Corrections made during the unit

- **A guessed API was caught by the compiler and the test.** The keyboard walk was first written against
  `movePoint(field, position, "right")`; the real signature is `(field, position, axis, steps)` and `PointPosition.y`
  is `number | null`, not `number | undefined`. Six checks failed until it matched reality.
- **The S2-03 reachability rule was widened deliberately, not deleted.** It required every point-placement question to
  live in a lesson — true until this cycle added two remediation-only placements, which are legitimate and already
  recorded as audit finding F-4. It now accepts "in a lesson **or** named as a remediation follow-up" and still fails
  on anything reachable from neither; a probe confirms that.
- **Three seed prompts were rejected by the audit as stubs** ("Which temperature is COLDER?") and rewritten with
  harbour context.

## Verification that the guards have teeth

Five deliberate probes, all reverted:

| Probe | Result |
|---|---|
| Sounding-line control made inert | **1 check fails** |
| Coordinates stops explaining the comma in its pair | **1 check fails** |
| A placement target moved off the step grid | **2 checks fail** |
| Tick-scale misconception loses its wrong placement | **1 check fails** |
| A placement orphaned from every lesson and remediation | **3 checks fail** |

## Remaining work

**4 Region 1 topic lessons are still skeletons** — one seed question each, no demonstration, no formal term, no
practice roles, all in module `m.r1-data`:

`l.r1-tables` · `l.r1-variables` · `l.r1-cases` · `l.r1-variable-kinds`

One more cycle finishes S2-08. That module is the least numeric of the four, so its demonstrations will need more
thought than the arithmetic ones: a table, a variable and a case are structures rather than quantities, and the
current `DemonstrationFormula` set may not express them without a new member.

Separately, and **not** part of this unit's criteria: scope §4 requires ≥100 validated interactions per Complete
*topic*. Module 3 has **7 authored questions per topic** and no generators. No topic is Complete under §4; that is
S2-09.

## Local commit

`def8b1d51eb71a08b5a8b08d18ec11fe5d6f7edc`

## Remote verification

```
LOCAL_HEAD  = def8b1d51eb71a08b5a8b08d18ec11fe5d6f7edc
REMOTE_HEAD = def8b1d51eb71a08b5a8b08d18ec11fe5d6f7edc
VERIFIED: MATCH
```

## Next unit

**S2-08 continued — Module 4 (`m.r1-data`): reading tables, variables, cases and observations, categorical versus
numerical.** Not started in this cycle, per the one-unit-per-cycle rule.
