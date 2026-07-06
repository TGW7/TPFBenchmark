# Audit implementation handoff — approved changes (July 2026)

The PTI approved the recommendations in `STANDARDS-AUDIT-2026-07.md`. This doc
is a **values-complete execution spec**: every judgment call is already made.
Execute exactly; do not re-derive or re-litigate values. If something here
conflicts with reality (e.g. a test you can't reconcile), STOP and ask the
user rather than improvising.

## Ground rules (this repo)

- **Pushing to `main` deploys production** (benchmark.takepointfitness.com via
  Vercel). Run tests + build BEFORE pushing.
- **Never hand-edit generated files** (`src/config/generated/*`). Standards
  flow: edit `scripts/seed-standards.mjs` → `npm run seed` (writes the Excel
  master) → `npm run codegen` → generated TS/JSON update.
- **Do NOT `git add -A`.** There is long-lived uncommitted drift in
  `config/standards/TPF_Operator_Standards.xlsx` and
  `src/config/generated/operator.*` — leave those unstaged. Stage files
  explicitly.
- Times in the seed arrays are **seconds**; the workbook shows mm:ss.

## Phase 1 — tier corrections (edit `scripts/seed-standards.mjs` only)

### 1a. STANDARDS array — replace these rows' tier arrays exactly

Format: `[pass, good, excellent, elite]`, M then F. Rows not listed: unchanged.

| id | M (new) | F (new) | what changed |
|---|---|---|---|
| `run_1mi` | `[540, 435, 390, 330]` | `[600, 495, 432, 390]` | M good 7:15; F good 8:15, elite 6:30 |
| `run_5k` | `[1800, 1440, 1290, 1110]` | `[2010, 1680, 1440, 1290]` | M good 24:00; F elite 21:30 |
| `row_2k` | `[480, 450, 420, 400]` | `[540, 510, 480, 460]` | M good 7:30, exc 7:00, elite 6:40; F good 8:30, exc 8:00, elite 7:40 |
| `row_500m` | unchanged `[110, 100, 93, 85]` | `[125, 115, 107, 102]` | F elite 1:42 |
| `back_squat_1rm` | `[1.35, 1.6, 2.0, 2.5]` | unchanged | M pass 1.35 |
| `front_squat_1rm` | `[1.1, 1.35, 1.65, 2.05]` | unchanged | M pass 1.10 (keeps 0.81 FS:BS) |
| `deadlift_1rm` | `[1.65, 1.9, 2.3, 2.8]` | unchanged | M pass 1.65 |
| `strict_press_1rm` | `[0.65, 0.8, 1.0, 1.25]` | unchanged | M pass 0.65 |
| `power_clean_1rm` | `[0.8, 1.05, 1.35, 1.65]` | unchanged | M exc 1.35, elite 1.65 |
| `broad_jump` | `[200, 230, 260, 285]` | `[160, 185, 210, 220]` | elites 285 / 220 cm (round picks from 280–285 / 220–225 bands) |
| `strict_pullups` | `[5, 11, 18, 25]` | unchanged | M elite 25 |
| `t2b` | `[8, 18, 30, 45]` | `[5, 12, 22, 35]` | elites 45 / 35 (round picks from 42–45 / 32–35 bands) |
| `du_unbroken` | `[20, 50, 100, 150]` | `[15, 45, 90, 130]` | elites 150 / 130 |
| `max_mu` | `[1, 4, 9, 14]` | `[1, 2, 5, 8]` | elites 14 / 8 |
| `plank_hold` | `[90, 150, 180, 300]` | `[90, 150, 180, 300]` | pass 1:30, good 2:30 (both sexes) |

Unchanged rows (validated — do not touch): `bench_1rm`, `snatch_1rm`,
`clean_jerk_1rm`, `hspu`, and all cells not named above.

### 1b. WODS object — replace tier arrays exactly

| id | M (new) | F (new) | what changed |
|---|---|---|---|
| `fran` | `[360, 240, 210, 165]` | `[420, 300, 270, 210]` | M exc 3:30, elite 2:45; F exc 4:30, elite 3:30 |
| `grace` | `[300, 225, 165, 135]` | `[360, 240, 165, 145]` | M good 3:45, exc 2:45, elite 2:15; F elite 2:25 |
| `diane` | `[600, 390, 285, 210]` | `[720, 480, 360, 255]` | M good 6:30, exc 4:45, elite 3:30; F exc 6:00, elite 4:15 |
| `cindy` | `[12, 18, 22, 25]` | `[10, 16, 20, 22]` | elites 25 / 22 rounds |

Unchanged: `helen`, `fight_gone_bad` (validated). Rx loads unchanged everywhere.

### 1c. HYROX pathway weights (WEIGHTS.hyrox) — replace with

```js
hyrox: { running: 33, erg_engine: 13, lower_strength: 16, upper_strength: 8, olympic: 2, power: 7, gymnastics: 6, core_endurance: 15 },
```

(Sums to 100 — verify. Rationale: running ≈50% of race time and most
predictive; ergs ≈10% and least; freed points to lower-strength/core/power as
sled/wall-ball/burpee proxies until dedicated benchmarks exist.) All other
pathway weights unchanged.

### Deliberately SKIPPED (optional items — do not apply)

Back-squat/deadlift M good bumps; bench/snatch/C&J F elite bumps; power-clean
M pass; 5k F good; Fran M good; Cindy M exc; Helen F elite; FGB M elite. These
were flagged "defensible either way" — leave for pool-driven recalibration.

## Phase 2 — copy guardrail (one edit per brand)

In `src/content/landingCopy.ts`, append this sentence to the END of the
`explanatory` paragraph for **all three brands** (LIFT / OPERATOR / HYBRID),
adjusting nothing else:

> ` Scores compress at the top — 85+ is elite territory, because it means being near the top in every area at once, not just one.`

## Phase 3 — HYROX race-time benchmark (design already decided)

Add a **display-tier race benchmark via the WOD layer** (v1: shows tiers +
logs like a benchmark workout; does NOT feed the core score — same contract as
all WODs, `WOD_CORE_WEIGHT = 0`).

1. In `scripts/seed-standards.mjs` WODS, add:
```js
hyrox_race: { unit: 'h:mm:ss', lib: 1, M: [5700, 5160, 4620, 4080], F: [6600, 6000, 5340, 4740], move: 'Full race (open, singles)', loadM: null, loadF: null },
```
   (M 1:35:00 / 1:26:00 / 1:17:00 / 1:08:00 · F 1:50:00 / 1:40:00 / 1:29:00 /
   1:19:00 — from 700k-result HYROX distributions, seasons 2023–25.)
2. Add QMIX row (must sum to 1):
```js
hyrox_race: { running: 0.5, erg_engine: 0.15, lower_strength: 0.1, power: 0.1, core_endurance: 0.15 },
```
3. In `src/config/wods.ts` WOD_PUBLIC_NAMES add:
```js
hyrox_race: { name: 'HYROX Race (Open)', spec: '8 × 1km run + 8 stations — official race time, open singles' },
```
   ("HYROX" as a factual event name is fine; we already use it for the pathway.)
4. Codegen picks the rest up automatically (WodLog dropdown, Browse Standards,
   Capacity Index). Verify the h:mm:ss format renders via `formatValue`
   (unit contains ":" → clock format — already supported; check a 5700s value
   renders as `1:35:00`).

## Verification (all must pass before push)

1. `npm run seed && npm run codegen` — confirm console shows 19 benchmarks + 7
   WODs, thresholds populated.
2. Spot-check generated data:
   `node -e "const d=require('./src/config/generated/lift.data.json'); console.log(d.standards.back_squat_1rm.M, d.standards.plank_hold.M, d.wodStandards.fran.thresholds.M, d.wodStandards.hyrox_race?.thresholds.M, d.weights.hyrox)"`
   → expect pass 1.35 / plank [90,150,…] / fran […,210,165] / hyrox_race
   [5700,…] / weights summing 100.
3. `npm test` — if any test asserts an old score/threshold (possible in
   score/landing tests using sample logs), **recompute the correct new expected
   value and update the assertion** — never widen tolerances or delete
   assertions. If a failure looks unrelated to standards, stop and ask.
4. `npm run build` — clean; 43+ SEO pages regenerate with new tier tables.
5. Stage explicitly:
   `git add scripts/seed-standards.mjs config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx src/config/generated/standards.generated.ts src/config/generated/lift.data.json src/config/README.md src/config/wods.ts src/content/landingCopy.ts` (+ any test files you updated).
   Confirm `git status` leaves operator drift files unstaged.
6. Commit (explain it implements the approved audit; reference the audit doc),
   push, then verify live:
   - `curl -s https://benchmark.takepointfitness.com/standards/back-squat/ | grep -o "1.35× BW"` (after deploy finishes; poll a few times)
   - fran elite in bundle: fetch the index JS and grep for `165` near fran is
     brittle — instead check the back-squat SEO page + one WOD via the
     BrowseStandards values in a local `vite preview` if unsure.
7. Update `ROADMAP.md` Phase 4: tick a line noting standards recalibrated to
   the July 2026 audit.

## Explicitly out of scope (do NOT attempt)

- Operator/ORS standards (separate master; pending PTI review).
- New capacity benchmarks (wall balls / sled / SkiErg) — future, needs PTI
  input on loads.
- Any engine change to make race time "dominate the composite" — deferred.
- Renaming anything; touching the app repo; changing pathway lists.
