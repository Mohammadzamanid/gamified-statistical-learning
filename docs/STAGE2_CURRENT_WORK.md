# STAGE2_CURRENT_WORK.md

Exactly one Stage 2 unit is active at a time. Rewritten at the start and end of every cycle.

---

## Current unit

**S2-18 — the Region 2 boss investigation**

Entered from `5b441209c8eb0f277cbd0f9534f5f2693003973d` (remote-verified, clean tree).

## Objective

Build the case Region 2 has owed since S2-10, close the debt recorded in `tests/helpers/complete-bosses.ts`, and
make `ach.atoll-charted` earnable — it has shipped since Stage 1 and has been unreachable since S2-10, because
`isRegionCompleted` will not fire for a region whose investigation is open and Region 2 had none.

## Result up front

**S2-18 is Complete.** `inv.r2-atoll-approach` — *The Northern Approach* — runs in five stages over nineteen new
questions and one dataset of twenty soundings. `REGIONS_OWING_A_BOSS` is now empty for the first time.

| Measure | Value |
|---|---|
| Stages | **5** (floor 3) |
| Boss questions | **19**, none shared with any lesson |
| Skills exercised | **17**, spanning **all 6** of Region 2's modules |
| Region 2 misconceptions the case can report | **10** |
| Topics meeting scope §4 | **41 of 41**, unchanged |
| Tests | **668** / 47 files (662 at the start of the unit) |

## The case

Two survey parties measured the atoll's northern approach across one season and filed the *same* twenty soundings:

```
3 4 4 9 10 10 11 11 11 12 12 12 12 13 13 13 14 14 15 16
```

Both report a typical depth of about twelve metres, both call the water safe for a boat drawing five, and three
boats have grounded there since. Nobody lied and nobody miscalculated. The mean is 10.95, the median 12, the mode
12 — and all three are silent about the soundings at 3 and 4 metres: 15% of the survey, every one below the lower
fence at 5.5, separated from the rest by two empty intervals that only a two-metre histogram shows.

The five stages settle it in order: what was measured, the middle each party chose, what the middle hides, the two
pictures drawn from it, and the verdict.

## Relevant files

| File | Change |
|---|---|
| `src/content/worlds/curriculum.json` | **New.** `inv.r2-atoll-approach`, five steps with briefing and debrief |
| `src/content/questions/questions.json` | **New.** Nineteen `q.boss.r2-*` questions |
| `src/content/datasets/datasets.json` | **New.** `ds.atoll-approach` (the twenty soundings) and `ds.survey-reports` (the notice board's two bars) |
| `tests/helpers/complete-bosses.ts` | `r.averages-atoll` moved across; the owing list is now empty |
| `tests/integration/region-completion.test.ts` | **New.** Region 2's case played through the real engine; the whole expedition — both regions, both cases — in one save |
| `tests/audit/interaction-audit.test.ts` | "Reachable" widened to boss questions (D-062); a histogram's counts and a box plot's ordering checked against the drawing (D-063) |
| `src/content/generators/pictures.ts` | Dead code removed — see Corrections |

## Acceptance criteria

From `STAGE2_RECONSTRUCTION_BACKLOG.md` S2-18 and `docs/REGION2_BOSS_SPEC.md` §7.

| # | Criterion | Met |
|---|---|---|
| 1 | Dataset inspection | **Yes** — stage 1 establishes the survey before either account |
| 2 | Summary selection | **Yes** — stage 2 computes all three centres and argues which the soundings support |
| 3 | Outlier reasoning | **Yes** — stage 3 derives the fence from the quartiles and applies it |
| 4 | Graph selection | **Yes** — stage 5 chooses the chart for the notice board and says why |
| 5 | Misleading-presentation detection | **Yes** — stage 4, both by interval width and by a truncated axis |
| 6 | Distribution comparison | **Yes** — stage 5 compares the two accounts against the distribution |
| 7 | Evidence-based conclusion | **Yes** — the verdict names the 15%, the fence and the gap |
| 8 | Case authored in curriculum, questions under `q.boss.r2-*` | Yes |
| 9 | `r.averages-atoll` moved to `REGIONS_WITH_A_BOSS` | Yes |
| 10 | Playthrough completes every required lesson and **both** cases | Yes — one save, 40 lessons, 2 investigations |
| 11 | Commit pushed and remote hash verified | Yes — see below |

## Required tests

Measured (Node v22.22.2 / npm 10.9.7):

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — 0 errors, 0 warnings |
| `npm test` | Pass — **668 tests / 47 files** |
| `npm run test:statistics` | Pass — 18 tests / 3 files |
| `npm run test:content` | Pass — 5 tests / 1 file |
| `npm run build` | Pass — 899.18 kB (230.73 kB gzip) |
| `npm run report:coverage` | Ran — **41 of 41** topics meet §4 |

`test:a11y` was **not** run and is **not** claimed; it arrives in S2-20.

## Work completed

1. **The case is one dataset, argued five ways.** Every stage reads the same twenty soundings, which is what makes
   the ending land: the learner has computed the mean, the median and the mode themselves before being asked what
   all three leave out.

2. **A second dataset, for the one thing the soundings cannot show.** `ds.survey-reports` holds the two reported
   depths — 10.95 and 12 — and the notice board draws them from an axis starting at 10, so a metre of honest
   difference fills the frame. That is where `mc.truncated-axis-read-as-scale` sits, on a distractor that reads the
   taller bar as twice the depth.

3. **Both histograms are drawn, not described.** The wide one sets `binWidth: 5` and the narrow one `binWidth: 2`,
   so the picture the prompt argues about is the picture on screen (D-035, and the settings D-047 added for exactly
   this).

4. **The audit that had never seen a boss question now does** (D-062), and two chart guards that could be walked
   through now cannot be (D-063).

## Corrections made during the unit

1. **A misconception was declared where the option could not express it.** The first draft tagged
   `mc.truncated-axis-read-as-scale` — "bar heights read as amounts on a truncated axis" — on a distractor about a
   histogram's interval width, which is a different error entirely. The audit would have passed it, because the tag
   *was* on a choice and so was mechanically triggerable; that is the limit S2-16 wrote down and left named. The fix
   was to build the chart the misconception is about rather than to move the tag onto prose that fits it loosely.

2. **Two counts a learner would have met were wrong on screen.** The first draft's histogram prose said the wide
   bins ran "13 to 18" and the narrow ones "15 to 17". `buildBins` closes the last interval at the largest reading,
   so they are 13 to 16 and 15 to 16. Found by computing the bins rather than by reading the prose — which is now
   what D-063's check does on every histogram.

3. **A trap that could not be fallen into.** `mc.frequency-counts-categories` was given a `wrongValue` of 1, which
   is not what counting categories produces. There are two distinct shallow depths, so it is 2.

4. **A second set of twenty soundings for the same channel.** `ds.channel-depths` — "twenty depth soundings taken
   across the season in the main channel of the atoll" — has belonged to `l.r2-misleading-graphs` since S2-14. The
   case originally claimed the same water and season with different numbers, which is a contradiction a reader would
   hit. It moved to the northern approach.

5. **My own new test proved nothing.** "Credits every skill the case claims" asserted the skills had states after
   the run — true from the lessons alone, which every one of those skills is taught by. Rewritten to measure the
   difference the case makes: each claimed skill must gain an attempt when the case is argued.

6. **The first probe harness restored from git** and reverted this cycle's uncommitted work — the investigation had
   to be rebuilt. Probes now snapshot the working tree and restore from that.

7. **Lint was not clean at the baseline, and S2-17's record said it was.** Five warnings sat in
   `src/content/generators/pictures.ts` at `5b44120`: two dead helpers, two unused parameters and an unused loop
   binding. `npm run lint` was reported as "0 errors, 0 warnings" in S2-17 and that was wrong. The dead code is
   removed here; the count-by-walking route the loop implemented is kept, since reading `length` there would have
   made the family's second route the same as its first (D-020).

## Verification that the guards have teeth

Nine deliberate probes, all reverted. **Eight bite; one found a gap now closed and re-probed:**

| Probe | Result |
|---|---|
| The region keeps its boss but is listed as still owing one | **1 check fails** |
| A stage claims a skill none of its questions exercises | **2 checks fail** |
| The case re-uses a question `l.r2-outliers` already asks | **1 check fails** |
| A histogram is redrawn at a different interval width | **1 check fails** |
| The notice board's chart loses its truncated axis | **1 check fails** |
| A boss answer drifts away from its own explanation | **1 check fails** |
| A misconception is declared where nothing expresses it | **1 check fails** |
| The case drops its last two stages | **1 check fails** |
| A box plot's words move its first quartile from 10 to 9 | **0 → 1 check fails** — presence is not attachment (D-063) |

## Remaining work

None. S2-18 is Complete.

## Local commit

`7b993fdfdb3dee22da35c6d669fbe0b781c4177f`

## Remote verification

```
LOCAL_HEAD  = 7b993fdfdb3dee22da35c6d669fbe0b781c4177f
REMOTE_HEAD = 7b993fdfdb3dee22da35c6d669fbe0b781c4177f
VERIFIED: MATCH
```

## Next unit

**S2-19 — the save and resume audit.** Not started in this cycle.
