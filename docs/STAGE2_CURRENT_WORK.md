# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-01 — Region-Completion Achievement Repair**

Entered from baseline `00f4497ff2f356bd03e3caf3556b3fa6a6de642e` (remote-verified, clean tree).

## Objective

Repair Stage 1 known defect #1: the `region-completed` achievement trigger was hard-coded to `false` in
`src/core/achievements/engine.ts`, so **no region achievement could ever be awarded**. Region awards are a
prerequisite for S2-10 and S2-18 (both boss investigations award a region achievement and gate the next region), so
this had to be fixed before any region content work.

## Relevant files

| File | Change |
|---|---|
| `src/core/achievements/engine.ts` | Region trigger now delegates to real completion logic; result de-duplicated |
| `src/core/curriculum/progress.ts` | Added `RegionGraph`; hardened `isRegionCompleted` against dangling references |
| `src/core/curriculum/loader.ts` | Validates achievement-trigger references (region / lesson / skill) |
| `src/renderer/state/session.ts` | Both call sites now pass the curriculum |
| `src/content/questions/achievements.json` | Added `ach.harbor-charted` and `ach.atoll-charted` |
| `tests/unit/achievements.test.ts` | 1 → 12 tests |
| `tests/integration/region-completion.test.ts` | New, 6 tests |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | A completed region awards its configured achievement | Yes |
| 2 | An incomplete region does not award it | Yes |
| 3 | The same achievement is not duplicated | Yes |
| 4 | The award survives save and reload | Yes — real `SaveManager` round trip |
| 5 | Existing tests remain green | Yes — all 73 baseline tests still pass |
| 6 | New unit and integration tests pass | Yes — 18 new tests |
| 7 | Commit pushed and remote hash verified | Yes |

## Required tests

```bash
npm run typecheck && npm run lint && npm test
npm run test:statistics && npm run test:content && npm run build
```

Measured results (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **90 tests / 15 files** (baseline was 73 / 14) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 286.61 kB (83.99 kB gzip) |

`test:a11y` was **not** run and is **not** claimed: the script does not exist yet. It arrives in S2-20.

## Work completed

1. **Root cause.** `evaluateAchievements` had no access to the curriculum, so the `region-completed` case could not be
   evaluated and returned `false` with a comment deferring the work to "the caller" — which never did it.

2. **Repair.** The engine now delegates to `isRegionCompleted`, the already-tested logic in
   `src/core/curriculum/progress.ts`, rather than growing a second parallel implementation. The curriculum argument is
   **required**, not optional: a caller that forgets it now fails to compile instead of silently reintroducing a
   permanent `false`.

3. **Hardened completion detection.** `isRegionCompleted` previously filtered modules by membership, so a region
   pointing at a **missing** module silently completed on its remaining modules. It now resolves every module id and
   returns `false` on any dangling reference, on a region with no modules, and on modules holding no lessons — a
   vacuous "all lessons complete" would otherwise award an unearned achievement.

4. **Content.** Added `ach.harbor-charted` and `ach.atoll-charted`, so the repaired trigger has genuinely reachable
   content instead of a code path with nothing to fire on.

5. **Loader validation.** Achievement triggers referencing a missing region, lesson, or skill now fail content
   validation. This is the same class of silent failure as the original defect — an achievement that can never fire.

6. **Regression proof.** The new tests were run against the old stubbed `false`: **7 failed**. They have teeth.

## Remaining work

None for this unit.

## Local commit

`6798b6a71beb3e15ec43e791ca60fa36e2a0c214`

## Remote verification

Verified by comparing `git rev-parse HEAD` with `git ls-remote origin refs/heads/main`:

```
LOCAL_HEAD  = 6798b6a71beb3e15ec43e791ca60fa36e2a0c214
REMOTE_HEAD = 6798b6a71beb3e15ec43e791ca60fa36e2a0c214
VERIFIED: MATCH
```

Re-confirmed after a session interruption: the commit is on remote `main` and the working tree is clean, so no work
was lost. This is exactly the failure mode `REMOTE_PERSISTENCE_POLICY.md` exists to survive.

## Result

**Complete.** Region achievements work end to end: earned by playing real lessons through the real session engine,
awarded exactly once, and surviving a real save/load round trip.

## Next unit

**S2-02 — Step-by-Step Calculation Interaction.** Not started in this cycle, per the one-unit-per-cycle rule.
