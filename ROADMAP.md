# HRS Benchmark — phase plan

The free benchmark calculator that feeds the Take Point Fitness app. Two brands,
two layers, one engine.

- **Lift / general** → `benchmark.takepointfitness.com`
- **Operator / tactical** → `operatorbenchmark.takepointfitness.com`
- Engine, UI and auth are shared; pathways, standards and naming differ per brand.

Marketing strategy: *Engineering as Marketing* (Traction) — a genuinely useful
free tool that ranks for evergreen search, earns word-of-mouth, builds a
proprietary data asset, and funnels into the paid app.

---

## Phase 0 — Engine backbone ✅ DONE

Pure scoring engine, Excel-codegen config, tier curve, pathways, WOD layer,
Capacity Index, weakness analysis, tests. (`src/engine`, `src/config`.)

## Phase 1 — Layer 1: anonymous calculator 🟡 IN PROGRESS

No sign-up. The public hook.

- [x] Pathways: Gym-Goer, Hybrid Athlete, CrossFit Generalist, HYROX, Powerlifter, Bodybuilder
- [x] Calculator **front-and-centre** on the homepage; Browse Standards + "why it works" below
- [x] Brand-aware theme — Lift = **Black / Red / White**, Operator = olive (tactical)
- [x] Strength pathways (Powerlifter / Bodybuilder) drop cardio + show a **per-lift radar**
- [x] Input-first calculator: editable sex/bodyweight/age, session-only entries,
      pathway switch preserves entries, clears on leave
- [x] Estimated percentile + weakness radar + limiters
- [x] Input audit (sanity bounds, consistency, trust) with live feedback
- [x] Licensing-safe WOD names
- [x] **Browse Standards** table (Strength-Level-style view, no input needed)
- [x] StoryBrand landing page (brand-aware) + footer + nav
- [x] Share-your-score (copy result) + brand-aware title/description
- [x] Social cards (OG/Twitter, hero image), robots + sitemap + favicon, no-JS fallback
- [x] Seed real standards into the Excel master (v1 beta) — Lift now scores on
      real tiers via codegen (`scripts/seed-standards.mjs`, `docs/STANDARDS.md`)
- [ ] **Programmatic SEO pages** (real URLs per benchmark / pathway / unit —
      needs client routing or SSG prerender) — biggest remaining growth lever

## Phase 2 — Layer 2: accounts + sync (Supabase) 🟢 LIVE (keys in, migration run)

Sign up → a **TPF account** (shared Supabase project) → data persists and syncs
with the app.

- [x] Supabase client, **env-gated** (no keys ⇒ anonymous-only, app still runs)
- [x] Auth context + sign-in/up/out UI
- [x] Remote persistence layer (profile + entries) and data-pool submission
- [x] DB migration SQL + Row-Level Security (`supabase/migrations/`)
- [x] `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` set (in `.env.local`)
- [x] Migration applied to the TPF Supabase project (verified via `npm run check:supabase`)
- [x] **Two-way app sync wired** to `profiles.orm` / `profiles.race_times`
      (`src/data/appSync.ts`) — pulls on sign-in, pushes on save
- [ ] Targets / goal tracking on the profile
- [ ] Map ruck + olympic lifts (no app equivalent yet) + sync manual reps
      (app keeps those in localStorage, not Supabase)

## Phase 3 — Operator brand (real ORS standards) 🟢 LIVE

Same codebase, tactical framing at `operatorbenchmark.*`, scoring on the real
ORS matrix.

- [x] Brand detection from hostname (`lift` / `operator`) + `data-brand`
- [x] Operator landing copy + brand-aware app URL
- [x] Curated Operator standards master (`config/standards/TPF_Operator_Standards.xlsx`
      — 9 US + 6 UK, strength merged, times disambiguated, blanks filled & flagged)
      via `scripts/build-operator-standards.mjs`; raw matrix kept for reference
- [x] **Operator scoring wired** — `scripts/codegen-operator.mjs` → per-unit
      benchmarks, unisex + absolute, components upper_endurance/stability/swimming,
      brand-aware radar + US/UK-grouped picker (`src/config/operator.ts`)
- [x] Even-split weights auto-filled for the 5 police/SF units lacking source weights (flagged)
- [ ] Review inferred tiers + real weights for the police/armed-response units
- [ ] Operator accent/theme + operator events (load carriage, work-capacity)

## Phase 4 — Data flywheel 🟡 FOUNDATION BUILT

Turn user submissions into trustworthy percentiles.

- [x] Robust outlier stats (median/MAD, winsorize) — `src/engine/stats.ts`, tested
- [x] Trust-weighted percentile — SQL `benchmark_percentile()` + `stats.ts` mirror
- [x] Contribute-to-pool flow (consent + `buildPoolSubmissions`, trust-weighted)
- [ ] Verification flow for high-percentile claims (gate `needsVerification` exists; UI TODO)
- [ ] "Based on N athletes" confidence surfacing; beta→own-population transition

## Phase 5 — Ship 🟡 CONFIG READY

- [x] `vercel.json` (SPA fallback + asset cache)
- [x] Vercel Analytics wired (privacy-friendly, cookieless)
- [x] `DEPLOY.md` — DNS, env vars, two-projects split
- [x] Vendor code-split (main app chunk ~98 kB, was 504 kB) + social/SEO assets
- [ ] Create the Vercel project + add both domains (the click)
- [ ] Apply migrations + set Supabase env vars
- [ ] `.co.uk` brand-protection redirect (if extended here)

---

## Architecture decisions

- **Standalone Vite SPA** (not folded into the Next.js app/marketing site). With
  Supabase, shared auth needs only the **same project URL + anon key** — both
  sites' users live in the same `auth.users`, so a benchmark sign-up is a TPF
  account. No framework rebuild required.
- **Shared Supabase, benchmark-owned tables.** This repo owns `benchmark_*`
  tables + RLS in the TPF project. Syncing 1RMs/times into the app's own tables
  is an explicit, documented contract (`src/data/remote.ts` + this file) so we
  never silently write to app-owned schema.
- **Excel remains the source of truth** for all standards (Phase 0 rule).
