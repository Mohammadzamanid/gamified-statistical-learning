# STAGE2_RECONSTRUCTION_BACKLOG.md

One unit per work cycle. A unit is **Complete** only when its commit is on remote `main` and the hashes match.
Status vocabulary is defined in `STAGE2_RECONSTRUCTION_SCOPE.md` §9.

**Stage 2 opened from baseline:** `00f4497ff2f356bd03e3caf3556b3fa6a6de642e`

---

| ID | Work unit | Dependencies | Acceptance criteria | Status | Important files | Tests | Local commit | Remote commit | Push verified | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| S2-01 | Region-completion achievement repair | Stage 1 baseline | Completed region awards its achievement; incomplete region does not; no duplicates; award survives save/reload; existing tests stay green; new unit + integration tests pass; pushed and verified | **In progress** | `src/core/achievements/engine.ts`, `src/core/curriculum/progress.ts`, `src/core/curriculum/loader.ts`, `src/renderer/state/session.ts`, `src/content/questions/achievements.json` | `tests/unit/achievements.test.ts` (12), `tests/integration/region-completion.test.ts` (6) | pending | pending | pending | Hashes recorded in a follow-up commit **after** the push is verified — never written in advance. Suite 73→**90 tests**, 14→**15 files**. Verified the new tests fail (7 failures) against the old stubbed `false`, so they are genuine regression tests. `evaluateAchievements` now *requires* the curriculum, so a caller that omits it fails to compile rather than silently reintroducing the defect. |
| S2-02 | Step-by-step calculation interaction | S2-01 | Multi-step calculation, per-step validation, equivalent numeric formats, per-step hints, misconception classification, retry from failed step, final explanation, mastery update, keyboard accessible; ≥3 real curriculum examples | Not started | `src/core/questions/*`, `src/renderer/features/*` | pending | — | — | — | Registry flag flips `implemented: false` → `true` only when renderer, evaluator, a11y, and real content all exist. |
| S2-03 | Point-placement interaction | S2-02 | Number lines, coordinates, graph reading, approximate values; pointer **and** keyboard interaction; configurable tolerance; accessible feedback | Not started | `src/core/questions/*`, `src/renderer/features/*` | pending | — | — | — | Keyboard path is a requirement, not an enhancement. |
| S2-04 | Accessible drag-and-drop | S2-03 | Reusable for sorting, matching, ordering, grouping, simple graph construction; complete keyboard alternative | Not started | `src/renderer/components/*` | pending | — | — | — | |
| S2-05 | Interaction-type audit (all 17) | S2-04 | Per type: schema, renderer, evaluation, correct path, incorrect path, misconception path, keyboard operation, accessible name/instructions, ≥1 genuine curriculum use, save/resume where stateful | Not started | registry + audit doc | pending | — | — | — | Isolated technical demos do not satisfy the audit. Remove "not implemented" notices only where genuinely resolved. |
| S2-06 | Dedicated spaced-review queue | S2-01 | Due calculation, review screen, overdue items, new-vs-review distinction, mixed-topic review, correct/incorrect rescheduling, persistence, interrupted-session resume, deterministic-clock tests | Not started | `src/core/spaced-repetition/*`, `src/renderer/screens/*` | pending | — | — | — | Logbook already computes `dueItems`. |
| S2-07 | Region 1 curriculum architecture | S2-05 | Complete lesson + prerequisite graph; every required topic represented and reachable | Not started | `src/content/worlds/curriculum.json` | pending | — | — | — | Skeleton content must not be marked Complete. |
| S2-08 | Region 1 lessons and interactions | S2-07 | Every lesson satisfies all 18 structure requirements (scope §5) | Not started | `src/content/*` | pending | — | — | — | |
| S2-09 | Region 1 validated content expansion | S2-08 | ≥100 validated interactions per completed major topic, multiple reasoning families, duplicate/near-duplicate gates, misconception mappings, a11y descriptions, machine- and human-readable reports | Not started | generators + report tooling | pending | — | — | — | Topic list comes from the curriculum graph, never from generator modules. |
| S2-10 | Region 1 boss investigation | S2-09 | Multi-step saveable investigation combining Region 1 skills; awards region achievement; unlocks Region 2 | Not started | `src/content/*`, `src/renderer/screens/*` | pending | — | — | — | Award path already repaired and tested by S2-01. |
| S2-11 | Region 2 world and curriculum architecture | S2-10 | Distinct world, narrative, module sequence, prerequisite graph, objectives, laboratory unlocks, boss specification | Not started | `src/content/worlds/curriculum.json` | pending | — | — | — | Regions must feel related but not visually interchangeable. |
| S2-12 | Central tendency lessons | S2-11 | Frequency, proportion, percentage, mean, median, mode, measure selection, outlier effects, skew effects; draggable/editable datasets | Not started | `src/content/*` | pending | — | — | — | |
| S2-13 | Spread and position lessons | S2-12 | Min/max, range, quartiles, percentiles, IQR, variance intuition, standard deviation, distribution comparison | Not started | `src/content/*`, `src/core/statistics/*` | pending | — | — | — | SD must be visualised as distances → squared distances → their average → square root. |
| S2-14 | Data-visualization lessons | S2-13 | Bar charts, histograms, dot plots, box plots, scatterplots, graph selection, truncated axes, bin-width effects, misleading framing | Not started | `src/renderer/components/*`, `src/content/*` | pending | — | — | — | Every chart needs an accessible textual equivalent. |
| S2-15 | Descriptive statistics laboratory | S2-14 | Create/edit datasets, add/remove values, sort, add outliers, compare two datasets, change graph type, change bins, live statistics, save/reload experiments, reset, export summaries, accessible text descriptions | Not started | `src/renderer/screens/LabScreen.tsx` | pending | — | — | — | Must be a learning environment, not a calculator. Replaces Stage 1 known defect #3 placeholders. |
| S2-16 | Region 2 misconception library | S2-15 | ≥12 named misconceptions reachable, each remediation with all 9 required parts | Not started | `src/content/questions/*` | pending | — | — | — | Includes reverse validation: no undeclared distractor misconceptions, no orphaned remediations, no count-inflating tags. |
| S2-17 | Region 2 validated content expansion | S2-16 | ≥100 validated interactions per completed Region 2 major topic, diverse reasoning families | Not started | generators + report tooling | pending | — | — | — | |
| S2-18 | Region 2 boss investigation | S2-17 | Dataset inspection, summary selection, graph selection, misleading-presentation detection, outlier reasoning, distribution comparison, evidence-based conclusion; save/resume, adaptive support, remediation, achievement, Stage 2 completion | Not started | `src/content/*`, `src/renderer/screens/*` | pending | — | — | — | |
| S2-19 | Save, resume, and recovery audit | S2-18 | Interruption at lesson, multi-step calculation, boss, review queue, laboratory; after achievement award, mastery update, settings change; multiple profiles, atomic writes, backup rotation, corrupt-primary recovery, migration, invalid import, missing save, duplicate-achievement prevention, review-schedule and laboratory-state persistence | Not started | `src/core/persistence/*` | pending | — | — | — | Duplicate-achievement prevention already covered for regions by S2-01; extend to all award kinds. |
| S2-20 | Accessibility harness and audit | S2-19 | Real DOM-capable a11y testing added to `package.json` and CI; all checks in scope §6 | Not started | `package.json`, `.github/workflows/ci.yml`, `tests/a11y/*` | pending | — | — | — | **`test:a11y` may only be referenced once the script exists.** CI currently omits it deliberately. |
| S2-21 | Stage 2 closure audit | all above | Full validation suite, measured totals, fresh-save playthrough, save/resume audit, laboratory audit, remote persistence audit, closure drift guards enforced | Not started | `docs/*` | pending | — | — | — | Stage not closed until final commit pushed + verified, docs pushed, tree clean, `stage-2-complete` tag pushed **or explicitly marked blocked**, and source ZIP + Git bundle exported outside history. |

## Measured totals (updated as units complete)

Measured from this repository — never recalled from earlier reports.

| Metric | At Stage 1 baseline | Current |
|---|---|---|
| Test files | 14 | **15** |
| Tests | 73 | **90** |
| Regions | 2 | 2 |
| Modules | 2 | 2 |
| Lessons | 3 | 3 |
| Authored questions | 14 | 14 |
| Misconceptions | 8 | 8 |
| Remediations | 7 | 7 |
| Achievements | 4 | **6** |
| Datasets | 1 | 1 |
| Interaction types implemented | 11 of 17 | 11 of 17 |
| Renderer bundle | 285.73 kB (83.82 kB gzip) | **286.61 kB (83.99 kB gzip)** |

Windows runtime status: **unverified**, unchanged. `package:win` is configured but has never been compiled or
smoke-tested; reconstruction runs on Linux. No Windows claim is made.
