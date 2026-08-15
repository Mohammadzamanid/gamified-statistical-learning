# STAGE2_CLOSURE.md

The Stage 2 closure record. **Every number here was measured from this repository at the closing commit**, not
recalled from a report. Nothing in Stage 2 is recovered source; all of it is a reconstruction (see
`RECONSTRUCTION_CONTEXT.md`), and no part of it may ever be described otherwise.

---

## 1. What closes

| Fact | Value |
|---|---|
| Closing commit | `ff22de27080d7b82f5f3dc9ea6d95b66931fd6cf` |
| Remote | `https://github.com/Mohammadzamanid/gamified-statistical-learning`, branch `main` |
| Remote verification | `LOCAL == REMOTE`, verified before this document was written |
| Commits on `main` | 89 |
| Units | S2-01 … S2-21, all Complete, each with a verified remote hash in the backlog |
| Node / npm | v22.22.2 / 10.9.7 |

## 2. Measured totals

| Measure | Value |
|---|---|
| Worlds / regions / modules / lessons | 1 / 2 / 10 / **40** |
| Skills / objectives | 42 / 43 |
| Boss investigations | **2** — one per region, no region owing one |
| Authored questions | **309** |
| Generator families | **210** |
| Validated generated interactions | **12,889** |
| Total available interactions | **13,250** |
| Topics meeting scope §4 | **41 of 41** |
| Smallest topic | **121** available (floor 100) |
| Fewest reasoning families on any topic | **4** (floor 4) |
| Largest single-shape share anywhere | **36.9%** (ceiling 50%) |
| Misconceptions / remediations | 40 / 39 |
| Datasets / achievements | 7 / 6 |
| Save schema version | **5**, with a migration for every step from 1 |

## 3. Validation at closure

Every command below was **run** at the closing commit. None is reported from memory.

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **707 tests / 49 files** |
| `npm run test:a11y` | Pass — **36 tests / 3 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 901.05 kB (231.05 kB gzip) |
| `npm run report:coverage` | Ran — 41 of 41 topics meet §4 |

The Stage 1 baseline was 73 tests / 14 files. **A green run is evidence of buildability and of the properties these
suites check. It is not evidence that the Electron GUI was exercised by hand, and never evidence of Windows support.**

## 4. Scope §10, the twelve closure guards

All twelve are enforced by `tests/audit/stage2-closure.test.ts`, which names them in the scope's own order and fails on
each independently. Nine probes were run against it; all nine bite.

| # | Guard | Enforced |
|---|---|---|
| 1 | A completed topic with too few validated interactions | Yes |
| 2 | A completed topic with zero families, omitted from reporting | Yes |
| 3 | An interaction registered without evaluation or accessibility coverage | Yes |
| 4 | A skill with no stage classification | Yes |
| 5 | A curriculum reference pointing at something missing | Yes — and the loader refuses to load such content at all |
| 6 | A declared misconception with no reachable trigger | Yes |
| 7 | A distractor naming an undeclared misconception, or an orphaned remediation | Yes |
| 8 | A region ending without a boss and a completion achievement | Yes |
| 9 | A region added without extending the fresh-save playthrough | Yes |
| 10 | A Stage 3 topic appearing before Stage 3 | Yes |
| 11 | A completed unit lacking a verified remote commit | Yes — read out of the backlog |
| 12 | Documentation claiming a script that does not exist | Yes — every script CI runs must be defined |

## 5. What is **not** closed, and why

Stated here rather than left for a reader to discover. None of these is a Stage 2 acceptance criterion that was
quietly dropped; each is recorded as Blocked or Deferred with its reason.

| # | Item | State |
|---|---|---|
| R-00d | `stage-1-baseline` tag on GitHub | **Blocked.** The session's git proxy returns HTTP 403 for `refs/tags/*` |
| R-00e | Repository visibility set to private | **Blocked.** Requires the owner in Settings → General → Danger Zone. The repository is **public** today |
| R-01 | 21 `electron-builder` dependency advisories | **Deferred by choice**, so the recorded baseline equals the surviving artifact |
| X-02 | Windows validation | **Blocked.** Reconstruction runs on Linux; `package:win` is configured and never compiled |
| — | `stage-2-complete` tag on GitHub | **Blocked, same cause as R-00d.** The tag exists locally at `2c61cbb` and is preserved in the exported bundle |
| — | Contrast at each theme; a real arrow key on a real range input | **GUI review.** jsdom computes no layout and implements neither (D-069) |

## 6. Exports, outside git history

`git archive` and `git bundle` at the closing commit, written to `../gsl-exports/` — outside the repository, because
large archives do not belong in normal history.

| File | SHA-256 |
|---|---|
| `statlas-stage2-ff22de2.bundle` | `7693cbc6e078fba677e51006ab5074d27cef93486f21a823196a874f6b279556` |
| `statlas-stage2-ff22de2.zip` | `e1992ffbc4958588eaa5efacef1b23ab5e3de4b0d91b1ec0810cf7a14dff8ca2` |

`git bundle verify` reports a complete history over five refs, including both `stage-1-baseline` and
`stage-2-complete`. **The bundle is therefore the only artifact that carries the stage tag**, since GitHub refuses it.

## 7. The three habits worth carrying into Stage 3

Written for whoever picks this up, because each cost a unit to learn.

1. **A guard is not evidence until something has been broken in front of it.** Three separate units found guards that
   read correctly and could not fail: chart rules that asked only whether a number appeared *somewhere* (D-063), four
   probes that failed for want of a test visiting the state (D-068), and a regex that matched its own counterexample
   (D-070). None was visible by reading.

2. **A test that reads its expectation through the code under test is not a test** (D-059, D-066). It appears wherever
   a value can be derived two ways, and the tell is always the same: break the derivation and nothing fails.

3. **A completeness claim is a declared list defended by an audit** (D-014), not a sentence in a document.
   `complete-lessons.ts`, `complete-topics.ts`, `complete-bosses.ts`, the nine misconception parts and the no-modals
   claim all work this way, and each is checked in both directions — nothing missing, nothing claimed that is not
   there.
