# INTERACTION_AUDIT.md — all 17 interaction types

**Unit:** S2-05 · **Audited:** 2026-08-04 · **Enforced by:** `tests/audit/interaction-audit.test.ts` (18 checks)

Every figure here was **measured from this repository**, not recalled. The table is not the audit — the test file is.
Each column below corresponds to an assertion that fails the suite if it stops being true, so this document cannot
quietly drift out of date with the code.

**Headline:** 14 of 17 types implemented, every one with a renderer and at least one lesson-reachable question. 3
remain stubbed, and no content depends on them.

---

## 1. Per-type audit

`Lesson use` counts questions reachable **from a lesson**. An isolated demo question would not count, by design.

| Interaction type | Schema | Renderer | Evaluation | Correct path | Wrong path | Misconception path | Keyboard | Accessible name | Lesson use | Stateful |
|---|---|---|---|---|---|---|---|---|---|---|
| `multiple-choice` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ buttons | ✅ choice text | 1 | no |
| `multiple-selection` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ none mapped | ✅ buttons | ✅ choice text | 1 | no |
| `numeric-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ text field | ✅ label | 3 | no |
| `percentage-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ text field | ✅ label | 1 | no |
| `fraction-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ text field | ✅ label | 1 | no |
| `ordering` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ none mapped | ✅ move buttons | ✅ per-button labels | 1 | no |
| `matching` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ none mapped | ✅ selects | ✅ label per row | 1 | no |
| `drag-and-drop` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ selects + move buttons | ✅ zone labels | 4 | ⚠️ yes, not persisted |
| `graph-interpretation` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ buttons | ✅ choice text + alt | 1 | no |
| `point-placement` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ range per axis | ✅ axis labels | 4 | ⚠️ yes, not persisted |
| `formula-construction` | — | ❌ stub | — | — | — | — | — | — | 0 | — |
| `simulation-prediction` | — | ❌ stub | — | — | — | — | — | — | 0 | — |
| `error-identification` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ buttons | ✅ choice text | 1 | no |
| `method-selection` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ buttons | ✅ choice text | 1 | no |
| `step-by-step-calculation` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ text field + buttons | ✅ per-step label | 3 | ⚠️ yes, not persisted |
| `short-explanation` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ none mapped | ✅ textarea | ✅ label | 1 | no |
| `confidence-rating` | — | ❌ stub | — | — | — | — | — | — | 0 | — |

**Totals:** implemented 14 · renderers 14 · stubs 3 · lesson-reachable questions using an implemented type: 24.

## 2. What the enforced checks actually assert

| Check | Guards against |
|---|---|
| Registry lists every schema type exactly once | A type declared in the schema but never registered |
| Renderer coverage == implemented flags | A flag flipped without a renderer, or a renderer without a flag |
| Each implemented type has ≥1 lesson-reachable question | Marking a type live on the strength of a demo |
| Each accepts its own correct answer | A question with no reachable correct answer |
| Each rejects a wrong answer | An evaluator that accepts anything |
| Each rejects a foreign response kind | Type confusion between interactions |
| Prompt, explanation, labels non-empty | An unlabelled control or an unexplained question |
| Visuals and point fields carry text equivalents | A chart with no description |
| No stub has a renderer, and no content uses a stub | A learner reaching a dead end (D-005) |
| No question is orphaned | Content nothing can route to |
| Declared misconceptions exist and have remediations | A classification with nothing to teach |
| Distractor / in-answer misconceptions are also declared | Tags that can never be classified — decoration |
| No orphaned remediation | Remediation nothing can trigger |
| Every misconception names a registered detector | A dangling detector name |

The correct/wrong answer checks are driven by `tests/helpers/responses.ts`, whose switches are exhaustive over
`AnswerSpec` — adding an answer kind without teaching the helper about it is a compile error, not a silent gap.

## 3. Findings

Recorded honestly; none is claimed as resolved by this unit.

**F-1 — Four implemented types have no misconception mapping in current content.**
`multiple-selection`, `ordering`, `matching`, `short-explanation` each have a working wrong-answer path, but no
question of that type declares a misconception, so a wrong answer produces the generic message rather than targeted
remediation. This is a *content* gap, not an engine gap. → **S2-16**.

**F-2 — In-progress interaction state is not persisted.**
Three types are stateful mid-question: a partially worked step run, a point position before submit, and a partly built
arrangement. `SaveFile` holds `skillStates`, `reviewQueue`, `lessonProgress`, `attemptLog`, `achievements` and `xp` —
no in-question state. Closing the app mid-question therefore restarts *that question*; no completed work is lost.
Acceptable now, but the save/resume audit must either persist it or state the behaviour deliberately. → **S2-19**.

*Update (S2-06):* the review queue now persists its session state across a save/load, which sets the precedent and
the migration machinery for doing the same here. It does **not** fix F-2 — what S2-06 persists is the learner's
position in the review queue, not a half-finished step run, point placement or arrangement. F-2 remains open.

**F-3 — Three types remain stubbed.**
`formula-construction`, `simulation-prediction`, `confidence-rating` keep `implemented: false` and their honest
"not yet available" notice. `simulation-prediction` is deliberately sequenced after the laboratory instruments exist
(S2-15), since predicting a simulation requires a simulation. No content references any of the three, and the audit
fails if that changes.

**F-4 — One question is reachable only through remediation.**
`q.remed-mean-basic` is not listed in any lesson; it is injected as a guided retry after
`mc.mean-median-confusion` / `mc.sum-not-mean`. That is intended, and the new orphan check confirms every question is
reachable by *some* path.

**F-5 — Keyboard operability is structurally verified, not verified in a browser.**
Keyboard reachability is proven for `point-placement` and `drag-and-drop` by tests that build every shipped answer
using only the operations the keyboard controls perform. Other types rely on native controls (buttons, inputs,
selects, textarea) which are keyboard-operable by construction. **None of this is automated accessibility testing** —
no DOM is rendered, focus order is not measured, and no screen reader is involved. → **S2-20**.

**F-6 — One authored question declares a misconception the engine can never report.**
`q.error-id-causation` declares `mc.correlation-causation`, whose detector is `tagged-distractor`, but none of its three
options carries that tag — in that question the misconception *is* the correct answer, so there is no distractor for it
to sit on. The declaration therefore inflates a mapping count while a learner who gets it wrong receives a bare
"incorrect" rather than the remediation.

Measured rather than reasoned: the real evaluator and the real classifier were driven with every wrong choice, every
detector's own declared trigger value, every single-item misplacement and every per-step wrong value, across all 46
authored misconception declarations. 45 can be reported; this one cannot. Fixing it means redesigning the question's
options, which is Region 2 data-literacy content. → **S2-17**.

Generated questions are held to this rule by a check rather than by inspection —
`tests/audit/content-coverage.test.ts` requires the engine to name each declared misconception when given the answer a
holder of it would give (D-025).

## 4. Notices removed, and notices kept

The "not yet available" notice was removed for `step-by-step-calculation` (S2-02), `point-placement` (S2-03) and
`drag-and-drop` (S2-04) — each only once its schema, evaluator, renderer, accessibility handling and real lesson
content all existed.

It is **kept** for the three remaining stubs. Per D-005 the notice is the honest state of the build, not a defect to
be tidied away, and the audit now enforces that a stub has neither renderer nor content.
