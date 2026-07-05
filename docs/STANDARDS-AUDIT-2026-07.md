# Standards Audit — July 2026 (external validation)

Full validation of the live HABS standards against external references. **No
standards were changed** — this is the evidence + recommendations for PTI
review. Approved changes go through the Excel master / `seed-standards.mjs` →
`npm run seed && npm run codegen` (never hand-edited TS).

## Method

- Four parallel research passes: barbell strength, engine (run/row),
  gymnastics + benchmark WODs, HYROX/hybrid.
- TPF tier model audited against: **pass ≈ 50th percentile of trained
  adults, good ≈ 70th, excellent ≈ 85th, elite ≈ 95th (top 5%)**.
- Every external source's population bias was mapped explicitly (e.g.
  Strength Level loggers ≈ dedicated lifters, so SL Intermediate ≈ TPF pass;
  Concept2 rankers ≈ serious ergers, so top-5%-of-trained ≈ top 12–20% of C2).
- References: strengthlevel.com (per-lift), Aasgaard/Starting Strength 2006 +
  Kilgore 2023 tables (ExRx lineage), Catalyst Athletics lift ratios,
  runninglevel.com / rowinglevel.com, live Concept2 season-2025 rankings
  (30–39, M n=1,663 / F n=367 for 2k), parkrun aggregate stats, US AFT + UK
  Army run standards, peer-reviewed btwb-validated WOD percentiles (PMC8228530),
  WodTimeCalculator/przilla/WODprep community levels, Topend Sports norms, ACFT
  plank data, HyroxDataLab (700k+ results, seasons 2023–25), Rox Lyfe elite
  analyses, hybrid coaching sources (Viada, MTI, hybridtrainingprogram).
- Licensing: values spot-checked for validation only; no tables copied.

## Headline findings

1. **~75–80% of all tier cells validate as-is.** Female barbell tiers, all
   excellent barbell tiers, every engine pass tier, the 500m row (M), pull-ups,
   HSPU, Helen, Fight Gone Bad, and the hybrid pathway weights are well
   calibrated.
2. **The dominant error is at the top: many elite tiers are top-0.1–2%, not
   top-5%.** The numbers were seeded when elite meant "top 1–2%"; the scoring
   relabel to top-5% (2026-07-02) makes them measurably strict. Worst: Fran
   2:00 (beats the logged top-1% by ~55s), Grace 1:30 (top ~0.2%), Diane 2:30
   (Games-podium), 2k row 6:15 M / 7:00 F (top 2% / top 0.8% of Concept2's own
   rankers), broad jump 300cm (= NFL-combine average), muscle-ups 18/11,
   double-unders 200/180, T2B 50/40.
3. **Secondary error at the male entry point: pass tiers for squat / deadlift
   / press are ~10–20% lenient** (they sit at the *Novice* ≈ 20th-percentile
   row of both major references, not the 50th). Female pass tiers don't share
   the problem — a man and a woman at "pass" currently sit at different true
   percentiles.
4. **Run-vs-row split on "good":** male running good is lenient (7:30 mile /
   25:00 5k ≈ 28–30th of runners; ≈ US-Army-minimum equivalent) while the 2k
   row good/excellent/elite ladder is a full tier too hot. The 500m row is the
   best-calibrated event in the model — use it as the template shape.
5. **Female engine elites are ~1 sex-gap too tight** — F tiers were derived at
   ~12% over male (elite physiology ratio) but recreational sex gaps run
   15–18%. F 5k elite beats the 95th percentile of dedicated female runners;
   F 2k elite was beaten by 2 women worldwide in-bracket this C2 season.
6. **Only lenient cells outside male barbell pass: plank pass/good**
   (1:00 ≈ 25–35th, 2:00 ≈ 50–60th).
7. **Skill floors:** pass = 1 rep on muscle-ups (and female HSPU) is far above
   the true 50th (median trained adult = 0). Fine as a deliberate skill floor —
   document it as an intentional exception to the percentile model.

## Recommended tier changes

Times mm:ss; lifts ×BW. "(opt)" = defensible either way. Confidence = strength
of external evidence after population-mapping.

### Barbell strength
| Lift | Sex | Change | Why | Conf |
|---|---|---|---|---|
| Back squat | M | pass 1.25→**1.35** · good 1.60→1.70 (opt) | pass = Novice row (Int anchors 1.46–1.62) | High |
| Front squat | M | pass 1.05→**1.10** only if BS pass raised | preserves 0.82 FS:BS ratio | Med |
| Deadlift | M | pass 1.50→**1.65** · good 1.90→2.00 (opt) | pass = Novice on both references | High |
| Strict press | M | pass 0.60→**0.65** | Int anchors 0.70–0.80 | Med |
| Power clean | M | exc 1.30→**1.35** · elite 1.60→**1.65** | both refs 6–11% above; stays ≤0.90×C&J | Med-low |
| Snatch | F | elite 1.05→1.10 (opt) | 6–8% under both elite anchors | Med |
| Bench | F | elite 1.30→1.35 (opt) | splits disagreeing sources | Med |
| Clean & jerk | F | elite 1.30→1.35 (opt) | hair lenient vs both elites | Med |

Keep: all other barbell cells — incl. all female pass/good/excellent, male
bench (elite 2.00 is the strictest cell but defensible), snatch/C&J M, and the
whole internal ratio web (FS:BS 0.82, snatch:C&J 0.78, PC:C&J ≤0.90 ✓).

### Engine
| Event | Sex | Change | Why | Conf |
|---|---|---|---|---|
| 1-mile | M | good 7:30→**7:15** | good ≈ 28th pct of runners | High |
| 1-mile | F | good 8:30→**8:15** · elite 6:12→**6:30** | elite ≈ 93rd of female runners | High |
| 5k | M | good 25:00→**24:00** | ≈ 30th of runners; = AFT-minimum equiv | High |
| 5k | F | elite 20:30→**21:30** · good 28:00→27:30 (opt) | elite beats RL 95th of F runners | High |
| 2k row | M | good 7:15→**7:30** · exc 6:45→**7:00** · elite 6:15→**6:40** | elite = top ~2% of C2 rankers | Med-high |
| 2k row | F | good 8:15→**8:30** · exc 7:42→**8:00** · elite 7:00→**7:40** | elite = top 0.8% of C2 | High |
| 500m row | F | elite 1:38→**1:42** | = 95th of female rowers | Med |

Keep: all pass tiers, all of 500m M (best-calibrated event), M run
excellent/elite. Cross-checked: recommended ladders stay internally consistent
(Riegel mile↔5k; Paul's Law 500m↔2k).

### Gymnastics / skill
| Item | Sex | Change | Why | Conf |
|---|---|---|---|---|
| Strict pull-ups | M | elite 28→**25** | ≈ top 2–3% | High |
| Toes-to-bar | M / F | elite 50→**44** / 40→**34** | above 95th of a fitter-skewed logging pop | Med |
| Double-unders | M / F | elite 200→**150** / 180→**130** | 100 unbroken = community "advanced" | Low-med |
| Muscle-ups | M / F | elite 18→**14** / 11→**8** | 18 ≈ semifinals; 11 ≈ Games-level women | Med / Low |
| Plank | both | pass 1:00→**1:30** · good 2:00→**2:30** | only lenient skill cells (pass ≈ 25–35th) | Med |
| Broad jump | M / F | elite 300→**285** / 245→**222** cm | 300 = NFL-combine *average* | Med-high |

Keep: pull-ups F, HSPU both, all pass/good/excellent elsewhere.

### Benchmark WODs
| WOD | Sex | Change | Why | Conf |
|---|---|---|---|---|
| Fran | M | exc 3:00→**3:30** · elite 2:00→**2:45** (good 4:00→4:15 opt) | elite beats logged top-1% (2:55) by ~55s | High |
| Fran | F | exc 4:00→**4:30** · elite 2:45→**3:30** | elite < logged top-1% (3:06) | Med-high |
| Grace | M | good 3:00→**3:45** · exc 2:00→**2:45** · elite 1:30→**2:15** | 1:30 ≈ top 0.2% ("Regional" ceiling 2:11) | High |
| Grace | F | elite 2:00→**2:25** | top 1–2% | Med |
| Diane | M | good 6:00→**6:30** · exc 4:00→**4:45** · elite 2:30→**3:30** | 2:30 ≈ Games podium (WR 1:35) | Med |
| Diane | F | exc 5:00→**6:00** · elite 3:15→**4:15** | same pattern | Med |
| Cindy | M / F | elite 28→**25** / 25→**22** rounds | 28 > logged 98th (24.5) | Med |
| Helen | both | keep (F elite 8:30→9:00 opt) | best-calibrated WOD | High |
| Fight Gone Bad | both | keep (M elite→410 opt) | well calibrated | Med |

### Structural (HYROX / hybrid)
| Recommendation | Detail | Conf |
|---|---|---|
| **Add `hyrox_race_time` benchmark** | M 1:35:00 / 1:26:00 / 1:17:00 / **1:08:00** · F 1:50:00 / 1:40:00 / 1:29:00 / **1:19:00** (open singles; from 700k-result distributions, ±3–5 min). A real race time should dominate the composite when present. | Med-high |
| **Rebalance HYROX weights** | erg 24%→**~13%**, running 28%→**~33%** (running = ~50% of race time and most predictive, r≈0.79; erg stations = ~10% and least discriminating). Spend freed points on future capacity benchmarks. | High |
| **Missing HYROX benchmarks (future)** | 100 wall balls for time (highest-variance station), sled push/pull 50m at race load, SkiErg 1k. | High |
| **Hybrid pathway** | Keep weights + tiers. | Med |
| **Copy guardrail** | Joint-elite across all domains ≈ 1-in-8,000+ athlete. Never imply "elite athletes score 100" — frame **85+ as elite-hybrid territory**; expect real scores to live in 40–85. | High |
| **Docs** | Note pass=1 on muscle-ups / female HSPU is a deliberate skill floor, not a 50th percentile. | High |

## Scope notes

- Operator (ORS) standards were externally validated separately in June 2026
  (PFT/run events solid; **inferred kg-strength tiers still awaiting PTI
  review**) — not re-audited here.
- The data flywheel (`benchmark_percentile()` + `npm run recalibrate`) will
  progressively replace these expert estimates with measured percentiles as
  the submission pool grows; this audit is the pre-data bridge.
