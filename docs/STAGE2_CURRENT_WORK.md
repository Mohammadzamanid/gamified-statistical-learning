# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-10 — Region 1 boss investigation**

Entered from `6e7e524baca968bdf7f3b38b947c4862544d67c8` (remote-verified, clean tree).

## Objective

Build the Region 1 boss: a multi-step, saveable investigation that combines the region's skills, gates its completion
achievement, and unlocks Region 2. `STAGE2_RECONSTRUCTION_SCOPE.md` §10 makes a region that ends without a boss a
closure failure, so this is the first unit where a *region* rather than a topic is the thing being completed.

## Result up front

**S2-10 is Complete.** `inv.r1-harbour-audit` — **The Harbourmaster's Audit** — runs in **5 stages over 15 authored
questions**, drawing on **14 of Region 1's 17 skills** across all four of its modules. It is resumable a stage at a
time, and Region 1's achievement is no longer awarded until the case is closed.

| Stage | Draws on |
|---|---|
| 1 · What the record is | cases, tables, multiplication |
| 2 · Reconciling the count | addition, counting, subtraction, tables |
| 3 · The share that was cod | fractions, percentages, proportions, division, multiplication |
| 4 · The brine that spoiled | ratios, multiplication, division |
| 5 · The verdict | negatives, number lines, variables, variable kinds, tables |

## Relevant files

| File | Change |
|---|---|
| `src/shared/schemas/curriculum.ts` | **New** `InvestigationSchema` / `InvestigationStepSchema`; `curriculum.investigations` |
| `src/shared/schemas/profile.ts` | **New** `InvestigationProgressSchema`; `save.investigationProgress` |
| `src/shared/constants/app.ts` | Save schema version **2 → 3** |
| `src/core/persistence/migrations.ts` | Migration 2 → 3 |
| `src/core/investigations/engine.ts` | **New.** Unlock, status, resume and step recording — pure |
| `src/core/curriculum/progress.ts` | A region is not complete until its boss is closed |
| `src/core/curriculum/loader.ts` | Investigation references validated |
| `src/renderer/state/session.ts` | `startInvestigationStep`; a finished step records a step result, not a lesson |
| `src/renderer/state/store.ts`, `app/App.tsx`, `screens/RegionScreen.tsx` | Entry point and routing |
| `src/renderer/screens/InvestigationScreen.tsx` | **New.** The case, its stages, and where the learner had got to |
| `src/content/worlds/curriculum.json` | The investigation |
| `src/content/questions/questions.json` | 145 → **160** authored questions |
| `tests/helpers/complete-bosses.ts` | **New.** Which regions have a boss and which owe one |
| `tests/helpers/investigation-playthrough.ts` | **New.** Plays a case through the real engine |
| `tests/unit/investigations.test.ts` | **New.** 17 checks |
| `tests/audit/investigation-structure.test.ts` | **New.** 12 checks |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Multi-step investigation | Yes — 5 stages, minimum of 3 enforced by the schema |
| 2 | Saveable | Yes — `investigationProgress` records the stage reached and every stage's accuracy; migration 2 → 3 |
| 3 | Combines Region 1 skills | Yes — 14 skills across all four modules, and an audit fails a boss confined to one module |
| 4 | Awards the region achievement | Yes — and only once the case is closed |
| 5 | Unlocks Region 2 | Yes — through the existing `isRegionUnlocked`, which now depends on the boss |
| 6 | Playable through the real session engine | Yes — the same `submitAnswer`/`advance` path as a lesson; mastery, review, misconceptions and achievements all move |
| 7 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **443 tests / 35 files** (was 413 / 33) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 562.92 kB (149.12 kB gzip) |
| `npm run report:coverage` | Ran — 17 of 22 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **The boss runs through the real session engine, not beside it.** A step is an ordinary `LessonSession` over that
   step's questions, so mastery, spaced review, misconception detection and achievement evaluation behave identically
   inside a case and inside a lesson. Only the record written on completion differs — a step result rather than a lesson
   completion. Two engines would have drifted, and the second one would have been the one nobody tested.

2. **A region is not complete until its case is closed.** This changed existing behaviour deliberately: finishing every
   Region 1 lesson used to award `ach.harbor-charted`, and now does not. Four existing tests failed on that change,
   which is the guard working, and they were updated to play the boss rather than relaxed.

3. **Resume means resume.** `beginInvestigation` is idempotent, so reopening the briefing cannot rewind a case;
   `recordStepResult` takes the maximum of the stage reached, so re-arguing stage one out of curiosity cannot push a
   learner backwards through a case they had nearly closed.

4. **The debt for Region 2's boss is declared, not implied.** `complete-bosses.ts` splits every region into "has one"
   and "owes one", and the audit checks both directions — every region appears in exactly one list, a region claiming a
   boss has it, and a region owing one does not yet have it. A boss cannot be quietly added for a region still listed
   as owing one without the list being updated to say so.

## Corrections made during the unit

1. **A stage claimed fewer skills than its questions exercise.** `step.r1-shares` declared fractions, percentages,
   proportions and division; one of its questions also needs multiplication. The audit holds a step's `skillIds` to its
   questions in *both* directions — nothing claimed that is not exercised, nothing exercised that is not declared — and
   it failed on the second. The declaration was corrected rather than the check loosened.

2. **The orphan-reachability rule needed a third route, and got it deliberately.** A boss question belongs to no lesson
   by design: filing it under one would misreport which topic it practises. So "reachable from a lesson or a
   remediation follow-up" became "…or an investigation step" — the third deliberate widening of that rule (D-017), each
   recorded where it happened.

## Verification that the guards have teeth

Eight deliberate probes, all reverted. All eight bit on the first run:

| Probe | Result |
|---|---|
| The boss stops gating its region | **2 checks fail** |
| Reopening a case rewinds it | **1 check fails** |
| The first stage closes the whole case | **2 checks fail** |
| A boss step recorded as a lesson completion | **7 checks fail** |
| The case unlocks before the region's lessons are done | **2 checks fail** |
| A region vanishes from the boss declaration | **1 check fails** |
| A stage claims a skill it never exercises | **1 check fails** |
| The case re-uses a lesson's question | **4 checks fail** |

## Remaining work

None for this unit. Region 2's boss investigation is **S2-18** and is declared as owed in `complete-bosses.ts`; it
cannot be built before the Region 2 lessons it draws on exist (S2-11 … S2-17).

## Local commit

`dc87d8b87c88b8d8b4db0d8cb1c6f20759aec8f4`

## Remote verification

```
LOCAL_HEAD  = dc87d8b87c88b8d8b4db0d8cb1c6f20759aec8f4
REMOTE_HEAD = dc87d8b87c88b8d8b4db0d8cb1c6f20759aec8f4
VERIFIED: MATCH
```

## Next unit

**S2-11 — Region 2 world and curriculum architecture.** Not started in this cycle, per the one-unit-per-cycle rule.
