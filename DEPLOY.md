# Deploy — HRS Benchmark

Static Vite SPA + Supabase + Vercel Analytics. Two subdomains, one codebase
(brand decided by hostname).

## Vercel projects

This repo is its **own** Vercel project, separate from the app's project.

- `benchmark.takepointfitness.com` → this project (brand resolves to **Lift**)
- `operatorbenchmark.takepointfitness.com` → **same** project, extra domain
  (brand resolves to **Operator** by hostname)

Build settings (Vercel auto-detects Vite):
- Framework preset: **Vite**
- Build command: `npm run build` (runs codegen → tsc → vite build)
- Output directory: `dist`
- `vercel.json` handles SPA fallback + asset cache headers.

## Environment variables (Vercel → Settings → Environment Variables)

| Key | Value | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | the **TPF** Supabase project URL | shared with the app |
| `VITE_SUPABASE_ANON_KEY` | the TPF Supabase anon key | public/anon, safe in client |

Leave them unset to ship anonymous-only (Layer 1 works; accounts/sync off).

## Database

Apply the migration to the TPF Supabase project once:

```bash
supabase db push        # or paste supabase/migrations/0001_benchmark_init.sql
```

It creates `benchmark_profiles`, `benchmark_entries`, `benchmark_submissions`
(+ RLS) and the `benchmark_percentile()` function. It does **not** touch
app-owned tables.

## DNS (Squarespace → point at Vercel)

Add the domain in Vercel first, then create the records it shows. Typical:

| Host | Type | Value |
|---|---|---|
| `benchmark` | CNAME | `cname.vercel-dns.com` |
| `operatorbenchmark` | CNAME | `cname.vercel-dns.com` |

(Use the exact target Vercel displays for your project.) The app subdomains
(`app.*`, `operatorapp.*`) stay pointed at the **app's** Vercel project.

## App sync (Phase 2b — wired)

`src/data/appSync.ts` syncs both ways with the app's JSONB profile columns:
- **Pull** on sign-in — `profiles.orm` + `profiles.race_times` prefill the calculator.
- **Push** on save — mapped 1RMs/times merge back into the app (non-destructive).

Mapped today: Back Squat, Deadlift, Bench Press, Overhead Press, Power Clean;
run mile/5k, row 2k/500m. Not yet mapped (no app equivalent / app-localStorage
only): snatch, clean & jerk, ruck, and manual reps (pull-ups, plank, grip).

## Analytics

`@vercel/analytics` is wired in `main.tsx` (privacy-friendly, cookieless). It
only sends data when deployed on Vercel; it no-ops locally.
