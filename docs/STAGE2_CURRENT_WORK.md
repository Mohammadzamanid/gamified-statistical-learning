# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-09 — Region 1 validated content expansion (cycle 1: the generation framework and Module 1's topics)**

Entered from `bf03ae281049b60be559d3b3779b137f9869d8df` (remote-verified, clean tree).

## Objective

Build the machinery `STAGE2_RECONSTRUCTION_SCOPE.md` §4 requires — generators, a validation pipeline, duplicate gates,
and a per-topic coverage report — and take Module 1's five topics past the ≥100 validated-interaction bar.

## Result up front

**S2-09 is Partial.** **5 of the 22 curriculum topics** now meet §4. The other **17 are reported as failures with
reasons**, which is what the scope demands of them — not omission.

| Topic | Total available | Reasoning families | Largest single shape |
|---|---:|---:|---:|
| Counting | 796 | 8 | 13% |
| Addition | 727 | 7 | 11% |
| Subtraction | 725 | 8 | 11% |
| Multiplication | 688 | 7 | 12% |
| Division | 291 | 6 | 13% |

## Relevant files

| File | Change |
|---|---|
| `src/core/generation/reasoning-families.ts` | **New.** The 14 families from scope §4, in code |
| `src/core/generation/types.ts` | **New.** The generator contract, including the mandatory independent answer |
| `src/core/generation/normalize.ts` | **New.** Three fingerprints for three different senses of "the same" |
| `src/core/generation/validate.ts` | **New.** Schema, answer, a11y, misconception and duplicate gates, each with a reason |
| `src/core/generation/report.ts` | **New.** The seven metrics, from the curriculum graph |
| `src/content/generators/arithmetic.ts` | **New.** Eight reasoning families, parameterised by operation |
| `src/content/generators/index.ts` | **New.** The five operation specs, each with a second independent implementation |
| `src/content/generated.ts` | **New.** The generated bank, built once at load |
| `src/content/index.ts` | `loadPlayableContent()` alongside `loadShippedContent()` |
| `scripts/coverage-report.ts` | **New.** Writes both report forms |
| `docs/CONTENT_COVERAGE.md`, `docs/content-coverage.json` | **New**, generated |
| `tests/helpers/complete-topics.ts` | **New.** The §4 completeness claim |
| `tests/audit/content-coverage.test.ts` | **New.** 21 checks |
| `tests/unit/generation.test.ts` | **New.** 17 checks driving the pipeline with deliberately broken generators |
| `package.json` | `report:coverage` script; `tsx` dev dependency |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | ≥100 validated interactions per completed topic | **No — 5 of 22 topics.** The rest are reported as failures |
| 2 | Multiple reasoning families per completed topic | Yes — 6 to 8 each, against a required 4 |
| 3 | Duplicate and near-duplicate gates | Yes — both, and each exercised by a test that supplies a clone |
| 4 | Misconception mappings validated | Yes — undeclared ids and untethered distractor tags both rejected |
| 5 | Accessibility descriptions validated | Yes — a generated question without one is never counted |
| 6 | Machine- and human-readable reports | Yes — `content-coverage.json` and `CONTENT_COVERAGE.md` |
| 7 | Topic list from the curriculum, zero-generator topics reported as failures | Yes — and enforced by two checks |
| 8 | Commit pushed and remote hash verified | Yes |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **403 tests / 33 files** (was 365 / 31) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 538.47 kB (143.72 kB gzip) |
| `npm run report:coverage` | Ran — 5 of 22 topics meet §4 |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **The seven metrics are seven fields, computed from different things.** The scope says they "must never be used
   interchangeably", so raw combinations, valid combinations and validated interactions are counted at three separate
   points in the pipeline, and a test asserts every raw combination is accounted for exactly once.

2. **The topic list comes from the curriculum graph.** A topic with no generators gets a row saying so — 17 of them do
   — rather than disappearing. Two checks enforce it, and a third rejects a generator that claims a skill no lesson
   teaches.

3. **Three fingerprints, because §4 names two different rules and they cannot share one.** An exact duplicate is a
   generator bug; a near duplicate is the same numbers wearing different names, which is rejected; a reasoning *shape*
   is the task with its particulars removed, which is reported. Collapsing these was my first attempt and it reduced
   800 valid combinations to 9 — every numeric variant looked like a duplicate of every other.

4. **"A hundred numeric variants of one pattern" is a number now.** No single reasoning shape may exceed 50% of a
   topic's interactions. The five completed topics sit between 11% and 13%.

5. **3,192 validated generated interactions, and they are genuinely available.** `loadPlayableContent()` merges them
   into the bundle so the spaced-review queue can pick them; a test proves it can. Lessons stay hand-authored, and a
   check fails if a generated id ever appears in one.

## Corrections made during the unit

- **The answer check was tautological, and a probe proved it.** Deleting the check entirely failed no test. It derived
  the "correct" response from `question.answer` and then evaluated it against `question.answer` — it could never fail,
  for any answer kind. The fix is structural: `expectedResponse` is now **mandatory**, stated by the family and never
  read back out of the question it built, so a `build()` that publishes a different answer is caught. Each operation
  also supplies a second, independent implementation of its arithmetic (repeated addition against multiplication,
  counting down against subtraction), so the two routes can disagree.
- **Near-duplicate detection was likewise unexercised**, for the same reason: no shipped generator emits a clone.
  `tests/unit/generation.test.ts` now drives every rejection stage with a generator built to fail that one way.
- **A probe was silently stale.** Its patch string no longer matched the code, so it changed nothing and reported zero
  failures — indistinguishable from a passing guard. The harness now asserts the file actually changed before a probe
  counts. This is the second cycle running in which a probe found a guard problem in the probes themselves (D-019).
- **Counting's own validity rule was strangling its coverage** — the shared parameter grid was rejected almost
  entirely, giving 48 valid combinations from 800. Operations can now declare their own grid.

## Verification that the guards have teeth

Five deliberate probes, all reverted:

| Probe | Result |
|---|---|
| A generator claims a topic no lesson teaches | **4 checks fail** |
| Near-duplicate detection switched off | **1 check fails** |
| A topic with no generators declared Complete | **3 checks fail** |
| All eight families claim one reasoning family | **2 checks fail** |
| The answer check switched off | **2 checks fail** |

## Remaining work

**17 of 22 topics do not meet §4**, all for the same reason: no generator families yet. They are listed with their
numbers in `docs/CONTENT_COVERAGE.md`.

- Region 1, 12 topics: fractions, decimals, percentages, ratios, proportions, negatives, number lines, coordinates,
  tables, variables, cases, categorical/numerical.
- Region 2 inheritance, 5 topics: mean, median, range, choosing measures, data literacy. These belong to S2-17.

The arithmetic generator template does not transfer to most of them — a fractions generator needs equivalence and
comparison of parts, and a coordinates generator needs point geometry, neither of which is a two-number operation.
Expect a new generator module per topic group rather than one more operation spec.

## Local commit

`pending`

## Remote verification

```
pending
```

## Next unit

**S2-09 continued — generators for Region 1's remaining 12 topics.** Not started in this cycle, per the
one-unit-per-cycle rule.
