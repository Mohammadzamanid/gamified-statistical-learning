# REMOTE_PERSISTENCE_POLICY.md

**Binding on every session that touches this repository. No exceptions without explicit owner permission.**

This policy exists because the predecessor project was lost. All work after Stage 1 was committed only to a local
repository inside an ephemeral environment and was destroyed when that environment was reclaimed. Local commits are
not durable. GitHub is the only source of truth.

---

## 1. Every completed unit must be pushed

A work unit is **not Complete** until its commit exists on GitHub and has been verified there.

Required sequence at the end of every unit, in order:

1. Run the relevant validation (see §6).
2. Review `git status` and `git diff` — read them; do not skim.
3. Stage **only intentional files**. Never `git add -A` without first reading `git status`.
4. Commit with a descriptive message.
5. Push to GitHub.
6. **Verify the remote hash matches the local hash** (§2).
7. Record both hashes in `RECONSTRUCTION_BACKLOG.md` and `CURRENT_WORK_UNIT.md`.
8. **Stop.** Do not begin the next unit in the same cycle.

## 2. Remote verification is mandatory

Verification is a hash comparison, not a successful-looking push message. A push can report success while the branch
you verified is not the branch you think it is.

```bash
LOCAL_HEAD=$(git rev-parse HEAD)
git push origin main
REMOTE_HEAD=$(git ls-remote origin refs/heads/main | awk '{print $1}')
[ "$LOCAL_HEAD" = "$REMOTE_HEAD" ] && echo "VERIFIED: MATCH" || echo "MISMATCH — DO NOT PROCEED"
```

`LOCAL_HEAD` must equal `REMOTE_HEAD`.

**If they do not match:**

- Do **not** mark the unit Complete.
- Do **not** begin another unit.
- Do **not** force push.
- Preserve all local work exactly as it is.
- Diagnose the push or branch problem and report the exact blocker to the owner.

A unit that is committed locally but not verifiably pushed must be recorded with the literal status:

```
Complete locally — remote persistence failed
```

## 3. Forbidden git operations

**Never run any of the following without explicit, specific permission from the owner:**

- `git push --force`
- `git push --force-with-lease`
- `git reset --hard`
- `git clean -fd`
- `git clean -fdx`
- destructive checkout that discards changes (e.g. `git checkout -- .`, `git checkout -f`)
- history rewriting of pushed commits (`rebase`, `commit --amend`, `filter-branch`)
- branch deletion
- tag deletion
- remote deletion (`git remote remove`)
- deleting the GitHub repository
- removing untracked files before inspecting them

**Never overwrite remote history to resolve a conflict.** If remote `main` has diverged, preserve both histories with a
normal merge, or a safe rebase of *unpushed local* commits only. Re-run full validation after any reconciliation, then
push normally and record the conflict and its resolution in the backlog Notes column.

Correcting a *pushed* mistake is done with a **new forward commit**, never by rewriting.

Before every push:

```bash
git fetch origin
git status
git log --oneline --decorate --graph --all -20
```

## 4. Stage tagging policy

Each completed stage is marked with an annotated tag, pushed immediately:

```
stage-1-baseline
stage-2-complete
stage-3-complete
stage-4-complete
stage-5-complete
stage-6-complete
```

```bash
git tag -a stage-N-complete -m "<description>"
git push origin stage-N-complete
git ls-remote --tags origin | grep stage-N-complete   # verify
```

A tag is not created until the stage's final commit is pushed and verified. Tags are never deleted or moved.

**Known environment limitation (observed 2026-08-04).** The hosted Claude Code session used for reconstruction can
push branches but **cannot write tags or releases**. `git push origin <tag>` returns `HTTP 403` for `refs/tags/*` while
`refs/heads/*` succeeds, and the `git/tags`, `git/refs`, and `releases` REST endpoints are all refused by the session
proxy. When this happens:

- **Do not** treat the tag as optional, and **do not** report it as done.
- Record the tag as a **Blocked** unit in the backlog, naming the exact failure (see unit R-00d).
- Ensure the tag still exists in the milestone git bundle, so it is not lost.
- Hand the owner the exact commands to push it from a machine with normal credentials.

Branch pushes are unaffected, so **commit persistence — the thing that actually protects the work — is never blocked by
this.**

## 5. Milestone archive policy

At the completion of every major stage, produce, **outside normal Git history**:

1. A source archive excluding `node_modules`, `dist`, `dist-electron`, `release`, coverage, and caches.
2. A Git bundle containing all branches and tags (`git bundle create <file> --all`).
3. SHA-256 checksums for both.
4. A manifest recording the stage, date, commit hash, validation results, and file inventory.

These live in the local export directory `../gsl-exports/` (a sibling of the repository, never inside it) and are
attached to a GitHub Release when authentication and permissions permit.

**Never commit to normal Git history:** large ZIP files, installers, `node_modules`, Wine prefixes, or generated
release directories. Use GitHub Releases or the export directory.

## 6. Validation before push

Run the scripts that **actually exist** in `package.json`. Verify with `npm run` before assuming.

Currently defined and relevant:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run test:statistics
npm run test:content
npm run build
```

**`test:a11y` exists as of S2-20**, and did not before it. It runs `vitest` against `vitest.a11y.config.ts`, which
renders the real screens into jsdom. The rule that made its absence worth writing down still stands and is the general
one: **do not invoke a script that is not defined, and do not add one to CI without adding it to `package.json`
first.** What that script can and cannot prove is written on the harness itself — jsdom sees roles, names, live
regions and tab order, and does not see paint.

**Never modify a test merely to make the suite green.** If a baseline failure appears: determine whether it is
environmental or a genuine source defect, document it, apply the smallest evidence-backed correction, re-run the
affected validation, and preserve a record of the original failure.

## 7. Recovery procedure after interruption

If a session is interrupted, killed, or its environment is lost, the next session recovers as follows.

**If the working environment survived:**

```bash
cd <repo>
git status                                   # inspect; do not clean
git log --oneline --decorate --graph --all -20
git fetch origin
git rev-parse HEAD
git ls-remote origin refs/heads/main | awk '{print $1}'
```

- Hashes match and tree is clean → the last unit persisted. Read `CURRENT_WORK_UNIT.md` and start the next unit.
- Local ahead of remote → an unpushed unit exists. **Push it first**, verify, record hashes, then continue.
- Uncommitted changes present → inspect with `git diff`. Do not discard. Either finish and commit the unit, or report.

**If the environment was lost (the failure this policy exists to survive):**

```bash
git clone https://github.com/Mohammadzamanid/gamified-statistical-learning.git
cd gamified-statistical-learning
npm ci && npm test
```

Everything pushed is intact. Anything not pushed is gone — which is precisely why §1 and §2 are non-negotiable.

Then read, in order: `RECONSTRUCTION_CONTEXT.md` → `RECONSTRUCTION_BACKLOG.md` → `CURRENT_WORK_UNIT.md` →
`STAGE_HANDOFF.md`, plus the surviving `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `DECISIONS.md`, and
`IMPLEMENTATION_STATUS.md`.
