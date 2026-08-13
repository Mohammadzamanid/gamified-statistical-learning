# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-20 — the accessibility harness and audit**

Entered from `c85b02fb5bdfb8bdca1f42747823e46a19cd7eb3` (remote-verified, clean tree).

## Objective

Add the **real DOM-capable** accessibility command scope §6 requires — which may only be called `test:a11y` once it
genuinely exists — wire it into CI, and cover §6's checklist against the rendered app rather than against intentions.

## Result up front

**S2-20 is Complete.** `test:a11y` exists, runs 36 checks against the real screens in jsdom, and runs in CI.

| Measure | Value |
|---|---|
| New command | `npm run test:a11y` — `vitest.a11y.config.ts`, jsdom, `tests/a11y/**/*.test.tsx` |
| Accessibility checks | **36**, across three files |
| Suite | **695** tests / 48 files, unchanged — the harness is a separate run |
| CI | a new **Accessibility harness** step, and the comment saying the script must not appear is gone |
| Probes | 10; **9 bit immediately, 1 found a guard that matched its own counterexample** |

## Scope §6, item by item

Fourteen covered, two covered in part with the limit stated, one not applicable and defended as such.

| § 6 check | State |
|---|---|
| Keyboard-only navigation | **Covered** — every enabled control is reached by tabbing, and the answer submits on Enter |
| Logical focus order | **Covered** — abandon, then the answer, then the hint |
| Visible focus | **Partly** — the stylesheet may not remove an outline without replacing it; whether the ring reads to an eye is GUI review |
| Accessible names | **Covered** — computed by the real algorithm, not a heuristic |
| Live-region feedback | **Covered** |
| Error announcements | **Covered** — a wrong step changes what the live region says |
| Modal focus trapping | **Not applicable** — no modal ships; a check fails the day one appears |
| Reduced motion | **Covered** — attribute set *and* acted on by the stylesheet |
| Adjustable text size | **Covered** — all four scales |
| High contrast | **Covered** |
| Light and dark themes | **Covered** |
| Colour-independent correctness | **Covered** — the verdict is words, the ✓/✕ is `aria-hidden` |
| Accessible chart descriptions | **Covered** — all five chart kinds, name equals the content's description |
| Point-placement keyboard controls | **Partly** — labelled sliders, correct step/min/max, keyboard submit; jsdom does not implement a range's arrow keys |
| Drag-and-drop keyboard alternatives | **Covered** — a select per item naming every zone, and a keyboard submit |
| Focus preservation after feedback | **Covered** — focus stays inside the question |
| No mouse-only required action | **Covered** |

## Relevant files

| File | Change |
|---|---|
| `package.json` | **New.** `test:a11y`, and the devDependencies it needs |
| `vitest.a11y.config.ts` | **New.** jsdom environment, `.tsx` includes, its own setup |
| `tests/a11y/setup.ts` | **New.** Loads the real stylesheet into the document; stubs `matchMedia` |
| `tests/a11y/question-screen.test.tsx` | **New.** Names, focus order, keyboard operation, live feedback |
| `tests/a11y/presentation.test.tsx` | **New.** Themes, text scale, motion, focus style, chart descriptions |
| `tests/a11y/interactions.test.tsx` | **New.** Point placement, drag and drop, step calculation, focus after answering |
| `tests/a11y/dom-accessibility-api.d.ts` | **New.** Typings shim for a package whose `exports` map omits them |
| `.github/workflows/ci.yml` | The harness runs; the note explaining its absence is replaced by one explaining its limits |
| `docs/REMOTE_PERSISTENCE_POLICY.md`, `docs/STAGE_HANDOFF.md` | The standing "does not exist" notes corrected |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **695 tests / 48 files** |
| `npm run test:a11y` | Pass — **36 tests / 3 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 901.05 kB (231.05 kB gzip), unchanged: the harness ships nothing |
| `npm run report:coverage` | Ran — **41 of 41** topics meet §4 |

**`test:a11y` was run this cycle and is claimed.** That sentence has been the opposite in every report since S2-14.

## Work completed

1. **A separate config, not a second include.** The existing suite runs in `node` against a pure core; these render
   React into jsdom. One environment cannot serve both without putting a DOM under 695 checks that do not want one.

2. **The real stylesheet is loaded into the test document**, so a check about a focus style or a theme reads the CSS
   that ships rather than a value the test invented.

3. **What the harness cannot see is written on the harness** (D-069) — contrast, layout and paint. Two checks are
   split around that boundary rather than overstated, and the CI comment says the same thing to whoever reads the run.

## Corrections made during the unit

1. **A regex matched what it was written to reject** (D-070). `/outline\s*:\s*(?!none)/` matches `outline: none`,
   because the engine backtracks over `\s*` and tests the lookahead a character early. The probe that removed the
   app's focus ring failed nothing. CSS is parsed now instead of pattern-matched.

2. **A hand-rolled accessible-name check flagged correct markup.** Reading `aria-label ?? textContent` reported the
   answer field as unnamed — it is named by a `<label for>`, which is the better way to do it. Replaced with the real
   algorithm.

3. **A first draft asserted an arrow key moves a range input.** jsdom does not implement that; the failure was the
   harness's, not the app's. Split into what jsdom can prove and what stays GUI review.

4. **Three assumptions about the app were simply wrong** in the first draft: the numeric field is a `textbox`, not a
   `spinbutton`; the submit button is disabled until something is typed; `applyToRoot` takes the root element as an
   argument. All found by running it.

5. **The focus-order check flagged `.region-node:focus-visible { outline: none }`** while the very next rule painted
   the ring on a child element — the pattern being too eager, which is D-047's lesson arriving in a new file.

## Verification that the guards have teeth

Ten deliberate probes, all reverted. **Nine bite; one found a guard that could not fail:**

| Probe | Result |
|---|---|
| The verdict stops being announced | **4 checks fail** |
| The verdict becomes a symbol and a colour | **1 check fails** |
| A chart loses its text equivalent | **1 check fails** |
| The answer field loses its label | **1 check fails** |
| Point placement leaves only the plot to click | **3 checks fail** |
| Drag and drop loses its keyboard alternative | **1 check fails** |
| The step calculation stops pointing at its live region | **2 checks fail** |
| A theme the settings offer is dropped from the stylesheet | **1 check fails** |
| The progress bar loses its name | **1 check fails** |
| Focus is removed with nothing put in its place | **0 → 1 check fails** — D-070 |

## Remaining work

None. S2-20 is Complete.

Two items stay GUI review and are recorded as such rather than as passes: contrast at each theme, and a real arrow key
on a real range input. Both belong with X-02.

## Local commit

Recorded in the follow-up commit; see `STAGE2_RECONSTRUCTION_BACKLOG.md`.

## Next unit

**S2-21 — the Stage 2 closure audit.** Not started in this cycle.
