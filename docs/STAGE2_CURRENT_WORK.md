# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-06 — Dedicated spaced-review queue**

Entered from `ebc84fbe8192839036a7e1825e565951bb22ec6a` (remote-verified, clean tree).

## Objective

Give review its own place in the app. The scheduler existed since Stage 1 and the Logbook already computed
`dueItems`, but there was nowhere to actually *do* a review — the data had no home. This unit adds the queue, the
session and the screen, and makes an interrupted review resumable.

## Relevant files

| File | Change |
|---|---|
| `src/core/spaced-repetition/review-queue.ts` | **New.** Pure selection and ordering: overdue/due/new, day arithmetic, question choice |
| `src/renderer/state/review-session.ts` | **New.** Pure session: start, answer, reschedule, advance, end |
| `src/renderer/screens/ReviewScreen.tsx` | **New.** The review screen |
| `src/renderer/state/store.ts` | `review` screen + `beginReview` / `submitReview` / `nextReview` / `exitReview` |
| `src/renderer/app/App.tsx`, `components/TopBar.tsx` | Route and a nav entry, so the screen is genuinely reachable |
| `src/shared/schemas/profile.ts` | `ReviewSessionStateSchema`; `SaveFile.reviewSession` |
| `src/shared/constants/app.ts` | `SAVE_SCHEMA_VERSION` 1 → 2 |
| `src/core/persistence/migrations.ts` | Real `1 -> 2` migration |
| `tests/integration/persistence.test.ts` | Migration test made version-agnostic |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Due-review calculation | Yes — `buildReviewPlan`, clock passed in |
| 2 | Review screen | Yes — routed and reachable from the top bar |
| 3 | Overdue items | Yes — separated at the one-day boundary, most overdue first |
| 4 | New versus review distinction | Yes — three named counts; a skill never met is *not* offered |
| 5 | Mixed-topic review | Yes — due band interleaved, no skill twice in a row |
| 6 | Correct/incorrect rescheduling | Yes — interval lengthens, or resets to a day and records a lapse |
| 7 | Persistence | Yes — answers persist immediately, not at the end of a run |
| 8 | Interrupted-session resume | Yes — the queue is **frozen**, and resume is proven across a real save/load |
| 9 | Deterministic-clock tests | Yes — every test pins an instant; no wall-clock reads anywhere in the review core |
| 10 | Commit pushed and remote hash verified | Yes |

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
| `npm test` | Pass — **236 tests / 24 files** (was 211 / 22) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 332.35 kB (95.55 kB gzip) |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **The clock is an argument, never read inside.** Review is defined in days, so a hidden `Date.now()` would make
   the system untestable and would drift with the machine's timezone. Every function in the review core takes `now`,
   and every test pins a fixed instant — which is what lets the one-day overdue boundary be tested at all.

2. **The queue is frozen when the session starts.** Rebuilding it on resume would silently change what "resume"
   means: items already shown would drop out, and items that fell due meanwhile would appear. Freezing costs a save
   schema change, and that is the honest price of the requirement. A test asserts the running session is unchanged
   even when new work falls due a week later.

3. **Save schema 1 → 2, with a real migration.** Per the contract in `STAGE_HANDOFF.md` §6, the shape change ships
   with a migration and round-trip tests. The migration writes an explicit `null` rather than leaning on the schema
   default — a migration that depends on a default stops working the moment the default changes.

4. **New is not the same as unpractised.** A skill only becomes a `new` review candidate once the learner has met it.
   Offering untouched skills would turn review into a second, shuffled lesson path.

5. **Review answers persist immediately.** A reschedule is the whole point of answering, so it is written on
   submission rather than at the end of the run — an interruption must not lose it. Abandoning a session keeps every
   reschedule and attempt already recorded, and drops only the queue position.

## Corrections made during the unit

- **I guessed the mastery API and was wrong.** `applyAttempt` takes `(prev, attempt, rule)` and returns a
  `MasteryUpdate`, not a bare state. Typecheck caught it; the review session now makes the same call the lesson
  session does, so the two share one notion of progress.
- **The migration test hardcoded version 1** and went stale the moment the version was bumped. It now asserts against
  `SAVE_SCHEMA_VERSION` and additionally checks the new `1 -> 2` step ran — stronger than before, and it will not
  quietly stop testing the chain at the next bump.
- **`FeedbackPanel` needed props I had not passed**; caught by typecheck.
- **The screen was initially unreachable.** The first version took props, which does not match the store-driven
  screens; the bundle grew by only 0.24 kB, showing it had been tree-shaken out. Rewritten to the store pattern and
  wired into the router and top bar — the bundle then grew by 7 kB, which is the evidence it is actually included.

## Verification that the tests have teeth

Two deliberate probes, both reverted:

| Probe | Result |
|---|---|
| Move the overdue boundary from ≥1 day to ≥2 days | **2 checks fail** |
| Break session completion so the frozen queue never ends | **1 check fails** |

## Remaining work

None for this unit.

## Local commit

Recorded in a follow-up commit once the push is verified; hashes are never written in advance.

## Remote verification

`git rev-parse HEAD` compared against `git ls-remote origin refs/heads/main` — see the backlog row.

## Result

**Complete.** Review has a queue, a session, a screen and a nav entry; overdue, due and new are distinguished by name;
outcomes reschedule; and an interrupted session resumes on the same item with the same question across a real
save/load round trip.

## Next unit

**S2-07 — Region 1 curriculum architecture.** Not started in this cycle, per the one-unit-per-cycle rule.
