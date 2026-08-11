# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-15 — Descriptive-statistics laboratory (cycle 3: the shelf, the export, and a migration)**

Entered from `a1fce52c835404406176e22576531b1807e09733` (remote-verified, clean tree).

## Objective

Let an experiment survive the app closing, and let a finding leave the app.

## Result up front

**S2-15 is Complete: all 12 criteria are met.** Experiments can be kept on a bounded shelf inside the save file,
reloaded with the chart they were drawn as, removed, and exported as plain text. Stage 1 known defect #3's placeholder
instruments are gone; the bench is a learning environment.

`SAVE_SCHEMA_VERSION` is **3 → 4** with a real migration. Note for the record: the previous handoff said 2 → 3; the
save schema had already reached 3 at S2-10, and that line was written from the older §6 text rather than from the
constant.

## Relevant files

| File | Change |
|---|---|
| `src/shared/schemas/profile.ts` | `SavedExperimentSchema`; `savedExperiments` on the save file |
| `src/shared/constants/app.ts` | `SAVE_SCHEMA_VERSION` 3 → **4**; `LABORATORY_SHELF_LIMIT` |
| `src/core/persistence/migrations.ts` | The 3 → 4 step, written explicitly rather than left to a default |
| `src/core/laboratory/shelf.ts` | **New.** Save, remove, reload, and the text export |
| `src/renderer/state/store.ts` | `shelveExperiment` / `unshelveExperiment`, persisted immediately |
| `src/renderer/screens/LabScreen.tsx` | Keep, load, remove, export |
| `tests/unit/laboratory-shelf.test.ts` | **New** — 15 checks |
| `tests/integration/persistence.test.ts` | 9 → **12**: the 3 → 4 step on a save that genuinely lacks the field, a shelf round-trip through a real save file, and the migration-chain check (D-055) |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1–7 | Create/edit, add/remove, sort, outliers, live statistics, reset, accessible text | **Yes** (cycle 1) |
| 8–10 | Compare two datasets, change graph type, change bins | **Yes** (cycle 2) |
| 11 | Save / reload experiments | **Yes** — in the save file, with a migration |
| 12 | Export summaries | **Yes** — plain text, including the picture in words |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **630 tests / 45 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 871.98 kB (223.98 kB gzip) |
| `npm run report:coverage` | Ran — 17 of 41 topics meet §4, unchanged (no content changed) |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **A kept experiment carries the readings, the title, the chart kind and the bin width** — an experiment that came
   back drawn as a different picture would have lost half of what was being explored. It does **not** carry the edit
   log, which belongs to the sitting it happened in, and the bench says so when it loads one. (D-054)

2. **The shelf is bounded and a full shelf is refused with the limit named**, not silently rotated. The learner chose
   to keep every one of those.

3. **The export is plain text** — every measure, the readings in full, the chart's description because words are the
   only form of a picture that survives a paste, and the name of the quartile convention that produced the numbers.

4. **The migration chain is now checked against the schema version** (D-055), after a probe showed the version bump
   was not load-bearing for a defaultable field.

## Corrections made during the unit

1. **The descriptions read "1 readings".** Pluralisation is now a helper, and a bench holding one reading is a real
   state rather than an edge case.

2. **A test of mine named a property it did not check.** "Does not share arrays with the shelf entry" asserted that
   adding a reading left the entry unchanged — true whether or not the array is shared, because every bench operation
   allocates. A probe pointing `loadExperiment` straight at the stored array failed nothing. It now asserts identity.

3. **My own expectation counted spaces wrong** in the export's aligned columns; the assertions use a pattern now.

## Verification that the guards have teeth

Seven deliberate probes, all reverted. **Five bite, two found gaps now closed and re-probed:**

| Probe | Result |
|---|---|
| The 3 → 4 migration is removed | **4 → 5 checks fail** |
| A full shelf silently drops the oldest instead of refusing | **1 check fails** |
| The shelf keeps the edit log too | **1 check fails** |
| The export stops naming the quartile convention | **1 check fails** |
| The export drops the picture | **2 checks fail** |
| A reloaded experiment shares its array with the shelf entry | **0 → 1 check fails** — a weak test of mine, now asserting identity |
| The save version is left behind while the field is added | **0 → 1 check fails** — closed by the migration-chain check (D-055) |

## Remaining work

None. S2-15 is Complete.

## Local commit

`c497a2ec7e22361b9a30f5484f6a68749a01a9cc`

## Remote verification

```
LOCAL_HEAD  = c497a2ec7e22361b9a30f5484f6a68749a01a9cc
REMOTE_HEAD = c497a2ec7e22361b9a30f5484f6a68749a01a9cc
VERIFIED: MATCH
```

## Next unit

**S2-16 — the Region 2 misconception library.** Not started in this cycle.
