# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-09 — Region 1 validated content expansion (cycle 2: parts of a whole, and two holes in the pipeline)**

Entered from `f784dd320775a672e5e8ec52178c189e1a9fa8bc` (remote-verified, clean tree).

## Objective

Take Module 2's four part/whole topics past the `STAGE2_RECONSTRUCTION_SCOPE.md` §4 bar, and probe the pipeline built in
cycle 1 for guards that do not actually guard.

## Result up front

**S2-09 remains Partial.** **9 of the 22 curriculum topics** now meet §4, up from 5. The other **13 are reported as
failures with reasons**, which is what the scope demands of them — not omission.

| Topic | Total available | Reasoning families | Largest single shape |
|---|---:|---:|---:|
| Counting | 855 | 8 | 12% |
| Addition | 807 | 8 | 10% |
| Subtraction | 804 | 8 | 10% |
| Multiplication | 768 | 8 | 10% |
| Division | 291 | 6 | 13% |
| Fractions | 271 | 6 | 37% |
| Decimals | 271 | 6 | 37% |
| Percentages | 271 | 6 | 37% |
| Proportions | 271 | 6 | 37% |

The four arithmetic totals rose without a new generator: see correction 1.

## Relevant files

| File | Change |
|---|---|
| `src/content/generators/parts.ts` | **New.** Six reasoning families, parameterised by the form a share is written in |
| `src/content/generators/index.ts` | Four `Form`s — fraction, decimal, percentage, proportion — each with its own trap and its own second route |
| `src/core/generation/normalize.ts` | `exactFingerprint` now includes `items` |
| `tests/helpers/complete-topics.ts` | The four Module 2 topics declared Complete under §4 |
| `tests/audit/content-coverage.test.ts` | 27 checks (was 21): defect-class rejections, and the error family's own invariant |
| `tests/unit/generation.test.ts` | 19 checks (was 17): ordering questions identified by their items |
| `docs/CONTENT_COVERAGE.md`, `docs/content-coverage.json` | Regenerated |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | ≥100 validated interactions per completed topic | **No — 9 of 22 topics.** The other 13 are reported as failures |
| 2 | Multiple reasoning families per completed topic | Yes — 6 to 8 each, against a required 4 |
| 3 | Duplicate and near-duplicate gates | Yes, and the exact gate now sees the whole question |
| 4 | Misconception mappings validated | Yes |
| 5 | Accessibility descriptions validated | Yes |
| 6 | Machine- and human-readable reports | Yes — regenerated this cycle |
| 7 | Topic list from the curriculum, zero-generator topics reported as failures | Yes |
| 8 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **411 tests / 33 files** (was 403 / 33) |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 538.47 kB (143.72 kB gzip) |
| `npm run report:coverage` | Ran — 9 of 22 topics meet §4 |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **Four topics, one shared structure, four genuinely different surfaces.** Fractions, decimals, percentages and
   proportions all rest on a part and a whole, so `parts.ts` holds six reasoning families — conversion, comparison,
   application, ordering, error-identification and transfer — and each topic supplies a `Form` saying how a share is
   written, what it is called, and which mistake it invites. Fractions render as `3/8`, decimals as `0.375`,
   percentages as `37.5%`.

2. **The application family's totals list is deliberately short.** Every application question is one reasoning shape, so
   seven totals pushed that single shape to 49% of the topic — just under the 50% ceiling, which is not a margin. Four
   totals put it at 37%.

3. **Each form invites a different, named mistake.** The fraction form's trap is counting the empty bays; the decimal
   form's is a slipped decimal point; the percentage form's is never scaling to a hundred; the proportion form's is
   scaling to a hundred when it should not. Parts where the mistake happens to land on the right answer are excluded
   with that reason.

## Corrections made during the unit

1. **The exact-duplicate fingerprint could not see an ordering question's items.** A question's identity was its
   prompt, its answer and its choices — but an ordering family has one fixed prompt and only six permutations of three
   items, so every such family collapsed onto six questions and the rest were discarded as "duplicates" while differing
   in every value the learner reads. Found by reading a coverage report that claimed 25 exact duplicates in a topic
   whose generators emit no clones. Fixing it recovered real questions across every topic: counting 796 → 855, addition
   727 → 807, subtraction 725 → 804, multiplication 688 → 768. `exactDuplicates` is now 0 everywhere, which says the
   generators were never at fault.

2. **A broken generator could clear all three §4 bars.** A probe made one form's second, independent working repeat the
   very mistake its own trap describes. Sixty-eight generated answers then disagreed with their own keys — and every
   one was silently dropped, leaving the topic at 203 interactions, 4 reasoning families and a 49% largest shape. It
   passed. The report distinguished a generator *declaring* a combination unaskable from the pipeline *catching a
   defect*, but no check did, so five defect classes are now required to be zero.

3. **The first `parts.ts` made four topics into one.** Only the conversion family used the topic's form; comparison,
   ordering, recognition and error emitted identical prompts under all four topics. The near-duplicate gate collapsed
   three of them to almost nothing — correctly. Every family now renders through `form.render` and asks in the topic's
   own terms.

4. **`inexact()` gave one reason for two different rejections.** A share that never terminates and a share needing a
   fourth decimal place are not the same fact, and 0.3125 was being reported as non-terminating. They are reported
   apart now.

## Verification that the guards have teeth

Five deliberate probes, all reverted. Two of them found nothing on the first run and are listed with what was added:

| Probe | Before | After |
|---|---|---|
| Exact-duplicate check blind to ordering items | — | **3 checks fail** |
| Two part/whole topics share one wording | **5 checks fail** | — |
| A form's independent working repeats its own trap | **0 checks fail** | **1 check fails** |
| Error family stops checking the mistake changes anything | **0 checks fail** | **1 check fails** |
| A topic with no generators declared Complete | **3 checks fail** | — |

## Known weakness, not fixed

Decimals and proportions share a numeric surface: both render `0.375` and both take a plain number. They are
distinguished by how the question is framed, not by what the learner types. The three fingerprints keep them apart
because the wording differs throughout, but this is thinner than the separation between fractions and percentages, and
it is a content-design question rather than a pipeline one. Recorded rather than papered over.

## Remaining work

**13 of 22 topics do not meet §4**, all for the same reason: no generator families yet. They are listed with their
numbers in `docs/CONTENT_COVERAGE.md`.

- Region 1, 8 topics: ratios, negatives, number lines, coordinates, tables, variables, cases, categorical/numerical.
- Region 2 inheritance, 5 topics: mean, median, range, choosing measures, data literacy. These belong to S2-17.

Ratios is the closest to `parts.ts` and should be next. The position group (negatives, number lines, coordinates) and
the data group (tables, variables, cases, variable-kinds) each need their own module — neither is a part of a whole.

## Local commit

`c7f99d5d6c4352567a6d8bbbdc26b6de0addd9c4`

## Remote verification

```
LOCAL_HEAD  = c7f99d5d6c4352567a6d8bbbdc26b6de0addd9c4
REMOTE_HEAD = c7f99d5d6c4352567a6d8bbbdc26b6de0addd9c4
VERIFIED: MATCH
```

## Next unit

**S2-09 continued — generators for ratios and the position group.** Not started in this cycle, per the
one-unit-per-cycle rule.
