# HRS — Hybrid Readiness Score

A fitness-benchmarking engine + app for CrossFit and hybrid athletes. A single
**0–100 % readiness score** (with a small bonus to a 110 % cap) that grades an
athlete against a **pathway-specific** set of benchmarks, plus a WOD layer and a
signature **Capacity Index** diagnostic alongside it.

> **Status: v1 live (Lift) · Operator standards landed.** Engine, scoring, UI and
> accounts (Supabase + two-way app sync) are complete and tested. **Lift scores on
> real v1-beta standards**, codegen'd from `config/standards/TPF_HRS_Standards_*.xlsx`
> (see `docs/STANDARDS.md`). The real **ORS matrix** (15 unit pathways) is in the
> repo too; wiring it into Operator *scoring* is the next step (it's a unisex,
> absolute-kg, per-unit model). No standards numbers are hardcoded in TS — they all
> flow from the Excel masters via codegen.

## ORS lineage

HRS is a standalone off-shoot of the **Operational Readiness Score (ORS)** and
mirrors that engine's architecture and naming where it makes sense:

- The **tier curve** (`pass / good / excellent / elite` anchored at
  `50 / 70 / 85 / 100 %`, with elite bonus and lower-is-better inversion) is
  reused verbatim from ORS.
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
- **4 pathways:** crossfit_generalist, hyrox, strength_lean, endurance_lean.
  Each pathway's component weights **must sum to 100** (enforced in tests).
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
`Quality_Mix` (scaffolded, blank = TODO).

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
    wod.ts             scoreWod + scaling rules, WOD_CORE_WEIGHT
    capacity.ts        predictWodPercent, computeCapacityIndex
    weakness.ts        rank components, flag limiters & coverage gaps
  config/              engine-facing standards catalogue (from codegen)
    generated/         AUTO-GENERATED — do not hand-edit
  data/                in-memory stores + SYNTHETIC demo dataset
  ui/                  React UI (Vite) — dashboard, radar, entry, WOD log
    theme.css          the ONLY place colour hex lives (4 TPF tokens)
  test/                Vitest unit tests (synthetic thresholds only)
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

- No real thresholds, weights, standards or quality-mix numbers (the whole
  point — they arrive from the workbook).
- WODs / Capacity Index are not folded into the core HRS in v1.
- No persistence/auth/backend — `src/data` is an in-memory holding pen.
