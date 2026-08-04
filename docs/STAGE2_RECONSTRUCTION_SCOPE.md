# STAGE2_RECONSTRUCTION_SCOPE.md

Authoritative scope for Stage 2. Read with `RECONSTRUCTION_CONTEXT.md` and `REMOTE_PERSISTENCE_POLICY.md`.

**Opened:** 2026-08-04 · **Baseline entering Stage 2:** `00f4497ff2f356bd03e3caf3556b3fa6a6de642e`

---

## 1. Reconstruction status

Stage 2 is a **reconstruction**, not a recovery. The previous Stage 2 source was destroyed with its ephemeral
environment and no part of it survived. Nothing in Stage 2 may be described as recovered, restored, or reproduced.

Specifically, the following claims are **forbidden**:

- that deleted Stage 2 source was recovered
- that previous question counts were restored
- that previous tests were reproduced exactly
- that previous visual designs were recovered
- that previously reported metrics remain valid

Earlier completion reports may be used as **design evidence and defect history only**. Every count, coverage figure,
test total, and build result must be **measured from this repository** at the time it is reported.

## 2. Included topics

**Region 1 — Number and Data Foundations.** Counting · addition · subtraction · multiplication · division · fractions ·
decimals · ratios · proportions · percentages · negative numbers · number lines · coordinates · reading tables ·
variables · data, cases, and observations · categorical and numerical variables.

**Region 2 — Describing and Visualizing Data.** Frequency · proportion · percentage · mean · median · mode · range ·
quartiles · percentiles · interquartile range · variance intuition · standard-deviation intuition · outliers · skew ·
bar charts · histograms · dot plots · box plots · scatterplots · choosing graphs · misleading graphs.

**Systems.** All required interaction renderers · deterministic misconception diagnosis · adaptive mastery · spaced
review · region achievements · boss investigations · descriptive-statistics laboratory · save and resume · automated
accessibility tests · validated question-generation coverage.

## 3. Excluded topics

Stage 2 must **not** introduce full lessons for: probability theory · random variables · probability distributions ·
sampling distributions · confidence intervals · hypothesis testing · regression · Bayesian inference · machine
learning. Brief contextual mentions are acceptable; these belong to Stages 3–6.

Stage 1 already ships probability primitives in `src/core/statistics` with `tests/statistics/probability.test.ts`.
Those remain — Stage 2 neither removes nor extends them into lessons.

## 4. Interaction-count rules

Every topic marked **Complete** must offer **at least 100 validated available interactions**.

The authoritative topic list comes from the **completed curriculum and skill graph** — never from the set of generator
modules. A topic with zero generators must appear in the report as a **failure**, not vanish from it.

These five metrics are distinct and must never be used interchangeably. Each is defined here and reported separately
per topic:

| Metric | Definition |
|---|---|
| Authored question records | Hand-written question entries in content JSON |
| Generator families | Distinct generator modules/functions producing questions for the topic |
| Unique reasoning families | Distinct *reasoning* patterns (see below), not distinct numbers |
| Raw parameter combinations | Every combination a generator could emit before validation |
| Valid parameter combinations | Raw combinations surviving validity rules |
| Final validated generated interactions | Valid combinations that also pass schema, answer, a11y, and duplicate checks |
| Total available interactions | Authored records + final validated generated interactions |

Also reported per topic: invalid combinations rejected (with reasons) · exact duplicates · near duplicates · schema
failures · correct-answer failures · missing accessibility descriptions · missing misconception mappings ·
unreachable questions.

**Diversity requirement.** A topic's 100 interactions must span several reasoning families: recognition ·
representation conversion · calculation · visual interpretation · prediction · error identification · comparison ·
ordering · multi-step reasoning · real-world application · irrelevant-information filtering · explanation ·
teach-it-back · transfer to unfamiliar contexts.

Changing only numbers, names, colours, or object labels does **not** create a new reasoning family. Near-duplicate
detection normalises numbers, names, whitespace, punctuation, and equivalent phrasing where practical. **A topic with
100 numeric variants of one reasoning pattern is not Complete.**

## 5. Lesson-completeness requirements

A lesson marked Complete must contain all 18: learning objective · narrative or practical purpose · concrete
beginner-level experience · interactive visual demonstration · learner prediction before the reveal · observation of
what changed · plain-language explanation · formal term · notation only when appropriate · explanation of every symbol
introduced · guided practice · independent practice · misconception-targeting challenge · real-world application ·
teach-it-back · mastery check · spaced-review scheduling · accessible textual equivalent for all visual information.

A lesson that is only explanatory text plus questions is **not Complete**. A lesson with placeholder simulations or
inactive controls is **not Complete**.

**Beginner safety.** Assume no prior mathematical knowledge. Never use unexplained notation. Never call a concept
obvious, trivial, or elementary. When a learner repeatedly struggles, teach the missing prerequisite rather than
merely lowering question difficulty.

## 6. Accessibility requirements

Stage 2 must add a **real DOM-capable** accessibility test command. It may only be named `test:a11y` once that script
genuinely exists in `package.json`; until then it must not appear in CI or in any report.

Automated checks must cover: keyboard-only navigation · logical focus order · visible focus · accessible names ·
live-region feedback · error announcements · modal focus trapping and restoration where modals exist · reduced motion ·
adjustable text size · high contrast · light and dark themes · colour-independent correctness feedback · accessible
chart descriptions · point-placement keyboard controls · drag-and-drop keyboard alternatives · focus preservation after
answer feedback · no mouse-only required action.

Manual review must **never** be described as automated verification. Criteria needing real GUI inspection are recorded
separately as such.

## 7. Testing requirements

Every unit ends with, at minimum:

```bash
npm run typecheck
npm run lint
npm test
```

plus the relevant existing scripts (`npm run test:statistics`, `npm run test:content`, `npm run build`). Only scripts
that actually exist may be run or reported. **Unexecuted commands are never reported as passing.** Failures are
corrected, not merely described. Tests are never weakened to force a green run.

**Statistical validation.** All statistical computation is centralised in `src/core/statistics`; important quantities
are never recomputed inside React components. Reference tests are required for mean, median, mode, weighted mean (where
used), range, quartiles, percentiles, IQR, population variance, sample variance (where introduced), population and
sample standard deviation, z-score intuition (where used), frequency, proportion, and percentage. Conventions for
quartile method, percentile interpolation, even-sized medians, multiple modes, empty data, non-finite input, and
population-versus-sample denominators must be documented and used consistently across lessons and the laboratory.

**Full playthrough.** An integration test starts from a fresh profile and follows the **curriculum-declared** region
and module order (not source-array order), verifying lock/unlock state, completing every required lesson and both boss
investigations through the real session engine, awarding both region achievements, leaving no stale lesson snapshot,
and confirming mastery changes and scheduled review items. It must not hard-code the current region count in a way that
silently tolerates later expansion.

## 8. Remote-persistence rules

`REMOTE_PERSISTENCE_POLICY.md` governs. In summary: one unit per cycle; validate, review `git status`/`git diff`,
commit intentional files only, push, then verify `git rev-parse HEAD` equals `git ls-remote origin refs/heads/main`,
record both hashes in this stage's backlog **and** `RECONSTRUCTION_BACKLOG.md`, confirm the CI run was triggered where
available, then stop. Force pushes, hard resets, history rewriting, and branch/tag deletion are forbidden without
explicit owner permission.

**Known limitation.** The hosted session can push branches but **cannot push tags or create releases** (403). This does
not block unit development. At stage closure the `stage-2-complete` tag is attempted; if still forbidden, the exact
manual command is documented for the owner and the tag is preserved inside the stage Git bundle.

## 9. Status vocabulary

| Status | Meaning |
|---|---|
| **Complete** | Every acceptance criterion met, all required tests written and passing, documentation updated, commit pushed **and remote hash verified**. Nothing partial, nothing placeholder. |
| **Partial** | Real, working, tested progress exists, but at least one acceptance criterion is unmet. Must name exactly what is missing. May never be reported as Complete or counted toward stage closure. |
| **Blocked** | Cannot proceed for a reason outside the unit's control (environment restriction, missing owner credentials, hardware). Must name the exact blocker and, where possible, the exact command or action that would unblock it. |
| **Not started** | No implementation work has begun. |

A unit that is locally committed but not verifiably pushed is recorded as
`Complete locally — remote persistence failed`, never as Complete.

## 10. Closure drift guards

Stage 2 closure tests must **fail** if any of these hold:

- a completed curriculum topic has fewer than 100 validated interactions
- a completed topic has zero generator families and is omitted from reporting
- an interaction type is registered without evaluation or accessibility coverage
- a new skill has no stage classification
- a curriculum reference points to a missing objective, skill, lesson, module, misconception, remediation, achievement,
  or dataset
- a declared misconception has no reachable trigger (unless documented as a global detector)
- a distractor references an undeclared misconception, or a remediation is orphaned
- a region ends without a boss and a completion achievement
- a new region is added without extending the fresh-save playthrough assertions
- a Stage 3 topic appears before Stage 3 begins
- a completed unit lacks a verified remote commit
- documentation claims a test, package, launch, or push that did not occur
