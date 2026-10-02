# Standards — what the numbers mean & where they come from

## Status: v1 beta (Lift and Operator)

Both brands score against **real tiers** (not synthetic placeholders): Lift
(and Hybrid, which shares its standards) from
`config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx`, Operator from
`config/standards/TPF_Operator_Standards.xlsx` (see "Operator (ORS)
standards" below — live since 2026-07, mirrored from the TPF app). They are
explicitly **beta** — good enough to be useful, not yet calibrated to our own
population. The UI says so.

*Corrected 2026-10-02: this section said "Operator is still synthetic until its
standards are added". That had not been true since Operator went live on the
curated workbook; the section further down already said so.*

## What the tiers mean

Every benchmark's tiers sit at the same points on the 0–100 score across
domains, so the composite and the weakness radar stay coherent. The tiers are
**TPF's own standards** (next section) — they are **not population
percentiles**, and nothing here says what share of athletes reaches a tier.

| Tier (four-tier rows: Operator, WODs) | Score | Six-tier rows (Lift) | Score |
|---|---|---|---|
| pass | 50 | Beginner | 50 |
| | | Novice | 60 |
| good | 70 | Experienced | 70 |
| | | Intermediate | 80 |
| excellent | 85 | Advanced | 90 |
| elite | 100 | Elite | 100 |

**Percentiles.** The calculator shows a percentile **only when it is measured**:
the trust-weighted pool percentile (`benchmark_percentile()`, read by
`fetchPercentile`), which the server returns only once the athlete's
(sex, age-band) cell holds enough trusted submissions (30 by default). With
no measured percentile the result shows the score, tier and level and says it
is scored against TPF's standards, not a ranking (`src/ui/resultCopy.ts`).

*Corrected 2026-10-02: this table used to carry a "≈ percentile (trained
adults)" column (pass ~50th … elite top 1–2 %), and the site turned a score
into "≈ Nth percentile" through it (`estimatedPercentile`, now removed) whenever
the pool had no data. After the standards rebuild the tiers are TPF's own, so
that column described no population. The landing copy, the SEO pages' tier
notes and FAQs, and the copied result were changed the same day;
`src/test/no-percentile-claims.test.ts` pins it.*

Bodyweight lifts are stored ×bodyweight per sex; times are seconds (lower is
better); reps/distance are absolute per sex.

## Provenance (honest) — rebuilt 2026-10-02

Owner, 2026-10-02: *"Remove any standards taken from places we don't have
permission for and replace them with ones we can use"* — and *"update benchmark
too"*. The TPF app made the change first, the same day (its record is tpf-app
`docs/build/51_STANDARDS_REBUILD_2026-10-02.md`); this repository was brought
into line with it by `scripts/apply-permitted-sources-2026-10-02.py`, which is
the cell-by-cell record of the workbook edit.

**Every tier here is TPF's own standard (owner-set), checked against a permitted
anchor.** Nothing is taken from a source TPF has no permission to use. Licences
below are as each source states itself — **not legal advice**; counsel should
confirm them.

| Benchmarks | Basis | Checked against |
|---|---|---|
| Back squat, deadlift, bench | TPF's own (owner rounds 8, 9, 12) | van den Hoek et al. 2024, J Sci Med Sport 27:734 (CC BY — 809,986 tested raw powerlifting entries, × bodyweight deciles) at 85 kg M / 65 kg F, discounted ~0.80 for a generalist (the CrossFit-to-powerlifter gap measured from Meier, Rabel, Schmidt 2021, Sports 9:80, CC BY) |
| Overhead press, power clean, barbell row | TPF's own | **No openly licensed population norm exists (a gap)** — ratio checks only (Nuzzo 2023; team-sport power clean ÷ squat) |
| Front squat | TPF's own: ~0.82 × TPF's back squat | every tier within 5 kg of the ratio |
| Snatch, clean & jerk | TPF's own, expert-curated | published ratios (snatch ÷ C&J, women ÷ men) and Meier 2021's own CrossFit sample |
| Mile, 5 km | TPF's own (owner round 12) | USATF 2025 road open standards as age-grade % (CC0); US Army Fitness Test 2-mile (2025 tables, a US government work) |
| 2 km row | TPF's own, **rebuilt 2026-10-02** | US Navy PRT 2,000 m row, ages 17–19 (Guide-5, Jan 2025, a US government work) for Beginner–Intermediate; GB Rowing Team 2026 senior trials minimum × 1.07 for Elite; Advanced midway |
| 500 m row | **Derived** from the 2 km row (Riegel 1.06, 1 s steps), per pathway — as the app derives it | — |
| 400 m / 1500 m swim | TPF's own triathlete anchor; 1500 m Riegel-derived | US Navy PRT 500-yd swim (converted, Riegel 1.06) |
| 20 km / 40 km bike | TPF's own triathlete anchor; 40 km Riegel-derived | **no permitted anchor (a gap)** |
| Broad jump, plank, pull-ups, HSPU, T2B, double-unders, muscle-ups | TPF's own, expert-set | **none checked (a gap)** — the AFT / PFRA plank tables could anchor plank |
| Pathway overrides | TPF's own (owner-set) | CrossFit: Meier 2021; runs: USATF age-grade %; rows: Navy PRT; HYROX / bodybuilder lifts: van den Hoek discounted; powerlifter: van den Hoek **undiscounted** (its own population) |
| Fran, Grace, Helen | TPF's own, expert-set | Meier 2021 — **the study's own sample only, never the third-party percentiles printed beside it** |
| Diane, Cindy, Fight Gone Bad | TPF's own, expert-set | **no openly licensed study exists (a gap)** |
| HYROX race | Elite = Rappelt et al. 2026 (Front Physiol, CC BY) season-7 ELITE-division median × 1.187; lower tiers TPF's own, **provisional** | — |
| Operator units | pass marks from each service's published test where one exists; upper tiers and all strength rows TPF's own | US government works for the US units; UK Crown-copyright status **unconfirmed** |

**Not a source of any standard here:** Strength Level / Running Level, the
Kilgore tables, Concept2 rankings or logbook percentiles, Beyond the Whiteboard
or any WOD-logging / WOD-score site, HYROX results (including third-party
analyses of them), Ironman results, parkrun, RunRepeat, the Cooper Institute.
The July 2026 audit (`docs/STANDARDS-AUDIT-2026-07.md`) used several of these
as validation references; none of them is now the basis of a tier.

**Corrected 2026-10-02.** This section used to say the squat / bench / deadlift
tiers were *"distributions from OpenPowerlifting (CC0, public domain)"* and the
runs *"WMA age-grade + open race norms (CC BY 4.0)"*, while the workbook's own
source columns said *"StrengthLevel + Kilgore 2023"*, *"runninglevel /
RunRepeat"* and *"Concept2 rankings"*, and the generated data labelled the lift
rows *"CC0 / public domain"*. None of those was right: the numbers are TPF's own
(owner-set), and the workbook, generated data and this file now say so.

### What moved on 2026-10-02 (every other tier is unchanged)

Times m:ss (h:mm:ss for HYROX); "exc" is the vestigial legacy tier (never
scored or shown on a six-tier row) and moves only to stay between its
neighbours.

| Benchmark | Sex | Beginner | Novice | Experienced | Intermediate | Advanced | Elite | exc |
|---|---|---|---|---|---|---|---|---|
| 2 km row (base) | M | 9:15 → **9:20** | 8:25 → **8:30** | 7:40 | 7:05 → **7:00** | 6:45 | 6:30 | 6:50 |
| 2 km row (base) | F | 10:40 | 9:40 | 8:45 → **8:40** | 8:05 → **8:00** | 7:35 → **7:45** | 7:15 → **7:30** | 7:45 → **7:50** |
| 500 m row (base) | M | 1:50 → **2:09** | 1:45 → **1:57** | 1:40 → **1:46** | 1:35 → **1:37** | 1:30 → **1:33** | 1:25 → **1:30** | 1:33 → **1:35** |
| 500 m row (base) | F | 2:05 → **2:27** | 2:00 → **2:13** | 1:55 → **2:00** | 1:50 | 1:45 → **1:47** | 1:42 → **1:44** | 1:47 → **1:49** |
| 500 m row, Gym-Goer (new override) | M | 1:50 → **2:13** | 1:45 → **2:02** | 1:40 → **1:52** | 1:35 → **1:42** | 1:30 → **1:37** | 1:25 → **1:33** | — |
| 500 m row, Gym-Goer (new override) | F | 2:05 → **2:32** | 2:00 → **2:19** | 1:55 → **2:07** | 1:50 → **1:56** | 1:45 → **1:49** | 1:42 → **1:46** | — |
| 500 m row, CrossFit (new override) | M | 1:50 → **2:05** | 1:45 → **1:54** | 1:40 → **1:44** | 1:35 | 1:30 → **1:31** | 1:25 → **1:27** | — |
| 500 m row, CrossFit (new override) | F | 2:05 → **2:23** | 2:00 → **2:10** | 1:55 → **2:00** | 1:50 → **1:52** | 1:45 | 1:42 → **1:41** | — |
| HYROX race | F | 1:50:00 → **1:44:30** | 1:45:00 → **1:39:30** | 1:40:00 → **1:35:00** | 1:32:40 → **1:28:00** | 1:25:40 → **1:21:30** | 1:19:00 → **1:15:00** | 1:29:00 → **1:24:30** |
| Barbell row, HYROX (kg) | M | 55 → **45** | 65 → **55** | 80 → **70** | 95 → **85** | 115 → **95** | 130 → **110** | — |
| Barbell row, HYROX (kg) | F | 30 | 40 | 50 → **45** | 60 → **55** | 70 → **65** | 78 → **72** | — |
| Barbell row, Triathlete (kg) | M | 55 → **40** | 65 → **50** | 80 → **60** | 95 → **70** | 115 → **85** | 130 → **95** | — |
| Barbell row, Triathlete (kg) | F | 30 → **25** | 40 | 50 → **45** | 60 → **55** | 70 → **60** | 78 → **70** | — |
| Barbell row, Powerlifter (kg) | M | 55 → **80** | 65 → **95** | 80 → **115** | 95 → **135** | 115 → **150** | 130 → **170** | — |
| Barbell row, Powerlifter (kg) | F | 30 → **45** | 40 → **55** | 50 → **65** | 60 → **75** | 70 → **90** | 78 → **105** | — |
| Barbell row, Bodybuilder (kg) | M | 55 | 65 | 80 → **95** | 95 → **115** | 115 → **130** | 130 → **150** | — |
| Barbell row, Bodybuilder (kg) | F | 30 | 40 | 50 | 60 | 70 | 78 → **82** | — |

The barbell-row rows are a **pre-existing drift**, not part of the app's
rebuild: the app has carried those four pathway overrides since 2026-07-12 and
this workbook never had them (the lockstep test wrongly pinned them as
"inherits base"). Found by the same day's comparison; the app is canonical.

Operator (unisex, Pass / Good / Excellent / Elite):

| Unit · benchmark | Old | New | Basis |
|---|---|---|---|
| US Police PFT · 1.5-mile run | 12:30 / 11:30 / 10:30 / 9:30 | **13:30 / 10:45 / 9:45 / 8:30** | US Navy PRT 1.5-mile, men 20–24 (the app had stated these three rows as Cooper Institute LE PT) |
| US Police PFT · push-ups (1 min) | 30 / 45 / 60 / 75 | 30 / 45 / **57 / 67** | USAF PFRA 1-min chart, men under 25 |
| US Police PFT · sit-ups (1 min) | 30 / 45 / 60 / 75 | **33 / 43 / 51 / 58** | USAF PFRA 1-min chart, men under 25 |
| Navy SEAL · 500 m swim | 12:30 / 10:00 / 9:00 / 8:00 | **13:45 / 11:00 / 9:54 / 8:48** | the PST swim is 500 **yards**; × 1.0995 (Riegel 1.06) to 500 m |
| Royal Marines · 500 m swim | 14:23 / 11:30 / 10:21 / 9:12 | **15:48 / 12:39 / 11:23 / 10:07** | derived: the corrected SEAL swim × 1.15 |

(The US Police PFT Elites above moved again later the same day — next section.)

### Later the same day: the Navy PRT, and the minimum / good / maximum rule

Owner, 2026-10-02, answering the app's question on the Navy and Air Force
pathways: *"Use navy tables. Military standards should be roughly
interchangeable but generally considered low as they are unlikely to consider
special forces. Be careful to differentiate between minimum standards and good
standards too, as minimums are often very low."* The app made the change first
(tpf-app `docs/build/51_STANDARDS_REBUILD_2026-10-02.md` §11);
`scripts/apply-navy-prt-and-military-tiers-2026-10-02.py` is the cell-by-cell
record of this repository's edit.

**The rule.** A ladder read off a **general** military score table (Navy PRT,
Army AFT, USAF PFRA, USMC PFT / CFT) puts the official **minimum** at Pass at
most (never easier than it), an official **"good"** standard in the middle
tiers, and the official **maximum** at Excellent at most — **Elite sits
strictly above it**. No published number exists above a general table's
maximum, so Elite there is **TPF's stated margin, not data**: the maximum
+ 10 % (reps, hold time, load) or − 5 % (time), rounded to the event's step
(1 rep, 5 s). A special-forces pipeline's own standard (BUD/S PST, SFAS, RASP,
PJ PAST) may set its own top tiers.

| Unit · benchmark | Old | New | Why |
|---|---|---|---|
| US Marine Corps · 3-mile run | 27:40 / 21:00 / 19:30 / 18:00 | 27:40 / 21:00 / 19:30 / **17:05** | Elite was the PFT maximum |
| US Marine Corps · pull-ups | 3 / 12 / 18 / 23 | 3 / 12 / 18 / **25** | Elite was the PFT maximum |
| US Marine Corps · push-ups (2 min) | 42 / 60 / 75 / 87 | 42 / 60 / 75 / **96** | Elite was the PFT maximum |
| US Marine Corps · plank (front) | 1:03 / 3:00 / 3:30 / 3:45 | 1:03 / 3:00 / 3:30 / **4:10** | Elite was the PFT maximum |
| US Police PFT · 1.5-mile run | 13:30 / 10:45 / 9:45 / 8:30 | 13:30 / 10:45 / 9:45 / **8:05** | Elite was the Navy PRT (20–24) Outstanding High |
| US Police PFT · push-ups (1 min) | 30 / 45 / 57 / 67 | 30 / 45 / 57 / **74** | Elite was the USAF PFRA maximum |
| US Police PFT · sit-ups (1 min) | 33 / 43 / 51 / 58 | 33 / 43 / 51 / **64** | Elite was the USAF PFRA maximum |
| Navy SEAL · pull-ups | 8 / 13 / 18 / 22 | **10** / 13 / 18 / 22 | Pass was **below** the BUD/S PST minimum of 10 |

Every other unit's tiers are unchanged — the app checked them against the rule
(its §11.3) and they already obey it, and the mirror was re-compared with the
app's live config (below).

**New unit: US Navy (PRT)** (`us_navy_prt`) — the app's `navy` pathway. Its
description in the app: *"US Navy (general — any rate). For the sailor who is
not chasing a SOF pipeline. Scored against the Navy PRT: push-ups, forearm
plank and one cardio event (1.5-mile run, or a 2 km row / 500-yd / 450 m
swim), plus moderate strength."* Until 2026-10-02 the app scored it on a copy
of its US Army baseline, which is why it was never mirrored here (this
repository's curated set drops the generic army units). Source: US Navy PRP
**Guide-5, Physical Readiness Test, JAN 2025, Table 4-1** (a US government
work), the **men 17–19** column — ORS has no sex split, and every US unit reads
its own table's youngest men's column (USMC 17–20, the AFT 17–21).
Pass = Probationary, Good = Good High, Excellent = Excellent High, Elite above
Outstanding High (the margin above).

| Event | Pass | Good | Excellent | Elite | Navy maximum |
|---|---|---|---|---|---|
| 1.5-mile run | 12:45 | 10:00 | 9:15 | **7:50** | 8:15 |
| 2 km row (alternate cardio) | 9:20 | 8:10 | 7:30 | **6:40** | 7:00 |
| 500-yd swim (alternate cardio) | 12:45 | 9:15 | 7:45 | **6:10** | 6:30 |
| 450 m swim (alternate cardio) | 12:35 | 9:05 | 7:35 | **6:00** | 6:20 |
| Push-ups (2 min) | 42 | 68 | 82 | **101** | 92 |
| Forearm plank | 1:11 | 2:23 | 3:04 | **3:45** → **4:30** (moved again later the same day — next section) | 3:24 |
| Back squat / hex-bar DL / conventional DL / bench, dead hang, power clean, broad jump | TPF's own — the app's general-military rows (the PRT has no strength, grip or power event) | | | | — |

Weights (TPF judgement, the app's): running 35 (the cardio event), upper
endurance 20, stability 20, lower strength 10, upper strength 5, grip 5,
power 5.

**The cardio event is ONE of four.** The run, row and two swims are
*alternatives* (`alternative_group` = `prt_cardio` in the workbook): the
component counts the group **once, at the athlete's best option**, the others
are marked `counted: false`, and an option not done costs nothing — exactly the
app's `computeORS`. The calculator's entry grid counts the four as one event
and says so; the unit's SEO page carries the same note.

Two things this repository represents differently from the app:
- **The swims are timed entries here** (`race_times` source, a mm:ss box), not
  the app's typed manual inputs; neither side converts them onto a 500 m event,
  and neither syncs to the app (no app Race Times event exists for 500 yd or
  450 m).
- **The 2 km row's id is `row_2k`** (set in the new `id` column), so it shares
  the app-sync mapping the Lift calculator already uses — the same app Race
  Times 2 km row the app's Navy pathway reads. The forearm plank's id is
  `plank_front`, the id every other unit's plank uses (the app scores one
  `plank` input across all pathways). The app's grid heading for this
  component, *"Cardio (run, row or swim)"*, is **not** mirrored: the component
  still shows as *Running* here.

**Air Force** stays on the app's US Army baseline and is still not mirrored here
(generic, like `us_army`).

### Later again: compare, then borrow — and the deadlift Elite over 200 kg

The app's record is tpf-app `docs/build/54_MILITARY_TOP_TIERS_COMPARISON.md`
§11; `scripts/apply-military-top-tiers-2026-10-02.py` is the cell-by-cell
record of this repository's edit (it is built as a list of changesets, so a
later mirror is appended to it rather than written as a new script).

**The rule, refined** (the app's `benchmark_derived_tiers.ts`, "COMPARE, THEN
BORROW"). On a ladder read off a general military table, Pass and Good stay
on the table. The **top tier** is now **the harder of** a comparison ladder's
"elite for an operator" point and the table maximum + TPF's margin — so the
margin of the section above is now only the floor that keeps Elite above the
maximum. For push-ups (2 min) the comparison is the special-forces median top
rung (100); for the plank, the app's own operator plank Elite (4:30). The
second-from-top tier moves only where the table maximum is weaker than the
comparison's "really good" point; no mirrored Operator row met that case
except the Navy plank, which the app overrode to keep Excellent at Excellent
High (its F5).

| Unit · benchmark | Old | New |
|---|---|---|
| US Marine Corps · push-ups (2 min) | 42 / 60 / 75 / 96 | 42 / 60 / 75 / **100** |
| US Marine Corps · plank (front) | 1:03 / 3:00 / 3:30 / 4:10 | 1:03 / 3:00 / 3:30 / **4:30** |
| US Navy (PRT) · forearm plank | 1:11 / 2:23 / 3:04 / 3:45 | 1:11 / 2:23 / 3:04 / **4:30** |

**The deadlift Elite is always over 200 kg.** The owner, answering the app's
plan 54 Q9: *"elite deadlift shoukd always be over 200kg adjust accordingly"*.
Both bars move — the hex bar is the same deadlift slot in the app (the athlete
picks which bar is scored), so a hex Elite left behind would make Elite
reachable at a conventional-equivalent under 200 kg. How the app set each value
(**TPF's method, not a source**): conventional = the smallest 5 kg value over
200 that keeps the order between units; hex = the smallest value at least
1.06 × the new conventional that keeps the hex order. **Pass, Good and
Excellent are unchanged**, so a 200 kg conventional (≈ 218 kg hex) lift reads
Excellent, never Elite, on every unit. Elite only (kg):

| Unit | Conventional | Hex bar |
|---|---|---|
| US Police PFT | 160 → **205** | 170 → **220** |
| US Navy (PRT) | 170 → **210** | 185 → **225** |
| UK Parachute Regiment (P Coy) | 180 → **215** | 200 → **235** |
| US Marine Corps | 180 → **215** | 195 → **230** |
| USAF Pararescue (PJ) | — (hex only) | 195 → **230** |
| US Army Airborne | 185 → **220** | 205 → **240** |
| UK Special Forces (SAS/SBS) | 185 → **220** | 200 → **235** |
| UK Royal Marines (Cdo Course) | 195 → **225** | 215 → **250** |
| US Infantry | 195 → **225** | 210 → **245** |
| Navy SEAL (BUD/S) | 195 → **225** | 215 → **250** |
| UK Infantry | 195 → **225** | 210 → **245** |
| US SWAT | 195 → **225** | 210 → **245** |
| US Army Special Forces (SFAS) | 215 → **230** | 235 → **255** |

The three units this site has and the app does not (US Army Ranger RASP, UK
Police JRFT, UK ARU / SCO19) have no deadlift row, so no Elite here is under
200 kg. Pinned by `src/test/operator-deadlift-elite-over-200.test.ts`; the
mirror re-checked with `npm run check:app-ors` (0 differences, 13 units).
Open in the app's record (§11.6), each an owner question: whether Excellent
should move too (the top step is 65 kg on police and the US Army baseline), and
that ORS has no sex split, so a woman also needs over 200 kg for an Elite
deadlift.

*2026-10-03: two sentences above are no longer current.* Excellent did move
(the next section), so "Pass, Good and Excellent are unchanged" holds for Pass
and Good only, and a 218 kg hex lift on US Army Special Forces now reads the top
of Good, not Excellent. Three Elites in the table moved again (UKSF 225 / 245,
Pararescue hex 245), which breaks "order between units kept" on purpose for
those rows.

### 2026-10-03: special-forces and elite-unit tiers (plan 55), and the deadlift Excellent evened out

The app's record is tpf-app `docs/build/55_SPECIAL_FORCES_AND_ELITE_UNIT_TIERS.md`
§10 (§10.2 lists every value that moved, each marked ORS or Benchmarks-only;
only ORS rows of the 13 shared units are mirrored here). The edit is changesets
2 and 3 of `scripts/apply-military-top-tiers-2026-10-02.py`; `npm run
check:app-ors` then reported **0 differences** across the 13 mirrored units.

**Special-forces tops** (the owner, 2026-10-02, *"As you suggest"*): a
special-forces top is the **harder of** the general Elite and the hardest
general unit's top for the same event (TPF's rule, plan 55 §4.1). Elite only,
old → new:

| Unit | Squat | Bench | Pull-ups | Push-ups (2 min) | Sit-ups (2 min) | Deadlift |
|---|---|---|---|---|---|---|
| Navy SEAL (BUD/S) | 180 → **190** | 140 → **160** | 22 → **25** | 100 → **105** | — | — |
| USAF Pararescue (PJ) | 175 → **190** | 135 → **160** † | 22 → **25** | 100 → **105** | 100 → **110** | hex 230 → **245** |
| US Army Special Forces (SFAS) | — | 155 → **160** | — | 100 → **105** | 100 → **110** | — |
| UK Special Forces (SAS/SBS) | 165 → **190** | 140 → **160** | 22 → **25** | 100 → **105** | — | 220 → **225**, hex 235 → **245** |

† Pararescue's bench and power clean (Elite 110 → **120**) have weight 0 in
both repositories, so they do not score; the unit page still shows them.

**Runs and rucks:** SEAL and Pararescue 1.5-mile Elite 8:30 → **8:15**; SFAS
2-mile 12:00 → **11:15**; Para Reg 2 km 6:45 → **6:20** (the owner: the paras
may be the fastest runners); US Army Airborne 2-mile Excellent 13:30 → **12:30**
and Elite 12:30 → **11:45** (the AFT test's "Elite" rung and Tier 1); UKSF
5-mile @ 30 kg Elite 1:00:00 → **55:00**.

**The Fan Dance** (the owner: *"Fan dance should be with proper weight"*): the
row now names the selection load, "Fan Dance (24 km, 18 kg bergen + rifle +
water) — optional", and its Pass moved to the published cut-off, 4:00:00 →
**4:10:00**. Good 3:30, Excellent 3:15 and Elite 3:00 are kept. The load rests
on third-party accounts only (no official source exists; the app's §10.3).

**Condition labels** (the owner: *"label conditions"*; no number converted): the
SEAL 1.5-mile run is "(PST: in boots and trousers)", the SEAL swim "(PST: 500 yd
sidestroke or breaststroke, converted)", the Pararescue swim "(PAST: freestyle,
breaststroke or sidestroke)". **The renamed rows keep their ids** (the
workbook's `id` column), because ids are stored — submissions, saved entries,
the app sync. The Fan Dance's id is still spelled with the old 35 lb load; it is
never shown, and `src/ui/format.ts` gives it the grid label "Fan Dance (18 kg +
rifle) — optional" (and keeps the swim's "500 m swim"), since the full names are
too long for the grid's name fallback.

**The deadlift Excellent, evened out** (the owner, 2026-10-03, shown police at
90 / 115 / 140 / 205: *"Even it out a bit 170kg is barely elite, wouldn't say.
Even [in] a police unit"*). On every unit and both bars: **Excellent = (Good +
Elite) / 2, rounded to the nearest 5 kg** (a half rounds up), and only ever
raised. All 25 deadlift rows here rose; Pass, Good and Elite did not move.

| Unit | Conventional | Hex bar |
|---|---|---|
| US Police PFT | 140 → **160** | 150 → **175** |
| US Navy (PRT) | 145 → **165** | 160 → **180** |
| UK Parachute Regiment (P Coy) | 160 → **175** | 180 → **190** |
| US Marine Corps | 160 → **175** | 175 → **190** |
| USAF Pararescue (PJ) | — (hex only) | 170 → **195** |
| US Army Airborne | 165 → **180** | 185 → **195** |
| UK Special Forces (SAS/SBS) | 165 → **185** | 175 → **205** |
| UK Royal Marines (Cdo Course) | 175 → **185** | 190 → **205** |
| US Infantry | 170 → **185** | 185 → **200** |
| Navy SEAL (BUD/S) | 175 → **185** | 190 → **205** |
| UK Infantry | 170 → **185** | 185 → **200** |
| US SWAT | 170 → **185** | 185 → **205** |
| US Army Special Forces (SFAS) | 195 → **200** | 210 → **220** |

Pinned by `src/test/operator-special-forces-tops.test.ts` (every value above
that is not a deadlift Excellent; the labels and kept ids; every special-forces
Elite at or above every general unit's top on the same event — 185 pairs on 12
events) and `src/test/operator-deadlift-elite-over-200.test.ts` (the Excellent
rule against a typed table, raised only). **Not mirrored**, because this site
has no row for them: the Benchmarks-only rows (the SFAS, RASP, PJ PAST and
Airborne tests), the app's generic pathways, and the app's run / ruck
comparisons on its own HABS scale. ORS has no sex split, so all of this applies
to women too.

### Gaps — standards with no permitted anchor (TPF's own judgement stands)

HYROX lower tiers (both sexes; Elite only is anchored) · Diane, Cindy, Fight
Gone Bad · overhead press, power clean, barbell row (ratio checks only) · bike
20 / 40 km · broad jump, plank and the gymnastics reps · bodybuilder lifts
(discounted check only) · Operator dead hang, broad jump, planks and the strength
rows · the UK units' tests (Crown copyright status unconfirmed) · US SWAT · the
Pararescue 500 m swim pass (12:00 matches neither published minimum the app
found — left as is, an owner question in the app's record) · Operator has no sex
split anywhere, so a woman is scored on the men's columns (pre-existing) ·
**the margin above a military maximum** (+10 % / −5 %) is TPF's judgement, and
which Navy column to read (17–19, not 20–24) is TPF's choice — both are owner
questions in the app's record (§11.6 Q1, Q2) · the Operator deadlift Elites
(over 200 kg by the owner's rule, but each value by TPF's method — smallest
step keeping the order, hex ≥ 1.06 × conventional) · *(2026-10-03)* the
special-forces tops (TPF's "harder of" rule, plan 55) and the evened-out
deadlift Excellents (TPF's midpoint rule) · the Fan Dance load (third-party
accounts only) and its kept 3:30 / 3:15 / 3:00 at that load (an owner question
in the app's record, §10.8).

## How to change them

The Excel master is the single source of truth:
`config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx`.

- Open it in Excel/Numbers — it's human-readable: one row per benchmark × sex,
  times shown as **mm:ss** (e.g. `30:00`), strength as ×BW, reps/distance plain.
- Edit values there, then run codegen. (`scripts/seed-standards.mjs` is the
  retired v1-beta seed and refuses to run on the six-tier workbook; a scripted
  edit is fine, as `scripts/apply-permitted-sources-2026-10-02.py` shows.)
  ```bash
  npm run codegen     # flow Excel → src/config/generated
  ```
- Never hand-edit `src/config/generated/`. Codegen parses mm:ss / h:mm:ss (and
  Excel's auto-converted time cells) back to seconds automatically.

## Operator (ORS) standards

Two workbooks in `config/standards/`:
- `TPF_ORS_Standards_2026-05-21.xlsx` — the **raw** matrix copied from Dropbox (reference).
- **`TPF_Operator_Standards.xlsx` — the curated, editable MASTER** (edit this one).

The curated master was first produced by `scripts/build-operator-standards.mjs`
from the raw matrix, and has been edited directly since (the 2026-07-16 app
mirror and the 2026-10-02 standards rebuild). ⚠ **Do not re-run that script**:
it would overwrite both, and the raw matrix still carries the old police rows
stated as *"Cooper Institute / POST"* and *"FBI / Cooper"* standards, which TPF
has no permission to use. What the script originally did:
- **Curated + split US / UK** (9 US, 6 UK). Removed the generic `US Army` /
  `UK Army`, plus `Tactical (generic)`, `Police PT`, `SWAT / Tactical Team`.
  Navy SEAL kept; US SWAT kept (it borrows the SWAT/Tactical-Team strength matrix).
- **Strength merged in** from the "Strength by pathway" sheet (absolute kg).
- **Times disambiguated** by component (runs/swims/planks = mm:ss; rucks =
  h:mm:ss; Excel-coerced serials fixed).
- **Blanks filled from patterns**, every filled cell flagged in the **`inferred`**
  column — REVIEW THOSE. Heuristics: squat ×1.25/1.5/1.75 off pass; Hex DL ≈
  squat ×1.2; Conventional DL ≈ Hex ÷1.1 (Cholewa 2019); OHP ≈ bench ×0.62;
  sparse run/rep tiers interpolated/extrapolated monotonically.

**Since 2026-10-02** the master has two optional columns on its Standards sheet
(blank on every row that predates them, so those rows are unchanged):
`id`, which overrides the benchmark id codegen otherwise makes from the name,
and `alternative_group`, which marks benchmarks in one component as
alternatives scored once at the best (codegen refuses a group with one member,
across components, or mixing directions, and any duplicate id in a unit). The
curated set is now **10 US + 6 UK** units — `US Navy (PRT)` was added that day.

**Lockstep with the app.** `src/test/operator-lockstep.test.ts` diffs the
generated data against a snapshot of itself — it catches a change HERE, not a
change in the app. `npm run check:app-ors -- <path to tpf-app>`
(`scripts/check-operator-vs-app.mjs`) is the cross-repo check: it runs the
app's own `tsx` against the app's `src/lib/operational_readiness.ts`
(read-only) and diffs every mirrored unit's weights, tiers, direction and
alternative groups against `operator.data.json`. 2026-10-02: **0 differences**
across the 13 mirrored units. *2026-10-03:* it also compares each benchmark's
**label** with the site's name (three Navy PRT rows keep a shorter site name and
are pinned both sides in `LABEL_KEPT`), and the rows of a **zero-weight**
component wherever the site holds them (unscored, but shown on the unit pages);
an alias is needed wherever a renamed row kept its id. After plan 55: **0
differences**, 13 units. It is not part of `npm test` (CI has no app
checkout). Matching numbers do not make the two **scores** identical: this
site re-normalises over the components you test with no penalty and caps each
benchmark at 100; the app takes 5 % off the score per unscored category, lets
a benchmark read up to 110 before capping the component, and predicts a run
distance from other logged runs.

Model differences from Lift: **unisex** (one standard regardless of sex),
**absolute kg** strength, **per-unit benchmarks** (each unit its own run/ruck
distance + load), and extra components `upper_endurance` / `stability` /
`swimming`.

**Status: LIVE.** `scripts/codegen-operator.mjs` turns the master into per-unit
operator config (`src/config/operator.ts`), and the Operator brand scores on it —
per-unit benchmarks, unisex, absolute, with a brand-aware radar + US/UK-grouped
picker. The 5 police/SF units that had **no source weights** (US Police, US SWAT,
UK Police JRFT, UK ARU, RASP) get an **even split across their tested components**
(auto, flagged) — replace with real weights when you have them. Edit the master →
`npm run codegen` re-flows everything.

> Note: `npm run seed` populated the **repo copy** of the workbook. The original
> in Dropbox is unchanged — treat the repo copy as canonical going forward, or
> copy it back to Dropbox to keep them in sync.

## The plan to make them real

Capture own-user submissions from day one (the percentile pool, audit-tiered and
trust-weighted), then recalibrate each tier to our own population once volume
allows — per `ROADMAP.md` Phase 4. Until a (sex, age-band) cell has enough
trusted data, we show the beta tiers and label them as such.
