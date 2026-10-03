"""
Military top tiers — 2026-10-02 (the third Operator mirror that day, after
scripts/apply-permitted-sources-2026-10-02.py and
scripts/apply-navy-prt-and-military-tiers-2026-10-02.py).

Brings the Operator master in line with the TPF app's ORS
(tpf-app src/lib/operational_readiness.ts). The app's record is
tpf-app docs/build/54_MILITARY_TOP_TIERS_COMPARISON.md section 11.

This script is the record of every cell it changes. It edits
config/standards/TPF_Operator_Standards.xlsx in place. Then run
`npm run codegen` — the generated files are never hand-edited — and check the
result against the app with `npm run check:app-ors -- <path to tpf-app>`.

HOW IT IS BUILT, SO A LATER RUN CAN BE ADDED

The changes are a list of CHANGESETS, applied in order. Each is one owner
decision mirrored from the app: its moves (pathway, benchmark, column, OLD,
NEW, note), and one README line. To mirror a later change (another special-
forces tier pass, say), APPEND a changeset to the list — never edit an earlier
one, which is the record of what that run did.

  - Every move names the value it expects to find (OLD). A cell holding
    anything other than a value in its chain (OLD, then each later NEW) stops
    the script before anything is saved: the workbook has drifted from what
    this record assumes, and a person should look.
  - A cell moved by two changesets is a chain: the later changeset's OLD must
    be the earlier one's NEW (checked before anything is read).
  - The note is appended to the row's `source` column once (the column is
    provenance only; codegen does not emit it). A row moved twice carries
    both notes, in order.
  - Idempotent: a re-run sets the same final values, appends nothing, and
    saves nothing.
  - (Added 2026-10-03, for changeset 2.) A move on the `benchmark` column
    RENAMES its row. A row is tracked by the FIRST name it had, and a move may
    name it by any name in its chain, so a re-run (which finds the new name on
    the sheet) still finds it. A rename never changes the benchmark's id: the
    same changeset pins the `id` column to the id codegen made from the old
    name, because ids are stored (Supabase submissions and logs, the app sync
    in src/data/appSync.ts).
  - (Added 2026-10-03, for changeset 3.) A changeset may carry `verify`, a
    function run on the finished sheet before anything is saved; any error it
    returns stops the script with nothing saved.

CHANGESET 1 — plan 54 (the app's "compare, then borrow" rule, and Q9)

  The rule (the app's, tpf-app src/lib/benchmark_derived_tiers.ts): a ladder
  read off a GENERAL military table keeps Pass and Good on the table; its top
  tier is the HARDER of a comparison ladder's "elite for an operator" point and
  the table maximum plus TPF's margin. For push-ups (2 min) the comparison is
  the special-forces median top rung (100); for the plank it is the app's own
  operator plank Elite (4:30). So:
    - US Marine Corps: push-ups (2 min) Elite 96 -> 100; plank (front) Elite
      4:10 -> 4:30.
    - US Navy (PRT): forearm plank Elite 3:45 -> 4:30. Excellent stays at the
      table's Excellent High, 3:04 (the app's named override, plan 54 F5).

  Q9, the owner verbatim: "elite deadlift shoukd always be over 200kg adjust
  accordingly". Every pathway's conventional AND hex-bar deadlift Elite moves
  above 200 kg (the hex bar is the same deadlift slot in the app — the athlete
  picks which bar is scored — so a hex Elite left behind would make Elite
  reachable at a conventional-equivalent under 200 kg). TPF's method, not a
  source: conventional = the smallest 5 kg value over 200 that keeps the order
  between pathways; hex = the smallest value at least 1.06 x the new
  conventional that keeps the hex order. Pass, Good and Excellent unchanged.
  The three units the site has and the app does not (US Army Ranger RASP,
  UK Police JRFT, UK ARU / SCO19) have no deadlift row, so nothing is left
  under 200 kg.

CHANGESET 2 — plan 55 (special-forces and elite-unit tiers), added 2026-10-03

  The app's record is tpf-app docs/build/55_SPECIAL_FORCES_AND_ELITE_UNIT_TIERS.md
  section 10 (§10.2 is the old -> new table; every row marked ORS whose unit
  is mirrored here is in this changeset, except the deadlift Excellents,
  which are changeset 3). The owner's answers (2026-10-02), as the app built
  them:
    - Q4 "As you suggest": an SF top is the HARDER of the general Elite and
      the hardest general unit's top for the same event (plan 55 §4.1) —
      squat, bench, pull-ups, push-ups (2 min), sit-ups (2 min) and the UKSF /
      Pararescue deadlift Elites. Pararescue's bench and power clean carry
      weight 0 in both repositories (no score effect); the site holds the rows,
      so they are mirrored too.
    - Q2 (R1): SEAL / Pararescue 1.5-mile Elite 8:30 -> 8:15; Green Berets
      2-mile 12:00 -> 11:15.
    - Q3 "paras only": Para Reg 2 km Elite 6:45 -> 6:20. US Airborne by the
      general rule: 2-mile Excellent 13:30 -> 12:30, Elite 12:30 -> 11:45.
    - Q1 (option B): UKSF 5-mile @ 30 kg Elite 1:00:00 -> 55:00.
    - Q6 (ii) "Fan dance should be with proper weight": the Fan Dance names
      the selection load (18 kg bergen + rifle + water) and its Pass moves to
      the published cut-off, 4:00:00 -> 4:10:00. Good / Excellent / Elite kept.
    - Q5 "label conditions": the SEAL run and swim and the Pararescue swim
      take the app's labels (boots and trousers; the strokes allowed). No
      number converted.
  The four renamed rows keep their ids: `1_5_mile_run`, `500_m_swim` (twice)
  and `fan_dance_24_km_35_lb_rifle_optional` (an id still spelled with the old
  load — it is never shown; src/ui/format.ts gives the row its grid label).

CHANGESET 3 — the deadlift Excellent, evened out (the owner, 2026-10-03)

  Shown police at 90 / 115 / 140 / 205 kg, the owner: "Even it out a bit 170kg
  is barely elite, wouldn't say. Even [in] a police unit". On every unit and
  both bars (conventional and hex): Excellent = (Good + Elite) / 2 rounded to
  the nearest 5 kg, a half rounding up, and only ever raised (the app's
  §10.1). All 25 rows here rose. Pass, Good and Elite do not move, so Elite is
  still over 200 kg everywhere. `verify` re-derives every value from the
  sheet's own Good and Elite, and refuses a deadlift row the table left out.

CHANGESET 4 — the Fan Dance's faster tiers re-set (the owner, 2026-10-03)

  The app's record is tpf-app docs/build/55_SPECIAL_FORCES_AND_ELITE_UNIT_TIERS.md
  section 11.1. Told that the kept 3:00 Elite at the real selection load
  (about 23 kg) is close to unreachable, the owner: "adjust times then". On
  the UKSF Fan Dance only: Good 3:30:00 -> 3:55:00, Excellent 3:15:00 ->
  3:40:00, Elite 3:00:00 -> 3:30:00; Pass stays the published 4:10:00. TPF's
  method, not a source: the app's ruck model plus its own hilly-terrain band
  (x 1.15) for the ~1,100 m of ascent; Elite 3:30 is the harder 5-minute value
  that sits inside the special-forces ruck band and is slower than the best
  known 35 lb time carried to 23 kg; Good and Excellent split the 40 minutes
  20 : 15 : 15 like the tier percentages, to the nearest 5 min. The label did
  not change; the app's cite gained a sentence, quoted in the row's note (the
  site emits no cite). `verify` checks the row reads exactly the app's four
  values in seconds and is strictly ordered.

Requires: python3 with openpyxl (3.1.5 checked).
"""

import math
from pathlib import Path

import openpyxl

REPO = Path(__file__).resolve().parent.parent
OPS = REPO / 'config/standards/TPF_Operator_Standards.xlsx'

# ----------------------------------------------------------- changeset 1 --

PLAN54 = 'tpf-app mirror 2026-10-02 (plan 54 §11)'
DL_NOTE = ("Elite {old} -> {new} kg: the owner, 2026-10-02, an Elite deadlift is always over 200 kg; "
           "TPF's method (smallest 5 kg value over 200 keeping the order between pathways; hex at "
           f"least 1.06 x the conventional) — {PLAN54}")

# (site pathway, conventional old -> new or None, hex old -> new) — the app's §11.3 table.
DEADLIFTS = [
    ('US Police PFT', (160, 205), (170, 220)),
    ('US Navy (PRT)', (170, 210), (185, 225)),
    ('UK Parachute Regiment (P Coy)', (180, 215), (200, 235)),
    ('US Marine Corps (PFT/CFT)', (180, 215), (195, 230)),
    ('USAF Pararescue (PJ)', None, (195, 230)),
    ('US Army Airborne', (185, 220), (205, 240)),
    ('UK Special Forces (SAS/SBS)', (185, 220), (200, 235)),
    ('UK Royal Marines (Cdo Course)', (195, 225), (215, 250)),
    ('US Infantry', (195, 225), (210, 245)),
    ('Navy SEAL (BUD/S)', (195, 225), (215, 250)),
    ('UK Infantry', (195, 225), (210, 245)),
    ('US SWAT', (195, 225), (210, 245)),
    ('US Army Special Forces (SFAS)', (215, 230), (235, 255)),
]


def deadlift_moves():
    out = []
    for pathway, conv, hex_ in DEADLIFTS:
        for bench, pair in (('Conventional DL', conv), ('Hex-bar DL', hex_)):
            if pair:
                old, new = pair
                out.append((pathway, bench, 'elite', old, new, DL_NOTE.format(old=old, new=new)))
    return out


# ----------------------------------------------------------- changeset 2 --
# Added 2026-10-03. The app's values were read from its live
# ORS_PATHWAY_CONFIGS (tpf-app src/lib/operational_readiness.ts) and its
# record, tpf-app docs/build/55_SPECIAL_FORCES_AND_ELITE_UNIT_TIERS.md §10.2.

PLAN55 = 'tpf-app mirror 2026-10-03 (plan 55 §10.2)'
SEAL, PJ, SFAS = 'Navy SEAL (BUD/S)', 'USAF Pararescue (PJ)', 'US Army Special Forces (SFAS)'
UKSF, PARA, ABN = 'UK Special Forces (SAS/SBS)', 'UK Parachute Regiment (P Coy)', 'US Army Airborne'

SF_TOP_NOTE = ("Elite {old} -> {new}: a special-forces top is the harder of the general Elite and the "
               "hardest general unit's top for the event (the owner, 2026-10-02: 'As you suggest', "
               "plan 55 §4.1) — " + PLAN55)
SF_TOP_ZERO_WEIGHT_NOTE = ("Elite {old} -> {new}: consistency with the other special-forces tops (plan 55 "
                           "§4.1); weight 0 here and in the app, so no score effect — " + PLAN55)

# (unit, benchmark, old Elite, new Elite) — plan 55 Q4, §4.1's change table.
SF_TOPS = [
    (SEAL, 'Back Squat', 180, 190), (SEAL, 'Bench Press', 140, 160),
    (SEAL, 'Pull-ups (no time)', 22, 25), (SEAL, 'Push-ups (2 min)', 100, 105),
    (PJ, 'Back Squat', 175, 190), (PJ, 'Hex-bar DL', 230, 245),
    (PJ, 'Pull-ups (no time)', 22, 25), (PJ, 'Push-ups (2 min)', 100, 105), (PJ, 'Sit-ups (2 min)', 100, 110),
    (SFAS, 'Bench Press', 155, 160), (SFAS, 'Push-ups (2 min)', 100, 105), (SFAS, 'Sit-ups (2 min)', 100, 110),
    (UKSF, 'Back Squat', 165, 190), (UKSF, 'Conventional DL', 220, 225), (UKSF, 'Hex-bar DL', 235, 245),
    (UKSF, 'Bench Press', 140, 160), (UKSF, 'Pull-ups (no time)', 22, 25), (UKSF, 'Push-ups (2 min)', 100, 105),
]
SF_TOPS_ZERO_WEIGHT = [(PJ, 'Bench Press', 135, 160), (PJ, 'Power Clean', 110, 120)]

RUN_R1_NOTE = ("Elite {old} -> {new}: a special-forces run top is at least the general Advanced and the "
               "fastest published maximum (plan 55 R1; the owner, 2026-10-02: 'if recommended are 1.5 mile "
               "fine') — " + PLAN55)
LABEL_NOTE = ("Renamed '{old}' -> '{new}', the app's label, which states the test's conditions (the owner, "
              "2026-10-02: 'label conditions'); no number converted; id pinned to '{id}' so stored results "
              "and the app sync still match — " + PLAN55)
FAN_DANCE_OLD = 'Fan Dance (24 km @ 35 lb + rifle) — optional'
FAN_DANCE_NEW = 'Fan Dance (24 km, 18 kg bergen + rifle + water) — optional'
FAN_DANCE_NOTE = ("The selection load and its published cut-off (the owner, 2026-10-02: 'Fan dance should be "
                  "with proper weight'): renamed from '" + FAN_DANCE_OLD + "'; Pass 4:00:00 -> 4:10:00; Good, "
                  "Excellent and Elite kept; the app's cite: 'UKSF selection Fan Dance: 4 h 10 min allowed; "
                  "18 kg bergen + rifle + water (third-party accounts)' (plan 55 §10.3); id pinned to "
                  "'fan_dance_24_km_35_lb_rifle_optional' so stored results still match — " + PLAN55)


def rename(unit, old, new, bid, note):
    """A rename is two moves on one row: the name, and the id pinned to the
    one codegen made from the old name (blank -> that id)."""
    return [(unit, old, 'benchmark', old, new, note), (unit, old, 'id', None, bid, note)]


def sf_moves():
    out = [(u, b, 'elite', o, n, SF_TOP_NOTE.format(old=o, new=n)) for u, b, o, n in SF_TOPS]
    out += [(u, b, 'elite', o, n, SF_TOP_ZERO_WEIGHT_NOTE.format(old=o, new=n)) for u, b, o, n in SF_TOPS_ZERO_WEIGHT]
    out += [
        # Runs (Q2 R1, Q3).
        (SEAL, '1.5-mile run', 'elite', '8:30', '8:15', RUN_R1_NOTE.format(old='8:30', new='8:15')),
        (PJ, '1.5-mile run', 'elite', '8:30', '8:15', RUN_R1_NOTE.format(old='8:30', new='8:15')),
        (SFAS, '2-mile run', 'elite', '12:00', '11:15', RUN_R1_NOTE.format(old='12:00', new='11:15')),
        (PARA, '2 km run (best effort)', 'elite', '6:45', '6:20',
         "Elite 6:45 -> 6:20: the paras may be the fastest runners (the owner, 2026-10-02: 'paras only', "
         "plan 55 Q3) — " + PLAN55),
        *[(ABN, '2-mile run', tier, o, n,
           "Excellent 13:30 -> 12:30 and Elite 12:30 -> 11:45: the general rule for runs — the AFT Benchmarks "
           "test's 'Elite' rung and Tier 1 (plan 55 Q3) — " + PLAN55)
          for tier, o, n in (('excellent', '13:30', '12:30'), ('elite', '12:30', '11:45'))],
        # Rucks (Q1 option B, Q6).
        (UKSF, '5-mile ruck (30 kg)', 'elite', '1:00:00', '55:00',
         "Elite 1:00:00 -> 55:00: special-forces ruck tops lead every general unit's (plan 55 Q1, option B); "
         "the app's cite: 'UK SF 5-mile @ 30 kg — 15 min/mile pass; 11 min/mile elite (TPF, plan 55)' — " + PLAN55),
        (UKSF, FAN_DANCE_OLD, 'pass', '4:00:00', '4:10:00', FAN_DANCE_NOTE),
        *rename(UKSF, FAN_DANCE_OLD, FAN_DANCE_NEW, 'fan_dance_24_km_35_lb_rifle_optional', FAN_DANCE_NOTE),
    ]
    # Condition labels (Q5).
    for unit, old, new, bid in (
        (SEAL, '1.5-mile run', '1.5-mile run (PST: in boots and trousers)', '1_5_mile_run'),
        (SEAL, '500 m swim', '500 m swim (PST: 500 yd sidestroke or breaststroke, converted)', '500_m_swim'),
        (PJ, '500 m swim', '500 m swim (PAST: freestyle, breaststroke or sidestroke)', '500_m_swim'),
    ):
        out += rename(unit, old, new, bid, LABEL_NOTE.format(old=old, new=new, id=bid))
    return out


# ----------------------------------------------------------- changeset 3 --
# Added 2026-10-03. Excellent = round5((Good + Elite) / 2), a half rounding
# up, only ever raised. (unit, conventional old -> new or None, hex old -> new)
# — the app's §10.2 rows for the mirrored units. The app's us_army / uk_army /
# tactical / firefighter / air_force rows are not mirrored here.

DL_EXCELLENT_NOTE = ("Excellent {old} -> {new} kg: (Good + Elite) / 2 rounded to the nearest 5 kg, a half "
                     "rounding up, only ever raised (the owner, 2026-10-03: 'Even it out a bit 170kg is barely "
                     "elite') — tpf-app mirror 2026-10-03 (plan 55 §10.1)")

DL_EXCELLENTS = [
    (SEAL, (175, 185), (190, 205)),
    (PJ, None, (170, 195)),
    (SFAS, (195, 200), (210, 220)),
    (UKSF, (165, 185), (175, 205)),
    (PARA, (160, 175), (180, 190)),
    (ABN, (165, 180), (185, 195)),
    ('UK Royal Marines (Cdo Course)', (175, 185), (190, 205)),
    ('US Marine Corps (PFT/CFT)', (160, 175), (175, 190)),
    ('US Navy (PRT)', (145, 165), (160, 180)),
    ('US Infantry', (170, 185), (185, 200)),
    ('UK Infantry', (170, 185), (185, 200)),
    ('US Police PFT', (140, 160), (150, 175)),
    ('US SWAT', (170, 185), (185, 205)),
]
DL_BARS = ('Conventional DL', 'Hex-bar DL')


def round5(kg):
    """Nearest 5 kg, a half rounding UP (Python's round() rounds a half to even)."""
    return int(math.floor(kg / 5 + 0.5)) * 5


def dl_excellent_moves():
    out = []
    for unit, conv, hex_ in DL_EXCELLENTS:
        for bench, pair in zip(DL_BARS, (conv, hex_)):
            if pair:
                old, new = pair
                out.append((unit, bench, 'excellent', old, new, DL_EXCELLENT_NOTE.format(old=old, new=new)))
    return out


def verify_dl_excellent(ws, idx, rows):
    """Every deadlift row on the sheet is in DL_EXCELLENTS, and each new
    Excellent is max(old, round5((Good + Elite) / 2)) on the FINISHED sheet."""
    errors = []
    listed = {(unit, bench): pair for unit, conv, hex_ in DL_EXCELLENTS
              for bench, pair in zip(DL_BARS, (conv, hex_)) if pair}
    on_sheet = {k for k in rows if k[1] in DL_BARS}
    for k in sorted(on_sheet - set(listed)):
        errors.append(f'{k}: a deadlift row the changeset does not list')
    for k in sorted(set(listed) - on_sheet):
        errors.append(f'{k}: listed, but no such deadlift row on the sheet')
    for k in sorted(on_sheet & set(listed)):
        r = rows[k]
        good, elite, exc = (ws.cell(row=r, column=idx[c]).value for c in ('good', 'elite', 'excellent'))
        want = max(listed[k][0], round5((good + elite) / 2))
        if exc != want or listed[k][1] != want:
            errors.append(f'{k}: Good {good}, Elite {elite} -> Excellent should be {want}; '
                          f'the table says {listed[k][1]}, the sheet holds {exc}')
    return errors


# ----------------------------------------------------------- changeset 4 --
# Added 2026-10-03. The app's values were read from its live
# ORS_PATHWAY_CONFIGS (uksf `fan_dance`: pass 4*3600+10*60, good 3*3600+55*60,
# excellent 3*3600+40*60, elite 3.5*3600) and its record, tpf-app
# docs/build/55_SPECIAL_FORCES_AND_ELITE_UNIT_TIERS.md §11.1.

FAN_DANCE_TIMES_NOTE = (
    "Good 3:30:00 -> 3:55:00, Excellent 3:15:00 -> 3:40:00, Elite 3:00:00 -> 3:30:00; Pass kept at the "
    "published 4:10:00 (the owner, 2026-10-03, told a 3:00 Elite at the ~23 kg selection load is close to "
    "unreachable: 'adjust times then'). TPF's method, not a source: the app's ruck model plus its "
    "hilly-terrain band (x 1.15) for the ~1,100 m of ascent; Elite 3:30 reads 2:16:38 on the app's "
    "12 mi @ 35 lb scale (inside the special-forces band, between Pararescue and the Rangers) and is slower "
    "than the best known 35 lb time (3:14, third-party) carried to 23 kg; Good and Excellent split the "
    "40 minutes 20 : 15 : 15 like the tier percentages, to the nearest 5 min. Label unchanged; the app's "
    "cite now reads: 'UKSF selection Fan Dance: 4 h 10 min allowed; 18 kg bergen + rifle + water "
    "(third-party accounts). Faster tiers TPF's: the ruck model plus a hilly-terrain climb allowance "
    "(plan 55 §11)' — tpf-app mirror 2026-10-03 (plan 55 §11.1)")

# The app's Pass / Good / Excellent / Elite, in seconds, for `verify` (h:mm:ss strings on the sheet).
FAN_DANCE_APP_SEC = [15000, 14100, 13200, 12600]


def hms_to_sec(v):
    """The sheet's h:mm:ss string (rucks) to seconds, as codegen-operator.mjs reads it."""
    out = 0
    for part in str(v).split(':'):
        out = out * 60 + int(part)
    return out


def verify_fan_dance(ws, idx, rows):
    """The Fan Dance row reads exactly the app's four values, strictly ordered
    (lower is better: Pass slowest, Elite fastest)."""
    key = row_key(UKSF, FAN_DANCE_NEW)
    if key not in rows:
        return [f'{key}: no such row on the sheet']
    r = rows[key]
    got = [hms_to_sec(ws.cell(row=r, column=idx[c]).value) for c in ('pass', 'good', 'excellent', 'elite')]
    want = FAN_DANCE_APP_SEC
    errors = []
    if got != want:
        errors.append(f'{key}: the sheet reads {got} s, the app {want} s')
    if not all(a > b for a, b in zip(got, got[1:])):
        errors.append(f'{key}: not strictly ordered (lower is better): {got}')
    return errors


CHANGESETS = [
    dict(
        name='plan 54: compare-then-borrow top tiers; the deadlift Elite always over 200 kg',
        moves=[
            ('US Marine Corps (PFT/CFT)', 'Push-ups (2 min)', 'elite', 96, 100,
             'Elite 96 -> 100: the harder of the special-forces median top rung (100) and the PFT '
             f'maximum + margin (96) — {PLAN54}'),
            ('US Marine Corps (PFT/CFT)', 'Plank (front)', 'elite', '4:10', '4:30',
             "Elite 4:10 -> 4:30: the harder of the app's operator plank Elite (4:30) and the PFT "
             f'maximum + margin (4:10) — {PLAN54}'),
            ('US Navy (PRT)', 'Forearm plank', 'elite', '3:45', '4:30',
             "Elite 3:45 -> 4:30: the harder of the app's operator plank Elite (4:30) and Outstanding "
             f'High + margin (3:45); Excellent kept at Excellent High 3:04 (plan 54 F5) — {PLAN54}'),
            *deadlift_moves(),
        ],
        readme=(
            "2026-10-02, latest (military top tiers, tpf-app mirror; record: tpf-app "
            "docs/build/54_MILITARY_TOP_TIERS_COMPARISON.md section 11): the top tier of a general "
            "military ladder is now the HARDER of a comparison ladder's elite point and the table "
            "maximum + TPF's margin — USMC push-ups (2 min) Elite 96 -> 100, USMC plank 4:10 -> 4:30, "
            "Navy PRT forearm plank 3:45 -> 4:30. And, the owner: an Elite deadlift is always over "
            "200 kg — every unit's conventional and hex-bar deadlift Elite moved to 205-255 kg by "
            "TPF's method (order between units kept; hex at least 1.06 x conventional); Pass, Good "
            "and Excellent unchanged. Script: scripts/apply-military-top-tiers-2026-10-02.py."
        ),
    ),
    dict(
        name='plan 55: special-forces and elite-unit tiers, condition labels, the Fan Dance load',
        moves=sf_moves(),
        readme=(
            "2026-10-03 (special-forces and elite-unit tiers, tpf-app mirror; record: tpf-app "
            "docs/build/55_SPECIAL_FORCES_AND_ELITE_UNIT_TIERS.md section 10.2): a special-forces top is "
            "the harder of the general Elite and the hardest general unit's top — SEAL, Pararescue, SFAS "
            "and UKSF squat / bench / pull-ups / push-ups / sit-ups Elites raised (squat 190, bench 160, "
            "pull-ups 25, push-ups 105, sit-ups 110), UKSF deadlift Elites 225 / 245, Pararescue hex 245. "
            "Runs: SEAL / Pararescue 1.5-mile Elite 8:15, SFAS 2-mile 11:15, Para Reg 2 km 6:20, US "
            "Airborne 2-mile Excellent 12:30 / Elite 11:45. UKSF 5-mile @ 30 kg Elite 55:00. The Fan "
            "Dance names the selection load (18 kg bergen + rifle + water) and Pass moved to the published "
            "4:10:00. The SEAL run and swim and the Pararescue swim name their conditions (the owner: "
            "'label conditions'); renamed rows keep their ids (the `id` column). Script: "
            "scripts/apply-military-top-tiers-2026-10-02.py."
        ),
    ),
    dict(
        name='the deadlift Excellent evened out (the owner, 2026-10-03)',
        moves=dl_excellent_moves(),
        verify=verify_dl_excellent,
        readme=(
            "2026-10-03, later (the deadlift Excellent evened out, tpf-app mirror; record: tpf-app "
            "docs/build/55_SPECIAL_FORCES_AND_ELITE_UNIT_TIERS.md section 10.1): the owner, shown police at "
            "90 / 115 / 140 / 205 kg, 'Even it out a bit 170kg is barely elite'. On every unit and both "
            "bars, Excellent = (Good + Elite) / 2 rounded to the nearest 5 kg (a half rounds up), only "
            "ever raised — all 25 deadlift rows here rose; Pass, Good and Elite unchanged. Script: "
            "scripts/apply-military-top-tiers-2026-10-02.py."
        ),
    ),
    dict(
        name="the Fan Dance's faster tiers re-set for the selection load (the owner, 2026-10-03)",
        moves=[
            (UKSF, FAN_DANCE_NEW, 'good', '3:30:00', '3:55:00', FAN_DANCE_TIMES_NOTE),
            (UKSF, FAN_DANCE_NEW, 'excellent', '3:15:00', '3:40:00', FAN_DANCE_TIMES_NOTE),
            (UKSF, FAN_DANCE_NEW, 'elite', '3:00:00', '3:30:00', FAN_DANCE_TIMES_NOTE),
        ],
        verify=verify_fan_dance,
        readme=(
            "2026-10-03, latest (the Fan Dance's faster tiers, tpf-app mirror; record: tpf-app "
            "docs/build/55_SPECIAL_FORCES_AND_ELITE_UNIT_TIERS.md section 11.1): told the kept 3:00 Elite at "
            "the ~23 kg selection load is close to unreachable, the owner: 'adjust times then'. UKSF Fan Dance "
            "Good 3:30:00 -> 3:55:00, Excellent 3:15:00 -> 3:40:00, Elite 3:00:00 -> 3:30:00; Pass stays the "
            "published 4:10:00. TPF's method (the app's ruck model plus its hilly-terrain band for the "
            "~1,100 m climb), not a source. Script: scripts/apply-military-top-tiers-2026-10-02.py."
        ),
    ),
    # A later mirror: APPEND a dict here (name, moves, readme[, verify]). Do not edit the ones above.
]

# ---------------------------------------------------------------- helpers --

changes = []


def put(ws, row, col, value):
    cell = ws.cell(row=row, column=col)
    if cell.value != value:
        changes.append(f'{ws.title}!{cell.coordinate}: {cell.value!r} -> {value!r}')
        cell.value = value


def header_index(ws, header_row):
    return {str(c.value).strip().lower(): c.column for c in ws[header_row] if c.value is not None}


# Renames (2026-10-03): a move on the `benchmark` column renames its row. Each
# row is tracked by the FIRST name it had; every name it has had maps to that.
first_name = {}  # (pathway, any name the row has had) -> (pathway, its first name)


def row_key(pathway, bench):
    return first_name.get((pathway, bench), (pathway, bench))


for cs in CHANGESETS:
    for pathway, bench, col, old, new, note in cs['moves']:
        if col == 'benchmark':
            assert row_key(pathway, old) == row_key(pathway, bench), (
                f"{cs['name']}: the rename of {(pathway, bench)} expects {old!r}, which is not one of its names")
            assert (pathway, new) not in first_name, f"{cs['name']}: {(pathway, new)} is already a row's name"
            first_name[(pathway, new)] = row_key(pathway, bench)

# Build each cell's chain of values and its notes, checking the changesets
# agree with each other before the workbook is opened.
chains = {}  # (pathway, first benchmark name, column) -> [old, new, newer, ...]
notes = {}   # (pathway, first benchmark name) -> [note, ...]
for cs in CHANGESETS:
    for pathway, bench, col, old, new, note in cs['moves']:
        key = (*row_key(pathway, bench), col)
        if key in chains:
            assert chains[key][-1] == old, (
                f"{cs['name']}: {key} expects {old!r}, but an earlier changeset left {chains[key][-1]!r}")
            chains[key].append(new)
        else:
            chains[key] = [old, new]
        notes.setdefault(row_key(pathway, bench), []).append(note)

wb = openpyxl.load_workbook(OPS)

# ---------------------------------------------------------- Standards sheet --

ws = wb['Standards']
HEADER = 2
idx = header_index(ws, HEADER)
rows = {}  # (pathway, first benchmark name) -> sheet row
for r in range(HEADER + 1, ws.max_row + 1):
    pathway, bench = ws.cell(row=r, column=idx['pathway']).value, ws.cell(row=r, column=idx['benchmark']).value
    if pathway is None:
        continue
    key = row_key(pathway, bench)
    assert key not in rows, f'duplicate row {key} (sheet name {bench!r})'
    rows[key] = r

missing = sorted({(p, b) for p, b, _ in chains} - set(rows))
assert not missing, f'rows not on the sheet: {missing}'

drift = []
for (pathway, bench, col), chain in chains.items():
    current = ws.cell(row=rows[(pathway, bench)], column=idx[col]).value
    if current not in chain:
        drift.append(f'{pathway} / {bench} / {col}: found {current!r}, expected one of {chain!r}')
if drift:
    raise SystemExit('The workbook has drifted from this record; nothing was saved:\n  ' + '\n  '.join(drift))

for (pathway, bench, col), chain in chains.items():
    put(ws, rows[(pathway, bench)], idx[col], chain[-1])

for (pathway, bench), ns in notes.items():
    r = rows[(pathway, bench)]
    source = ws.cell(row=r, column=idx['source']).value or ''
    for n in ns:
        if n not in source:
            source = f'{source}; {n}' if source else n
    put(ws, r, idx['source'], source)

# A changeset's own check of the finished sheet (2026-10-03); nothing is saved
# if any fails.
failed = [f"{cs['name']}: {e}" for cs in CHANGESETS if cs.get('verify') for e in cs['verify'](ws, idx, rows)]
if failed:
    raise SystemExit('A changeset check failed; nothing was saved:\n  ' + '\n  '.join(failed))

# ------------------------------------------------------------------- README --

ws = wb['README']
for cs in CHANGESETS:
    if not any(c.value == cs['readme'] for c in ws['A']):
        ws.cell(row=ws.max_row + 2, column=1, value=cs['readme'])
        changes.append(f"README: appended the note for '{cs['name']}'")

if changes:  # save only when something changed, so a re-run is a true no-op
    wb.save(OPS)

print(f'{len(changes)} cell change(s):')
for c in changes:
    print('  ' + c)
