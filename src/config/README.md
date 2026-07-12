# /config — generated from the Excel master

**Do not hand-edit the generated values.** They are produced by
`scripts/codegen.mjs` from the single source of truth:

```
config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx
```

To change any standard, edit that workbook and run:

```bash
npm run codegen
```

(`codegen` also runs automatically on `predev` and `prebuild`.) Override the
workbook location with the `HRS_STANDARDS_XLSX` env var.

## What is generated

`generated/standards.generated.ts` — typed, framework-agnostic data:

| Export | From sheet | State |
|--------|-----------|-------|
| `BENCHMARK_SOURCING` (25) | Benchmarks_Sourcing | populated |
| `STANDARDS_THRESHOLDS` | Standards | thresholds TODO (null) |
| `PATHWAY_STANDARD_OVERRIDES` | Standards_Pathway | per-pathway tier overrides |
| `PATHWAY_WEIGHTS` | Weights | weights TODO (null), each col → 100 |
| `WOD_STANDARDS` (7) | WOD_Standards | thresholds TODO (null) |
| `QUALITY_MIX` | Quality_Mix | vectors TODO (null), rows → 1 |

## The hand-authored shape

`benchmarks.ts`, `pathways.ts`, `wods.ts` import the generated data and adapt it
into the engine-facing constants (`HRS_BENCHMARKS`, `HRS_PATHWAY_CONFIGS`,
`HRS_WODS`). They contain **structure only — no standards numbers**; every real
value flows in from the workbook via codegen. Empty cells stay `null` and the
engine skips them, so the app builds and tests pass against the mostly-empty
master.
