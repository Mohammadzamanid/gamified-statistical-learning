# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-14 — Data-visualization lessons (cycle 5: comparing distributions, and the end of Region 2's teaching)**

Entered from `986f0f783c5476a6ee55f2912dcf38af5cf7fab1` (remote-verified, clean tree).

## Objective

Write `l.r2-comparing-distributions` to all 18 of scope §5's requirements — the last of S2-14's nine lessons, and the
last unwritten lesson in Region 2.

## Result up front

**S2-14 is Complete: all 9 lessons are written.** With this one, **Region 2 has no skeletons left** — all 20 seeded
lessons are declared Complete and held to the 18 structure checks. It also meets **S2-13's outstanding criterion 5**
(distribution comparison), which is why that unit stayed Partial, and makes the boss's **stage 5** legal under D-028.

## Relevant files

| File | Change |
|---|---|
| `src/content/worlds/curriculum.json` | The lesson: narrative, three concepts, `dem.r2-comparing-distributions`, formal term, five objectives |
| `src/content/questions/questions.json` | 285 → **290** authored (six new, one seed deleted) |
| `src/content/questions/{misconceptions,remediations}.json` | `mc.same-centre-same-data` + `rem.centre-is-not-the-comparison` |
| `tests/audit/interaction-audit.test.ts` | Two new checks — a numeric answer must be stated in its explanation; a box plot's words must carry its five numbers (D-049) |
| `tests/audit/region2-architecture.test.ts` | The skeleton set is now empty, and says so rather than looping over nothing |
| `tests/helpers/complete-lessons.ts` | 39 → **40** lessons declared Complete |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Bar charts, histograms | **Yes** (cycle 1) |
| 2 | Dot plots, box plots | **Yes** (cycle 2) |
| 3 | Scatterplots | **Yes** (cycle 3) |
| 4 | Graph selection | **Yes** (cycle 4) |
| 5 | Truncated axes, bin-width effects, misleading framing | **Yes** (cycle 4) — drawn, not described |
| 6 | `l.r2-comparing-distributions` (inherited from S2-13) | **Yes** |
| 7 | Staged inherited questions cleared | **Yes** (cycle 4) — and the mechanism deleted |
| 8 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **575 tests / 41 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 856.35 kB (219.19 kB gzip) |
| `npm run report:coverage` | Ran — 17 of 41 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **The lesson teaches that a comparison is three comparisons, not one.** Two survey parties report a median depth of
   ten metres for two channels; one is safe to run at night and the other has grounded three boats. Its three concepts
   are centre-spread-shape, why a shared centre hides everything, and what a fair comparison requires — the same
   measures, on the same scale, for both.

2. **Its demonstration moves the spreads and leaves the medians alone.** Two controls set the width of each channel's
   middle half, and the readout gives the difference: 2.6 against 0.3 reads 2.3, and dredging Channel A to 2.6 takes it
   to 0 without a median moving. That is the argument in one control — a report giving only the medians reads
   identically before and after.

3. **Six questions across the six roles**, including a numeric one that computes both interquartile ranges from a box
   plot of the twenty channel soundings (7.5 against 0.3, so 7.2 metres wider), and a mastery question where centre
   *and* spread agree and only the mean-against-median gap reveals B's tail.

4. **Region 2's skeleton rule now states its own emptiness.** With all 20 lessons Complete the loop iterated nothing
   and passed vacuously; it asserts zero explicitly, as Region 1's did on reaching the same point (the D-048 habit).

## Corrections made during the unit

None. The previous cycle's note — read an existing example before writing an unfamiliar shape — was followed for the
`short-explanation` answer, the `tagged-distractor` misconception and the remediation, and each matched on the first
attempt.

## Verification that the guards have teeth

Six deliberate probes, all reverted. **Four bite, two found gaps now closed and re-probed:**

| Probe | Result |
|---|---|
| The demonstration's initial readout drifts from the prose describing it | **1 check fails** (D-035) |
| The misconception question loses its tagged distractor | **1 check fails** |
| The lesson declares an objective no question practises | **3 checks fail** (D-036) |
| The finished lesson is left out of `COMPLETE_LESSONS` | **1 check fails** — the emptiness claim added this cycle |
| The numeric answer drifts from the arithmetic in its own explanation | **0 → 1 check fails** — closed by D-049 |
| The box plot's words drift from the dataset they describe | **0 → 1 check fails** — closed by D-049 |

The numeric-answer guard's reach was probed as well as its bite: swapping the answer for an intermediate figure the
same explanation already quotes still passes, and the check says so in its own comment rather than being trusted for
more than it does.

## Remaining work

None. S2-14 is Complete.

## Local commit

`bc1525de5ba188baa1e130c762b93744d06c50aa`

## Remote verification

```
LOCAL_HEAD  = bc1525de5ba188baa1e130c762b93744d06c50aa
REMOTE_HEAD = bc1525de5ba188baa1e130c762b93744d06c50aa
VERIFIED: MATCH
```

## Next unit

**S2-15 — the descriptive-statistics laboratory.** Not started in this cycle.
