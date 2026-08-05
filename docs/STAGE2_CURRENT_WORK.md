# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-07 — Region 1 curriculum architecture**

Entered from `0901f5ad86baa3d33b42a838e979b06783ba2366` (remote-verified, clean tree).

## Objective

Give Region 1 its full shape before any lesson is written properly. Every one of the 17 topics in
`STAGE2_RECONSTRUCTION_SCOPE.md` §2 gets a skill, an objective, a lesson and a seed question, arranged into modules
with a prerequisite graph a learner can actually walk.

This unit delivers **architecture, not finished lessons.** Completeness — the 18 structure requirements in scope §5 —
is S2-08.

## Relevant files

| File | Change |
|---|---|
| `src/content/worlds/curriculum.json` | 17 skills, 17 objectives, 4 modules, 17 lessons, prerequisite graph |
| `src/content/questions/questions.json` | 17 seed questions, one per topic |
| `tests/audit/region1-architecture.test.ts` | **New.** 10 checks over coverage, graph soundness and skeleton honesty |
| `.github/workflows/ci.yml` | Concurrency fix so a commit on `main` keeps its own CI run |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Complete Region 1 lesson graph | Yes — 4 new modules, 17 new lessons (19 in the region) |
| 2 | Prerequisite graph | Yes — chained within modules, modules chained from `m.r1-counting`; no cycles |
| 3 | Every required topic represented | Yes — 17 of 17, asserted against the scope list |
| 4 | Every required topic reachable | Yes — an unlock walk from a fresh save reaches every lesson |
| 5 | Skeleton content not marked Complete | Yes — and enforced, see below |
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
| `npm test` | Pass — **246 tests / 25 files** (was 236 / 24) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 358.13 kB (101.10 kB gzip) |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **All 17 scope topics now exist as curriculum, not prose.** Counting, the four operations, fractions, decimals,
   percentages, ratios, proportions, negative numbers, number lines, coordinates, tables, variables, cases, and
   categorical-versus-numerical each have a skill, an objective, a lesson with a written concept, and one seed
   question that genuinely teaches the point.

2. **Four modules with a real prerequisite graph.** `m.r1-counting` (counting and the four operations) opens the
   region; `m.r1-parts`, `m.r1-position` and `m.r1-data` each depend on it. Lessons chain inside a module, and each
   module's first lesson depends on the last lesson of its prerequisite module.

3. **Reachability is walked, not assumed.** The audit starts from a fresh save, repeatedly completes whatever is
   unlocked, and fails if any Region 1 lesson is still locked at the end. A cycle check runs alongside it, because a
   cycle is the most likely way to make content permanently unreachable.

4. **Skeleton honesty is enforced.** A check asserts each new lesson still has exactly one question. If one grows
   past a seed, the test fails with a message pointing at S2-08 — so a half-finished lesson cannot quietly start
   counting as finished work.

## Corrections made during the unit

- **The CI concurrency rule was wrong for `main`, and it cost S2-06 its run.** `cancel-in-progress: true` applied to
  every ref, so pushing the docs follow-up cancelled the unit commit's own CI. That run is now `cancelled`, not
  passed, in the history. The rule now cancels only on non-`main` refs, so every persisted unit keeps a verified run
  of its own. (S2-06 is still covered: `0901f5a` has identical source plus docs and passed.)

## Verification that the guards have teeth

Two deliberate probes, both reverted:

| Probe | Result |
|---|---|
| Introduce a prerequisite cycle between two lessons | **2 checks fail** |
| Drop `l.r1-ratios` from its module | **3 checks fail** |

## Known mismatch, recorded not silently fixed

The surviving Stage 1 world places centre (`l.middle-harbor`) inside Region 1 and spread (`l.spread-1`) in Region 2.
Under the Stage 2 scope both belong to **Region 2 — Describing and Visualizing Data**. Re-cutting the regions is
Region 2 architecture work, so it is left alone here and recorded for **S2-11** rather than done half-way. Region 1
therefore currently holds 19 lessons: the 17 new topic lessons plus the two inherited Stage 1 lessons.

## Remaining work

None for this unit.

## Local commit

Recorded in a follow-up commit once the push is verified; hashes are never written in advance.

## Remote verification

`git rev-parse HEAD` compared against `git ls-remote origin refs/heads/main` — see the backlog row.

## Result

**Complete.** Region 1 has its full topic architecture: 17 of 17 topics represented, ordered and reachable, with the
skeleton state enforced so nothing here can be mistaken for a finished lesson.

## Next unit

**S2-08 — Region 1 lessons and interactions.** Not started in this cycle, per the one-unit-per-cycle rule.
