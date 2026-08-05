# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-05 — Interaction-type audit (all 17)**

Entered from `12996468471d3f24317260b4714c428248302e62` (remote-verified, clean tree).

## Objective

Audit every registered interaction type before more content is layered on top, and make the audit **enforced rather
than described** — a document that can silently go stale is not an audit.

## Relevant files

| File | Change |
|---|---|
| `tests/audit/interaction-audit.test.ts` | **New.** 18 checks over the registry, renderer coverage and shipped content |
| `docs/INTERACTION_AUDIT.md` | **New.** Measured per-type table, what each check guards against, 5 findings |
| `src/renderer/components/rendered-interactions.ts` | **New.** Single source of truth for which types have a renderer |
| `src/renderer/components/QuestionRenderers.tsx` | Consults it, so the UI stays honest if flags and renderers ever drift |
| `tests/helpers/responses.ts` | **New.** Exhaustive correct/incorrect response builders for any answer kind |
| `tests/integration/region-completion.test.ts` | Uses the shared helper instead of its own private copy |

## Acceptance criteria

Per type: schema · renderer · evaluation · correct path · incorrect path · misconception path · keyboard operation ·
accessible name and instructions · ≥1 genuine curriculum use · save/resume where stateful.

| # | Criterion | Met |
|---|---|---|
| 1 | All 17 types audited | Yes — table in `INTERACTION_AUDIT.md` §1 |
| 2 | Schema / renderer / evaluation recorded per type | Yes, and enforced |
| 3 | Correct and incorrect paths exercised per type | Yes — driven from real content, every implemented type |
| 4 | Misconception path recorded per type | Yes — 10 of 14 mapped; the 4 gaps are finding **F-1**, not hidden |
| 5 | Keyboard operation recorded | Yes — structurally, with the limits stated in **F-5** |
| 6 | Accessible name and instructions present | Yes, and enforced |
| 7 | ≥1 genuine curriculum use | Yes — measured as reachable-from-a-lesson, so demos cannot satisfy it |
| 8 | Save/resume where stateful | Recorded as finding **F-2**: in-progress state is *not* persisted |
| 9 | Inappropriate "not implemented" notices removed | Yes — 3 removed across S2-02…S2-04; the 3 genuine stubs keep theirs |
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
| `npm test` | Pass — **211 tests / 22 files** (was 193 / 21) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 325.04 kB (93.81 kB gzip) |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20. Finding F-5 states plainly that nothing here
is automated accessibility testing.

## Work completed

1. **Renderer coverage became data.** `RENDERED_INTERACTION_TYPES` is now a module the renderer's switch consults and
   the audit compares against the registry's `implemented` flags. Previously "does a renderer exist?" was answerable
   only by reading a switch statement, so nothing could check it.

2. **Correct and wrong paths are exercised for every implemented type, from real content.** A shared helper builds a
   correct and a deliberately wrong response for any answer kind; the audit runs both through the real evaluator for
   every lesson-reachable question. Because the helper's switches are exhaustive over `AnswerSpec`, adding an answer
   kind without teaching it about that kind is a compile error.

3. **"Genuine curriculum use" is measured, not asserted.** A type counts only if a question using it is reachable
   **from a lesson**, so an isolated technical demo cannot satisfy the audit — exactly what the unit asked for.

4. **New reverse-validation guards.** No orphaned question (every question is reachable from a lesson or as a
   remediation follow-up), no orphaned remediation, no distractor or in-answer misconception the question does not
   also declare, and no misconception naming an unregistered detector.

5. **Findings recorded honestly, none claimed fixed.** F-1 four types with no misconception mapping (→ S2-16);
   F-2 in-progress interaction state is not persisted (→ S2-19); F-3 three genuine stubs; F-4 one question reachable
   only via remediation, by design; F-5 keyboard operability is structural, not browser-verified (→ S2-20).

## Corrections made during the unit

- **A `require()` call failed under ESM** in the first draft of the audit; replaced with a normal import.
- **Duplication removed:** `region-completion.test.ts` carried its own private response builder, which would have
  drifted from the audit's. It now uses the shared helper.

## Verification that the audit has teeth

Two deliberate drift probes, both reverted:

| Probe | Result |
|---|---|
| Flip `confidence-rating` to `implemented: true` with no renderer | **3 checks fail** |
| Remove `matching` from renderer coverage while its flag stays true | **1 check fails** |

## Remaining work

None for this unit.

## Local commit

`acc9bf36df47ab97613ec1f1bc77c8355b3cccd1`

## Remote verification

```
LOCAL_HEAD  = acc9bf36df47ab97613ec1f1bc77c8355b3cccd1
REMOTE_HEAD = acc9bf36df47ab97613ec1f1bc77c8355b3cccd1
VERIFIED: MATCH
```

## Result

**Complete.** 14 of 17 types implemented, every one with a renderer and at least one lesson-reachable question; 3
stubs, none used by content, none with a renderer. Five findings recorded for later units.

## Next unit

**S2-06 — Dedicated spaced-review queue.** Not started in this cycle, per the one-unit-per-cycle rule.
