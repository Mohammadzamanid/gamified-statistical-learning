# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-16 — Region 2 misconception library**

Entered from `b581ee82726d6e55f42a319275fc3d29b3e22bfc` (remote-verified, clean tree).

## Objective

Hold Region 2's misconceptions to the unit's criteria: at least twelve reachable, every remediation carrying all nine
required parts, and reverse validation including no count-inflating tags.

## Result up front

**S2-16 is Complete.** It turned out to be mostly audit and two repairs rather than authoring, which the measurement
said before any content was written: Region 2 already had **26** reachable misconceptions against a floor of 12, and
all 40 in the repository were reachable somewhere.

**The nine parts are declared rather than recovered.** The number is in the backlog cell and the list is in no
surviving document (D-056). They are written down in the audit, marked as a reconstruction, and each is checked.

## Relevant files

| File | Change |
|---|---|
| `tests/audit/misconception-library.test.ts` | **New** — 16 checks: the nine parts, Region 2's floor, and the triggerability rule |
| `tests/helpers/misconception-triggers.ts` | **New.** Builds the wrong answer a declaration implies, for the real pipeline |
| `src/content/questions/remediations.json` | The two remediations with no follow-up question now have one |
| `src/content/questions/misconceptions.json` | Six inherited descriptions rewritten from labels into accounts of the learner's reasoning |
| `src/content/questions/questions.json` | `q.boss.r1-variable` — both distractors tagged (D-057) |

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | ≥12 named misconceptions reachable in Region 2 | **Yes** — measured **26** |
| 2 | Each remediation with all 9 required parts | **Yes** — declared in the audit (D-056), all 39 pass |
| 3 | No undeclared distractor misconceptions | **Yes** — already enforced in `interaction-audit`, not duplicated |
| 4 | No orphaned remediations | **Yes** — same |
| 5 | No count-inflating tags | **Yes** — newly enforced; found and fixed one (D-057) |
| 6 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **646 tests / 46 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 873.48 kB (224.42 kB gzip) |
| `npm run report:coverage` | Ran — 17 of 41 topics meet §4, unchanged |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **Measured before writing.** 26 reachable Region 2 misconceptions, all 40 reachable somewhere, and exactly two
   remediations lacking a follow-up question. The unit was audit plus repair, and saying so is more useful than
   authoring content to hit a number already met.

2. **The nine parts, declared and checked** (D-056). Each is something the running app consumes — the session engine
   injects the follow-up, mastery and the review queue are keyed by the skills — so no part is paperwork. The count is
   asserted too, so the list cannot drift.

3. **Count-inflating tags are now impossible to ship** (D-057). The audit builds the wrong answer each declaration
   implies and requires the **real** pipeline to name that misconception and return its remediation.

4. **Two remediations gained a follow-up**: `rem.read-axes-first` → `q.r2-misleading-graphs`, whose whole prompt is to
   look at the value axis first; `rem.correlation-not-causation` → `q.r2-scatterplots-application`, a second instance
   of the same error in a different harbour.

5. **Six inherited descriptions were rewritten.** They named the wrong answer — "Numerator and denominator swapped." —
   where the part requires an account of the reasoning that produces it.

## Corrections made during the unit

1. **My first measurement excluded every boss question.** Investigation steps carry `questionIds`, plural; I read a
   singular field that does not exist, and the measurement reported zero problems. The typechecker caught it when the
   same expression reached a checked file. Re-measured, it found a real defect: `q.boss.r1-variable` declared
   `mc.constant-counted-as-variable` with neither distractor tagged, so a learner picking either wrong column got no
   diagnosis. Both are tagged now.

2. **A description threshold I set at 40 characters was arbitrary.** It failed exactly one entry while five others sat
   just above it saying just as little. The threshold is 60 now and the six label-only descriptions were rewritten —
   the point was the content, not the number.

## Verification that the guards have teeth

Eight deliberate probes, all reverted. **Seven bite, one is a stated limit rather than a gap:**

| Probe | Result |
|---|---|
| A boss question declares a misconception with no tagged distractor | **1 check fails** |
| A remediation loses its follow-up question | **1 check fails** |
| A remediation loses its micro-lesson | **1 check fails** |
| A remediation loses the skills it reinforces | **1 check fails** |
| A misconception description shrinks back to a label | **1 check fails** |
| A remediation follows up with a question that does not exist | **7 checks fail** |
| The nine parts quietly become eight | **1 check fails** |
| A question's `wrongValue` drifts away from the answer it describes | **0 checks fail — and no guard was added.** The trigger is derived from the same parameter the detector reads, so the machinery stays self-consistent while the content stops making sense. A heuristic guessing at plausibility would fire on legitimate content (D-047's lesson). The limit is written into the audit |

## Remaining work

None. S2-16 is Complete.

## Local commit

Recorded in `STAGE2_RECONSTRUCTION_BACKLOG.md` on the S2-16 row.

## Next unit

**S2-17 — Region 2 validated content expansion.** Not started in this cycle.
