# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-04 — Accessible Drag-and-Drop**

Entered from `7b49bfbf67e74ff22c9ef74f1277e348516c28c9` (remote-verified, clean tree).

## Objective

Make `drag-and-drop` live — the third Stage 1 interaction stub, and the hardest of them to make accessible. The unit
asks for one control reusable across sorting, matching, ordering, grouping observations, and simple graph
construction, with a **complete** keyboard alternative.

## Relevant files

| File | Change |
|---|---|
| `src/core/questions/drag-drop.ts` | **New.** Pure placement state machine: place, return, reorder, capacity, completion, description, matching, classification |
| `src/shared/schemas/question.ts` | `PlacementAnswerSchema` + `DropZoneSchema`; interaction ↔ answer ↔ zones cross-checks; item/zone/capacity validation |
| `src/core/questions/types.ts` | `placement` raw and normalized response kinds |
| `src/core/questions/normalize.ts` | Zones sorted for a stable shape; within-zone order preserved |
| `src/core/questions/evaluators.ts` | `placement` evaluation; emits `misplacedItemIds`, `placementMisconceptionIds` |
| `src/core/questions/registry.ts` | `responseKind` widened; flag flipped to `implemented: true` |
| `src/core/misconceptions/{engine,detectors}.ts` | Pre-classification extended; `placement-mapping` detector registered |
| `src/core/curriculum/loader.ts` | Placement misconception references validated |
| `src/renderer/components/QuestionRenderers.tsx` | `DragDrop` renderer |
| content | `mc.digits-mean-numerical` + `rem.categorical-vs-numerical`; 4 questions across two lessons |
| `tests/integration/session-flow.test.ts` | Playthrough extended for the two new Region 1 questions |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Reusable for sorting | Yes — `q.dd-sort-prices`, single ordered zone |
| 2 | Reusable for ordering | Yes — same primitive, `orderMatters: true` |
| 3 | Reusable for matching | Yes — one capacity-1 zone per right-hand item; covered by a unit test using that shape |
| 4 | Reusable for grouping observations | Yes — `q.dd-variable-kinds`, `q.dd-above-below-mean` |
| 5 | Reusable for simple graph construction | Yes — `q.dd-build-bar-chart`, one zone per bar |
| 6 | Complete keyboard alternative | Yes — asserted, see below |
| 7 | Commit pushed and remote hash verified | Yes |

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
| `npm test` | Pass — **193 tests / 21 files** (was 155 / 19) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 324.70 kB (93.72 kB gzip) |

`test:a11y` was **not** run and is **not** claimed — the script still does not exist; it arrives in S2-20.

## Work completed

1. **One primitive, five shapes.** Rather than five bespoke controls, a placement answer assigns items to zones, and
   only the *zone configuration* varies: capacity-1 ordered slots for sorting and matching, unlimited category zones
   for grouping, one zone per bar for graph construction. The unit tests exercise the matching shape explicitly, so
   "reusable" is demonstrated rather than asserted.

2. **The keyboard path is the same code, and is proven.** Both the drag handlers and the `<select>` / reorder buttons
   call `placeItem` and `moveWithinZone`. An integration test then builds **every shipped arrangement using only those
   operations** — never a drag — and submits each through the real session engine, requiring it to be marked correct.
   "Works with a mouse but not a keyboard" is therefore not a reachable state.

3. **A full zone refuses new items instead of displacing old ones.** Silently evicting a placement the learner already
   made would lose their work; refusing the new drop is recoverable. Re-placing an item into the zone it already
   occupies is treated as a reorder, not an overfill.

4. **Partial arrangements cannot be submitted.** `placementResponse` throws while items remain in the tray, so an
   unfinished attempt is never recorded as a wrong answer.

5. **Schema catches unauthorable questions.** An item expected in two zones, an item the answer never places, a zone
   reference that does not resolve, and an expected arrangement exceeding a zone's capacity are all rejected — each
   would otherwise produce a question with no reachable correct answer.

6. **Content.** Four questions in two real lessons, plus `mc.digits-mean-numerical` (a variable written with digits
   classified as numerical) and its remediation.

## Corrections made during the unit

- **My test assumption was wrong, not the engine.** The bar-chart question is last in its lesson, so `advance` finishes
  the lesson rather than incrementing the index. The assertion now branches on whether the question is last, instead of
  assuming it never is.
- **The drift guard fired again** for the two new Region 1 questions in `session-flow.test.ts`; answers added, no
  assertion weakened.
- **Regression probe:** removing the capacity guard fails the overfill test, so that coverage is real.

## Remaining work

None for this unit.

## Local commit

Recorded in a follow-up commit once the push is verified; hashes are never written in advance.

## Remote verification

`git rev-parse HEAD` compared against `git ls-remote origin refs/heads/main` — see the backlog row.

## Result

**Complete.** `drag-and-drop` is live: **14 of 17** interaction types implemented, content uses 14 distinct types.
Three stubs remain: `formula-construction`, `simulation-prediction`, `confidence-rating`.

## Next unit

**S2-05 — Interaction-type audit (all 17).** Not started in this cycle, per the one-unit-per-cycle rule.
