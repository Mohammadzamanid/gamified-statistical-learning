# RECONSTRUCTION_BACKLOG.md

One unit per session cycle. A unit is **Complete** only when its commit is pushed to GitHub *and* the remote hash is
verified equal to the local hash (see `REMOTE_PERSISTENCE_POLICY.md`).

**Status values:** `Complete` · `Complete locally — remote persistence failed` · `In progress` · `Blocked` · `Planned`

Hash columns record full or abbreviated SHAs. `Push verified` records the result of comparing `git rev-parse HEAD`
with `git ls-remote origin refs/heads/main`.

---

## Stage 0 — Reconstruction infrastructure

| ID | Stage | Work unit | Source specification | Dependencies | Acceptance criteria | Status | Local commit | Remote commit | Push verified | Tests | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| R-00a | 0 | Import pristine surviving Stage 1 source | `statlas-stage1.zip` (SHA-256 `5fb3490a…`) | none | Archive `.git` preserved; branch normalised to `main`; commit pushed unmodified | Complete | `7add4bc` | `7add4bc` | Yes — MATCH | 73/73 pass (pre-existing) | Original commit carried forward, not re-created. No source modified. Pushed before any other file was written. |
| R-00b | 0 | Establish repository, reconstruction docs, CI, verified baseline | This protocol | R-00a | Docs authored; CI workflow uses only existing scripts; full validation green; commit pushed + verified; `stage-1-baseline` tag pushed; export bundle created | In progress | pending | pending | pending | 73/73 pass, 14 files | Hashes are recorded in a follow-up commit **after** the push is verified — never written in advance. Measured counts in `RECONSTRUCTION_CONTEXT.md`. |
| R-01 | 0 | Triage `electron-builder` dependency advisories | `npm audit` output at baseline | R-00b | Each of 21 advisories classified reachable/unreachable; safe upgrades applied; `npm test` + `npm run build` stay green; no forced breaking upgrade without owner sign-off | Planned | — | — | — | — | 21 advisories at baseline (2 critical, 15 high, 4 moderate), concentrated in packaging toolchain. Deliberately untouched during baseline so the baseline equals the surviving artifact. |

## Stage 2 — Beginner mathematics, data, and descriptive statistics

Derived from the reconstruction roadmap and the surviving `STAGE_HANDOFF.md` Stage 2 priorities. Ordered so that
defect repair and engine capability precede content breadth.

| ID | Stage | Work unit | Source specification | Dependencies | Acceptance criteria | Status | Local commit | Remote commit | Push verified | Tests | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S2-01 | 2 | Wire region-completed achievement trigger | Known defect #1; `STAGE_HANDOFF.md` priority 1 | R-00b | Trigger fires on genuine region completion; unit + integration tests; no false positives on partial completion | Planned | — | — | — | — | Currently stubbed `false` in `src/core/achievements/engine.ts`. Smallest real defect — correct first unit. |
| S2-02 | 2 | Implement `step-by-step-calculation` interaction | Roadmap "missing interaction types"; registry `implemented: false` | S2-01 | Evaluator + renderer + a11y; registry flag → `true`; tests per type; content exercising it | Planned | — | — | — | — | Highest pedagogy value of the six stubs per surviving handoff. |
| S2-03 | 2 | Implement `point-placement` interaction | as above | S2-02 | as above | Planned | — | — | — | — | Keyboard-operable alternative required, not mouse-only. |
| S2-04 | 2 | Implement `drag-and-drop` interaction | as above | S2-03 | as above | Planned | — | — | — | — | Must ship a keyboard equivalent path. |
| S2-05 | 2 | Implement `formula-construction` interaction | as above | S2-04 | as above | Planned | — | — | — | — | |
| S2-06 | 2 | Implement `confidence-rating` interaction | as above | S2-05 | as above | Planned | — | — | — | — | Feeds metacognition; pairs with adaptive review. |
| S2-07 | 2 | Implement `simulation-prediction` interaction | as above | S2-06, S2-11 | as above | Planned | — | — | — | — | Depends on lab simulation instruments existing. |
| S2-08 | 2 | Complete Region 1 content | Roadmap "Region 1 completion" | S2-02..S2-06 | Region 1 objectives fully covered; `npm run test:content` green | Planned | — | — | — | — | Baseline Region 1 is partial (measured: 2 regions, 3 lessons, 14 questions total). |
| S2-09 | 2 | Descriptive-statistics region (spread & shape) | Roadmap "descriptive-statistics region" | S2-08 | Variance, sd, outliers, skew as a new region reusing existing schema; content tests green | Planned | — | — | — | — | Surviving handoff calls this "World 2". |
| S2-10 | 2 | Graph and table interpretation | Roadmap item | S2-09 | Interpretation content + interaction coverage; a11y for any chart | Planned | — | — | — | — | `graph-interpretation` interaction already implemented; this is breadth. |
| S2-11 | 2 | Descriptive laboratory instruments | Roadmap "descriptive laboratory"; known defect #3 | S2-09 | Real instruments replace placeholders; driven by `src/core/statistics` | Planned | — | — | — | — | `LabScreen.tsx` placeholders must stop being labelled planned-only once real. |
| S2-12 | 2 | Misconception remediation expansion | Roadmap item | S2-09 | New misconceptions + remediations for spread/shape; detector params per question (D-004) | Planned | — | — | — | — | Baseline measured: 8 misconceptions, 7 remediations. |
| S2-13 | 2 | Adaptive review ("Due today") | Roadmap "adaptive review"; handoff priority 5 | S2-12 | Dedicated flow surfacing scheduler `dueItems`; tests | Planned | — | — | — | — | Data already computed on the Logbook screen. |
| S2-14 | 2 | Accessibility harness | Roadmap "accessibility harness" | S2-04 | Automated a11y assertions over screens/widgets; wired into `npm test`; CI updated | Planned | — | — | — | — | **No `test:a11y` script exists.** Adding one requires a `package.json` script *and* a CI step. |
| S2-15 | 2 | Validated content coverage gate | Roadmap "validated content coverage" | S2-08..S2-12 | Coverage assertion fails CI when an objective/skill has no question | Planned | — | — | — | — | Extends `tests/content/content.test.ts` cross-reference integrity. |
| S2-16 | 2 | Boss investigations | Roadmap "boss investigations" | S2-15 | Multi-step region-capstone assessment; tests; achievement wiring via S2-01 | Planned | — | — | — | — | |
| S2-17 | 2 | Save and resume verification | Roadmap "save and resume" | S2-16 | Fresh-save progression + mid-session resume proven by integration tests; migration added if save shape changes | Planned | — | — | — | — | `SAVE_SCHEMA_VERSION` + `MIGRATIONS` contract must not break. |
| S2-99 | 2 | Stage 2 closure audit + tag | Stage completion policy | all S2 | All units Complete/explicitly blocked; metrics measured not recalled; `stage-2-complete` tag pushed; archive + bundle produced | Planned | — | — | — | — | |

## Stages 3–6 — roadmap granularity

Not yet decomposed into units. Each will be broken down at the start of its stage, following the S2 pattern
(defect repair → engine capability → content breadth → laboratory → assessment → closure audit).

| ID | Stage | Work unit | Source specification | Dependencies | Acceptance criteria | Status | Local commit | Remote commit | Push verified | Tests | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S3-00 | 3 | Probability foundations | Roadmap Stage 3 | S2-99 | Sample spaces, event operations, independence, conditional probability, tree diagrams, contingency tables, Bayes, diagnostic testing, risk/odds, expected value, probability lab, misconception remediation, boss investigation | Planned | — | — | — | — | Stage 1 already ships `src/core/statistics` probability primitives + `tests/statistics/probability.test.ts` (4 tests). |
| S4-00 | 4 | Distributions and sampling | Roadmap Stage 4 | S3-00 | Random variables, PMF/PDF, Bernoulli/binomial, uniform/normal/Poisson, non-normal, populations/samples, sampling frames and bias, sampling error, sampling distributions, LLN, CLT, standard error, sampling lab | Planned | — | — | — | — | CLT explorer is a Stage 1 placeholder (known defect #3). |
| S5-00 | 5 | Estimation and uncertainty | Roadmap Stage 5 | S4-00 | Parameters vs statistics, estimators, bias/precision, standard error, confidence intervals, coverage, margin of error, analytic intervals, bootstrap, prediction intervals, tolerance intuition, estimation lab | Planned | — | — | — | — | |
| S6-00 | 6 | Hypothesis testing | Roadmap Stage 6 | S5-00 | Claims/hypotheses, null models, test statistics, null distributions, p-values, thresholds, one/two-sided, Type I/II, power, effect sizes, practical significance, multiple testing, researcher degrees of freedom, publication bias, randomization testing, hypothesis lab | Planned | — | — | — | — | |

## Cross-cutting, unscheduled

| ID | Stage | Work unit | Source specification | Dependencies | Acceptance criteria | Status | Local commit | Remote commit | Push verified | Tests | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| X-01 | any | Windows installer CI workflow | Protocol "GitHub Actions" | packaging stable | Windows runner builds NSIS installer and uploads it as a workflow artifact | Planned | — | — | — | — | Deferred until packaging is stable. A green build proves **buildability only**, never manual GUI verification (D-008). |
| X-02 | any | Real Windows runtime verification | D-008; `IMPLEMENTATION_STATUS.md` | X-01 | `npm run package:win` on real Windows; installer + save paths smoke-tested; status doc updated | Blocked | — | — | — | — | **Cannot be done in a Linux container.** Requires the owner on a real Windows machine. Until then Windows support stays `🔧 configured only`. |
