# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-03 — Point-Placement Interaction**

Entered from `53c77f620eef832c80c330d2740088818c3e00c7` (remote-verified, clean tree).

## Objective

Make `point-placement` live — the second of the Stage 1 interaction stubs. Placing a point answers *"where is this
value?"* rather than *"what is this value?"*, which is the natural way to teach number lines, coordinates, and reading
a chart, and the only way to ask for a deliberately approximate answer.

## Relevant files

| File | Change |
|---|---|
| `src/core/questions/point-placement.ts` | **New.** Pure geometry: snapping, clamping, keyboard movement, description, matching, classification |
| `src/shared/schemas/question.ts` | `PointAnswerSchema` + `PointFieldSchema`; interaction ↔ answer ↔ field cross-checks; target-inside-field validation |
| `src/core/questions/types.ts` | `point` raw and normalized response kinds |
| `src/core/questions/normalize.ts` | Missing second axis recorded as `null`, not dropped |
| `src/core/questions/evaluators.ts` | `point` evaluation; emits offsets, `axesSwapped`, `pointMisconceptionIds` |
| `src/core/questions/registry.ts` | `responseKind` widened; flag flipped to `implemented: true` |
| `src/core/misconceptions/engine.ts` | Pre-classification generalised to cover point as well as step signals |
| `src/core/misconceptions/detectors.ts` | `point-geometry` detector registered |
| `src/core/curriculum/loader.ts` | Point misconception references validated |
| `src/renderer/components/QuestionRenderers.tsx` | `PointPlacement` renderer |
| content | `mc.axes-swapped` + `rem.axes-order`; 4 point questions across two lessons |
| `tests/integration/session-flow.test.ts` | Playthrough extended for the three new Region 1 questions |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Number lines | Yes — 3 of the 4 shipped questions |
| 2 | Coordinates | Yes — `q.point-thursday-catch` on a day × fish plane |
| 3 | Graph reading | Yes — same question reads a chart's axes to plot a value |
| 4 | Approximate values | Yes — `q.point-approx-mean`, tolerance 1, tests balance-point intuition rather than arithmetic |
| 5 | Pointer interaction | Yes — click on the plot maps back onto the field grid |
| 6 | Keyboard interaction | Yes — native range slider per axis; asserted reachable, see below |
| 7 | Configurable tolerance | Yes — per axis, 0 for exact, >0 for approximate |
| 8 | Accessible feedback | Yes — labelled sliders, `aria-valuetext`, polite live region, SVG `aria-label` carrying the marker position |
| 9 | Commit pushed and remote hash verified | Yes |

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
| `npm test` | Pass — **155 tests / 19 files** (was 115 / 17) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 310.30 kB (90.08 kB gzip) |

`test:a11y` was **not** run and is **not** claimed — the script still does not exist; it arrives in S2-20. The
accessibility work here is structural, and the keyboard claim below is a real assertion, but neither is the same as
automated a11y verification.

## Work completed

1. **Geometry in core, not in the renderer.** Snapping, clamping, movement, description, matching, and classification
   all live in `point-placement.ts`, following the pattern S2-02 set. The renderer computes pixel positions and
   nothing else.

2. **Keyboard operability is asserted, not asserted-about.** A test walks from the control's start position to *every
   shipped target* using `movePoint` alone — one step per simulated key press — and then submits that placement
   through the real session engine and requires it to be marked correct. If a question were ever authored with a
   target off the step grid, that test fails: the pointer could reach it but the keyboard could not.

3. **Snapping without float noise.** Naive stepping on a 0.05 grid produces values like `0.30000000000000004`, which
   would miss a zero-tolerance target. Values are rounded to the precision the step implies.

4. **Axes-swapped is detected geometrically.** Placing (6, 4) when (4, 6) was wanted is the classic coordinate error,
   and it is derivable from the target rather than needing to be enumerated per question. Symmetric targets are
   excluded, because a swap there is unprovable.

5. **Misconception pre-classification generalised.** The mechanism S2-02 introduced for steps now covers any
   interaction that classifies during evaluation, so point errors reach the same micro-lesson, guided retry, and
   follow-up as everything else. A `point-geometry` detector is registered so the new misconception names a real
   detector rather than a dangling one.

6. **Content.** Four questions in two real lessons, plus `mc.axes-swapped` and its `rem.axes-order` remediation.

## Corrections made during the unit

- **The S2-02 drift guard fired, as designed.** Adding three questions to `l.reading-tallies` broke the enumerated
  playthrough in `session-flow.test.ts` — this time with the clear message added in S2-02 rather than a `TypeError`.
  Answers were added; no assertion was weakened.
- **`toleranceY` made optional** in `PointTarget` after typecheck flagged number-line targets being forced to supply a
  meaningless second-axis tolerance.
- **A lint warning was introduced and removed** (unused destructured binding) to hold the 0/0 baseline.
- **Regression probe:** disabling `isAxesSwapped` fails 4 tests across both new files, so the swap coverage is real.

## Remaining work

None for this unit.

## Local commit

`4c4d908bf4395bacbb4c23968fbb86ce46b36fd3`

## Remote verification

```
LOCAL_HEAD  = 4c4d908bf4395bacbb4c23968fbb86ce46b36fd3
REMOTE_HEAD = 4c4d908bf4395bacbb4c23968fbb86ce46b36fd3
VERIFIED: MATCH
```

## Result

**Complete.** `point-placement` is live: **13 of 17** interaction types implemented, content uses 13 distinct types.
Four stubs remain: `drag-and-drop`, `formula-construction`, `simulation-prediction`, `confidence-rating`.

## Next unit

**S2-04 — Accessible Drag-and-Drop.** Not started in this cycle, per the one-unit-per-cycle rule.
