# Standards — what the numbers mean & where they come from

## Status: v1 beta (Lift)

The Lift brand now scores against **real, expert-seeded tiers** (not synthetic
placeholders). They are explicitly **beta** — good enough to be useful, not yet
calibrated to our own population. The UI says so. Operator is still synthetic
until its standards are added.

## What the tiers mean

Every benchmark has four tiers, anchored to the same percentile across domains
so the composite and weakness radar stay coherent:

| Tier | Score | ≈ percentile (trained adults) |
|---|---|---|
| pass | 50% | ~50th |
| good | 70% | ~70th |
| excellent | 85% | ~85th |
| elite | 100% | top 1–2% |

Bodyweight lifts are stored ×bodyweight per sex; times are seconds (lower is
better); reps/distance are absolute per sex.

## Provenance (honest) — rebuilt 2026-10-02

Owner, 2026-10-02: *"Remove any standards taken from places we don't have
permission for and replace them with ones we can use"* — and *"update benchmark
too"*. The TPF app made the change first, the same day (its record is tpf-app
`docs/build/51_STANDARDS_REBUILD_2026-10-02.md`); this repository was brought
into line with it by `scripts/apply-permitted-sources-2026-10-02.py`, which is
the cell-by-cell record of the workbook edit.

**Every tier here is TPF's own standard (owner-set), checked against a permitted
anchor.** Nothing is taken from a source TPF has no permission to use. Licences
below are as each source states itself — **not legal advice**; counsel should
confirm them.

| Benchmarks | Basis | Checked against |
|---|---|---|
| Back squat, deadlift, bench | TPF's own (owner rounds 8, 9, 12) | van den Hoek et al. 2024, J Sci Med Sport 27:734 (CC BY — 809,986 tested raw powerlifting entries, × bodyweight deciles) at 85 kg M / 65 kg F, discounted ~0.80 for a generalist (the CrossFit-to-powerlifter gap measured from Meier, Rabel, Schmidt 2021, Sports 9:80, CC BY) |
| Overhead press, power clean, barbell row | TPF's own | **No openly licensed population norm exists (a gap)** — ratio checks only (Nuzzo 2023; team-sport power clean ÷ squat) |
| Front squat | TPF's own: ~0.82 × TPF's back squat | every tier within 5 kg of the ratio |
| Snatch, clean & jerk | TPF's own, expert-curated | published ratios (snatch ÷ C&J, women ÷ men) and Meier 2021's own CrossFit sample |
| Mile, 5 km | TPF's own (owner round 12) | USATF 2025 road open standards as age-grade % (CC0); US Army Fitness Test 2-mile (2025 tables, a US government work) |
| 2 km row | TPF's own, **rebuilt 2026-10-02** | US Navy PRT 2,000 m row, ages 17–19 (Guide-5, Jan 2025, a US government work) for Beginner–Intermediate; GB Rowing Team 2026 senior trials minimum × 1.07 for Elite; Advanced midway |
| 500 m row | **Derived** from the 2 km row (Riegel 1.06, 1 s steps), per pathway — as the app derives it | — |
| 400 m / 1500 m swim | TPF's own triathlete anchor; 1500 m Riegel-derived | US Navy PRT 500-yd swim (converted, Riegel 1.06) |
| 20 km / 40 km bike | TPF's own triathlete anchor; 40 km Riegel-derived | **no permitted anchor (a gap)** |
| Broad jump, plank, pull-ups, HSPU, T2B, double-unders, muscle-ups | TPF's own, expert-set | **none checked (a gap)** — the AFT / PFRA plank tables could anchor plank |
| Pathway overrides | TPF's own (owner-set) | CrossFit: Meier 2021; runs: USATF age-grade %; rows: Navy PRT; HYROX / bodybuilder lifts: van den Hoek discounted; powerlifter: van den Hoek **undiscounted** (its own population) |
| Fran, Grace, Helen | TPF's own, expert-set | Meier 2021 — **the study's own sample only, never the third-party percentiles printed beside it** |
| Diane, Cindy, Fight Gone Bad | TPF's own, expert-set | **no openly licensed study exists (a gap)** |
| HYROX race | Elite = Rappelt et al. 2026 (Front Physiol, CC BY) season-7 ELITE-division median × 1.187; lower tiers TPF's own, **provisional** | — |
| Operator units | pass marks from each service's published test where one exists; upper tiers and all strength rows TPF's own | US government works for the US units; UK Crown-copyright status **unconfirmed** |

**Not a source of any standard here:** Strength Level / Running Level, the
Kilgore tables, Concept2 rankings or logbook percentiles, Beyond the Whiteboard
or any WOD-logging / WOD-score site, HYROX results (including third-party
analyses of them), Ironman results, parkrun, RunRepeat, the Cooper Institute.
The July 2026 audit (`docs/STANDARDS-AUDIT-2026-07.md`) used several of these
as validation references; none of them is now the basis of a tier.

**Corrected 2026-10-02.** This section used to say the squat / bench / deadlift
tiers were *"distributions from OpenPowerlifting (CC0, public domain)"* and the
runs *"WMA age-grade + open race norms (CC BY 4.0)"*, while the workbook's own
source columns said *"StrengthLevel + Kilgore 2023"*, *"runninglevel /
RunRepeat"* and *"Concept2 rankings"*, and the generated data labelled the lift
rows *"CC0 / public domain"*. None of those was right: the numbers are TPF's own
(owner-set), and the workbook, generated data and this file now say so.

### What moved on 2026-10-02 (every other tier is unchanged)

Times m:ss (h:mm:ss for HYROX); "exc" is the vestigial legacy tier (never
scored or shown on a six-tier row) and moves only to stay between its
neighbours.

| Benchmark | Sex | Beginner | Novice | Experienced | Intermediate | Advanced | Elite | exc |
|---|---|---|---|---|---|---|---|---|
| 2 km row (base) | M | 9:15 → **9:20** | 8:25 → **8:30** | 7:40 | 7:05 → **7:00** | 6:45 | 6:30 | 6:50 |
| 2 km row (base) | F | 10:40 | 9:40 | 8:45 → **8:40** | 8:05 → **8:00** | 7:35 → **7:45** | 7:15 → **7:30** | 7:45 → **7:50** |
| 500 m row (base) | M | 1:50 → **2:09** | 1:45 → **1:57** | 1:40 → **1:46** | 1:35 → **1:37** | 1:30 → **1:33** | 1:25 → **1:30** | 1:33 → **1:35** |
| 500 m row (base) | F | 2:05 → **2:27** | 2:00 → **2:13** | 1:55 → **2:00** | 1:50 | 1:45 → **1:47** | 1:42 → **1:44** | 1:47 → **1:49** |
| 500 m row, Gym-Goer (new override) | M | 1:50 → **2:13** | 1:45 → **2:02** | 1:40 → **1:52** | 1:35 → **1:42** | 1:30 → **1:37** | 1:25 → **1:33** | — |
| 500 m row, Gym-Goer (new override) | F | 2:05 → **2:32** | 2:00 → **2:19** | 1:55 → **2:07** | 1:50 → **1:56** | 1:45 → **1:49** | 1:42 → **1:46** | — |
| 500 m row, CrossFit (new override) | M | 1:50 → **2:05** | 1:45 → **1:54** | 1:40 → **1:44** | 1:35 | 1:30 → **1:31** | 1:25 → **1:27** | — |
| 500 m row, CrossFit (new override) | F | 2:05 → **2:23** | 2:00 → **2:10** | 1:55 → **2:00** | 1:50 → **1:52** | 1:45 | 1:42 → **1:41** | — |
| HYROX race | F | 1:50:00 → **1:44:30** | 1:45:00 → **1:39:30** | 1:40:00 → **1:35:00** | 1:32:40 → **1:28:00** | 1:25:40 → **1:21:30** | 1:19:00 → **1:15:00** | 1:29:00 → **1:24:30** |
| Barbell row, HYROX (kg) | M | 55 → **45** | 65 → **55** | 80 → **70** | 95 → **85** | 115 → **95** | 130 → **110** | — |
| Barbell row, HYROX (kg) | F | 30 | 40 | 50 → **45** | 60 → **55** | 70 → **65** | 78 → **72** | — |
| Barbell row, Triathlete (kg) | M | 55 → **40** | 65 → **50** | 80 → **60** | 95 → **70** | 115 → **85** | 130 → **95** | — |
| Barbell row, Triathlete (kg) | F | 30 → **25** | 40 | 50 → **45** | 60 → **55** | 70 → **60** | 78 → **70** | — |
| Barbell row, Powerlifter (kg) | M | 55 → **80** | 65 → **95** | 80 → **115** | 95 → **135** | 115 → **150** | 130 → **170** | — |
| Barbell row, Powerlifter (kg) | F | 30 → **45** | 40 → **55** | 50 → **65** | 60 → **75** | 70 → **90** | 78 → **105** | — |
| Barbell row, Bodybuilder (kg) | M | 55 | 65 | 80 → **95** | 95 → **115** | 115 → **130** | 130 → **150** | — |
| Barbell row, Bodybuilder (kg) | F | 30 | 40 | 50 | 60 | 70 | 78 → **82** | — |

The barbell-row rows are a **pre-existing drift**, not part of the app's
rebuild: the app has carried those four pathway overrides since 2026-07-12 and
this workbook never had them (the lockstep test wrongly pinned them as
"inherits base"). Found by the same day's comparison; the app is canonical.

Operator (unisex, Pass / Good / Excellent / Elite):

| Unit · benchmark | Old | New | Basis |
|---|---|---|---|
| US Police PFT · 1.5-mile run | 12:30 / 11:30 / 10:30 / 9:30 | **13:30 / 10:45 / 9:45 / 8:30** | US Navy PRT 1.5-mile, men 20–24 (the app had stated these three rows as Cooper Institute LE PT) |
| US Police PFT · push-ups (1 min) | 30 / 45 / 60 / 75 | 30 / 45 / **57 / 67** | USAF PFRA 1-min chart, men under 25 |
| US Police PFT · sit-ups (1 min) | 30 / 45 / 60 / 75 | **33 / 43 / 51 / 58** | USAF PFRA 1-min chart, men under 25 |
| Navy SEAL · 500 m swim | 12:30 / 10:00 / 9:00 / 8:00 | **13:45 / 11:00 / 9:54 / 8:48** | the PST swim is 500 **yards**; × 1.0995 (Riegel 1.06) to 500 m |
| Royal Marines · 500 m swim | 14:23 / 11:30 / 10:21 / 9:12 | **15:48 / 12:39 / 11:23 / 10:07** | derived: the corrected SEAL swim × 1.15 |

### Gaps — standards with no permitted anchor (TPF's own judgement stands)

HYROX lower tiers (both sexes; Elite only is anchored) · Diane, Cindy, Fight
Gone Bad · overhead press, power clean, barbell row (ratio checks only) · bike
20 / 40 km · broad jump, plank and the gymnastics reps · bodybuilder lifts
(discounted check only) · Operator dead hang, broad jump, planks and the strength
rows · the UK units' tests (Crown copyright status unconfirmed) · US SWAT · the
Pararescue 500 m swim pass (12:00 matches neither published minimum the app
found — left as is, an owner question in the app's record) · Operator has no sex
split anywhere, so a woman is scored on the men's columns (pre-existing).

## How to change them

The Excel master is the single source of truth:
`config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx`.

- Open it in Excel/Numbers — it's human-readable: one row per benchmark × sex,
  times shown as **mm:ss** (e.g. `30:00`), strength as ×BW, reps/distance plain.
- Edit values there, then run codegen. (`scripts/seed-standards.mjs` is the
  retired v1-beta seed and refuses to run on the six-tier workbook; a scripted
  edit is fine, as `scripts/apply-permitted-sources-2026-10-02.py` shows.)
  ```bash
  npm run codegen     # flow Excel → src/config/generated
  ```
- Never hand-edit `src/config/generated/`. Codegen parses mm:ss / h:mm:ss (and
  Excel's auto-converted time cells) back to seconds automatically.

## Operator (ORS) standards

Two workbooks in `config/standards/`:
- `TPF_ORS_Standards_2026-05-21.xlsx` — the **raw** matrix copied from Dropbox (reference).
- **`TPF_Operator_Standards.xlsx` — the curated, editable MASTER** (edit this one).

The curated master was first produced by `scripts/build-operator-standards.mjs`
from the raw matrix, and has been edited directly since (the 2026-07-16 app
mirror and the 2026-10-02 standards rebuild). ⚠ **Do not re-run that script**:
it would overwrite both, and the raw matrix still carries the old police rows
stated as *"Cooper Institute / POST"* and *"FBI / Cooper"* standards, which TPF
has no permission to use. What the script originally did:
- **Curated + split US / UK** (9 US, 6 UK). Removed the generic `US Army` /
  `UK Army`, plus `Tactical (generic)`, `Police PT`, `SWAT / Tactical Team`.
  Navy SEAL kept; US SWAT kept (it borrows the SWAT/Tactical-Team strength matrix).
- **Strength merged in** from the "Strength by pathway" sheet (absolute kg).
- **Times disambiguated** by component (runs/swims/planks = mm:ss; rucks =
  h:mm:ss; Excel-coerced serials fixed).
- **Blanks filled from patterns**, every filled cell flagged in the **`inferred`**
  column — REVIEW THOSE. Heuristics: squat ×1.25/1.5/1.75 off pass; Hex DL ≈
  squat ×1.2; Conventional DL ≈ Hex ÷1.1 (Cholewa 2019); OHP ≈ bench ×0.62;
  sparse run/rep tiers interpolated/extrapolated monotonically.

Model differences from Lift: **unisex** (one standard regardless of sex),
**absolute kg** strength, **per-unit benchmarks** (each unit its own run/ruck
distance + load), and extra components `upper_endurance` / `stability` /
`swimming`.

**Status: LIVE.** `scripts/codegen-operator.mjs` turns the master into per-unit
operator config (`src/config/operator.ts`), and the Operator brand scores on it —
per-unit benchmarks, unisex, absolute, with a brand-aware radar + US/UK-grouped
picker. The 5 police/SF units that had **no source weights** (US Police, US SWAT,
UK Police JRFT, UK ARU, RASP) get an **even split across their tested components**
(auto, flagged) — replace with real weights when you have them. Edit the master →
`npm run codegen` re-flows everything.

> Note: `npm run seed` populated the **repo copy** of the workbook. The original
> in Dropbox is unchanged — treat the repo copy as canonical going forward, or
> copy it back to Dropbox to keep them in sync.

## The plan to make them real

Capture own-user submissions from day one (the percentile pool, audit-tiered and
trust-weighted), then recalibrate each tier to our own population once volume
allows — per `ROADMAP.md` Phase 4. Until a (sex, age-band) cell has enough
trusted data, we show the beta tiers and label them as such.
