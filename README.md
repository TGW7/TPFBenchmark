# HRS — Hybrid Readiness Score

A fitness-benchmarking engine + app for CrossFit and hybrid athletes. A single
**0–100 readiness score** (elite is a hard ceiling — no bonus above it since
2026-07-11, as in the TPF app) that grades an
athlete against a **pathway-specific** set of benchmarks, plus a WOD layer and a
signature **Capacity Index** diagnostic alongside it.

> **Status: v1 live (Lift and Operator).** Engine, scoring, UI and accounts
> (Supabase + two-way app sync) are complete and tested. **Lift scores on real
> v1-beta standards**, codegen'd from `config/standards/TPF_HRS_Standards_*.xlsx`
> (see `docs/STANDARDS.md`). **Operator scores on the curated ORS master**,
> `config/standards/TPF_Operator_Standards.xlsx` — **16 units** (10 US, 6 UK;
> 190 benchmark definitions), a unisex, absolute-kg, per-unit model; 13 of the
> units mirror the TPF app's ORS and are checked against it with
> `npm run check:app-ors`. No standards numbers are hardcoded in TS — they all
> flow from the Excel masters via codegen.
>
> *Corrected 2026-10-02: this said "the real ORS matrix (15 unit pathways) … wiring
> it into Operator scoring is the next step". Operator has scored on the curated
> master since 2026-07; the count is 16 since the US Navy (PRT) unit was added on
> 2026-10-02.*

## ORS lineage

HRS is a standalone off-shoot of the **Operational Readiness Score (ORS)** and
mirrors that engine's architecture and naming where it makes sense:

- The **tier curve** (`pass / good / excellent / elite` anchored at
  `50 / 70 / 85 / 100`, with lower-is-better inversion) is reused from ORS. The
  elite bonus it once had was removed on 2026-07-11 (elite is the ceiling).
  The tiers are TPF's own standards, not population percentiles.
- Components, pathways, missing-data re-normalisation and coverage follow ORS.
- The optional **grip** and **rucking** components are ORS carry-overs, shipped
  off by default.

**New vs ORS:**

- A **normalisation resolver** seam (`normalize.ts`) — `resolveThresholds`
  converts stored ×bodyweight / per-sex tiers into absolute, athlete-specific
  thresholds, with an optional WMA-style age-grading hook (off by default).
- A **WOD layer** (`wod.ts`) with explicit Rx / scaled / incomplete scaling.
- The **Capacity Index** (`capacity.ts`) — predicted vs actual WOD performance.

The engine is **pure, framework-agnostic TypeScript** (`src/engine/`) and can be
lifted into another app wholesale.

## The model

```
raw input
  → per-benchmark % on the 50/70/85/100 tier curve (bodyweight- & sex-adjusted)
  → per-component average (only benchmarks the athlete has logged)
  → pathway-weighted, missing-data-normalised overall %
```

- **8 scored components:** running, erg_engine, lower_strength, upper_strength,
  olympic, power, gymnastics, core_endurance (+ optional grip, rucking).
  *(2026-10-03: this is now the **Operator** score's shape, and on the Lift /
  Hybrid brands it feeds only the Capacity Index. The **HABS score** those
  brands show is the TPF app's model — nine components (lower-body strength,
  power, upper-body push, upper-body pull, running intensity, running distance,
  swimming, cycling, rowing / erg), the app's own weights from the workbook's
  `HABS_Weights` sheet, its curve and combination rule, in
  `src/engine/habs.ts`. Front squat, the Olympic lifts, the 500 m row, broad
  jump, the gymnastics rows and plank stay on the site as TPF Benchmark
  standards scored on their own, outside the HABS score.
  `npm run check:app-habs -- <path to tpf-app>` runs the app's own
  `computeHABS` against this engine. See `docs/HABS-ALIGNMENT-2026-10-03.md`.
  Later the same day: a HABS race left empty is filled with the app's
  predicted equivalent, exactly as the app fills it, shown as predicted and
  never saved — `src/engine/racePrediction.ts`, `src/engine/habsPredict.ts`,
  `docs/LEGAL-FIXES-2026-10-03.md` §6.)*
- **7 Lift pathways:** gym_goer, hybrid_athlete, crossfit_generalist, hyrox,
  powerlifter, bodybuilder, triathlete (the Hybrid brand shows a subset);
  Operator scores per unit. Each pathway's component weights **must sum to
  100** (enforced in tests). *(Corrected 2026-10-02 — this listed four
  pathways, crossfit_generalist, hyrox, strength_lean and endurance_lean.)*
- **Missing data is never penalised:** untested components are dropped and the
  remaining pathway weights re-normalised. `coverage` reports the fraction of the
  pathway's weight actually tested.
- **WODs and the Capacity Index sit *alongside* the score, never inside it.**
  `WOD_CORE_WEIGHT = 0` in v1 (a config value, so a small capped weight can be
  enabled later).

## The codegen-from-Excel boundary — read this before editing `/config`

The **single source of truth** for every standard is the curated Excel workbook:

```
config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx
```

`scripts/codegen.mjs` reads it and generates `src/config/generated/standards.generated.ts`
(and `src/config/README.md`). The hand-authored `src/config/{benchmarks,pathways,wods}.ts`
adapt that generated data into the engine-facing constants — **structure only,
no numbers**.

- **Never hand-edit standards values in TypeScript.** Edit the workbook and run
  `npm run codegen` (it also runs automatically on `predev` / `prebuild`).
- Empty cells become `null`; the engine skips null benchmarks/components.
- Override the workbook path with the `HRS_STANDARDS_XLSX` env var.

The Excel sheets: `Benchmarks_Sourcing` (populated — sources, licences, units,
direction, normalisation), `Standards` / `Weights` / `WOD_Standards` /
`Quality_Mix` (scaffolded, blank = TODO). *2026-10-03:* `HABS_Weights` (the
TPF app's literal HABS weights — these weight the HABS score) and a
`habs_component` column on `Benchmarks_Sourcing` (which HABS component a
benchmark feeds; blank = outside the HABS score); written by
`scripts/apply-habs-alignment-2026-10-03.py`.

## Repo structure

```
config/standards/      the Excel master (codegen input)
scripts/codegen.mjs    Excel → TypeScript config generator
src/
  engine/              pure, framework-agnostic scoring engine
    types.ts           Sex, ComponentId, ThresholdSet, BenchmarkDef, …
    tier-curve.ts      scoreToPercentage (anchors, bonus, inversion)
    normalize.ts       resolveThresholds (bw/sex/age), calc1RMVal stub
    score.ts           scoreBenchmark/Component, computeHRS (renorm + coverage)
    habs.ts            computeHabs — the TPF app's HABS score, ported (2026-10-03)
    racePrediction.ts  the app's predicted race equivalents (VDOT / Riegel, 4.1×), ported
    habsPredict.ts     HABS inputs with those predictions filled in (never saved)
    wod.ts             scoreWod + scaling rules, WOD_CORE_WEIGHT
    capacity.ts        predictWodPercent, computeCapacityIndex
    weakness.ts        rank components, flag limiters & coverage gaps
  config/              engine-facing standards catalogue (from codegen)
    generated/         AUTO-GENERATED — do not hand-edit
  data/                stores, Supabase remote + app sync, the pool, the Save
                       sequence (save.ts), and the sample athlete's SYNTHETIC
                       inputs (demo.ts)
  content/             landing copy, and legalCopy.ts — every word shown where
                       the site collects something (drafts for counsel)
  ui/                  React UI (Vite) — dashboard, radar, entry, WOD log
    theme.css          the ONLY place colour hex lives (4 TPF tokens)
  test/                Vitest: engine tests on synthetic thresholds, plus
                       lockstep pins on the real generated standards
```

## Develop

```bash
npm install
npm run codegen   # regenerate /config from the Excel master
npm run dev       # Vite dev server (runs codegen first)
npm run build     # codegen + tsc --noEmit + vite build
npm test          # Vitest
```

## Preview — double-click `HRS.app`

For a no-terminal preview, double-click **`HRS.app`** in the project root. It opens
a Terminal window, installs dependencies on first run, starts the dev server, and
opens the app in your default browser. Close that Terminal window (or press
`Ctrl-C`) to stop the preview.

- It's a tiny local AppleScript launcher (no Electron, no bundled runtime) and
  uses your installed Node, so it isn't quarantined — Gatekeeper won't block it.
- The repo path is baked in, so the `.app` works even if you move it to
  `/Applications` or the Dock. If you ever **move the repo**, rebuild it:

  ```bash
  bash scripts/build-app.sh
  ```

`HRS.app` is git-ignored (a regenerable build artifact); `scripts/launch.command`
and `scripts/hrs-launcher.applescript` are the committed sources.

## Brand colours

The four-colour TPF palette (off-white, black, OD-green, red) lives once in
`src/ui/theme.css` as CSS custom properties; everything else derives from them
via `color-mix()`. **The hex values are placeholders — confirm against brand
before launch.** OD-green is primary/positive; red is reserved for weaknesses,
alerts and negative Capacity Index.

## What's deliberately NOT done

- ~~No real thresholds, weights, standards or quality-mix numbers (the whole
  point — they arrive from the workbook).~~ *Superseded: real v1-beta standards
  now arrive from the workbooks for Lift and Operator (see Status).*
- WODs / Capacity Index are not folded into the core HRS in v1.
- ~~No persistence/auth/backend — `src/data` is an in-memory holding pen.~~
  *Superseded: Supabase accounts, the percentile pool and two-way app sync are
  built (`src/data/remote.ts`, `src/data/appSync.ts`).*
