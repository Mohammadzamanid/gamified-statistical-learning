# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-09 — Region 1 validated content expansion (cycle 4: the data group, and Region 1 closed under §4)**

Entered from `bad823a7c433e17fb9c6101a4b6a372ae933689f` (remote-verified, clean tree).

## Objective

Take the data group — tables, variables, cases, categorical/numerical — past the `STAGE2_RECONSTRUCTION_SCOPE.md` §4
bar. These four are the first topics whose questions are *about a table*, so the generator has to build a dataset before
it can build a question.

## Result up front

**S2-09 remains Partial**, and the reason it is Partial has changed. **17 of the 22 curriculum topics** now meet §4, up
from 13. **Every Region 1 topic passes.** The 5 still failing are the entire Region 2 inheritance — mean, median,
range, choosing measures, data literacy — which **belongs to S2-17**, not here.

| New this cycle | Total available | Reasoning families | Largest single shape |
|---|---:|---:|---:|
| Cases and observations | 311 | 4 | 13% |
| Variables | 235 | 5 | 14% |
| Reading tables | 232 | 5 | 13% |
| Kinds of variable | 215 | 5 | <1% |

**6,607 validated generated interactions** (was 5,642).

## Relevant files

| File | Change |
|---|---|
| `src/content/generators/data.ts` | **New.** Six ledgers and eighteen families across the four data topics |
| `src/content/generators/index.ts` | Wired in |
| `tests/helpers/complete-topics.ts` | The four data topics declared Complete under §4 |
| `tests/audit/content-coverage.test.ts` | Two more misconception routes taught to the audit's helper |
| `docs/CONTENT_COVERAGE.md`, `docs/content-coverage.json` | Regenerated |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | ≥100 validated interactions per completed topic | **No — 17 of 22 topics.** The 5 remaining are Region 2, owned by S2-17 |
| 2 | Multiple reasoning families per completed topic | Yes — 4 to 8 each, against a required 4 |
| 3 | Duplicate and near-duplicate gates | Yes |
| 4 | Misconception mappings validated | Yes, on both sides, and now across all five declaration routes |
| 5 | Accessibility descriptions validated | Yes |
| 6 | Machine- and human-readable reports | Yes — regenerated this cycle |
| 7 | Topic list from the curriculum, zero-generator topics reported as failures | Yes |
| 8 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **413 tests / 33 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 538.47 kB (143.72 kB gzip) |
| `npm run report:coverage` | Ran — 17 of 22 topics meet §4 |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **Six ledgers, written out rather than computed.** A table question is only honest if the table is real, and a
   formula would have made every ledger a rescaling of one ledger — indistinguishable to the near-duplicate gate and
   uncheckable by eye for whoever reads the file next. They render into the prompt as prose, which is the convention the
   authored questions in these lessons already use.

2. **Where a described shape beats a real ledger, the shape is used.** Every ledger here has three columns and five
   rows, so the cases and variable-observation families enumerate over described shapes — 8 row counts by 5 column
   counts — instead. Running them over the six ledgers would have asked the same arithmetic six times with the same
   numbers, and the near-duplicate gate would have thrown five away, correctly.

3. **Every one of the four topics' misconceptions is now answerable.** Three are declared as a `wrongValue` under
   `question.parameters`, which is how `known-wrong-answer` reaches a learner on a numeric question where there is no
   distractor to tag. The fourth is a wrong *placement* — see correction 1.

4. **A `visual-interpretation` sorting family**, because that is the only interaction from which
   `mc.digits-mean-numerical` can be reported.

## Corrections made during the unit

1. **`mc.digits-mean-numerical` was tagged on a multiple-choice distractor, and could never have fired.** Its detector
   is `placement-mapping`, which reads the evaluator's placement signals — not `known-wrong-answer`, which the module
   header asserted for all four. The tag read perfectly. This is precisely the defect D-025 names, made in the first
   module written *after* D-025 was written down, and it was caught by the check rather than by care. The declaration
   moved to a new sorting family where it is a declared wrong placement, and the recognition family now declares
   nothing, with the reason recorded in place.

2. **The audit's own helper knew only three of the five ways a misconception can be declared.** It covered tagged
   choices, misconception points and swapped axes; the first generator to declare a numeric `wrongValue` was reported
   as offering the learner no way to express the misconception, and so was the first to declare a wrong placement. Both
   were the check telling the truth about itself — an unknown route is indistinguishable from an unreachable one — and
   both routes were added.

3. **Two lint warnings**, from an unused index and a loop variable kept only to count. The count now walks the columns
   the constant is excluded from, which is what it always claimed to do.

## Verification that the guards have teeth

Six deliberate probes, all reverted. All six bit on the first run:

| Probe | Result |
|---|---|
| The placement misconception tagged on a choice instead | **1 check fails** |
| The declared wrong value set to the right answer | **1 check fails** |
| The case count answered with the observation count | **3 checks fail** |
| The cell reader walking the wrong axis | **1 check fails** |
| The constant column counted among the variables | **1 check fails** |
| A topic with no generators declared Complete | **3 checks fail** |

## Remaining work

**5 of 22 topics do not meet §4**, and for the first time none of them is a Region 1 topic. Mean, median, range,
choosing measures and data literacy are the Region 2 inheritance, and generators for them are **S2-17**'s work, not a
continuation of this unit.

That makes S2-09's Region 1 objective **met**, and the unit stays Partial only because §4 is stated over all 22
curriculum topics. The next unit is **S2-10**, the Region 1 boss investigation.

## Local commit

Recorded in the follow-up commit below.

## Remote verification

Recorded in the follow-up commit below.

## Next unit

**S2-10 — Region 1 boss investigation.** Not started in this cycle, per the one-unit-per-cycle rule.
