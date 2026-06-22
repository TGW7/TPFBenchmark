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
