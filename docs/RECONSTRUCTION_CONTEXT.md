# RECONSTRUCTION_CONTEXT.md

> Read this **first**, before `RECONSTRUCTION_BACKLOG.md`, `CURRENT_WORK_UNIT.md`, and `STAGE_HANDOFF.md`.

**Reconstruction began:** 2026-08-04
**Target repository:** `https://github.com/Mohammadzamanid/gamified-statistical-learning` (private, default branch `main`)
**Project working title:** Statlas (package name `statlas`, product name `Statlas`)

---

## 1. Why reconstruction is necessary

The original Statlas project was developed inside an **ephemeral environment**. Commits were made only to a local
repository inside that environment and were never pushed to a durable remote. When the environment was reclaimed,
every commit after Stage 1 was destroyed along with it.

The single reason this project is recoverable at all is that a Stage 1 source archive had been exported out of the
environment before it was lost.

**The governing lesson, now encoded as policy in `REMOTE_PERSISTENCE_POLICY.md`: a work unit does not exist until it
is pushed to GitHub and the remote hash has been verified to match the local hash.**

## 2. What was lost

All source code, tests, content, and documentation produced **after Stage 1**. Concretely, the work described by the
Stage 2–6 specifications is gone. No Stage 2+ source, tests, or content survived in any form.

What did *not* survive, and therefore may not be claimed as recovered:

- Stage 2–6 implementation source
- Stage 2–6 tests and their pass/fail evidence
- Stage 2–6 content JSON
- Any metrics reported for Stage 2–6 (test counts, coverage, content counts)

## 3. What survived

A single archive containing the complete Stage 1 working tree, **including its `.git` directory**.

| Property | Value |
|---|---|
| Uploaded as | `statlas-stage1.zip` |
| Path in reconstruction session | `/root/.claude/uploads/a542ca8f-b433-56e1-8a68-f358dadd20d2/43ac5fc9-statlasstage11.zip` |
| Size | 457,070 bytes |
| SHA-256 | `5fb3490aa694d45d700b72124ef75f6c1d8fa7336e1390d8dcdc06788067dbce` |
| Entries | 419 files |
| Archive root | `statlas/` |

Because the archive preserved `.git`, the original Stage 1 commit was carried forward **as-is** rather than being
re-created by a fresh `git init`. The original authorship and message are intact:

```
commit 7add4bc7f49c4c805f41423f7d3ce64b6179a598
Author: Mo <mo@localhost>
Date:   2026-07-21T12:42:57+00:00
    Stage 1: Statlas vertical slice — engines, content, app shell, tests, docs
```

That commit is the **pristine surviving source**. It was pushed to `origin/main` before any reconstruction file was
written, so the irreplaceable artifact was secured first. The branch was renamed `master` → `main`; no history was
rewritten.

Surviving Stage 1 documentation (still authoritative, written by the original stage):
`docs/PROJECT_CONTEXT.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_STATUS.md`.

## 4. Stage 1 baseline state — measured, not remembered

All figures below were **measured from this repository on 2026-08-04**, not copied from prior reports.

**Toolchain:** Node v22.22.2 · npm 10.9.7 · Linux x64

| Validation | Command | Result |
|---|---|---|
| Dependency install | `npm ci` | Pass — 582 packages, from committed `package-lock.json` |
| Typecheck | `npm run typecheck` | Pass (renderer + electron tsconfigs) |
| Lint | `npm run lint` | Pass — 0 errors, 0 warnings |
| Tests | `npm test` | Pass — **73 tests / 14 files** |
| Statistics tests | `npm run test:statistics` | Pass — 18 tests / 3 files |
| Content validation | `npm run test:content` | Pass — 5 tests / 1 file |
| Production build | `npm run build` | Pass — renderer 285.73 kB (83.82 kB gzip), 100 modules |

**Source size:** 60 `.ts`/`.tsx` files under `src/`; 14 test files under `tests/`; 98 files tracked by git.

**Measured content coverage (Stage 1):**

| Item | Count |
|---|---|
| Worlds | 1 |
| Regions | 2 |
| Modules | 2 |
| Lessons | 3 |
| Objectives | 6 |
| Skills | 6 |
| Questions | 14 |
| Misconceptions | 8 |
| Remediations | 7 |
| Achievements | 4 |
| Datasets | 1 |

**Measured interaction coverage:** 17 interaction types are registered in
`src/core/questions/registry.ts`; **11 are `implemented: true`** and **6 are `implemented: false`**.

- Implemented (11): `multiple-choice`, `multiple-selection`, `numeric-input`, `percentage-input`, `fraction-input`,
  `ordering`, `matching`, `graph-interpretation`, `error-identification`, `method-selection`, `short-explanation`
- Not implemented (6): `drag-and-drop`, `point-placement`, `formula-construction`, `simulation-prediction`,
  `step-by-step-calculation`, `confidence-rating`

The 14 shipped questions use exactly 11 distinct interaction types — the implemented set. No content depends on a
stubbed interaction.

**Mastery rule as shipped:** `streakToMaster: 3`, `minAccuracy: 0.8`, `minAttempts: 4`.

**Known Stage 1 defects carried into reconstruction** (from `IMPLEMENTATION_STATUS.md`, unmodified):

1. Region-completed achievement trigger is stubbed and always returns false.
2. Six interaction types are unimplemented; the renderer degrades honestly with a "not yet available" notice.
3. Laboratory simulation instruments (sampling distribution, CLT explorer) are placeholders.
4. Only one world of content exists.
5. `eslint.config.js` emits a cosmetic `MODULE_TYPELESS_PACKAGE_JSON` Node warning (see `DECISIONS.md` D-002).

No source file was modified to establish this baseline. The baseline is green exactly as it survived.

**Dependency advisories:** `npm ci` reports 21 advisories (2 critical, 15 high, 4 moderate), concentrated in the
`electron-builder` toolchain. These were **deliberately not remediated** during baseline establishment, because
changing dependencies before the baseline is committed would mean the recorded baseline is no longer the surviving
artifact. Remediation is tracked as its own backlog unit.

## 5. Windows runtime status

**Unverified, and must not be claimed.** Stage 1 was developed and validated on Linux. `electron-builder.yml`
configures an NSIS Windows target, but the installer has **never been compiled or smoke-tested**. Reconstruction
continues on Linux, so this remains unverified.

Per surviving decision D-008, no Windows claim may be made until `npm run package:win` is run on real Windows and the
installer plus save paths are smoke-tested. A green CI build is evidence of **buildability only** — never evidence
that the GUI was manually exercised.

## 6. Target repository and remote-persistence policy

Remote: `https://github.com/Mohammadzamanid/gamified-statistical-learning.git` · private · default branch `main`.

The full policy is in **`REMOTE_PERSISTENCE_POLICY.md`** and is binding on every future session. In summary: every
completed work unit must be committed, pushed, and confirmed by comparing `git rev-parse HEAD` against
`git ls-remote origin refs/heads/main`; both hashes are recorded in the backlog; destructive git operations are
forbidden without explicit permission.

## 7. Stage reconstruction roadmap

Stages 2–6 **cannot be presented as recovered source code**. They are *reconstructed implementations* derived from the
surviving Stage 1 source, the surviving specifications, and the known defect history. Byte-for-byte restoration is not
claimed and is not achievable. Every metric reported for a reconstructed stage must be measured from this repository.

| Stage | Scope | Status |
|---|---|---|
| 1 | Surviving vertical slice — engines, content, app shell, tests, docs | **Baseline verified** |
| 2 | Beginner mathematics, data, and descriptive statistics | Not started |
| 3 | Probability foundations | Not started |
| 4 | Distributions and sampling | Not started |
| 5 | Estimation and uncertainty | Not started |
| 6 | Hypothesis testing | Not started |

Per-unit decomposition lives in `RECONSTRUCTION_BACKLOG.md`. Only one unit is worked per session cycle.
