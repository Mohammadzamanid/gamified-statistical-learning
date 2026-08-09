# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-11 — Region 2 world and curriculum architecture**

Entered from `8cc4e545935e6fd824d46f19691e9c0ad61285fd` (remote-verified, clean tree).

## Objective

Give Region 2 the architecture Region 1 got from S2-07: a distinct identity and narrative, a module sequence, a
prerequisite graph, objectives and skills for every topic the scope requires, a declared laboratory unlock, and a
specification for the boss S2-18 will build. Lessons themselves are S2-12 … S2-14 and are **not** part of this unit.

## Result up front

**S2-11 is Complete.** Region 2 now holds **22 topic lessons across 6 modules**, covering all 21 topics
`STAGE2_RECONSTRUCTION_SCOPE.md` §2 names for the region plus choosing a measure of centre. **19 are skeletons** seeded
by this unit; **3 are Stage 1 lessons re-cut into the region** — which is what "re-cut in S2-11" meant for
`l.reading-tallies`, `l.middle-harbor` and `l.spread-1`.

| Module | Lessons | Teaches |
|---|---:|---|
| `m.r2-counts` — Counting What Is There | 3 | frequency · proportion · percentage |
| `m.r2-centre` — The Middle of the Data | 4 | mean · median · mode · choosing a measure |
| `m.r2-spread` — How Far It Reaches | 4 | range · quartiles · percentiles · IQR |
| `m.r2-variation` — How Much It Varies | 4 | variance · standard deviation · outliers · skew |
| `m.r2-pictures` — Pictures of Data | 5 | bar charts · histograms · dot plots · box plots · scatterplots |
| `m.r2-judgement` — Reading Honestly | 2 | choosing graphs · misleading graphs |

**Region 1 now holds no un-Complete lesson at all.** Moving the two Stage 1 inheritances out is what closed that.

## Relevant files

| File | Change |
|---|---|
| `src/shared/schemas/curriculum.ts` | `SkillSchema.stage` (required); `curriculum.laboratoryUnlock` |
| `src/core/curriculum/progress.ts` | **New** `isLaboratoryUnlocked` |
| `src/renderer/screens/LabScreen.tsx` | The bench is sealed until the curriculum's gate opens |
| `src/content/worlds/curriculum.json` | Region 2 architecture; both placeholder modules retired |
| `src/content/questions/questions.json` | 160 → **179** authored questions (19 seeds) |
| `tests/helpers/region2-topics.ts` | **New.** The 22 required topics, with their lesson and skill |
| `tests/audit/region2-architecture.test.ts` | **New.** 20 checks |
| `tests/audit/region1-architecture.test.ts` | The two-inheritance exception is gone; Region 1 must now hold none |
| `docs/REGION2_BOSS_SPEC.md` | **New.** The boss specification S2-18 builds from |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Distinct world and narrative | Yes — Region 2 re-identified around variation rather than "averages"; see the note below on the shared world |
| 2 | Module sequence | Yes — 6 modules, one entry point, no cycles |
| 3 | Prerequisite graph | Yes — and expressed in *lesson* prerequisites, which is what the unlock rule actually reads |
| 4 | Objectives | Yes — 19 new, each routing its lesson to its topic's skill |
| 5 | Laboratory unlocks | Yes — declared in the curriculum, enforced by `isLaboratoryUnlocked`, honoured by the screen |
| 6 | Boss specification | Yes — `docs/REGION2_BOSS_SPEC.md`, five stages mapped onto the module sequence |
| 7 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **463 tests / 36 files** (was 443 / 35) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 592.32 kB (155.26 kB gzip) |
| `npm run report:coverage` | Ran — **17 of 40** topics meet §4 |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## The coverage denominator grew, and nothing regressed

`report:coverage` now says **17 of 40** where it said 17 of 22. That is not a regression: the 18 Region 2 skills this
unit declares are topics the curriculum did not previously contain, and the scope requires a topic with zero generators
to **appear in the report as a failure rather than vanish from it**. All 23 failing topics are Region 2's, each with
its reason. Their generators are **S2-17**. The 17 that pass are unchanged, and every Region 1 topic is still among
them.

## Work completed

1. **Every skill now says which stage owns it.** Scope §10 makes an unclassified skill a closure failure, and this unit
   adds 18 skills — retrofitting the field later across 41 would have been the wrong order. `stage` is required with no
   default, deliberately: a default would satisfy the letter of that rule while defeating it, since every new skill
   would classify itself. It also makes "a Stage 3 topic appears before Stage 3 begins" checkable, which is a separate
   closure guard.

2. **The two placeholder modules are retired, not left standing.** `m.harbor-1` and `m.atoll-1` existed to hold Stage 1
   lessons whose topics belong to Region 2. Their three lessons moved into the Region 2 modules that teach those
   topics, keeping their ids so nothing that references them broke, and the empty shells were removed.

3. **The laboratory gate lives in the curriculum, not in the screen.** When a learner is ready for a bare instrument is
   a content decision; hard-coding it in `LabScreen` would have put it where no audit looks. A curriculum that declares
   no gate leaves the bench open, so this can never seal it by accident.

## Corrections made during the unit

1. **The module prerequisite graph did not actually gate anything.** Modules declared prerequisites, but
   `isLessonUnlocked` reads *lesson* prerequisites — so a learner arriving at Region 2 would have found six modules
   open at once instead of one. The audit caught it on its first run, by computing availability through the real unlock
   rule rather than reading the JSON. Fixed by adopting Region 1's convention: a module's first lesson depends on the
   last lesson of every module that module depends on. The check was then tightened to assert exactly that, rather than
   to assert the empty prerequisite list that had let the bug through.

2. **Region 1's "two known exceptions" check had nothing left to guard.** With the inheritances moved out, Region 1
   holds only its 17 topic lessons and all are Complete. The check was rewritten to require *no* un-Complete Region 1
   lesson rather than deleted along with the exception, so a regression still surfaces there.

## Verification that the guards have teeth

Eight deliberate probes, all reverted. All eight bit on the first run:

| Probe | Result |
|---|---|
| A module opens without its prerequisite | **2 checks fail** |
| A skeleton grows without being declared Complete | **1 check fails** |
| A lesson stops reaching its own topic's skill | **1 check fails** |
| A required topic vanishes from the declared list | **2 checks fail** |
| A skill ships with no stage classification | **5 checks fail** |
| A Stage 3 skill appears before Stage 3 begins | **2 checks fail** |
| The laboratory gate stops being honoured | **1 check fails** |
| A skeleton is declared Complete | **4 checks fail** |

## A judgement call, recorded

The criterion says "distinct world", and the backlog note says regions "must feel related but not visually
interchangeable". Both regions remain inside `w.counting-shores` rather than Region 2 getting its own `World` record —
one coastline, two places on it — and the distinctness was put into the region's identity instead: Region 2 is now
about readings that are never the same twice, where Region 1 is about counting things once. If a later unit decides a
separate world record is wanted, nothing here blocks it.

## Remaining work

None for this unit. The 19 seeded lessons are skeletons by design; writing them is **S2-12** (central tendency),
**S2-13** (spread and position) and **S2-14** (visualization). The three inherited lessons need the same §5 treatment
in those units. Region 2's boss is specified here and built by **S2-18**.

## Local commit

`dfb8e4f7c4c7b78d2ec612c4bb433e68d8f448c3`

## Remote verification

```
LOCAL_HEAD  = dfb8e4f7c4c7b78d2ec612c4bb433e68d8f448c3
REMOTE_HEAD = dfb8e4f7c4c7b78d2ec612c4bb433e68d8f448c3
VERIFIED: MATCH
```

## Next unit

**S2-12 — Central tendency lessons.** Not started in this cycle, per the one-unit-per-cycle rule.
