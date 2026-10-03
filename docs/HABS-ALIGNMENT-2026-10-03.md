# HABS score — aligning the site with the app (2026-10-03)

The owner, 2026-10-03: *"make HABS score align"*. The finding behind it is in
`docs/APP-ALIGNMENT-AUDIT-2026-07.md` §1 (the 2026-10-03 addendum): the app's
HABS scores **upper push / pull, run intensity / distance and erg**, while this
site's composite scored **upper strength, running, erg engine, olympic,
gymnastics and core endurance** — two different models under one name.

This document was written in two passes. **§1–§3 were written first, before any
code changed** (the criteria list: what the app does, what the site did, and
every difference, marked *applies* / *N-A*). §4 onwards records what was built
and what the check measured.

Everything about the app below was **read** from tpf-app at `226b018a`
(`origin/main`, 2026-10-03) and, where marked *measured*, **run** with the app's
own `tsx` against that source. Nothing in tpf-app was edited.

---

## 1. The app's HABS model, exactly

Source files (tpf-app): `src/lib/habs.ts` (`computeHABS`, `scoreValue`,
`COMPONENT_DEFS`), `src/lib/habs_pathways.ts` (`HABS_PATHWAY_WEIGHTS`),
`src/lib/habs_pathway_standards.ts` (`habsStandardsFor`),
`scripts/habs_standards.source.json` → `src/lib/habs_standards.generated.ts`
(base ladders), `scripts/habs_pathway_standards.source.json` (pathway
overrides), `src/lib/auto_benchmark_inputs.ts` (what is fed in),
`docs/26_derivation_reference.md` §9.1 (the formula).

### 1.1 Components and the benchmarks that feed each

Order matters only for floating-point summation; this is `COMPONENT_DEFS` order.

| # | Component id | App label | Benchmarks (app StdKey) | Input |
|---|---|---|---|---|
| 1 | `lower_strength` | Lower-body strength | Back Squat (`back_squat`), Deadlift (`deadlift`) | 1RM slot |
| 2 | `power` | Power | Power Clean (`power_clean`) | 1RM slot |
| 3 | `upper_push` | Upper-body push | Bench Press (`bench_press`), Overhead Press (`strict_press`) | 1RM slot |
| 4 | `upper_pull` | Upper-body pull | Barbell Row (`barbell_row`) | 1RM slot |
| 5 | `run_intensity` | Running (intensity) | 1-mile (`run_1mi`, race `run/mile`), 5K (`run_5k`, `run/5k`) | race time |
| 6 | `run_distance` | Running (distance) | 10K (`run_10k`, `run/10k`), half marathon (`run_half`, `run/half`) | race time |
| 7 | `swimming` | Swimming | 400 m (`swim_400m`), 1500 m (`swim_1500m`) | race time |
| 8 | `cycling` | Cycling | 20 km TT (`bike_20k`), 40 km TT (`bike_40k`) | race time |
| 9 | `erg` | Rowing / erg | 2 km row (`row_2k`, `row/2k`) | race time |

### 1.2 A result → a 0–100 value (`scoreValue`)

Six anchors per ladder: Beginner (`pass`) 50, Novice 60, Experienced (`good`)
70, Intermediate 80, Advanced 90, Elite 100, linear between neighbours.

- **At or past Elite: exactly 100** (hard cap, no bonus band — Phase 107).
- **Below Beginner, higher-is-better** (lifts): `max(0, 50 × value / max(1, pass))` — a straight line from 0 at zero.
- **Below Beginner, lower-is-better** (times): a floor one Beginner–Novice gap past Beginner, `floor = pass + (pass − novice)`; `max(0, 50 × (floor − value) / max(1, floor − pass))` — reaches 0 at that floor.
- The expressions are written per segment, e.g. `90 + 10 × (advanced − value) / (advanced − elite)`.

### 1.3 The lift value: estimated 1RM (`calc1RMVal`, `src/lib/calc.ts`)

`reps = parseInt(r) || 1`; one rep → the weight itself; otherwise Epley
`w × (1 + reps / div)` **rounded to 0.1 kg**, with `div = 25` for an Olympic
lift (`OLYMPIC_ORM_LIFTS` — of HABS's lifts only **Power Clean**) and 30 for the
rest. A value must be > 0 to count.

### 1.4 How components combine (`computeHABS`)

1. **Zero-weight components are dropped entirely** (not shown, cannot be the weak link).
2. A component's score is the **plain mean of its scored benchmarks**; a benchmark with no value is left out, never zeroed.
3. The overall is the **weighted mean over scored components only, renormalised** by the weight actually scored: `Σ wᶜ·sᶜ / Σ wᶜ` — `min(100, …)`.
4. **No missing-category penalty** (ORS has one; HABS does not) and **no cap below 100**.
5. `weightCovered` = the sum of the scored components' weights (out of 100) — the app shows "N% of components scored".
6. `weakLink` = the lowest-scoring scored component (first wins a tie), **only when at least two are scored**; else none.
7. Nothing scored → score 0 and `weightCovered` 0, which every surface treats as "no score".

### 1.5 Pathways and weights (`HABS_PATHWAY_WEIGHTS`, literal numbers)

| Pathway | lower | power | push | pull | run int. | run dist. | swim | bike | erg |
|---|---|---|---|---|---|---|---|---|---|
| `gym_goer` (General) | 28.6 | 14.3 | 14.9 | 13.7 | 7.1 | 7.1 | 0 | 0 | 14.3 |
| `hybrid_athlete` | 20 | 13.4 | 10.4 | 9.6 | 13.3 | 13.3 | 0 | 0 | 20 |
| `crossfit_generalist` | 22.6 | 19.2 | 10.1 | 9.3 | 9.7 | 9.7 | 0 | 0 | 19.4 |
| `hyrox` | 20.8 | 9.1 | 5.4 | 5.0 | 21.4 | 21.4 | 0 | 0 | 16.9 |
| `powerlifter` | 50 | 11.1 | 20.2 | 18.7 | 0 | 0 | 0 | 0 | 0 |
| `bodybuilder` | 43.8 | 12.5 | 22.7 | 21.0 | 0 | 0 | 0 | 0 | 0 |
| `triathlete` | 10 | 5 | 5 | 5 | 12.5 | 12.5 | 25 | 25 | 0 |

How they were made (the app's header): this site's 8-component Weights sheet,
with olympic, gymnastics and core endurance **dropped**, upper strength split
13 : 12 into push : pull, running split 50 : 50, then renormalised to 100 and
hand-rounded (crossfit's power reads 19.2 and bodybuilder's push 22.7 where
plain rounding gives 19.4 and 22.8 — the rows were adjusted to total exactly
100). Triathlete is owner-set directly. **The app's literal numbers are what it
scores with, so they — not a re-derivation — are what the site must hold.**

### 1.6 Standards

- Base ladders (the hybrid-athlete tables), split by sex, absolute kg / seconds: the 11 hand-set keys in `habs_standards.source.json`.
- **Derived at runtime**, never stored: `run_10k` and `run_half` from `run_5k` (Riegel, exponent 1.06, rounded to 10 s); `swim_1500m` from `swim_400m` (1.06); `bike_40k` from `bike_20k` (1.05).
- Per-pathway overrides replace one benchmark's ladder for one sex; everything else falls back to base. gym_goer, crossfit_generalist and triathlete override `run_5k`, so **their 10K and half are derived from their own 5K**, not the base.
- These numbers are already mirrored here and checked by `npm run check:app-lift` (0 differences on 14 base keys and 68 pathway rows before this work) — **except `run_10k` / `run_half`, which this site did not have at all**.

### 1.7 Sex

Separate men's and women's ladders; the weights do not depend on sex. **An
unspecified sex is scored on the men's ladders.** No bodyweight input (all
standards are absolute).

### 1.8 Typed vs derived inputs (what reaches `computeHABS`)

`computeHABS` itself only ever sees two stores: lift name → `{w, r}` and
modality → event → `{timeSec}`. What the app puts into them is a separate layer
(`src/lib/auto_benchmark_inputs.ts`):

| Input | Typed? | Derived? |
|---|---|---|
| 1RMs | typed on the 1RM screen (weight × reps) | the best **logged** e1RM from training beats a typed value when higher |
| Race times | typed on the Race Times screen | a **logged run** beats a missing or slower time |
| Missing race events | — | **predicted equivalents**: runs by the Daniels VDOT chain, row / bike / swim by the modality's Riegel exponent, only from a result within **4.1×** of the distance, never past the marathon. A prediction saved earlier that the rule can no longer reproduce is dropped. |

### 1.9 Current (6 months) vs all-time

Since 2026-10-02 every surface that shows one HABS number (the header ring,
Home, the Training Log card, the HABS history, the friend leaderboard) reads
**current**: each lift's and race's best in the **last six local calendar
months** (a typed number with no known date counts as current), then the
predicted equivalents from those. **All-time** (a switch on the HABS card) is
the best ever plus the 1RM record store and the current block's undated runs.
Coach (Active-Client) mode still uses the older undated rule.

---

## 2. The site's model before this change

Source files (this repo): `src/engine/score.ts` (`computeHRS`),
`src/engine/tier-curve.ts` (`scoreToPercentage`), `src/engine/normalize.ts`
(`calc1RMVal`), `config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx`
(`Benchmarks_Sourcing`, `Standards`, `Standards_Pathway`, `Weights`) →
`src/config/generated/lift.data.json`.

| | The site (before) |
|---|---|
| Components | 8 + 2: `running`, `erg_engine`, `lower_strength`, `upper_strength`, `olympic`, `power`, `gymnastics`, `core_endurance` (+ `swimming`, `cycling` for the triathlete; optional `grip`, `rucking` off) |
| Benchmarks | running: 1-mile, 5K · erg engine: 2 km row, **500 m row** · lower: back squat, **front squat**, deadlift · upper: bench, overhead press, row · **olympic: snatch, clean & jerk** · power: power clean, **broad jump** · **gymnastics: strict pull-ups, HSPU, toes-to-bar, double-unders, muscle-ups** · **core: plank** · swim 400 / 1500 · bike 20 / 40. **No 10K, no half marathon.** |
| Curve | the same six anchors, `lerp` per segment; at/over Elite 100; below Beginner: lifts `raw / pass × 50` (same), **times reach 0 at 2 × pass** (different) |
| 1RM | Epley ÷ 30 for every lift, **no Olympic divisor, no rounding** |
| Combination | weighted mean over tested components, renormalised; `coverage` = tested weight / total weight; no penalty; no explicit cap |
| Weights | the `Weights` sheet's 8-component numbers (e.g. hybrid 20 / 15 / 15 / 15 / 5 / 10 / 10 / 10) |
| Weak link | "limiters" = the two weakest tested components; the bridge card names the weakest **even when only one is tested** |
| Sex | M / F only (no unspecified) |
| Inputs | typed only. Signed in: the app's `profiles.orm` and `profiles.race_times` are pulled to prefill — **including race times the app saved as predictions (`predicted: true`)**, which then count as typed and are written back on Save as `predicted: false` |
| Current vs all-time | none — one value per benchmark, no dates, no training log |
| Pool | per-benchmark raw values (model-independent) + one composite row `overall:<pathway>:v2` holding **the score** |

---

## 3. The differences — criteria list (applies / N-A)

*Applies* = the site must change to match. *N-A* = the site cannot or should
not carry it, with the reason. Every row is answered in §4.

| # | Item | App | Site before | Verdict |
|---|---|---|---|---|
| D1 | Component set | 9 (§1.1) | 8 + 2 | **applies** — adopt the app's 9 |
| D2 | Which benchmark feeds which component | §1.1 | §2 | **applies** — bench + press → push; row → pull; mile + 5K → intensity; 10K + half → distance; 2 km row → erg |
| D3 | Benchmarks the app scores that the site lacks | 10K, half marathon | absent | **applies** — add both, with the app's derived ladders (base + the three pathways' own) |
| D4 | Benchmarks the site scored that the app does not | — | front squat, snatch, clean & jerk, 500 m row, broad jump, 5 gymnastics rows, plank | **applies** — take them out of the score; they stay on the site as TPF Benchmark standards (own tier shown), in the Capacity Index and on their SEO pages |
| D5 | Pathway weights | §1.5 literals | 8-component sheet | **applies** — hold the app's literals in a new `HABS_Weights` sheet |
| D6 | Zero-weight components dropped | yes | yes (computeHRS filters `w > 0`) | already equal |
| D7 | Curve between anchors | §1.2 | same anchors, different float expression | **applies** — port `scoreValue` verbatim so the numbers are bit-identical |
| D8 | Below-Beginner floor for times | `pass + (pass − novice)` | `2 × pass` | **applies** |
| D9 | Above Elite | 100 | 100 | already equal |
| D10 | Olympic 1RM divisor (power clean ÷ 25) and 0.1 kg rounding | yes | no | **applies** (HABS only — the Operator power clean is out of scope, §6) |
| D11 | Component = mean of scored benchmarks | yes | yes | already equal |
| D12 | Weighted mean, renormalised, `min(100)` | yes | yes (no explicit min, but never > 100) | applies — port verbatim, in the app's summation order |
| D13 | Missing-category penalty | none | none | already equal |
| D14 | Coverage | `weightCovered` (0–100) | fraction (0–1) | equal quantity; the site keeps its fraction for display |
| D15 | Weak link | lowest scored component, only with ≥ 2 scored | weakest even with 1 | **applies** — the "your weak link is" card uses the app's rule; the two-item "Train these first" list stays (site UI) |
| D16 | Sex unspecified → men's ladders | yes | the site has no unspecified option | **N-A** |
| D17 | Standards (base + overrides) | §1.6 | mirrored, checked | already equal (`check:app-lift`), plus D3 |
| D18 | Logged e1RMs / logged runs beat typed values | yes | the site has no training log | **N-A** — the site scores what is typed (or pulled from the app's typed stores) |
| D19 | Predicted equivalents for missing races | yes (VDOT / Riegel, ≤ 4.1×) | none | **owner question** (§7 Q1) — not ported; measured in §5 how often it changes the number |
| D20 | Current (6 months) vs all-time | yes | no history | **N-A** — the site's number is "the values you entered"; for a signed-in athlete those are the app's typed records, which the app's own Current view treats as current when undated |
| D21 | Stored app predictions pulled as typed, written back as real | n/a | yes (§2) | **applies** — the pull now skips `predicted: true` records (adding the 10K / half to the sync would otherwise widen it to the events the app most often predicts) |
| D22 | Level ladder (20 levels, 5 points each) | yes | yes | already equal (the app rounds "points to next" to 0.1; the site rounds up for display — display only) |
| D23 | Component labels | §1.1 | site labels | **applies** — show the app's labels for HABS |
| D24 | Pool composite row (`overall:<pathway>:v2`) holds old-model scores | n/a | yes | **applies** — new key `v3`; v2 rows are left untouched (§6, §7 Q2) |
| D25 | SEO pages and copy that describe the components | n/a | old components | **applies** — pathway pages, "counts toward" lines, README, STANDARDS.md |
| D26 | Bodyweight / age-grading | not used | not used (lifts absolute; hook off) | already equal |

---

## 4. What was built (every §3 row answered)

**The workbook** — `scripts/apply-habs-alignment-2026-10-03.py` is the
cell-by-cell record (idempotent; a re-run changes nothing), then `npm run codegen`:

- `Benchmarks_Sourcing` gains a `habs_component` column (D1, D2). Blank = a TPF
  Benchmark standard outside the HABS score (D4). The old `component` column is
  untouched — it still groups the Capacity Index and the Operator components.
- `run_10k` and `run_half` added (D3): base rows on `Standards`, and own rows on
  `Standards_Pathway` for gym_goer, crossfit_generalist and triathlete, each
  derived from that ladder's own 5 km exactly as the app derives them. The
  script checks the base rows against the app's numbers, measured with its tsx.
- A new `HABS_Weights` sheet holds the app's literal weights (D5). The old
  `Weights` sheet is kept: it still decides which outside-the-score standards a
  pathway lists (each pathway keeps the extras it had) and feeds the Capacity
  Index.
- `scripts/codegen.mjs` reads both, validates them (each HABS column sums to 100;
  every weighted HABS component has a benchmark; every `habs_component` is one of
  the nine) and emits `HABS_PATHWAY_WEIGHTS` and `habsComponent`
  (`lift.data.json` gains `habsWeights`).

**The engine** — `src/engine/habs.ts` (new): `habsScoreValue` (D7, D8, D9),
`habsOneRepMax` (D10), `computeHabs` (D6, D11, D12, D13, D15's rule) — each written
as the app writes it, so the numbers are bit-identical, not just close — and
`habsAsHrsResult`, which hands the result to the existing dashboard, radar,
weakness analysis, share card and pool in the shape they already read (D14).
`src/config/habs.ts` (new) holds the structure: the pathway's HABS weights, which
benchmarks a pathway lists (`liftBenchmarksFor`), and the Olympic-divisor ids.
`src/config/habsDisplay.ts` holds the app's labels (D23).

**The UI** (lift and hybrid brands only; Operator is unchanged):

- The headline score, level, tier, coverage, limiters and gaps, the radar, the
  share card and the copied text are the HABS result, labelled as the app labels
  it. Powerlifter / bodybuilder's per-lift radar shows the six lifts the score
  counts.
- "Your weak link is …" uses the app's rule (D15). "Train these first" (the two
  weakest) is unchanged.
- The entry grid groups the score's benchmarks by HABS component and lists the
  standards outside it last, under *"TPF Benchmark standards — not in the HABS
  score"*, each showing its own tier and score once entered. "N of M entered"
  counts the score's benchmarks only. Browse Standards marks those rows "Not in
  the HABS score".
- The Capacity Index is computed exactly as before, from the site's own
  8-component scores (it needs gymnastics and the Olympic lifts to predict a
  Fran or a Grace).

**The sync** — `src/data/appSync.ts`: `run_10k` ↔ `run["10k"]`, `run_half` ↔
`run["half"]`; the pull skips race times the app saved as predictions (D21).

**The pool** — the HABS composite row moves to `overall:<pathway>:v3`
(`src/data/pool.ts`, D24); Operator's stays on v2 (its score did not change). See §6.

**SEO and copy** (D25) — `scripts/build-seo.mjs`: pathway pages show the HABS
areas and weights with the app's labels and a line on how they combine, link the
score's benchmarks, and link the other standards separately; a standards page
says which pathways' HABS score it counts toward, or that it is outside the HABS
score. `src/content/landingCopy.ts` (hybrid): "weights strength and engine
equally" was wrong under either model (the app's hybrid athlete is 53.4 strength
/ 46.6 engine) — now "roughly half and half … the same HABS components and
weights as the Take Point Fitness Hybrid app". README, `docs/STANDARDS.md`,
`docs/APP-ALIGNMENT-AUDIT-2026-07.md` §1, `docs/APP_SYNC.md` and
`docs/SHARED-STANDARDS.md` carry dated notes; nothing was deleted from them.

**The checks** — `npm run check:app-habs -- <path to tpf-app>`
(`scripts/check-habs-vs-app.mjs`, new) and `check:app-lift`, extended to the
derived 10 km / half (§5).

## 5. Measured

All runs read-only, with the app's own `tsx`. The app clone moved during the
work, from `226b018a` to `baa1aebd` (two assistant commits, #660 and #661, plus
another session's uncommitted documents); `git diff --stat 226b018a baa1aebd`
over the HABS sources (`habs.ts`, `habs_pathways.ts`,
`habs_pathway_standards.ts`, both generated tables and their sources,
`auto_benchmark_inputs.ts`, `calc.ts`, `constants.ts`, `e1rm.ts`,
`multimodal_race_times_storage.ts`, `race_predictor.ts`, `benchmark_tests.ts`,
`operational_readiness.ts`) is empty, and the final runs below were against
`baa1aebd`.

**`npm run check:app-habs`:**

```
[check:app-habs] model: 7 pathways × 9 weights, 9 labels, 15 benchmark memberships, 210 ladders, 9 Olympic-divisor flags: 0 difference(s)
[check:app-habs] scores: 708 athletes (675 with a score; 7 pathways × 2 sexes × 22 fixed + 400 random), 708 bit-identical, max |Δ| 0: 0 difference(s)
[check:app-habs] not compared (information): with the app's predicted equivalents for missing races, 170 of 708 athletes' app score moves by more than 0.5 (max 18.5) — the site does not predict (docs/HABS-ALIGNMENT-2026-10-03.md D19)
```

The athletes: 16 hand-written profiles (full coverage at three levels, below
Beginner, far past the time floor, past Elite, lifts only with multi-rep sets,
pound-converted weights, runs only, one race, one lift, the triathlete's swim
and bike, fractional and zero reps, the standards outside HABS, empty) and six
on-anchor athletes per pathway and sex, on all 7 pathways × 2 sexes, plus 400
seeded random partial athletes. Required: the overall within ± 0.5 and the
breakdown identical (components, weights, data flags, scores; benchmarks,
values, scores; weight covered; weak link). All 708 overall scores came out
bit-for-bit equal.

**The check can fail** (each mutation made, run, and reverted): the Olympic
divisor 25 → 30 — 255 differences; the old 2 × Beginner time floor — 1,119; a
weak link with one component — 57; a HABS weight 16.9 → 17, front squat added to
lower-body strength and one derived 10 km cell moved — 3 model differences and
191 score differences; one label changed — 1. One mutation it did **not**
catch: rewriting one curve segment in an algebraically equal form (no score
moved on any of the 708 athletes); the tolerance on breakdown scores is 1e-9,
not bit equality.

**`npm run check:app-lift`:** 4 WODs × 2 sexes, 16 base keys × 2 sexes, 68 app
pathway rows: **0 differences** ("not compared (app only)" went from
`run_10k, run_half` to none). Mutated (a derived pathway cell, a deleted pathway
row, a base cell) — 4 differences, then reverted.

**Before the change, the same 708 athletes** (the site at `0fc31e8`, its old
composite, against the app): 665 scored by both; **396 differed by more than
0.5, the largest by 38.5 points**; 10 were scored by one and not the other.
Fully-tested athletes moved little (all 14 "full_mid" athletes within 0.7);
partial ones moved most — the time floor and the weights. The site's own sample
athlete (men, hybrid athlete): 76.6 before → **77.8** now (HYROX 78.0 → 81.3,
CrossFit 77.1 → 76.4, powerlifter 65.5 → 65.7).

**Site gate:** `npx tsc --noEmit` exit 0; `npx vitest run` 31 files, 436 tests,
0 failures (was 28 / 407); `npm run build` exit 0 (codegen, tsc, vite, and 45
SEO pages + 2 sitemaps). New tests: `src/test/habs.test.ts` (the model as typed
pins: labels, membership, the app's literal weights, the derived ladders, the
curve, the 1RM, the combination, the listing), `src/test/habs-app-map.test.ts`
(the check's app keys = the sync's), `src/test/habs-ui.test.ts` (the grid and
dashboard rendered to static HTML — mutation-checked: making the grid count the
outside standards fails two of its three tests); `appsync.test.ts` and
`pool.test.ts` extended.

## 6. The percentile pool — what happens to old pooled scores

The pool (`benchmark_submissions`) holds two kinds of row:

- **One row per benchmark, holding the raw value** (a 1RM estimate in kg, a time
  in seconds) under the benchmark's own cell. These do not depend on the HABS
  model and are untouched. The 10 km and half start new, empty cells.
- **One composite row per save, holding the SCORE**, under
  `overall:<pathway>:v2`. Every v2 HABS score was computed with the old model, so
  it is a different number from a v3 one. **Nothing was rewritten or deleted.**
  New saves on the lift / hybrid brands go to `overall:<pathway>:v3`; nothing
  reads v2 any more. The overall percentile therefore starts again from an empty
  cell and shows nothing until a (sex, age-band) cell holds enough trusted v3
  submissions (30 by default). Operator's composite stays on v2.
- Saved entries (`benchmark_entries`) hold raw inputs and are re-scored live —
  a returning athlete's saved numbers simply show the new score.

Re-scoring the v2 composites is not reliable: a pool row has no submission id
(only `user_id` and `created_at`), and lift rows hold the estimated 1RM, not
weight × reps, so a multi-rep power clean cannot be re-estimated with the app's
Olympic divisor. Owner question Q2.

## 7. Questions for the owner

**Q1 — Should the site fill in predicted race times, as the app does?**
*What it is:* in the app, an athlete who has logged a 5 km but no 10 km gets a
**predicted** 10 km (and mile) filled in, and HABS scores it; the site scores
only what is typed, so the running-distance component stays "untested" and is
left out. *Why ask:* scoring a prediction is a product decision, and the site's
copy promises a score of the numbers you enter. *What each answer changes:*
**yes** — port the app's predictor (its race predictor is ~930 lines, plus the
modality Riegel and the 4.1× range rule) and the site's number matches the app's
for the same typed results; measured here, 170 of 708 synthetic athletes' app
scores move by more than 0.5 when predictions fill in (up to 18.5 points).
**No** — the site stays "the HABS score of what you entered". Reversible either
way. *Recommendation:* yes, as its own change, if the aim is one number in both
places; *default if unanswered:* no change.

**Q2 — What to do with the old composite scores in the pool (`overall:*:v2`).**
*What it is:* rows that nothing reads any more, holding scores from the old model (§6).
*Options:* leave them (nothing reads them), or delete them. Rescoring is not
reliable. *What it changes:* nothing a user sees either way — the overall
percentile restarts from empty on v3 regardless. *Recommendation and default:*
leave them.

**Q3 — The standards outside the HABS score (front squat, snatch, clean & jerk,
500 m row, broad jump, the gymnastics rows, plank).** *What it is:* they no
longer count toward the score; the calculator still lists them, last, each with
its own tier, and they still feed the Capacity Index and their SEO pages.
*Alternative:* take them out of the calculator. *Recommendation and default:*
keep them as they are now.

**Q4 — The Capacity Index still predicts WOD results from the site's old
8-component scores.** *What it is:* the WOD prediction needs gymnastics, Olympic
and core scores, which HABS does not have. *Alternative:* re-express its
quality-mix vectors in HABS components (and lose those three). *Recommendation
and default:* leave it.

## 8. What was NOT checked

- **No browser.** The project forbids a dev server or preview, so the new
  grid section, the 7-axis radar, the dashboard and the share-card image were
  **not seen** rendered. What rests on measurement: static HTML from
  react-dom/server for the grid and dashboard (`habs-ui.test.ts`) and the built
  SEO pages' text. `src/ui/App.tsx`'s wiring is covered by `tsc` only — App is
  never rendered in a test.
- **The app's input layer was not compared**, only reported: logged e1RMs and
  runs beating typed values, the six-month "current" window, and predicted
  equivalents (D18–D20). The check feeds both engines the same typed values.
- **The live database was not touched or read.** How many v2 rows exist is
  unknown. Noticed in passing, not verified live: the migrations here allow
  `brand` only `'lift'` or `'operator'` on `benchmark_submissions`,
  `benchmark_profiles` and `benchmark_entries`, while the hybrid brand writes
  `'hybrid'` — if the live table matches the migration, hybrid saves and pool
  submissions are rejected (and `submitToPool` does not check for an error).
  Pre-existing; not changed.
- **The app-sync change** (skip `predicted: true`) is tested on the mappers
  only, not against a real account.
- **Operator was not aligned.** Noticed: the app's ORS also estimates a
  multi-rep power clean with ÷ 25 and rounds to 0.1 kg (`operational_readiness.ts`
  line 1920); the site's Operator score still uses ÷ 30 unrounded. Out of scope
  (the owner's ask was HABS); recorded, not changed.
- **Inside the site, one inconsistency remains by design:** the snatch and clean
  & jerk's own tier (shown in the grid) now uses the app's Olympic ÷ 25, while
  the Capacity Index and the pool rows still estimate them with ÷ 30.
- **Not changed, pre-existing:** the SEO generator has no Triathlete pathway
  page and names General "Gym-Goer"; the landing copy still calls the curve
  "pass / good / excellent / elite" (the six-tier names are Beginner … Elite);
  the in-app label "Strict Press" (the app says "Overhead Press").
- **Nothing was committed or pushed**, and nothing in tpf-app was edited.
