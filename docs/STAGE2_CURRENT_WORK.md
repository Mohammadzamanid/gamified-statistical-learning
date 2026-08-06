# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-08 — Region 1 lessons and interactions (cycle 2 of 4: Module 2, `m.r1-parts`)**

Entered from `934a6f18cb0014bd12b0ea1dcabb2051f06755d3` (remote-verified, clean tree).

## Objective

Bring **Module 2 — Parts of a Whole** (fractions, decimals, percentages, ratios, proportions) up to all **18 structure
requirements** in `STAGE2_RECONSTRUCTION_SCOPE.md` §5, under the guards cycle 1 established.

## Result up front

**S2-08 remains Partial.** **10 of the 17** Region 1 topic lessons are now Complete — Modules 1 and 2. **7 remain
skeletons** and are named in "Remaining work". They are not claimed, not counted, and the skeleton guard still holds
them to the seed shape S2-07 delivered.

## Relevant files

| File | Change |
|---|---|
| `src/shared/schemas/curriculum.ts` | New `place-value` demonstration formula + its arity |
| `src/core/curriculum/demonstration.ts` | `place-value` case: tenths and hundredths weighted separately |
| `src/content/worlds/curriculum.json` | Five lessons fully authored: narrative purpose, demonstration, formal term, six practice roles |
| `src/content/questions/questions.json` | 72 → **103** questions; the five seed questions upgraded to guided practice |
| `src/content/questions/misconceptions.json` | 15 → **19** |
| `src/content/questions/remediations.json` | 14 → **18**, and two existing ones gained the follow-up question they never had |
| `tests/helpers/complete-lessons.ts` | Five lessons added to the Complete list |
| `tests/helpers/lesson-playthrough.ts` | **New.** Playthrough mechanics shared by the per-module integration tests |
| `tests/integration/module2-lessons.test.ts` | **New.** 16 checks driving the module through the real session engine |
| `tests/integration/module1-lessons.test.ts` | Refitted onto the shared helper; its Complete-list check generalised |
| `tests/audit/region1-architecture.test.ts` | Skeleton count 12 → 7, **updated deliberately** |
| `tests/audit/lesson-structure.test.ts` | Guard boundary documented — see Corrections |
| `tests/unit/demonstration.test.ts` | `place-value` column weighting |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Every Region 1 lesson satisfies all 18 structure requirements | **No — 10 of 17.** Modules 1 and 2 |
| 2 | Lessons that do claim completeness genuinely satisfy all 18 | Yes — the 24 checks now cover 10 lessons |
| 3 | Demonstrations are interactive, not placeholders | Yes — the audit drives every control and fails an inert one |
| 4 | Misconception challenges reach a real remediation | Yes — all 6 Module 2 slips driven through the session engine |
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
| `npm test` | Pass — **318 tests / 29 files** (was 301 / 28) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 462.75 kB (126.18 kB gzip); was 411.48 kB / 114.21 kB |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **Five lessons finished to the 18 requirements.** Fractions, decimals, percentages, ratios and proportions each
   have a practical narrative purpose, a manipulable harbour demonstration, a prediction and observation, a formal term
   with every symbol explained, and six questions — one per practice role.

2. **The demonstrations teach the thing the lesson is about, not just its arithmetic.** Fractions holds the numerator
   still and raises the denominator, so the share visibly shrinks. Ratios shows that adding to both sides changes the
   mix while multiplying does not. Proportions steps the crate count and watches the cost climb in equal steps from
   zero. Percentages doubles the catch at a fixed rate and doubles the fee.

3. **One new formula, `place-value`, weighted per column** — a step on the tenths dial has to beat nine steps on the
   hundredths dial, which is exactly the misconception the decimals lesson targets.

4. **Four new misconceptions, and two existing ones put back to work.** Bigger-denominator-means-bigger, longer-decimal-
   means-bigger, a ratio part read as a share of the whole, and scaling by adding instead of multiplying. Percentages
   and fractions reuse Stage 1's `mc.decimal-vs-percent` and `mc.reversed-fraction` rather than minting duplicates that
   would double-count one error in every report.

5. **Two remediations that explained but never re-tested now have follow-ups.** `rem.percent-decimal` and
   `rem.fraction-order` had empty `followUpQuestionIds` since Stage 1 — the learner was told what went wrong and then
   given nothing to try it on.

6. **Playthrough mechanics extracted to `tests/helpers/lesson-playthrough.ts`.** Each per-module test now carries only
   what is genuinely module-specific: its misconceptions and the exact wrong answer that triggers each.

7. **A cross-form consistency check.** Fractions, decimals, percentages and proportions describe one quantity in four
   costumes; a test asserts the content agrees with itself about that, and that proportion answers stay inside 0 to 1
   while percentage answers stay inside 0 to 100.

## Corrections made during the unit

- **A stricter notation guard was tried and withdrawn on evidence.** Adding `:` to the operators checked in prose
  immediately flagged "Count on 5: 8, 9, 10, 11, 12" — a colon ending a clause, not a ratio. A guard that cannot tell
  punctuation from notation is worse than none, so it was reverted and the boundary documented in the test alongside
  the same reasoning for `=`. Requirement 10 still forces the ratios and proportions lessons to explain both symbols,
  because they appear in those lessons' *notation*.
- **A dead misconception mapping was caught by the S2-05 audit.** `q.r1-proportions-mastery` mapped a step to
  `mc.additive-scaling` without declaring it on the question, so the engine — which walks `question.misconceptionIds` —
  would never have surfaced it.
- **The drag-and-drop mastery question shipped without drop zones** and failed content validation; zones added.
- **Three stub prompts and explanations were rejected by the audit** and rewritten with real harbour context.
- **The Module 1 test asserted its lesson list *equalled* the Complete list.** True while one module was done, wrong
  the moment a second was. Generalised to a subset check rather than patched with a number.

## Verification that the guards have teeth

Four deliberate probes, all reverted:

| Probe | Result |
|---|---|
| Ratios stops explaining the colon it puts on screen | **1 check fails** |
| Hundredths dial stops affecting the decimals readout | **1 check fails** |
| Ratio misconception loses the value that identifies it | **1 check fails** |
| Percentages uses `%` with no formal term explaining it | **1 check fails** |

## Remaining work

**7 Region 1 topic lessons are still skeletons** — one seed question each, no demonstration, no formal term, no
practice roles:

`l.r1-negatives` · `l.r1-number-lines` · `l.r1-coordinates` (module `m.r1-position`) ·
`l.r1-tables` · `l.r1-variables` · `l.r1-cases` · `l.r1-variable-kinds` (module `m.r1-data`)

Two more cycles at this granularity. `m.r1-position` will need the `negate` formula, which exists but has never been
used by content.

Separately, and **not** part of this unit's criteria: scope §4 requires ≥100 validated interactions per Complete
*topic*. Module 2 has **7–8 authored questions per topic** and no generators. No topic is Complete under §4; that is
S2-09.

## Local commit

`pending`

## Remote verification

```
pending
```

## Next unit

**S2-08 continued — Module 3 (`m.r1-position`): negative numbers, number lines, coordinates.** Not started in this
cycle, per the one-unit-per-cycle rule.
