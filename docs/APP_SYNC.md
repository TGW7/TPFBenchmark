# App sync — how the benchmark site talks to the TPF app

The benchmark site and the app **share one Supabase project**, so a benchmark
sign-up is a TPF account. Shared performance data lives as **JSONB on
`public.profiles`** (keyed to `auth.users.id`), not in separate tables:

- `profiles.orm` → `{ "Back Squat": { w: "180", r: "5" }, … }` — weight (kg) × reps, keyed by title-case lift name
- `profiles.race_times` → `{ run: { "5k": { timeSec, updatedAt } }, row: {…}, … }` — seconds, by modality → event

`src/data/appSync.ts` syncs both ways:
- **Pull on sign-in** (`syncFromApp`) — prefills the calculator from the app.
- **Push on save** (`syncToApp`) — merges mapped values back (non-destructive).

## Mapping coverage

| Benchmark id | App target | Synced? |
|---|---|---|
| `back_squat_1rm` | `orm["Back Squat"]` | ✅ |
| `deadlift_1rm` | `orm["Deadlift"]` | ✅ |
| `bench_1rm` | `orm["Bench Press"]` | ✅ |
| `strict_press_1rm` | `orm["Overhead Press"]` | ✅ |
| `power_clean_1rm` | `orm["Power Clean"]` | ✅ |
| `run_1mi` | `race_times.run["mile"]` | ✅ |
| `run_5k` | `race_times.run["5k"]` | ✅ |
| `row_2k` | `race_times.row["2k"]` | ✅ |
| `row_500m` | `race_times.row["500m"]` | ✅ |
| `snatch_1rm` | — | ❌ app has no 1RM field (see below) |
| `clean_jerk_1rm` | — | ❌ app has no 1RM field (see below) |
| `ruck_time` | `race_times.ruck[?]` | ❌ app ruck events are distance-specific; pick a canonical distance first |
| manual reps (pull-ups, plank, grip) | — | ❌ app keeps ORS manual inputs in **localStorage**, not Supabase |
| WODs | — | ❌ benchmark-site-only (app has no WOD store) |

*Corrected 2026-10-02:* the two ❌ rows for `snatch_1rm` / `clean_jerk_1rm`
above are out of date — both have synced since 2026-07-12 (`ORM_TO_APP` in
`src/data/appSync.ts`; the app gained Olympic 1RM slots). The rows are kept, as
written, with this correction; the section "Why snatch & clean-and-jerk don't
sync" below is history for the same reason. This table also never listed the
Operator ids (2026-07-16 audit) — the code comments in `appSync.ts` are the
record for those. One Operator row added 2026-10-02:

| Benchmark id | App target | Synced? |
|---|---|---|
| `500_m_swim` (Navy SEAL, USAF Pararescue, UK Royal Marines) | `race_times.swim["500m"]` | ✅ since 2026-10-02 — the record the app's `swim_500m` reads on all three pathways; every site row is a 500 m time |
| `500_yd_swim_alternate`, `450_m_swim_alternate` (US Navy PRT) | — | ❌ no exact metric event (and the app keeps its Navy swims as manual inputs) |
| `2_km_run_best_effort`, `8_km_ruck`, `5_mile_ruck_30_kg`, `8_mile_loaded_march_25_kg` | `run["2k"]`, `ruck["8k"]`, `ruck["5mi"]`, `ruck["8mi"]` | ❌ **not yet** — the app has an exact event for each (checked 2026-10-02); left for a separate change because the loaded rucks need their load matched |

*2026-10-03 (plan 55, no mapping changed):* the Navy SEAL `1_5_mile_run` row is now
named "1.5-mile run (PST: in boots and trousers)", and the SEAL and Pararescue
`500_m_swim` rows name their strokes. The ids did not change (the workbook's `id`
column pins them), so the sync is as before — and, as in the app, the SEAL run
still reads the ordinary `run["1.5mile"]` record: neither repository records
whether a run was booted yet (the owner asked the app for a "boot run" switch;
not built).

*2026-10-03 (the HABS alignment, `docs/HABS-ALIGNMENT-2026-10-03.md`):* two rows
added, and one rule for the pull.

| Benchmark id | App target | Synced? |
|---|---|---|
| `run_10k` | `race_times.run["10k"]` | ✅ since 2026-10-03 — the app's HABS running-distance component reads it |
| `run_half` | `race_times.run["half"]` | ✅ since 2026-10-03 — likewise |

**A time the app saved as a prediction is no longer pulled.** The app's Race
Times screen can save a predicted time (`predicted: true`). The pull used to
take it as if typed — so the site scored a prediction as a result — and the
next Save wrote it back with `predicted: false`, turning the app's prediction
into a "real" time there. `logsFromAppProfile` now skips `predicted: true`
records (pinned in `src/test/appsync.test.ts`). Adding the 10 km and half,
which the app predicts most often, would otherwise have widened that.

Anything not synced still works on the benchmark site (scored + saved in our own
`benchmark_entries`); it just doesn't appear in the app.

## Why snatch & clean-and-jerk don't sync

Verified in the app repo: the app tracks 1RMs only via `ORM_EX_MAP`
(`src/lib/constants.ts:1277`), which has **no snatch and no clean & jerk**. They
exist only as *workout exercises* (`src/lib/exercises.ts:576` Snatch id 600,
`:581` Clean & Jerk id 605) — programmable in metcons, but not 1RM-tracked. So
there is no `profiles.orm` field to write them to.

## To enable snatch / C&J sync (app-side change — your call)

1. In the **app repo** `src/lib/constants.ts`, add to `ORM_EX_MAP`:

   ```ts
   600: 'Snatch',        // id 600 = "Snatch (Full / Squat Snatch)" in exercises.ts
   605: 'Clean & Jerk',  // id 605 = "Clean & Jerk" in exercises.ts
   ```

   (Optionally add `"Snatch"`, `"Clean & Jerk"` to `DEFAULT_ORM_LIFTS` to show
   them by default.)

2. Then, on the benchmark side, add two lines to `ORM_TO_APP` in
   `src/data/appSync.ts` — using the **exact** names chosen above:

   ```ts
   snatch_1rm: 'Snatch',
   clean_jerk_1rm: 'Clean & Jerk',
   ```

That's the whole change. Names must match byte-for-byte (the orm store is keyed
by name).

## Verify

```bash
npm run check:supabase   # tables + function exist, keys valid
```

## 2026-10-03 — prediction anchors, and saves that report failure

*(docs/LEGAL-FIXES-2026-10-03.md §4 and §6.)*

**The pull now also returns anchors.** `syncFromApp` returns `{ logs, anchors }`.
`anchors` (`anchorsFromAppProfile`) are the athlete's other typed race results
in the app — run / row / bike / swim events the calculator has no field for (a
1 km row, a 2 km run, an 800 m swim …), never a `predicted: true` record, never
an event a calculator field maps to. They are used ONLY to predict missing
HABS races the way the app does (the app predicts from every typed event in a
modality). They are never shown as entries, saved, written back or pooled.

**The push never writes after a failed read.** `syncToApp` used to merge onto
`data ?? {}`, so a failed read replaced the app's whole `orm` and `race_times`
with the session's patch. It now returns `error` and writes nothing. A failed
write is reported too (`SyncResult.error`; it used to read as `disabled`).

**Not changed, noticed:** `racePatchFromLogs` writes a whole new record
(`{ timeSec, updatedAt: now, predicted: false }`) for every mapped race on
every Save, so a pulled race loses the app's `achievedOn` date (plan 47) and
gets a new `updatedAt` even when its time did not change. Recorded in
docs/LEGAL-FIXES-2026-10-03.md §10 as an owner question; not fixed here.
