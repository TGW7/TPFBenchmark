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

## Provenance (honest)

- **Squat / bench / deadlift** — distributions from **OpenPowerlifting** (CC0,
  public domain), adjusted from competition lifters toward a general trained
  population.
- **Runs (mile / 5k)** — **WMA** age-grade + open race norms (CC BY 4.0).
- **Rows, presses, olympic lifts, gymnastics, plank, jump** — coach-curated
  ratios and published normative data.

**Not** copied from proprietary tables (Strength Level, BTWB). No third-party
ToS-restricted data is ingested. Have a lawyer review data rights before any
scraped source is ever added.

## How to change them

The Excel master is the single source of truth:
`config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx`.

- Open it in Excel/Numbers — it's human-readable: one row per benchmark × sex,
  times shown as **mm:ss** (e.g. `30:00`), strength as ×BW, reps/distance plain.
- Edit values there (or in `scripts/seed-standards.mjs` for a reproducible set), then:
  ```bash
  npm run seed        # only if using the script
  npm run codegen     # flow Excel → src/config/generated
  ```
- Never hand-edit `src/config/generated/`. Codegen parses mm:ss / h:mm:ss (and
  Excel's auto-converted time cells) back to seconds automatically.

## Operator (ORS) standards

Two workbooks in `config/standards/`:
- `TPF_ORS_Standards_2026-05-21.xlsx` — the **raw** matrix copied from Dropbox (reference).
- **`TPF_Operator_Standards.xlsx` — the curated, editable MASTER** (edit this one).

The curated master is produced by `scripts/build-operator-standards.mjs` from the
raw matrix:
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
