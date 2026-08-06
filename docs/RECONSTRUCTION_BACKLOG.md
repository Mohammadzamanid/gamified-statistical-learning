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
| R-00b | 0 | Establish repository, reconstruction docs, CI, verified baseline | This protocol | R-00a | Docs authored; CI workflow uses only existing scripts; full validation green; commit pushed + verified; `stage-1-baseline` tag pushed; export bundle created | Complete | `1b0a5dd` | `1b0a5dd` | Yes — MATCH | 73/73 pass, 14 files | Full SHA `1b0a5dd16e0a51346f2e64e6ad104995060f7fb7`. Hashes recorded only **after** the push was verified, never written in advance. Measured counts in `RECONSTRUCTION_CONTEXT.md`. |
| R-00c | 0 | Record verified hashes; tag `stage-1-baseline`; create export bundle | Remote-persistence policy §1, §4, §5 | R-00b | Backlog + work-unit docs carry verified hashes; annotated tag pushed and confirmed on remote; source ZIP, git bundle, manifest, SHA-256 checksums created outside Git history | Complete except tagging — see R-00d | `d4e2504` | `d4e2504` | Yes — MATCH | unchanged (docs only) | Full SHA `d4e250434c465f85e4307a226a9af2cbc9788c17`. Hashes recorded, exports created and verified (`git bundle verify` → complete history). Tagging split out to R-00d because it is blocked by the environment, not by this work. |
| R-00d | 0 | Push `stage-1-baseline` tag to GitHub (+ optional Release) | Remote-persistence policy §4, §5 | R-00c | Tag visible in `git ls-remote --tags origin`, pointing at `d4e2504` | **Blocked — requires owner credentials** | `7faa5896` (tag object, local + in bundle) | — | No | n/a | Hosted session cannot write tags: `git push refs/tags/*` → 403; `git/tags` + `git/refs` API → 403 "Write access … not permitted through this proxy"; `releases` API → 403 "not permitted for this session type". Environment restriction, **not** a permissions or repository problem — the tagged commit is on GitHub and verified. Tag is preserved in `../gsl-exports/*.bundle`. Owner completes it with `git tag -a stage-1-baseline d4e2504 -m "…" && git push origin stage-1-baseline`. |
| R-01 | 0 | Triage `electron-builder` dependency advisories | `npm audit` output at baseline | R-00b | Each of 21 advisories classified reachable/unreachable; safe upgrades applied; `npm test` + `npm run build` stay green; no forced breaking upgrade without owner sign-off | Planned | — | — | — | — | 21 advisories at baseline (2 critical, 15 high, 4 moderate), concentrated in packaging toolchain. Deliberately untouched during baseline so the baseline equals the surviving artifact. |

| R-00e | 0 | Set repository visibility to private | Protocol: "Preferred visibility: `private`" | R-00a | `GET /repos/:owner/:repo` reports `"private": true` | **Blocked — requires owner** | n/a | n/a | n/a | n/a | The repository was created **public**; the protocol asked for private. The session cannot change it: `PATCH /repos/:owner/:repo` → `403 "Repository settings writes are not permitted through this proxy."` Owner fixes it at **Settings → General → Danger Zone → Change repository visibility → Private**. Note the repo has been public since creation, so treat anything already pushed as having been publicly visible. The repository description is also unset and can be filled in on the same screen. |

## Stage 2 — Beginner mathematics, data, and descriptive statistics

Derived from the reconstruction roadmap and the surviving `STAGE_HANDOFF.md` Stage 2 priorities. Ordered so that
defect repair and engine capability precede content breadth.

| ID | Stage | Work unit | Source specification | Dependencies | Acceptance criteria | Status | Local commit | Remote commit | Push verified | Tests | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S2-01 | 2 | Wire region-completed achievement trigger | Known defect #1; `STAGE_HANDOFF.md` priority 1 | R-00b | Trigger fires on genuine region completion; unit + integration tests; no false positives on partial completion | **Complete** | `6798b6a` | `6798b6a` | Yes — MATCH | 90 pass, 15 files (was 73/14) | Full SHA `6798b6a71beb3e15ec43e791ca60fa36e2a0c214`. Engine now delegates to `isRegionCompleted`; curriculum argument made **required** so omitting it fails to compile. Hardened against dangling module refs and vacuous empty-region completion. Loader now validates achievement-trigger references. Added `ach.harbor-charted` / `ach.atoll-charted`. New tests produce 7 failures against the old stub — genuine regression tests. Detail in `STAGE2_RECONSTRUCTION_BACKLOG.md`. |
| S2-02 | 2 | Implement `step-by-step-calculation` interaction | Roadmap "missing interaction types"; registry `implemented: false` | S2-01 | Evaluator + renderer + a11y; registry flag → `true`; tests per type; content exercising it | **Complete** | `48bac65` | `48bac65` | Yes — MATCH | 115 pass, 17 files (was 90/15) | Full SHA `48bac65064d45b376d88d92bd775957ecc78105f`. New `steps` answer kind + pure run engine in `src/core/questions/step-calculation.ts`; per-step validation, hints, retry-from-failed-step; step misconceptions routed into the existing remediation pipeline; 3 questions inside real lessons. **12 of 17** interaction types now implemented. Detail in `STAGE2_RECONSTRUCTION_BACKLOG.md`. |
| S2-03 | 2 | Implement `point-placement` interaction | as above | S2-02 | as above | **Complete** | `4c4d908` | `4c4d908` | Yes — MATCH | 155 pass, 19 files (was 115/17) | Full SHA `4c4d908bf4395bacbb4c23968fbb86ce46b36fd3`. New `point` answer kind + `PointField` geometry; pure engine in `src/core/questions/point-placement.ts`; pointer **and** keyboard paths share one code path, and a test steps to every shipped target by keyboard alone. Axes-swapped derived from the target. 4 questions across 2 lessons. **13 of 17** interaction types implemented. |
| S2-04 | 2 | Implement `drag-and-drop` interaction (accessible) | Roadmap "missing interaction types" | S2-03 | Reusable across sorting/matching/ordering/grouping/graph construction; complete keyboard alternative | **Complete** | `70e9527` | `70e9527` | Yes — MATCH | 193 pass, 21 files (was 155/19) | Full SHA `70e95277a0850c67d0af07148d7f0ac7497aab43`. One `placement` primitive; only the zone configuration varies. Keyboard path proven by building every shipped arrangement with `placeItem`/`moveWithinZone` alone. **14 of 17** interaction types implemented. |
| S2-05 | 2 | Interaction-type audit (all 17) | Roadmap; addendum interaction requirements | S2-04 | Per type: schema, renderer, evaluation, correct/incorrect/misconception paths, keyboard, accessible name, ≥1 genuine curriculum use, save/resume where stateful | **Complete** | `acc9bf3` | `acc9bf3` | Yes — MATCH | 211 pass, 22 files (was 193/21) | Full SHA `acc9bf36df47ab97613ec1f1bc77c8355b3cccd1`. Audit is enforced by `tests/audit/interaction-audit.test.ts` (18 checks), not just documented. 14 of 17 implemented, all with renderers and lesson-reachable content; 3 stubs unused. 5 findings recorded (F-1…F-5). Detail in `docs/INTERACTION_AUDIT.md`. |
| S2-06 | 2 | Dedicated spaced-review queue | Roadmap "adaptive review"; handoff priority 5 | S2-01 | Due calculation, review screen, overdue, new-vs-review, mixed topics, rescheduling, persistence, interrupted resume, deterministic-clock tests | **Complete** | `e8e0cb2` | `e8e0cb2` | Yes — MATCH | 236 pass, 24 files (was 211/22) | Full SHA `e8e0cb2b8a02ce933671aa8cf4c2a5c727760855`. Pure review core with the clock always passed in; session frozen at start so resume is meaningful. **Save schema 1 → 2** with a real migration (first schema change since the baseline). Screen routed and reachable from the top bar. |
| S2-07 | 2 | Region 1 curriculum architecture | Roadmap "Region 1 completion" | S2-05 | Complete lesson + prerequisite graph; every required topic represented and reachable | **Complete** | `dd39d38` | `dd39d38` | Yes — MATCH | 246 pass, 25 files (was 236/24) | Full SHA `dd39d38c57b4083d7829a698a56960b6ff484c8c`. All 17 scope §2 topics given a skill, objective, lesson and seed question across 4 new modules with a prerequisite graph. Reachability walked from a fresh save; cycles rejected. **Architecture only** — a skeleton-honesty check keeps these from being mistaken for finished lessons (S2-08). |

| S2-08 | 2 | Region 1 lessons and interactions | Addendum §5 lesson-completeness requirements | S2-07 | Every Region 1 lesson satisfies all 18 structure requirements | **Partial** | `def8b1d` | `def8b1d` | Yes — MATCH | 337 pass, 30 files (was 246/25) | Cycles `629dd74b763013016ae09a40064be2a976b394d7`, `2f1ec31dee5d451b28fda8f85398b998d4a60217`, `def8b1d51eb71a08b5a8b08d18ec11fe5d6f7edc` — all verified. **13 of 17 lessons Complete** — Modules 1 (`m.r1-counting`), 2 (`m.r1-parts`) and 3 (`m.r1-position`). The other 4 topic lessons are still skeletons and are named in `STAGE2_CURRENT_WORK.md`. Lessons gained a data-driven `demonstration` and `formalTerm` plus six practice roles (D-012…D-014); `tests/audit/lesson-structure.test.ts` (24 checks) enforces all 18 requirements and **drives** every demonstration control, so an inert one fails. 5 new misconceptions, each triggered through the real session engine. Not Complete, and not counted toward stage closure. |

**S2-09 onward: see `STAGE2_RECONSTRUCTION_BACKLOG.md`, which is authoritative.**

The Stage 2 rows above are kept here because the persistence policy requires verified hashes in
both backlogs. The remaining Stage 2 units are *not* duplicated here: this file's original decomposition
predates the authoritative Stage 2 unit list and used different numbers for the same work (for example, it had
S2-05 as `formula-construction`, where the authoritative list has S2-05 as the interaction-type audit). Keeping two
numberings risks a future session implementing the wrong unit, so the superseded rows were removed rather than
left to drift. Nothing was lost — every one of those work items appears in the authoritative Stage 2 backlog.


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
