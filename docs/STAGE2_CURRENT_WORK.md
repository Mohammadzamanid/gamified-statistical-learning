# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-02 — Step-by-Step Calculation Interaction**

Entered from `b19d51da2c892fed9ce19ccde44a6307163f41c4` (remote-verified, clean tree).

## Objective

Make `step-by-step-calculation` a genuinely live interaction — the first of the six Stage 1 stubs to be implemented.
The learner works a calculation one numeric step at a time, so a mistake is caught and explained **where it happened**
rather than only at the final answer.

Chosen first among the stubs because the surviving Stage 1 handoff ranked it highest for pedagogy, and Region 1's
arithmetic, fraction, and percentage lessons (S2-08) cannot be authored properly without it.

## Relevant files

| File | Change |
|---|---|
| `src/core/questions/step-calculation.ts` | **New.** Pure run state machine: per-step submission, hints, retry, completion |
| `src/shared/schemas/question.ts` | `CalculationStepSchema` + `StepsAnswerSchema`; interaction ↔ answer-kind cross-check; duplicate step-id check |
| `src/core/questions/types.ts` | `steps` raw and normalized response kinds |
| `src/core/questions/normalize.ts` | Step normalization, preserving step order |
| `src/core/questions/evaluators.ts` | `steps` evaluation; emits `stepResults`, `firstFailedStepId`, `stepMisconceptionIds` |
| `src/core/questions/registry.ts` | `responseKind` widened to include `steps`; flag flipped to `implemented: true` |
| `src/core/misconceptions/engine.ts` | Step classifications honoured before question-level detectors |
| `src/core/curriculum/loader.ts` | Step-level misconception references validated |
| `src/renderer/components/QuestionRenderers.tsx` | `StepByStep` renderer |
| `src/content/questions/questions.json` | 3 step questions |
| `src/content/worlds/curriculum.json` | Attached to `l.reading-tallies` (2) and `l.middle-harbor` (1) |
| `tests/integration/session-flow.test.ts` | Playthrough extended for the two new lesson questions |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Multi-step calculations | Yes — 3-step runs |
| 2 | Per-step validation | Yes — each step checked on submission |
| 3 | Equivalent numeric formats | Yes — `25`, `25.0`, `50/2`, `12/40`, percent signs, comma decimals, plus per-step `acceptedValues` |
| 4 | Hints per step | Yes — per-step hints, counter resets on advance |
| 5 | Misconception classification | Yes — declarative `misconceptionValues`, routed into the existing remediation pipeline |
| 6 | Retry from the failed step | Yes — earlier accepted steps are preserved |
| 7 | Final explanation | Yes — per-step explanation on pass, question explanation at the end |
| 8 | Mastery update | Yes — one update per question, via the normal session path |
| 9 | Keyboard accessibility | Yes — native input + buttons, Enter submits, `role="status"` live region, state in words not colour |
| 10 | ≥3 real curriculum examples | Yes — 3, all inside real lessons, none a standalone demo |
| 11 | Commit pushed and remote hash verified | Yes |

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
| `npm test` | Pass — **115 tests / 17 files** (was 90 / 15) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 297.78 kB (86.67 kB gzip) |

`test:a11y` was **not** run and is **not** claimed — that script still does not exist; it arrives in S2-20. The
accessibility work here is structural (native controls, labels, live region, non-colour state) and is **not** the same
as automated a11y verification.

## Work completed

1. **Structured steps.** `solutionSteps` was display-only prose, so steps became a real answer kind: a `steps` answer
   holds ordered numeric steps, each with its own prompt, tolerance, unit, hints, explanation, and misconception map.
   The schema makes the interaction and the answer kind imply each other, so neither can exist without the other.

2. **Pure run engine.** All run logic is in `step-calculation.ts` with no React import, matching D-001's "session logic
   in pure functions". The renderer is a shell. That is why the state machine is testable without a DOM.

3. **Retry that keeps work.** A wrong submission moves the run to `awaiting-retry` and leaves `currentIndex` where it
   is; accepted steps stay banked. The learner retries the failed step, not the whole calculation.

4. **Misconceptions reach remediation.** The evaluator emits `stepMisconceptionIds`, and `classifyMisconception` now
   honours those before falling back to question-level detectors — which only understand single responses and would
   all decline a `steps` response. A wrong step therefore produces the same micro-lesson, guided retry, and injected
   follow-up as any other interaction, rather than a dead end.

5. **Reachability enforced.** The loader validates step-level misconception ids, so a step cannot classify to something
   nothing can remediate.

6. **One mastery update per question.** A completed run emits a single `steps` response through the ordinary session
   pipeline, so mastery, review scheduling, and achievements update exactly once — consistent with every other type.

## Corrections made during the unit

- **A pre-existing test broke and was extended, not weakened.** `session-flow.test.ts` drives a full playthrough of
  `l.reading-tallies` from a hard-coded answer map; the two new questions were absent, so it failed with an opaque
  `Cannot read properties of undefined`. Answers were added for them and an explicit assertion now names the missing
  question id. Every original assertion is unchanged. The enumeration is deliberately still exhaustive so that adding
  a lesson question fails loudly here — that is the drift guard working.
- **A lint warning was introduced and removed** (unused binding) to hold the 0-error/0-warning baseline.

## Remaining work

None for this unit.

## Local commit

`48bac65064d45b376d88d92bd775957ecc78105f`

## Remote verification

```
LOCAL_HEAD  = 48bac65064d45b376d88d92bd775957ecc78105f
REMOTE_HEAD = 48bac65064d45b376d88d92bd775957ecc78105f
VERIFIED: MATCH
```

## Result

**Complete.** `step-by-step-calculation` is live: **12 of 17** interaction types are now implemented, and content uses
12 distinct types. Five stubs remain: `drag-and-drop`, `point-placement`, `formula-construction`,
`simulation-prediction`, `confidence-rating`.

## Next unit

**S2-03 — Point-Placement Interaction.** Not started in this cycle, per the one-unit-per-cycle rule.
