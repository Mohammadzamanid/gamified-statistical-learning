# CURRENT_WORK_UNIT.md

Exactly one unit is active at a time. This file is rewritten at the start and end of every unit.

---

## Current ID

**R-00b — Establish repository, reconstruction documentation, CI, and verified Stage 1 baseline**

Stage 0 (reconstruction infrastructure). Predecessor: R-00a (pristine source import, Complete, `7add4bc`, verified on
remote).

## Objective

Put the surviving Stage 1 project under durable GitHub persistence and prove the baseline is green — **without
modifying any Stage 1 source**. This unit establishes the safety machinery that the loss of the previous project
proved was missing. It does **not** begin Stage 2.

## Relevant files

Created by this unit:

- `docs/RECONSTRUCTION_CONTEXT.md` — why reconstruction is needed, what was lost, what survived, measured baseline
- `docs/REMOTE_PERSISTENCE_POLICY.md` — push/verify discipline, forbidden git operations, tagging, recovery
- `docs/RECONSTRUCTION_BACKLOG.md` — unit decomposition with hash and verification columns
- `docs/CURRENT_WORK_UNIT.md` — this file
- `docs/STAGE_HANDOFF.md` — rewritten for reconstruction (Stage 1 original preserved at `7add4bc`)
- `.github/workflows/ci.yml` — CI over existing scripts only

Read but **not modified** (surviving Stage 1, authoritative):

- `docs/PROJECT_CONTEXT.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_STATUS.md`
- all of `src/`, `tests/`, `package.json`, `package-lock.json`, tsconfigs, `vite.config.ts`, `electron-builder.yml`

## Acceptance criteria

| # | Criterion | Met |
|---|---|---|
| 1 | Local project created from `statlas-stage1.zip` with `.git` history preserved | Yes |
| 2 | Remote `Mohammadzamanid/gamified-statistical-learning` exists, private, default `main` | Yes |
| 3 | Surviving commit pushed **before** any other work | Yes — `7add4bc` verified |
| 4 | Stage 1 baseline validated with existing scripts only | Yes — see below |
| 5 | No Stage 1 source modified to make the baseline pass | Yes — zero source edits |
| 6 | Reconstruction documentation committed | This commit |
| 7 | CI workflow uses only scripts defined in `package.json` | Yes — no `test:a11y` |
| 8 | Baseline commit pushed and remote hash verified equal | Pending push |
| 9 | `stage-1-baseline` tag pushed and verified | Pending push |
| 10 | Milestone source ZIP + Git bundle + checksums created outside Git history | Pending |
| 11 | Working tree clean | Pending |
| 12 | No Stage 2 source changes started | Yes — none |

## Required tests

Scripts that exist in `package.json` (verified before running — `test:a11y` does **not** exist):

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run test:statistics
npm run test:content
npm run build
```

Measured results on 2026-08-04, Node v22.22.2 / npm 10.9.7:

| Command | Result |
|---|---|
| `npm ci` | Pass — 582 packages |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **73 tests / 14 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 285.73 kB (83.82 kB gzip) |

No test was modified. The baseline was green exactly as it survived.

## Current status

**In progress** — documentation and CI authored; validation green; push and tag pending.

## Local commit

R-00a: `7add4bc7f49c4c805f41423f7d3ce64b6179a598`
R-00b: recorded in the follow-up commit once the push is verified. Hashes are never written in advance.

## Remote verification

R-00a: `LOCAL_HEAD == REMOTE_HEAD == 7add4bc7f49c4c805f41423f7d3ce64b6179a598` — **MATCH**, verified via
`git ls-remote origin refs/heads/main`.

R-00b: pending.

## Remaining work

1. Commit reconstruction docs + CI workflow.
2. Push to `origin main`; verify `git rev-parse HEAD` equals `git ls-remote origin refs/heads/main`.
3. Record both hashes here and in the backlog (follow-up commit); mark R-00b Complete.
4. Create and push annotated tag `stage-1-baseline`; verify it exists on the remote.
5. Produce milestone source ZIP, Git bundle, manifest, SHA-256 checksums in `../gsl-exports/` (outside Git history).
6. Confirm the working tree is clean.
7. **Stop.** Next unit is **S2-01 — wire the region-completed achievement trigger**, in a separate cycle.

## Explicitly not in scope

- Any Stage 2 source, test, or content change.
- Dependency advisory remediation (tracked as R-01) — deliberately deferred so the recorded baseline equals the
  surviving artifact.
- Any Windows runtime claim (tracked as X-02; impossible in a Linux container).
