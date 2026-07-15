# Shared standards — single source of truth (HABS + ORS)

## The problem this solves

Both HABS (Lift pathway weights) and ORS (Operator standards) existed
independently in two places:

- **tpf-benchmark** — this repo. Excel master → codegen → the app you're
  looking at.
- **tpf-app** — the paid product. `src/lib/habs_pathways.ts` and
  `src/lib/operational_readiness.ts`, hardcoded TS constants with a comment
  saying "SOURCE OF TRUTH: tpf-benchmark... update this file in the same
  pass" — a manual, unenforced copy-paste.

As of the 2026-07-16 audit, HABS was still exactly in sync (verified
numerically, all 7 pathways). ORS had drifted significantly — different
numbers on ~10 of 12 comparable pathways, a completely different Royal
Marines ruck event (10-mile in the app vs 30-mile here), and US Police PFT
missing 9 of its 13 benchmarks entirely on this side. tpf-benchmark's ORS
has now been mirrored to match the app (see
`docs/STANDARDS-AUDIT-2026-07.md` for the full diff). But "sync once" doesn't
prevent the next drift — the next time either side changes a number, the
other one goes stale again unless someone remembers the manual step.

## The mechanism

Both repos already share **the same Supabase project**. Migration
`0003_published_standards.sql` adds one table:

```
benchmark_published_standards (brand, payload jsonb, source_commit, published_at)
```

One row per brand (`lift`, `operator`), always the **current** published
config — the full codegen'd JSON (weights + tier thresholds + benchmark
sourcing), not a normalised schema. Public read (it's training-standards
data, not user data); writes are `service_role`-only.

**tpf-benchmark's side (done, this repo):**
1. Edit the Excel master, `npm run codegen`, verify.
2. `npm run publish-standards` — pushes `lift.data.json` +
   `operator.data.json` to the shared table. Needs
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

**tpf-app's side (NOT done — requires a separate session with explicit
permission to touch that repo, per this project's rules):**

Replace the two hardcoded files with a read from the same table:

```ts
// instead of: import { HABS_PATHWAY_WEIGHTS } from './habs_pathways'
const { data } = await supabase
  .from('benchmark_published_standards')
  .select('payload')
  .eq('brand', 'lift') // or 'operator' for ORS
  .single();
const weights = data.payload.weights; // same shape habs_pathways.ts already hand-copies
```

Fetch once at build time (SSG/ISR) or cache client-side — this is config
data that changes rarely, not a live per-request query. Once wired, a single
`npm run publish-standards` after any standards edit updates both apps; no
more manual "update this file in the same pass."

## Payload shape

`payload` is exactly `src/config/generated/lift.data.json` /
`operator.data.json` — see `src/config/README.md` for the full shape
(`sourcing`, `standards`, `weights`, `wodStandards`, `qualityMix`). tpf-app
only needs `weights` (→ `habs_pathways.ts` equivalent) and `standards` +
`sourcing` (→ `operational_readiness.ts` equivalent); the rest (WOD data) is
benchmark-site-only and safe to ignore.

## Status

- [x] Migration written (`supabase/migrations/0003_published_standards.sql`)
- [x] Publish script written (`npm run publish-standards`)
- [x] Health check extended (`npm run check:supabase`)
- [ ] **Migration not yet applied** — paste into the Supabase SQL editor
      (same manual step as 0001/0002; no service-role key was available in
      this session to apply it directly)
- [ ] First publish not yet run (needs the migration applied + a
      `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`)
- [ ] tpf-app not yet wired to read from the table (separate session, app
      repo is off-limits to write without explicit go-ahead)
