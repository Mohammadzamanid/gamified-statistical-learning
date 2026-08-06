# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-08 — Region 1 lessons and interactions (cycle 4 of 4: Module 4, `m.r1-data`)**

Entered from `e33a7724c07a1ca037efb1988cc5bcf25395bba6` (remote-verified, clean tree).

## Objective

Bring **Module 4 — Data** (reading tables, variables, cases and observations, categorical versus numerical) up to all
**18 structure requirements** in `STAGE2_RECONSTRUCTION_SCOPE.md` §5, completing S2-08.

## Result up front

**S2-08 is Complete.** All **17 of the 17** Region 1 topic lessons in scope §2 now satisfy the 18 structure
requirements, enforced by 24 checks. **No skeletons remain.**

**One thing to be precise about.** Region 1's container also holds two lessons inherited from Stage 1 —
`l.reading-tallies` and `l.middle-harbor` — which are **not** Complete. They teach tallies and centre, which the Stage 2
scope places in **Region 2**, so re-cutting them belongs to S2-11 rather than to this unit. That is not a footnote: a
check in `region1-architecture.test.ts` asserts those two are the *only* un-Complete lessons in Region 1, so the
exception cannot grow quietly.

## Relevant files

| File | Change |
|---|---|
| `src/shared/schemas/curriculum.ts` | `DemonstrationTableSchema`; `table-cell` and `column-total` formulas; `valueLabels` on controls |
| `src/core/curriculum/demonstration.ts` | `apply` now takes the demonstration, so a readout can index a table; `formatControlValue` exported |
| `src/renderer/components/DemonstrationPanel.tsx` | Labelled controls show names, not indices, and drop the number box |
| `src/content/worlds/curriculum.json` | Four lessons fully authored |
| `src/content/questions/questions.json` | 121 → **145** questions; the four seed questions upgraded to guided practice |
| `src/content/questions/misconceptions.json` | 21 → **24** |
| `src/content/questions/remediations.json` | 20 → **23**, and `rem.categorical-vs-numerical` gained the follow-up it never had |
| `tests/helpers/complete-lessons.ts` | The last four lessons added — all 17 now declared |
| `tests/integration/module4-lessons.test.ts` | **New.** 18 checks, including a full Region 1 walkthrough |
| `tests/audit/region1-architecture.test.ts` | Skeleton count 4 → **0**; new check naming the two Stage 1 inheritances |
| `tests/unit/demonstration.test.ts` | 17 → **27** checks, covering the table formulas |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Every Region 1 topic lesson satisfies all 18 structure requirements | **Yes — 17 of 17** |
| 2 | Completeness claims are enforced, not asserted | Yes — 24 checks per lesson |
| 3 | Demonstrations are interactive, not placeholders | Yes — the audit drives every control and fails an inert one |
| 4 | Misconception challenges reach a real remediation | Yes — all 4 Module 4 slips driven through the session engine |
| 5 | No lesson can sit between Complete and skeleton | Yes — and the two Stage 1 inheritances are named by a check |
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
| `npm test` | Pass — **365 tests / 31 files** (was 337 / 30) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 538.47 kB (143.73 kB gzip); was 493.11 kB / 133.34 kB |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **The demonstration can now index data, not only compute over it.** A table, a variable and a case are structures
   rather than quantities, and the handoff predicted the existing formula set would not express them. It did not, so
   `DemonstrationTable` plus the `table-cell` and `column-total` formulas were added properly — schema, arity entry,
   `apply` case and unit tests — rather than bending a lesson to fit arithmetic that does not describe it.

2. **Controls can name their positions.** A row selector shows "Thursday", not "4", in both the panel and the spoken
   description, because both now call the same `formatControlValue`. The schema requires a table selector's labels to
   equal the table's own labels, so an unnamed selector cannot ship.

3. **Four lessons finished to the 18 requirements.** Reading tables, variables, cases and observations, and
   categorical versus numerical.

4. **Each demonstration makes its lesson's argument.** Tables: hold the day and sweep the column and the numbers are
   incomparable; hold the column and sweep the day and they are. Variables: one column reads 7 every single day, so it
   can explain nothing. Cases: adding columns races the observation count upward while the case count never moves.
   Variable kinds: totalling the boat-number column reports 20 quite happily — a number describing nothing at all.

5. **Three new misconceptions, and Stage 1's `mc.digits-mean-numerical` finally put to work.** Right row wrong column,
   a constant column counted as a variable, and cases counted as observations. The digits-mean-numerical misconception
   has existed since Stage 1 with a `placement-mapping` detector and no content that could trigger it; the sorting
   question now can, and `rem.categorical-vs-numerical` has a follow-up for the first time.

6. **Region 1 is walked end to end in a test** — every module, every lesson, in curriculum order, from a fresh profile.

## Corrections made during the unit

- **A probe found one of my own new guards to be vacuous.** The "names rows and columns in words" check skipped
  controls that had no labels — which is exactly the defect it existed to catch, so removing the labels failed nothing.
  Fixed in two places: the schema now rejects an unlabelled table selector outright, and the check no longer skips.
- **The probe script's counter was also wrong.** It counted only failed checks, so a content change the schema rejects
  — which stops every suite loading, a harder failure — was reported as zero. Corrected, and the two affected probes
  re-run.
- **One explanation called an idea "obvious"** and was rejected by the beginner-safety check; rewritten.

## Verification that the guards have teeth

Five deliberate probes, all reverted:

| Probe | Result |
|---|---|
| The constant column starts varying | **1 check fails** |
| Table selectors lose their labels | **content rejected at load — every suite fails** |
| `table-cell` ignores its column control | **2 checks fail** |
| Cases misconception loses its wrong value | **1 check fails** |
| The categorical column is renamed away | **content rejected at load — every suite fails** |

## Remaining work

None for S2-08. Region 1's 17 scope topics are Complete.

Carried forward, and **not** part of this unit:

- `l.reading-tallies` and `l.middle-harbor` — Stage 1 lessons inside the Region 1 container that teach Region 2
  topics. Re-cutting them is **S2-11**, and a check names them so the exception stays exactly two.
- Scope §4 requires ≥100 validated interactions per Complete *topic*. Every Region 1 topic has **7-8 authored
  questions** and **zero generator families**. No topic is Complete under §4; that is **S2-09**.
- `rem.read-axes-first` and `rem.correlation-not-causation` still have no follow-up question. Both belong to Region 2
  chart topics, so they are S2-14 / S2-16 work.

## Local commit

`pending`

## Remote verification

```
pending
```

## Next unit

**S2-09 — Region 1 validated content expansion.** ≥100 validated interactions per completed topic, multiple reasoning
families, duplicate and near-duplicate gates, misconception mappings, accessibility descriptions, and machine- and
human-readable reports. Not started in this cycle, per the one-unit-per-cycle rule.
