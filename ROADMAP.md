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
- [x] **Programmatic SEO pages** — 42 static, crawlable pages (per lift benchmark,
      pathway, and operator unit) + index pages + full sitemap, generated at build
      (`scripts/build-seo.mjs`, postbuild). Tier tables + meta/OG/canonical + CTA.

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
- [x] Real expert weights for the 5 police/armed-response units (replaced even-split)
- [x] SEAL swim corrected to 500 yd; olive accent + operator landing copy confirmed
- [ ] Review the flagged `inferred` operator strength tiers (your PTI call)
- [ ] Operator accent/theme + operator events (load carriage, work-capacity)

## Phase 4 — Data flywheel 🟢 BUILT (lights up as data arrives)

Turn user submissions into trustworthy, self-correcting percentiles.

- [x] Robust outlier stats (median/MAD, winsorize, weightedQuantile) — `src/engine/stats.ts`, tested
- [x] Trust-weighted percentile — SQL `benchmark_percentile()` + `stats.ts` mirror
- [x] Contribute-to-pool flow (consent + `buildPoolSubmissions`, incl. composite overall row)
- [x] **Live data-driven overall percentile** in the dashboard (`fetchPercentile`),
      falls back to the tier estimate until a (sex, age-band) cell has enough trusted data
- [x] **Tier recalibration job** (`npm run recalibrate`) — proposes new pass/good/excellent/elite
      from trust-weighted, winsorised pool quantiles → review diff (`recalibration-proposal.md`)
- [ ] Per-benchmark live percentiles in the radar (currently overall only)
- [ ] Verification flow for high-percentile claims (gate `needsVerification` exists; UI TODO)
- [ ] Operator (per-unit, unisex) recalibration grouping; `--apply` write-back to the workbook

## Phase 5 — Ship 🟡 CONFIG READY

- [x] `vercel.json` (SPA fallback + asset cache)
- [x] Vercel Analytics wired (privacy-friendly, cookieless)
- [x] `DEPLOY.md` — DNS, env vars, two-projects split
- [x] Vendor code-split (main app chunk ~98 kB, was 504 kB) + social/SEO assets
- [ ] Create the Vercel project + add both domains (the click)
- [ ] Apply migrations + set Supabase env vars
- [ ] `.co.uk` brand-protection redirect (if extended here)

## Phase 6 — Funnel & virality 🟢 BUILT

Turn the calculator into a growth loop: measure it, make it shareable, lower
friction, build the list, and deepen the SEO surface.

- [x] **Personalized app-bridge** — names your weakest link and routes into the app
- [x] **Funnel analytics** (`src/lib/analytics.ts`) — privacy-friendly Vercel events:
      pathway picked, units changed, result shared, get-app click, email captured
- [x] **Shareable result card** (`src/ui/shareImage.ts`) — on-brand 1080² PNG via the
      native share sheet (mobile) or download (desktop) — the word-of-mouth unit
- [x] **Imperial / metric toggle** (`src/lib/units.ts`) — lb↔kg at the input edges
      (bodyweight + lifts), persisted to localStorage; engine stays in kg
- [x] **Email capture** (`src/ui/EmailCapture.tsx` + `benchmark_emails`) — honest
      updates list, anon-write RLS, only shown when Supabase is configured
- [x] **"vs N athletes"** beside the live percentile (`benchmark_pool_count()`
      SECURITY DEFINER function)
- [x] **Richer SEO pages** — FAQ + "how to improve" + FAQPage / BreadcrumbList
      JSON-LD on every benchmark, pathway and unit page (`scripts/build-seo.mjs`)
- [ ] Apply `supabase/migrations/0002_emails_and_pool_count.sql` to the project

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
