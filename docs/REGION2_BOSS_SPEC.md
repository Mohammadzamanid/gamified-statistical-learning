# REGION2_BOSS_SPEC.md

The specification for Region 2's boss investigation. **Written by S2-11; built by S2-18.**

This document exists because S2-11's acceptance criteria include a "boss specification" and S2-18's include the boss
itself. Separating them is deliberate: the case has to be designed against the region's *architecture* — which module
teaches what, and in which order — while that architecture is being decided, but it cannot be built until the lessons
it draws on exist.

`tests/helpers/complete-bosses.ts` records `r.averages-atoll` as **owing** a boss, and
`tests/audit/investigation-structure.test.ts` fails if that debt is quietly paid off or quietly dropped. This file says
what paying it off should look like.

---

## 1. What the scope requires

From `STAGE2_RECONSTRUCTION_BACKLOG.md`, S2-18: *dataset inspection, summary selection, graph selection,
misleading-presentation detection, outlier reasoning, distribution comparison, evidence-based conclusion.*

From `STAGE2_RECONSTRUCTION_SCOPE.md` §10, a region that ends without a boss and a completion achievement is a closure
failure. `ach.atoll-charted` already exists and triggers on `region-completed` for `r.averages-atoll`; since S2-10,
`isRegionCompleted` will not fire until the region's investigation is closed. So building this boss is what makes that
achievement reachable at all.

## 2. What a boss has to be (D-028)

Constraints inherited from S2-10, all enforced by `tests/audit/investigation-structure.test.ts`:

- **At least three stages.** The schema enforces it; Region 1's case runs in five.
- **It may only ask about skills its own region teaches.** Every question's `skillIds` must be reachable from a Region 2
  lesson's objectives. Region 1 skills are *not* available, even though the learner has them.
- **Every stage's `skillIds` must match its questions exactly** — nothing claimed that is not exercised, nothing
  exercised that is not declared.
- **It may not re-use a question any lesson asks.** Sharing one would make the case a review round in costume.
- **It must span more than one module of its region.**
- Every stage needs a `brief`; the case needs a `briefing` and a `debrief`; every question needs an
  `accessibilityDescription` and an `explanation`.

## 3. Proposed case: *The Atoll Survey*

**Premise.** Two survey parties have measured the same channel over the same season and reached opposite conclusions
about whether it is safe. Both have the readings, both have drawn a graph, and neither has lied. The learner has to
work out why the two accounts differ and which one the data supports.

The shape mirrors the Region 1 boss deliberately: the evidence is volunteered by the parties themselves, and what
convicts an account is its own presentation rather than a hidden number. Region 1's case turned on an arithmetic error
written into a ledger; this one turns on the difference between a summary and a distribution.

## 4. Stages

| # | Stage | Draws on | What it settles |
|---|---|---|---|
| 1 | **What was measured** | frequency, proportion, percentage | Establish the dataset before either account: how many readings, in which categories, and what share each is |
| 2 | **The middle they each chose** | mean, median, mode, choosing a measure | Both parties report "the typical depth" and get different numbers. Compute both; decide which the data supports |
| 3 | **What the middle hides** | range, quartiles, IQR, outliers | The summaries agree more than the readings do. Find the spread, and the reading that moves one measure and not the other |
| 4 | **Two pictures of one season** | histograms, box plots, bin width, truncated axes | Each party's graph is accurate. Identify what each one's construction emphasises and conceals |
| 5 | **The verdict** | skew, distribution comparison, choosing graphs | State which account the evidence supports, which graph should have been drawn, and why |

Every stage names skills from a different Region 2 module, so the "spans more than one module" check passes on
substance rather than by arrangement.

## 5. Where the misconceptions go (D-025)

Region 2's misconception library is **S2-16**, so the exact ids are not fixed here. What is fixed is the rule: a
declared misconception must be one the engine can *report*, which means checking its `detector` field before deciding
where it can sit.

- `mc.outlier-mean` (already exists, detector `known-wrong-answer`) belongs in stage 3, as a **tagged distractor** on a
  multiple-choice, or as a declared `wrongValue` under `question.parameters` on a numeric question.
- `mc.mean-median-confusion` and `mc.sum-not-mean` (both `confused-statistic`) need a numeric answer and a declared
  `wrongValue`; they suit stage 2.
- `mc.axis-misread` (`known-wrong-answer`) suits stage 4.
- Anything S2-16 adds with a `placement-mapping` or `point-geometry` detector can only be reported from a drag-and-drop
  or point-placement question respectively — **not** from a multiple-choice, however apt the tag reads. This is the
  mistake the data-group generators made after D-025 was already written down.

## 6. Dependencies, in order

| Needs | Unit |
|---|---|
| Central-tendency lessons written | S2-12 |
| Spread and position lessons written | S2-13 |
| Data-visualization lessons written | S2-14 |
| Region 2 misconception library | S2-16 |
| Region 2 topics meeting §4 | S2-17 |

S2-18 cannot start before S2-14 at the earliest, and should not start before S2-16 if its questions are to carry
misconceptions rather than have them retrofitted.

## 7. What S2-18 must do to close the debt

1. Author the case in `src/content/worlds/curriculum.json` under `investigations`, with its questions in
   `questions.json` under a `q.boss.r2-*` prefix.
2. Move `r.averages-atoll` from `REGIONS_OWING_A_BOSS` to `REGIONS_WITH_A_BOSS` in `tests/helpers/complete-bosses.ts`.
   The audit fails if the boss appears without that move, and fails if the move happens without the boss.
3. Extend the fresh-save playthrough to complete both bosses — scope §7 requires the full playthrough to complete
   "every required lesson and both boss investigations through the real session engine".
