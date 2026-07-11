# HRS — Hybrid Readiness Score (Claude Code notes)

Auto-loaded each session. Keep concise; full context in `README.md`.

## What this is

A standalone benchmarking engine + app for CrossFit / hybrid athletes — an
off-shoot of the **Operational Readiness Score (ORS)**. Pure TypeScript engine
(`src/engine`) + React/Vite UI (`src/ui`) + Vitest. See `README.md`.

## The one rule that bites

**Never hand-edit standards numbers in TypeScript.** Thresholds, pathway weights,
WOD tiers and quality-mix vectors are the **single source of truth in the Excel
master** (`config/standards/*.xlsx`) and flow into `src/config/generated/` via
`npm run codegen`. To change a standard: edit the workbook, run codegen. Files in
`src/config/generated/` are AUTO-GENERATED.

Empty workbook cells are `null` (TODO); the engine skips null
benchmarks/components and re-normalises. The app must keep building and testing
green against the mostly-empty master.

## Invariants (tests enforce)

- Pathway weights sum to **100** once populated (`validatePathwayWeights`).
- Tier curve anchors: `pass/good/excellent/elite = 50/70/85/100`; elite is a
  HARD ceiling (no bonus tier — unified with the app's Phase 107 HABS model);
  lower-is-better inverts.
- **WODs and the Capacity Index are never folded into the core HRS** in v1
  (`WOD_CORE_WEIGHT = 0`).
- Engine stays pure / framework-agnostic — no React imports in `src/engine`.

## Colours

Four TPF tokens only (off-white, black, OD-green, red), defined once in
`src/ui/theme.css`; derive everything else via `color-mix()`. Hex values are
**placeholders — confirm with the user before launch.**

## Synthetic data

**Lift** runs on real v1-beta standards (codegen'd from
`config/standards/TPF_HRS_Standards_*.xlsx`); `src/data/demo.ts` now only supplies
the sample athlete's inputs. **Operator** still uses synthetic data
(`src/data/operatorDemo.ts`) until the real ORS workbook
(`config/standards/TPF_ORS_Standards_*.xlsx`) is wired into operator scoring.
Never confuse demo/synthetic data for real standards; real values only ever come
from the Excel masters via codegen.

## Commands

`npm run dev` · `npm run build` · `npm test` · `npm run codegen`
