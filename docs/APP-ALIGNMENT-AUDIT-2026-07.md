# App alignment audit — HABS + ORS (2026-07-16)

Full audit of whether tpf-benchmark's standards match the real product
(tpf-app) they funnel into, requested alongside "tie HABS and ORS to the
app, mirror ORS into benchmark, and make sure changing one changes both."
Read-only on tpf-app throughout (per this project's rules — never write
there without a separate, explicit session).

## Executive summary

| System | Before this audit | After |
|---|---|---|
| **HABS** (Lift pathway weights) | Manually mirrored into tpf-app (`habs_pathways.ts`), currently exact | Re-verified exact — **no changes needed** |
| **ORS** (Operator standards) | Two independently-maintained systems, significantly diverged | **Mirrored**: 12 of 16 app pathways now match tpf-benchmark exactly |
| **Single source of truth** | None — pure copy-paste-and-hope | Built (Supabase-backed), not yet consumed by tpf-app |
| **Recalibration from real data** | Lift only | Now covers Operator too (infra ready; needs pool data + a migration applied) |

## 1. HABS — re-verified, exact match

Compared tpf-app's `habs_pathways.ts` (which explicitly names this repo as
its source of truth) against the current `PATHWAY_WEIGHTS` for all 7
pathways × 8 components, including the HYROX rebalance from the July 2026
standards audit. **Every value matches exactly.** No drift, no action
needed — the manual-mirror convention has held up so far, but see §4 for why
that's fragile.

> **2026-10-03 addendum.** "Every value matches exactly" has been kept true
> by hand since this audit: the Lift pins in `src/test/pathway-standards.test.ts`
> are typed literals, so they catch a change here but never the app moving.
> On 2026-10-03 the app's plan 61 moved the HYROX ladders and three HABS base
> cells (women's overhead press Beginner 20 → 25 kg; women's 20 / 40 km bike
> Beginner 50:00 → 49:30 and 1:43:30 → 1:42:30); the list of values handed to
> this repository named only the HYROX ones. `npm run check:app-lift -- <path
> to tpf-app>` (`scripts/check-lift-vs-app.mjs`, new) now reads the app's live
> Benchmarks catalogue, HABS base table and pathway-override rows and diffs
> them against `lift.data.json`: against the unchanged data it reported 5
> differences (those five ladders); after
> `scripts/apply-standards-research-2026-10-03.py`, 0 across 4 WODs, 14 base
> keys and 68 app pathway rows.
>
> ⚠ **The pathway WEIGHTS this section audited no longer match, and that
> check does not cover them.** An ad hoc comparison on 2026-10-03 (the app's
> live `HABS_PATHWAY_WEIGHTS` from `src/lib/habs_pathways.ts` against
> `lift.data.json`'s `weights`) found every pathway different, and not by
> value: the app's HABS now scores other components — `upper_push` /
> `upper_pull` where this site has `upper_strength`, `run_intensity` /
> `run_distance` where it has `running`, `erg` where it has `erg_engine`, and
> no `olympic`, `gymnastics` or `core_endurance` — so the two composite scores
> are no longer the same model. When that diverged was not traced, and nothing
> was changed for it; it needs a decision (re-mirror the app's model here, or
> state that the site's composite is its own), not a value edit.

## 2. ORS — was significantly diverged; now mirrored

### What tpf-app's ORS actually is

`operational_readiness.ts` is a **live, default-on, actively-used feature**
in the app (Operator brand, shown in the dashboard and its own tab) — not
dormant code. It scores 16 pathways across **10 components** (running,
rucking, swimming, lower_strength, upper_strength, upper_endurance,
core_endurance, stability, grip, power) — all 10 of which, reassuringly,
already existed in tpf-benchmark's engine (`ComponentId` type) and were
already wired into the current Operator config. No engine changes were
needed — this was a pure data-content exercise.

**Source-of-truth reality check:** the code's own header comment claims an
Excel workbook is authoritative ("`TPF_ORS_Standards_2026-05-11.xlsx`...
codegen produces the object below"). That workbook doesn't exist in the
tpf-app repo, and the app owner's own internal audit
(`docs/PHASE70_AUDIT_REPORT.md`) found the Dropbox copy stale and
partially empty, concluding **"the live engine is correct... code
authoritative."** This audit treated `operational_readiness.ts` as the
real source, per that finding.

### The diff (12 pathways with a clear name correspondence)

| App pathway | tpf-benchmark unit | Result |
|---|---|---|
| `us_infantry` | `us_infantry` | Already 100% identical |
| `uk_infantry` | `uk_infantry` | Already 100% identical (bar a label suffix) |
| `usmc`, `police`, `swat` | `us_marine_corps_pft_cft`, `us_police_pft`, `us_swat` | **Weights differed substantially**, not just numbers |
| `royal_marines` | `uk_royal_marines_cdo_course` | **Structural**: app tests a 10-mile ruck + 500m swim; benchmark had a 30-mile ruck and no swim |
| the other 7 | 1:1 name match | Numeric drift on most strength/skill values (small-to-moderate, e.g. squat pass 100 vs 80 kg for Para Reg) |

All 12 pathways' weights, benchmarks and tier thresholds have been
**replaced to match the app exactly**, via
`config/standards/TPF_Operator_Standards.xlsx` → `npm run codegen`. Notably:
**US Police PFT went from 4 scored benchmarks to 13** (squat, deadlift,
hex-bar, bench, pull-ups, plank, side-plank, dead-hang, power clean, broad
jump were simply absent before) — this was the single biggest completeness
gap. 137/137 tests pass (2 new), build clean, verified programmatically
(zero remaining diffs between the two datasets for these 12 pathways).

### Pathways left as an open decision (not mirrored)

**In the app but not in tpf-benchmark:** `us_army`, `uk_army`, `tactical`
(generic baseline standards), `firefighter` (a genuinely new occupation).

**In tpf-benchmark but not in the app:** `us_army_ranger_rasp_entry`,
`uk_police_jrft`, `uk_aru_sco19`.

I did **not** unilaterally resolve this. tpf-benchmark's curated Operator
set was deliberately narrowed in an earlier session — the build script's own
header says *"drop the generic 'general army' US Army + UK Army, plus
Tactical/Police PT/SWAT-Tactical-Team"* — a real prior curation decision by
you/the PTI. Re-adding the app's generic pathways would reverse that
decision; I'm not doing that without you confirming it's still what you
want. **Recommendation:** leave the generic units dropped (the curation
rationale still holds); consider adding **Firefighter** as a new pathway
next time you touch Operator standards, since it's a specific real
occupation with a rich, well-reasoned benchmark set in the app, not a
generic catch-all.

> **2026-10-02 addendum.** The app has since added `navy` and `air_force`,
> both first scored on its US Army baseline (so, like `us_army`, generic and
> not mirrored). On 2026-10-02 the app moved `navy` onto the US Navy PRT's own
> table (tpf-app `docs/build/51_STANDARDS_REBUILD_2026-10-02.md` §11), and it
> is now mirrored here as `us_navy_prt` — 13 mirrored units. `air_force` stays
> on the Army baseline and is still not mirrored. The comparison is now
> scripted: `npm run check:app-ors -- <path to tpf-app>` (see
> `docs/STANDARDS.md`, "Operator (ORS) standards").
>
> **Later on 2026-10-02** the app's plan 54 moved 28 more Elites (USMC
> push-ups and plank, the Navy plank, and every unit's deadlift Elite over
> 200 kg); mirrored by `scripts/apply-military-top-tiers-2026-10-02.py`, and
> `check:app-ors` reports 0 differences across the 13 mirrored units.
>
> **2026-10-03** the app's plan 55 (tpf-app
> `docs/build/55_SPECIAL_FORCES_AND_ELITE_UNIT_TIERS.md` §10.2) moved 28 values
> on the special-forces and elite units (SEAL, Pararescue, SFAS, UKSF, Para Reg,
> US Airborne: strength and endurance tops, runs, the UKSF ruck, the Fan Dance's
> load and Pass) and relabelled four rows with their test conditions; and the
> owner's "even it out" moved every unit's deadlift Excellent to (Good + Elite) / 2
> (25 rows here). Mirrored as changesets 2 and 3 of the same script — renamed rows
> keep their ids — and `check:app-ors`, which now also compares labels and the
> zero-weight rows the site holds, reports 0 differences across the 13 mirrored
> units. The Benchmarks-only rows of that plan have no counterpart here.
>
> **2026-10-03, later** the app's plan 55 §11.1 re-set the Fan Dance's faster
> tiers for the selection load (the owner: "adjust times then") — Good 3:55:00,
> Excellent 3:40:00, Elite 3:30:00, Pass still 4:10:00. Mirrored as changeset 4
> of the same script; `check:app-ors` reports 0 differences across the 13
> mirrored units. The same day's job-role strength battery (§11.2) is
> Benchmarks-only and has no counterpart here.
>
> **2026-10-03, last** the app's plan 61 (tpf-app
> `docs/build/61_MISSING_STANDARDS_RESEARCH_2026-10-03.md` §8.2 / §8.6)
> researched the missing tactical standards: Pararescue on the IFT worksheet
> (run, swim, push-ups and sit-ups Pass; the swim and pull-ups relabelled, ids
> kept), one flat broad-jump ladder per group (general units 1.70 / 1.95 / 2.20
> / 2.40, special forces 1.93 / 2.16 / 2.39 / 2.65), the police plank onto the
> operator plank and the USMC plank Pass 1:03 → 1:10 — 27 values on the units
> mirrored here — plus a stated basis (`cite`) on every operator-plank,
> dead-hang and broad-jump row. Mirrored by
> `scripts/apply-standards-research-2026-10-03.py`; the workbook gained a
> `cite` column holding the app's cites verbatim (34 rows), and
> `check:app-ors`, which now compares those too, reports 0 differences across
> the 13 mirrored units. The app's firefighter plank and us_army / air_force /
> uk_army broad jumps moved as well; those units are still not mirrored.

### Known data-quality issues inherited from the app (flagging, not silently fixing)

Because the app is being treated as authoritative, mirroring means these
came along too. Both predate this audit and are **already live in
production on the app today** — mirroring didn't introduce them, but you
should know they're now in both places:

- **USMC's running benchmark is labeled "3-mile run" but its underlying
  event key actually pulls the 5k distance** — no acknowledgment comment in
  the app's own source (unlike similar issues elsewhere that got fixed in a
  documented "2026-05-25 audit" pass). This one looks like it was missed.
- **UK Infantry's ruck is labeled "8-mile loaded march (25 kg)" but the
  underlying event is actually the 8 km distance** (~38% short of 8 miles)
  — the app's own comment calls this a deliberate "closest available,
  don't inflate" compromise, not an oversight.

Neither is something I fixed by substituting my own numbers — that would
mean tpf-benchmark no longer matches the app, defeating the point of this
exercise. **Recommendation:** if you want these corrected, they need to be
fixed in `tpf-app` first (a separate, explicit session for that repo), and
then re-mirrored here — not patched one-sided.

## 3. Single source of truth — infrastructure built, not yet closed-loop

Built entirely within tpf-benchmark (the app repo is off-limits to write
without a separate explicit go-ahead):

- **Migration `0003_published_standards.sql`** — a `benchmark_published_standards`
  table in the Supabase project both repos already share. One row per brand,
  holding the full codegen'd config as JSON. Public read, service-role write.
- **`npm run publish-standards`** — pushes the current `lift.data.json` /
  `operator.data.json` to that table.
- **`docs/SHARED-STANDARDS.md`** — the exact, small change tpf-app would
  need to make to read from this table instead of its two hardcoded mirror
  files, so a future publish updates both apps in one step.

**This isn't fully closed yet** — two things are still needed:
1. **Apply migration 0003** (paste into the Supabase SQL editor — no
   service-role key was available in this session to run it directly, same
   manual step as every prior migration in this project).
2. **A separate session, explicitly scoped to touching `tpf-app`**, to wire
   its two config files to read from the table instead of hardcoding a
   copy. Until that happens, "changing one changes both" is *possible* but
   not yet *automatic* — today, publishing updates the shared table, but
   the app doesn't read from it yet.

## 4. Recalibration from real data — extended to cover Operator

The existing Lift recalibration job (`npm run recalibrate`) already existed;
this audit extended it to Operator:

- **Migration `0004_submission_pathway.sql`** — adds a `pathway_id` column to
  pool submissions. This was a genuine gap, not just missing code: Operator
  tiers are **per-unit** (the same benchmark id, e.g. `back_squat`, has
  different correct thresholds for USMC vs SEAL), unlike Lift where a
  benchmark's tiers are pathway-independent. Without tagging which unit a
  submission was scored under, pooling two units' data under one id would
  silently blend two different standards together.
- **`src/data/pool.ts`** now tags Operator submissions with their pathway;
  Lift/Hybrid rows stay untagged (correct — their tiers don't vary by
  pathway).
- **`npm run recalibrate:operator`** — sibling script, unisex (pools M+F
  together, matching ORS's own model), grouped by (unit, benchmark), same
  propose-only / never-auto-overwrite discipline as the Lift job.

Both recalibration jobs need real submission volume to produce anything —
they're wired and will start surfacing proposals as the pool grows, per
each cell's `MIN_TRUST_N = 30` threshold. Same as before, this is the
mechanism that eventually makes "does the app's/benchmark's standard match
reality" a data question, not just a code-review question.

## 5. Suggestions / recommendations table

| # | Recommendation | Why | Effort |
|---|---|---|---|
| 1 | **Apply migrations 0003 + 0004** in the Supabase SQL editor | Both are written, tested against the schema, but not yet live | Small — paste + run |
| 2 | **Run `npm run publish-standards`** once 0003 is applied | Gets the shared table populated with current HABS + ORS | Small — needs `SUPABASE_SERVICE_ROLE_KEY` |
| 3 | **Separate session: wire tpf-app to read from `benchmark_published_standards`** | Closes the loop so "changing one changes both" is automatic, not just possible | Medium — touches the app repo, needs your explicit go-ahead per project rules |
| 4 | **Fix USMC's 3-mile/5k mislabeling and UK Infantry's 8-mile/8km approximation in tpf-app**, then re-mirror | Both are known-compromised in the app itself; fixing tpf-benchmark alone would break the mirror | Small in isolation, but app-repo-only |
| 5 | **Decide on the 4 app-only generic pathways** (`us_army`, `uk_army`, `tactical`) and **Firefighter** | Respects the prior deliberate curation decision to drop generics; Firefighter is a real, well-specified addition worth considering | Product decision, not code |
| 6 | **Let the two recalibration jobs run for a while**, then review their proposals | This is the actual long-term fix for standards drift — data-driven, not two teams manually agreeing | Ongoing, no action now |

## Verification

- 137/137 tests pass (5 new: brand-aware Operator lift mapping already
  covered by the earlier appSync work, plus pool-submission pathway tagging).
- Production build clean; 43 SEO pages regenerate.
- ORS mirror verified programmatically: zero remaining diffs across all 12
  reconciled pathways (weights + every benchmark's 4 tiers), confirmed by a
  script comparing the regenerated `operator.generated.ts` output directly
  against the transcribed app source.
- HABS re-verified: exact match, all 7 pathways × 8 components.
