"""
Standards rebuild 2026-10-02 — bring both Excel masters in line with the TPF
app's rebuild (tpf-app docs/build/51_STANDARDS_REBUILD_2026-10-02.md).

Owner, 2026-10-02: "Remove any standards taken from places we don't have
permission for and replace them with ones we can use" — and "update benchmark
too".

This script is the record of every cell it changes. It edits the two masters
in place and is idempotent (re-running it sets the same values again):

  config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx   (Lift / Hybrid)
  config/standards/TPF_Operator_Standards.xlsx            (Operator / ORS)

Then run `npm run codegen` — the generated files are never hand-edited.

What changes
  NUMBERS (each the TPF app's new value):
    - row_2k base ladder: rebuilt from the US Navy PRT 2,000 m row + the GB
      Rowing 2026 senior minimum x 1.07 (was derived from a third-party
      logbook TPF has no permission to use).
    - row_500m base ladder: now DERIVED from row_2k by Riegel (exponent 1.06)
      at 1 s steps, exactly as the app derives it; and, because the app's
      derived 500 m follows the athlete's pathway, the two pathways that set
      their own 2 km row (gym_goer, crossfit_generalist) gain a derived
      row_500m override computed from that pathway's own 2 km row.
    - hyrox_race women: Elite anchored on Rappelt et al. 2026 (CC BY); the
      lower tiers keep the old spacing to elite (men unchanged).
    - Operator US Police PFT run / push-ups / sit-ups: US military score
      tables (were stated as Cooper Institute LE standards — no permission).
    - Operator Navy SEAL 500 m swim: the PST swim is 500 YARDS; the times are
      converted to 500 m (x 1.0995, Riegel 1.06). Royal Marines' derived swim
      (SEAL x 1.15) follows.
    - PRE-EXISTING DRIFT, found by the same lockstep check and fixed here
      because the app is canonical: barbell_row overrides for the hyrox,
      triathlete, powerlifter and bodybuilder pathways (the app has carried
      them since 2026-07-12; this workbook never had them).
  WORDING ONLY (no number changes): every stated source in the Sourcing,
  Standards, Standards_Pathway and WOD_Standards sheets, and the Read me.

"excellent" is the legacy four-tier anchor and is VESTIGIAL on every six-tier
row (tier-curve.ts never reads it there; no display shows it). Where a moved
ladder needed one, it is the midpoint of intermediate and advanced, so it stays
between them.

Requires: python3 with openpyxl (3.1.5 checked).
"""

from pathlib import Path

import openpyxl

REPO = Path(__file__).resolve().parent.parent
HRS = REPO / 'config/standards/TPF_HRS_Standards_v0_2026-06-21.xlsx'
OPS = REPO / 'config/standards/TPF_Operator_Standards.xlsx'

DATE = '2026-10-02'

# ---------------------------------------------------------------- wording --

LIFT_CHECK = (
    "checked against van den Hoek et al. 2024 (J Sci Med Sport 27:734, CC BY — "
    "tested raw powerlifting x bodyweight deciles) at 85 kg M / 65 kg F, with the "
    "specialist-to-generalist discount measured from Meier, Rabel, Schmidt 2021 "
    "(Sports 9:80, CC BY)"
)
RUN_CHECK = (
    "checked against the USATF 2025 road open standards as age-grade % (CC0) and the "
    "US Army Fitness Test 2-mile run (2025 score tables, a US government work)"
)
OWN_SET = f"Owner-set; checked against permitted anchors ({DATE})"
ABS_KG = "Absolute kg (owner 2026-07-12: fixed-load sports don't scale with bodyweight)"
ABS_TIME = "Absolute time, split by sex; no age adjustment (the age-grading hook is off)"
OLY = (
    "TPF's own expert-curated tiers (set by TPF in TPF Benchmark); checked "
    f"{DATE}: snatch = 0.71-0.81 x clean & jerk across these tiers (published: "
    "0.77 in a CrossFit sample, 0.79-0.84 for world records); women's = 0.60-0.70 x "
    "men's (published: 0.65-0.72); against Meier, Rabel, Schmidt 2021 (Sports 9:80, "
    "CC BY, a CrossFit sample) the median sits at about Intermediate and the top "
    "10 % at about Elite"
)

# Benchmarks_Sourcing: id -> {column header: value}. Only these columns change.
SOURCING = {
    'run_1mi': dict(
        data_source=f"TPF's own standards (owner-set; elite = the 5-500 club's sub-5 mile), {RUN_CHECK}",
        license="TPF's own", commercial_use='Yes',
        reference_population='Trained adults (hybrid)', launch_method=OWN_SET, notes=ABS_TIME),
    'run_5k': dict(
        data_source=f"TPF's own standards (owner-set; owner round 12: Intermediate under 20:00), {RUN_CHECK}",
        license="TPF's own", commercial_use='Yes',
        reference_population='Trained adults (hybrid)', launch_method=OWN_SET, notes=ABS_TIME),
    'row_2k': dict(
        data_source=(
            f"TPF's own standards, rebuilt {DATE}: Beginner / Novice / Experienced / "
            "Intermediate = the US Navy PRT 2,000 m row categories, ages 17-19 "
            "(Probationary / Good Medium / Excellent Medium / Outstanding High — "
            "Guide-5 PRT, Jan 2025, a US government work); Elite = the GB Rowing Team "
            "2026 senior trials minimum ergo standard (6:05 M / 7:00 F, a published "
            "participation minimum) x 1.07 for a non-specialist; Advanced = midway"),
        license="TPF's own (anchors: a US government work; a published selection minimum)",
        commercial_use='Yes', reference_population='Trained adults (hybrid)',
        launch_method=f'Rebuilt from permitted anchors ({DATE})',
        notes=f"Replaces a ladder derived from a third-party logbook TPF has no permission to use ({DATE})"),
    'row_500m': dict(
        data_source=(
            "TPF's own: derived from TPF's 2 km row ladder (row_2k) with Riegel's "
            "formula, exponent 1.06, at 1 s steps — the same derivation the TPF app "
            f"uses ({DATE})"),
        license="TPF's own", commercial_use='Yes',
        reference_population='Trained adults (hybrid)',
        launch_method=f'Derived from row_2k ({DATE})',
        notes=f'Derived — change the 2 km row, not this ({DATE})'),
    'back_squat_1rm': dict(
        data_source=f"TPF's own ladders (owner rounds 8, 9 and 12), {LIFT_CHECK}",
        license="TPF's own", commercial_use='Yes',
        reference_population='Trained adults (hybrid)', launch_method=OWN_SET, notes=ABS_KG),
    'deadlift_1rm': dict(
        data_source=f"TPF's own ladders (owner rounds 8, 9 and 12), {LIFT_CHECK}",
        license="TPF's own", commercial_use='Yes',
        reference_population='Trained adults (hybrid)', launch_method=OWN_SET, notes=ABS_KG),
    'bench_1rm': dict(
        data_source=f"TPF's own ladders (owner rounds 8, 9 and 12), {LIFT_CHECK}",
        license="TPF's own", commercial_use='Yes',
        reference_population='Trained adults (hybrid)', launch_method=OWN_SET, notes=ABS_KG),
    'front_squat_1rm': dict(
        data_source=(
            "TPF's own: about 0.82 x TPF's back-squat ladder (a TPF ratio); checked "
            f"{DATE} — every tier within 5 kg of 0.82 x the back squat"),
        license="TPF's own", commercial_use='Yes', reference_population='Trained adults',
        launch_method='TPF ratio off the back squat', notes=ABS_KG),
    'strict_press_1rm': dict(
        data_source=(
            "TPF's own ladder. No openly licensed population norm exists; checked only "
            "against published ratios (women's overhead press ≈ 0.5-0.6 of men's "
            "absolute — Nuzzo 2023 review) and the CrossFit sample of Meier, Rabel, "
            "Schmidt 2021 (Sports 9:80, CC BY)"),
        license="TPF's own", commercial_use='Yes',
        reference_population='Trained adults (hybrid)',
        launch_method=f'Owner-set; ratio checks only ({DATE})', notes=ABS_KG),
    'barbell_row_1rm': dict(
        data_source=(
            "TPF's own ladder (the TPF app's base table, mirrored 2026-07-19). No "
            "openly licensed population norm exists (a gap)"),
        license="TPF's own", notes=ABS_KG),
    'snatch_1rm': dict(
        data_source=OLY, license="TPF's own", commercial_use='Yes',
        reference_population='Trained adults (hybrid / CrossFit)',
        launch_method='Expert-curated (TPF)', notes=ABS_KG),
    'clean_jerk_1rm': dict(
        data_source=OLY, license="TPF's own", commercial_use='Yes',
        reference_population='Trained adults (hybrid / CrossFit)',
        launch_method='Expert-curated (TPF)', notes=ABS_KG),
    'power_clean_1rm': dict(
        data_source=(
            "TPF's own ladder. No openly licensed population norm exists; checked only "
            "against ratios — power clean = 0.60-0.64 x TPF's back squat (M), 0.60-0.67 "
            "(F), against 0.55-0.60 published for team-sport athletes"),
        license="TPF's own", commercial_use='Yes',
        reference_population='Trained adults (hybrid)',
        launch_method=f'Owner-set; ratio checks only ({DATE})', notes=ABS_KG),
    'broad_jump': dict(
        data_source="TPF's own (expert-set). No openly licensed population table has been checked yet (a gap)",
        license="TPF's own", commercial_use='Yes', reference_population='Trained adults',
        launch_method='Expert-set (TPF)'),
    'plank_hold': dict(
        data_source=(
            "TPF's own (expert-set). Not yet checked against a permitted table — the "
            "US Army Fitness Test and USAF PFRA plank tables (US government works) "
            "could anchor it (a gap)"),
        license="TPF's own", commercial_use='Yes', reference_population='Trained adults',
        launch_method='Expert-set (TPF)'),
    # Gymnastics / grip / ruck: already expert-set (TPF's own), relabelled in
    # the same form so every row states its basis the same way.
    **{bid: dict(
        data_source="TPF's own (expert-set). No openly licensed population table exists to check against (a gap)",
        license="TPF's own") for bid in ('strict_pullups', 'hspu', 't2b', 'du_unbroken', 'max_mu', 'grip_deadhang')},
    'ruck_time': dict(
        data_source="TPF's own (expert-set); optional, off by default — not checked against a permitted table",
        license="TPF's own"),
    'swim_400m': dict(
        data_source=(
            "TPF's own triathlete-pathway anchor (round 13: elite 4:45 M ≈ 1:11/100 m), "
            "checked against the US Navy PRT 500-yd swim (a US government work), "
            "converted to 400 m with Riegel exponent 1.06"),
        license="TPF's own",
        launch_method=f'Owner-set; checked against a permitted anchor ({DATE})'),
    'swim_1500m': dict(
        data_source="TPF's own: Riegel-derived from swim_400m (exp 1.06)",
        license="TPF's own"),
    'bike_20k': dict(
        data_source=(
            "TPF's own triathlete-pathway anchor (round 13: elite 27:00 M ≈ 44 km/h). "
            "No permitted anchor yet (a gap)"),
        license="TPF's own", launch_method='Owner-set (TPF)'),
    'bike_40k': dict(
        data_source="TPF's own: Riegel-derived from bike_20k (exp 1.05)",
        license="TPF's own"),
}

LIFT_REF = f"TPF's own (owner rounds 8/9/12), checked vs van den Hoek 2024 (CC BY) with the Meier 2021 generalist discount ({DATE})"
RUN_REF = f"TPF's own (owner-set), checked vs USATF 2025 age-grade (CC0) + US Army AFT ({DATE})"
# Standards sheet: id -> source_ref (both sexes).
STANDARDS_REF = {
    'run_1mi': f"TPF's own (owner-set; 5-500 club anchor), checked vs USATF 2025 age-grade (CC0) + US Army AFT ({DATE})",
    'run_5k': RUN_REF,
    'row_2k': f"TPF's own, rebuilt {DATE}: US Navy PRT 2,000 m row (17-19) + GB Rowing 2026 senior minimum x 1.07",
    'row_500m': f"TPF's own: Riegel (1.06) from row_2k, 1 s steps ({DATE})",
    'back_squat_1rm': LIFT_REF,
    'deadlift_1rm': LIFT_REF,
    'bench_1rm': LIFT_REF,
    'front_squat_1rm': f"TPF's own: ~0.82 x TPF's back squat (checked {DATE}: every tier within 5 kg)",
    'strict_press_1rm': f"TPF's own; no openly licensed norm — ratio checks only ({DATE})",
    'power_clean_1rm': f"TPF's own; no openly licensed norm — ratio checks only ({DATE})",
    'barbell_row_1rm': "TPF's own — mirrors the TPF app's base table (2026-07-19); no openly licensed norm (a gap)",
    'snatch_1rm': f"TPF's own (expert-curated), checked vs published ratios + Meier 2021 (CC BY) ({DATE})",
    'clean_jerk_1rm': f"TPF's own (expert-curated), checked vs published ratios + Meier 2021 (CC BY) ({DATE})",
    'broad_jump': "TPF's own (expert-set); no permitted table checked yet (a gap)",
    'plank_hold': "TPF's own (expert-set); the AFT / PFRA plank tables not yet checked (a gap)",
    'swim_400m': f"TPF's own (round 13), checked vs the US Navy PRT 500-yd swim, Riegel 1.06 ({DATE})",
    'bike_20k': "TPF's own (round 13); no permitted anchor yet (a gap)",
    **{bid: "TPF's own (expert-set); no permitted table exists (a gap)"
       for bid in ('strict_pullups', 'hspu', 't2b', 'du_unbroken', 'max_mu')},
}

# Standards sheet numbers: (id, sex) -> {tier: value}. Times as m:ss strings.
STANDARDS_VALUES = {
    ('row_2k', 'M'): dict(pass_='9:20', novice='8:30', good='7:40', excellent='6:50',
                          intermediate='7:00', advanced='6:45', elite='6:30'),
    ('row_2k', 'F'): dict(pass_='10:40', novice='9:40', good='8:40', excellent='7:50',
                          intermediate='8:00', advanced='7:45', elite='7:30'),
    # Riegel (500/2000)^1.06 = 0.230047 x row_2k, rounded to 1 s.
    ('row_500m', 'M'): dict(pass_='2:09', novice='1:57', good='1:46', excellent='1:35',
                            intermediate='1:37', advanced='1:33', elite='1:30'),
    ('row_500m', 'F'): dict(pass_='2:27', novice='2:13', good='2:00', excellent='1:49',
                            intermediate='1:50', advanced='1:47', elite='1:44'),
}
STANDARDS_NOTES = {
    'row_2k': f'Rebuilt {DATE}; excellent = vestigial (midpoint of intermediate and advanced)',
    'row_500m': f'Derived from row_2k by Riegel (1.06), 1 s steps ({DATE}); excellent = vestigial midpoint',
}

CF = "TPF's own (owner-set), checked vs the Meier 2021 CrossFit sample (CC BY)"
HY = "TPF's own (owner-set; elite = strong end of the pro / top age-group field), checked vs van den Hoek 2024 discounted (CC BY)"
TRI = "TPF's own (owner-set): endurance-athlete strength profile"
PL = "TPF's own (owner-set, round 10): elite ≈ tested world-class (records are published facts); checked vs van den Hoek 2024 undiscounted (CC BY)"
BB = "TPF's own (owner-set, round 11), checked vs van den Hoek 2024 discounted (CC BY)"
# Standards_Pathway: (id, pathway) -> source_ref (both sexes).
PATHWAY_REF = {
    ('run_1mi', 'gym_goer'): "TPF's own (owner-set), softer for a gym population; checked as USATF 2025 age-grade % (CC0)",
    ('run_5k', 'gym_goer'): "TPF's own (owner-set), softer for a gym population; checked as USATF 2025 age-grade % (CC0)",
    ('row_2k', 'gym_goer'): "TPF's own (owner-set), softer for a gym population; checked vs the US Navy PRT 2,000 m row",
    ('back_squat_1rm', 'crossfit_generalist'): CF,
    ('front_squat_1rm', 'crossfit_generalist'): f'{CF} (0.85x BS)',
    ('deadlift_1rm', 'crossfit_generalist'): "TPF's own (owner, round 5: same ceiling as squat, ~5% above pass/novice — CF barely deadlifts), checked vs the Meier 2021 CrossFit sample (CC BY)",
    ('bench_1rm', 'crossfit_generalist'): f'{CF} (bench deliberately soft — untrained in CF)',
    ('snatch_1rm', 'crossfit_generalist'): CF,
    ('clean_jerk_1rm', 'crossfit_generalist'): CF,
    ('power_clean_1rm', 'crossfit_generalist'): CF,
    ('run_1mi', 'crossfit_generalist'): "TPF's own (owner round 12: elite 5:30), checked vs the Meier 2021 mile (CC BY) + USATF 2025 age-grade % (CC0)",
    ('run_5k', 'crossfit_generalist'): "TPF's own (owner-set), checked as USATF 2025 age-grade % (CC0)",
    ('row_2k', 'crossfit_generalist'): "TPF's own (owner-set), checked vs the US Navy PRT 2,000 m row",
    ('back_squat_1rm', 'hyrox'): HY,
    ('front_squat_1rm', 'hyrox'): f'{HY} (0.82x BS)',
    ('deadlift_1rm', 'hyrox'): HY,
    ('bench_1rm', 'hyrox'): HY,
    ('strict_press_1rm', 'hyrox'): HY,
    ('power_clean_1rm', 'hyrox'): HY,
    ('back_squat_1rm', 'triathlete'): TRI,
    ('front_squat_1rm', 'triathlete'): f'{TRI} (0.82x BS)',
    ('deadlift_1rm', 'triathlete'): TRI,
    ('bench_1rm', 'triathlete'): TRI,
    ('strict_press_1rm', 'triathlete'): TRI,
    ('power_clean_1rm', 'triathlete'): TRI,
    ('run_1mi', 'triathlete'): "TPF's own (owner-set), checked as USATF 2025 age-grade % (CC0) — elite the highest of any pathway",
    ('run_5k', 'triathlete'): "TPF's own (owner-set), checked as USATF 2025 age-grade % (CC0) — elite 16:20 M ≈ 78 %",
    ('back_squat_1rm', 'powerlifter'): PL,
    ('front_squat_1rm', 'powerlifter'): f'{PL} (0.82x BS)',
    ('deadlift_1rm', 'powerlifter'): PL,
    ('bench_1rm', 'powerlifter'): PL,
    ('strict_press_1rm', 'powerlifter'): "TPF's own (owner-set): scaled to tested-elite pressing (not contested)",
    ('back_squat_1rm', 'bodybuilder'): BB,
    ('front_squat_1rm', 'bodybuilder'): f'{BB} (0.82x BS)',
    ('deadlift_1rm', 'bodybuilder'): BB,
    ('bench_1rm', 'bodybuilder'): BB,
    ('strict_press_1rm', 'bodybuilder'): BB,
}

# New pathway rows: the app's derived 500 m row follows the pathway's own
# 2 km row (tpf-app standards_links.ts habsLadderFor + riegelStd(.., 1)).
PATHWAY_500 = {
    ('gym_goer', 'M'): ('2:13', '2:02', '1:52', '1:40', '1:42', '1:37', '1:33'),
    ('gym_goer', 'F'): ('2:32', '2:19', '2:07', '1:53', '1:56', '1:49', '1:46'),
    ('crossfit_generalist', 'M'): ('2:05', '1:54', '1:44', '1:33', '1:35', '1:31', '1:27'),
    ('crossfit_generalist', 'F'): ('2:23', '2:10', '2:00', '1:49', '1:52', '1:45', '1:41'),
}
PATHWAY_500_REF = f"TPF's own: Riegel (1.06) from this pathway's own row_2k, 1 s steps ({DATE})"
PATHWAY_500_NOTE = 'Derived — excellent = vestigial midpoint of intermediate and advanced'

# Pre-existing drift found by the 2026-10-02 lockstep check (NOT part of the
# app's rebuild): the TPF app has carried barbell_row overrides for these four
# pathways since 2026-07-12 (its original per-pathway table); this workbook
# never had them, and pathway-standards.test.ts wrongly asserted that the app
# had none. The app is canonical (the 2026-07-13 lockstep rule), so they are
# added here. Tuple: pass, novice, good, excellent (vestigial midpoint),
# intermediate, advanced, elite — kg.
PATHWAY_ROW = {
    ('hyrox', 'M'): (45, 55, 70, 90, 85, 95, 110),
    ('hyrox', 'F'): (30, 40, 45, 60, 55, 65, 72),
    ('triathlete', 'M'): (40, 50, 60, 78, 70, 85, 95),
    ('triathlete', 'F'): (25, 40, 45, 58, 55, 60, 70),
    ('powerlifter', 'M'): (80, 95, 115, 143, 135, 150, 170),
    ('powerlifter', 'F'): (45, 55, 65, 83, 75, 90, 105),
    ('bodybuilder', 'M'): (55, 65, 95, 123, 115, 130, 150),
    ('bodybuilder', 'F'): (30, 40, 50, 65, 60, 70, 82),
}
PATHWAY_ROW_NOTE = f'Mirrors the TPF app (its override since 2026-07-12; synced {DATE}); excellent = vestigial midpoint'

def meier(m_med, m_top, f_med, f_top):
    return (f"TPF's own (expert-set), checked {DATE} against Meier, Rabel, Schmidt 2021 "
            f"(Sports 9:80, CC BY — the study's own sample): men's median {m_med}, top 10 % "
            f"{m_top}; women's {f_med}, {f_top}")

NO_STUDY = "TPF's own (expert-set); no openly licensed study exists to check it against (a gap)"
WOD_LICENSE = "TPF's own; never copy or scrape community or results data"
# WOD_Standards: wod_id -> {sex: data_source}
WOD_SOURCE = {
    'fran': meier('4:34', '3:04', '5:55', '3:58'),
    'grace': meier('3:23', '1:59', '3:26', '2:23'),
    'helen': meier('10:02', '7:35', '11:12', '8:52'),
    'diane': NO_STUDY,
    'cindy': NO_STUDY,
    'fight_gone_bad': NO_STUDY,
}
HYROX_SOURCE = {
    'M': ("Elite: Rappelt et al. 2026 (Front Physiol, CC BY), season-7 ELITE-division "
          "median (57:17) x 1.187; lower tiers TPF's own (provisional — need the owner's "
          f"numbers). Numbers unchanged {DATE}"),
    'F': ("Elite: Rappelt et al. 2026 (Front Physiol, CC BY), season-7 ELITE-division "
          "median (1:03:22) x 1.187 = 1:15:13, shown 1:15:00; lower tiers TPF's own "
          f"(provisional), keeping the old spacing to elite. Rebuilt {DATE}"),
}
# hyrox_race women: old tier x (1:15:00 / 1:19:00), to the nearest 30 s.
HYROX_F = dict(pass_='1:44:30', novice='1:39:30', good='1:35:00', excellent='1:24:30',
               intermediate='1:28:00', advanced='1:21:30', elite='1:15:00')

README_LAUNCH = (
    "v1 = TPF's own standards (owner-set), each checked against a permitted anchor — "
    "openly licensed research (van den Hoek 2024, Meier 2021, Rappelt 2026; all CC BY), "
    "CC0 age-grade tables (USATF 2025) and US government test tables (Army AFT, Navy "
    "PRT, USAF PFRA) — plus expert-set tiers where no anchor exists (named as gaps in "
    "docs/STANDARDS.md); label beta. Capture own-user submissions from day one; "
    "recalibrate every tier to your own population once volume allows. Own data is the "
    "only fully-owned, legally-clean, on-population, defensible long-term source. "
    f"(Rebuilt {DATE}.)"
)
README_LEGAL = (
    "Data licensing and ToS carry real commercial risk. This is not legal advice — have "
    "a lawyer review data-rights/ToS before ingesting any third-party source, especially "
    "anything scraped. Do NOT copy or derive from proprietary tables or results "
    "databases (Strength Level / Running Level, Concept2 rankings, WOD-logging sites, "
    "the Cooper Institute, HYROX / Ironman / parkrun results) without written permission."
)

# ------------------------------------------------------------- operator --

OPERATOR_ROWS = {
    # (pathway, benchmark): (pass, good, excellent, elite, source)
    ('US Police PFT', '1.5-mile run'): (
        '13:30', '10:45', '9:45', '8:30',
        'US Navy PRT 1.5-mile, men 20-24 (Guide-5, Jan 2025, a US government work) — tpf-app mirror 2026-10-02'),
    ('US Police PFT', 'Push-ups (1 min)'): (
        30, 45, 57, 67,
        'USAF PFRA 1-min push-ups, men under 25 (eff. 1 Mar 2026, a US government work) — tpf-app mirror 2026-10-02'),
    ('US Police PFT', 'Sit-ups (1 min)'): (
        33, 43, 51, 58,
        'USAF PFRA 1-min sit-ups, men under 25 (eff. 1 Mar 2026, a US government work) — tpf-app mirror 2026-10-02'),
    # The PST swim is 500 YARDS (457.2 m): times x (500/457.2)^1.06 = x 1.0995.
    ('Navy SEAL (BUD/S)', '500 m swim'): (
        '13:45', '11:00', '9:54', '8:48',
        'BUD/S PST 500-yd swim x 1.0995 (Riegel 1.06) to 500 m — tpf-app mirror 2026-10-02'),
    ('UK Royal Marines (Cdo Course)', '500 m swim'): (
        '15:48', '12:39', '11:23', '10:07',
        'Derived: SEAL PST swim (converted to 500 m) x 1.15 — tpf-app mirror 2026-10-02'),
}
OPERATOR_README_LINE = (
    "2026-10-02 (standards rebuild, tpf-app mirror): US Police PFT run / push-ups / sit-ups "
    "now come from US military score tables (US Navy PRT 1.5-mile; USAF PFRA 1-min charts) "
    "— they were stated as Cooper Institute LE standards, which TPF has no permission to "
    "use. Navy SEAL 500 m swim: the PST swim is 500 yards, so its times are converted to "
    "500 m (x 1.0995); Royal Marines' derived swim follows. The raw matrix "
    "(TPF_ORS_Standards_2026-05-21.xlsx) still carries the old Cooper-cited police rows — "
    "do not rebuild this master from it."
)

# ---------------------------------------------------------------- helpers --

def header_index(ws, header_row):
    return {str(c.value).strip().lower(): c.column for c in ws[header_row] if c.value is not None}

def col_for(idx, prefix):
    for k, v in idx.items():
        if k == prefix or k.startswith(prefix + ' (') or k.startswith(prefix):
            return v
    raise KeyError(prefix)

TIER_KEYS = ['pass', 'novice', 'good', 'excellent', 'intermediate', 'advanced', 'elite']

changes = []

def put(ws, row, col, value):
    cell = ws.cell(row=row, column=col)
    if cell.value != value:
        changes.append(f'{ws.title}!{cell.coordinate}: {cell.value!r} -> {value!r}')
        cell.value = value

# ------------------------------------------------------------------- HRS --

wb = openpyxl.load_workbook(HRS)

ws = wb['Read me']
for r in ws.iter_rows():
    for c in r:
        if c.value == 'Launch strategy':
            put(ws, c.row, c.column + 1, README_LAUNCH)
        if c.value == 'Legal caveat':
            put(ws, c.row, c.column + 1, README_LEGAL)

ws = wb['Benchmarks_Sourcing']
idx = header_index(ws, 2)
seen = set()
for r in range(3, ws.max_row + 1):
    bid = ws.cell(row=r, column=idx['benchmark_id']).value
    if bid in SOURCING:
        seen.add(bid)
        for k, v in SOURCING[bid].items():
            put(ws, r, idx[k], v)
assert seen == set(SOURCING), f'Sourcing rows missing: {set(SOURCING) - seen}'

ws = wb['Standards']
idx = header_index(ws, 2)
tier_col = {t: col_for(idx, t) for t in TIER_KEYS}
seen = set()
for r in range(3, ws.max_row + 1):
    bid = ws.cell(row=r, column=idx['benchmark_id']).value
    sex = ws.cell(row=r, column=idx['sex']).value
    if bid in STANDARDS_REF:
        put(ws, r, idx['source_ref'], STANDARDS_REF[bid])
    if bid in STANDARDS_NOTES:
        put(ws, r, idx['notes'], STANDARDS_NOTES[bid])
    vals = STANDARDS_VALUES.get((bid, sex))
    if vals:
        seen.add((bid, sex))
        for t in TIER_KEYS:
            put(ws, r, tier_col[t], vals['pass_' if t == 'pass' else t])
assert seen == set(STANDARDS_VALUES), f'Standards rows missing: {set(STANDARDS_VALUES) - seen}'

ws = wb['Standards_Pathway']
idx = header_index(ws, 2)
tier_col = {t: col_for(idx, t) for t in TIER_KEYS}
seen_ref, seen_500 = set(), set()
for r in range(3, ws.max_row + 1):
    bid = ws.cell(row=r, column=idx['benchmark_id']).value
    pw = ws.cell(row=r, column=idx['pathway']).value
    sex = ws.cell(row=r, column=idx['sex']).value
    if (bid, pw) in PATHWAY_REF:
        seen_ref.add((bid, pw))
        put(ws, r, idx['source_ref'], PATHWAY_REF[(bid, pw)])
    if bid == 'row_500m' and (pw, sex) in PATHWAY_500:
        seen_500.add((pw, sex))
        for t, v in zip(TIER_KEYS, PATHWAY_500[(pw, sex)]):
            put(ws, r, tier_col[t], v)
        put(ws, r, idx['source_ref'], PATHWAY_500_REF)
        put(ws, r, idx['notes'], PATHWAY_500_NOTE)
assert seen_ref == set(PATHWAY_REF), f'Pathway rows missing: {set(PATHWAY_REF) - seen_ref}'
# Append the derived row_500m overrides that are not there yet, directly after
# that pathway's own row_2k rows so the sheet stays grouped by pathway.
for (pw, sex), tiers in PATHWAY_500.items():
    if (pw, sex) in seen_500:
        continue
    anchor = None
    for r in range(3, ws.max_row + 1):
        if (ws.cell(row=r, column=idx['pathway']).value == pw
                and ws.cell(row=r, column=idx['benchmark_id']).value in ('row_2k', 'row_500m')):
            anchor = r
    assert anchor, f'no row_2k row for {pw}'
    ws.insert_rows(anchor + 1)
    new = anchor + 1
    values = {'benchmark_id': 'row_500m', 'pathway': pw, 'sex': sex, 'unit': 'mm:ss.s',
              'lower_is_better': 1, 'source_ref': PATHWAY_500_REF, 'notes': PATHWAY_500_NOTE}
    for k, v in values.items():
        put(ws, new, idx[k], v)
    for t, v in zip(TIER_KEYS, tiers):
        put(ws, new, tier_col[t], v)

ROW_REF = {'hyrox': HY, 'triathlete': TRI, 'powerlifter': PL, 'bodybuilder': BB}
for (pw, sex), tiers in PATHWAY_ROW.items():
    found = None
    for r in range(3, ws.max_row + 1):
        if (ws.cell(row=r, column=idx['pathway']).value == pw
                and ws.cell(row=r, column=idx['benchmark_id']).value == 'barbell_row_1rm'
                and ws.cell(row=r, column=idx['sex']).value == sex):
            found = r
    if found is None:
        last = max(r for r in range(3, ws.max_row + 1) if ws.cell(row=r, column=idx['pathway']).value == pw)
        ws.insert_rows(last + 1)
        found = last + 1
    values = {'benchmark_id': 'barbell_row_1rm', 'pathway': pw, 'sex': sex, 'unit': 'kg',
              'lower_is_better': 0, 'source_ref': ROW_REF[pw], 'notes': PATHWAY_ROW_NOTE}
    for k, v in values.items():
        put(ws, found, idx[k], v)
    for t, v in zip(TIER_KEYS, tiers):
        put(ws, found, tier_col[t], v)

ws = wb['WOD_Standards']
idx = header_index(ws, 2)
tier_col = {t: col_for(idx, t) for t in TIER_KEYS}
seen = set()
for r in range(3, ws.max_row + 1):
    wid = ws.cell(row=r, column=idx['wod_id']).value
    sex = ws.cell(row=r, column=idx['sex']).value
    if wid in WOD_SOURCE:
        seen.add(wid)
        put(ws, r, idx['data_source'], WOD_SOURCE[wid])
        put(ws, r, idx['license_note'], WOD_LICENSE)
    if wid == 'hyrox_race':
        seen.add(wid)
        put(ws, r, idx['data_source'], HYROX_SOURCE[sex])
        put(ws, r, idx['license_note'], WOD_LICENSE)
        if sex == 'F':
            for t in TIER_KEYS:
                put(ws, r, tier_col[t], HYROX_F['pass_' if t == 'pass' else t])
assert seen == set(WOD_SOURCE) | {'hyrox_race'}, 'WOD rows missing'

hrs_changes = len(changes)
if hrs_changes:  # save only when something changed, so a re-run is a true no-op
    wb.save(HRS)

# -------------------------------------------------------------- Operator --

wb = openpyxl.load_workbook(OPS)
ws = wb['Standards']
idx = header_index(ws, 2)
seen = set()
for r in range(3, ws.max_row + 1):
    key = (ws.cell(row=r, column=idx['pathway']).value, ws.cell(row=r, column=idx['benchmark']).value)
    if key in OPERATOR_ROWS:
        seen.add(key)
        p, g, e, el, src = OPERATOR_ROWS[key]
        for name, v in (('pass', p), ('good', g), ('excellent', e), ('elite', el), ('source', src)):
            put(ws, r, idx[name], v)
assert seen == set(OPERATOR_ROWS), f'Operator rows missing: {set(OPERATOR_ROWS) - seen}'

ws = wb['README']
if not any(c.value == OPERATOR_README_LINE for c in ws['A']):
    ws.cell(row=ws.max_row + 2, column=1, value=OPERATOR_README_LINE)
    changes.append('README: appended the 2026-10-02 note')

if len(changes) > hrs_changes:
    wb.save(OPS)

print(f'{len(changes)} cell change(s):')
for c in changes:
    print('  ' + c)
