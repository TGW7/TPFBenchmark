"""
Navy PRT pathway + the minimum / good / maximum rule — 2026-10-02 (later the
same day as scripts/apply-permitted-sources-2026-10-02.py).

Brings the Operator master in line with the TPF app's ORS
(tpf-app src/lib/operational_readiness.ts; the record is tpf-app
docs/build/51_STANDARDS_REBUILD_2026-10-02.md section 11).

Owner, 2026-10-02, answering the app's question on the Navy and Air Force
pathways: "Use navy tables. Military standards should be roughly
interchangeable but generally considered low as they are unlikely to consider
special forces. Be careful to differentiate between minimum standards and good
standards too, as minimums are often very low."

This script is the record of every cell it changes. It edits
config/standards/TPF_Operator_Standards.xlsx in place and is idempotent
(re-running it sets the same values again, and saves nothing when nothing
changed). Then run `npm run codegen` — the generated files are never
hand-edited.

What changes

  THE RULE (the app's, stated in tpf-app src/lib/benchmark_derived_tiers.ts):
  a ladder read off a GENERAL military score table puts the official minimum
  at Pass at most, an official "good" standard in the middle tiers, and the
  official MAXIMUM at Excellent at most — Elite sits strictly above it. No
  published number exists above a general table's maximum, so Elite is TPF's
  stated margin: the maximum + 10 % (reps, hold time, load) or - 5 % (time),
  rounded to the event's step (1 rep, 5 s) — `aboveMilitaryMax` in the app.
  A judgement, not data (the app's section 11.6 Q1 asks the owner).

  NUMBERS (each the app's new value):
    - US Marine Corps: Elite was the PFT maximum; now above it —
      3-mile run 18:00 -> 17:05, pull-ups 23 -> 25, push-ups (2 min) 87 -> 96,
      plank (front) 3:45 -> 4:10. Pass / Good / Excellent unchanged.
    - US Police PFT: Elite was each table's maximum; now above it —
      1.5-mile run 8:30 -> 8:05 (Navy PRT 20-24 Outstanding High 8:30),
      push-ups (1 min) 67 -> 74 and sit-ups (1 min) 58 -> 64 (USAF PFRA,
      men under 25). Pass / Good / Excellent unchanged.
    - Navy SEAL (BUD/S): pull-ups Pass 8 -> 10. Pass was BELOW the BUD/S PST
      minimum of 10, so a candidate who would fail the PST read "Pass".
    - NEW unit "US Navy (PRT)" — the app's `navy` pathway, which until today
      was a copy of the app's US Army baseline (never mirrored here: the
      curated set drops the generic army units). It now reads the US Navy
      PRT's own table — PRP Guide-5, Physical Readiness Test, JAN 2025,
      Table 4-1, a US government work — the MEN 17-19 column (ORS has no sex
      split; every US unit reads its table's youngest men's column):
      Pass = Probationary, Good = Good High, Excellent = Excellent High,
      Elite above Outstanding High (the margin above). Events: push-ups
      (2 min), forearm plank, and ONE cardio event — the 1.5-mile run, or
      "alternate cardio, if authorized": a 2,000 m row, a 500-yd swim or a
      450 m swim. Strength, grip and power are TPF's own (the app shares its
      US Army baseline's rows by reference). Weights: running 35 (the cardio
      event), upper endurance 20, stability 20, lower strength 10, upper
      strength 5, grip 5, power 5 — the app's, TPF judgement.

  NEW COLUMNS in the Standards sheet (blank on every existing row, so every
  existing benchmark is unchanged):
    - `id` — overrides the benchmark id codegen otherwise makes from the
      name. Used twice, on the Navy unit, so its entries share an id with an
      existing input: the 2 km row is `row_2k` (the id the app-sync layer
      already maps to the app's Race Times 2 km row, which is the record the
      app's Navy pathway reads) and the forearm plank is `plank_front` (the
      id every other unit's plank uses — the app scores one `plank` input
      across all pathways).
    - `alternative_group` — benchmarks in one component sharing a group are
      ALTERNATIVES: the component counts the group ONCE, at its best member
      (the app's `ORSBenchmark.alternativeGroup`). Only the Navy cardio event
      has one (`prt_cardio`).

Requires: python3 with openpyxl (3.1.5 checked).
"""

from pathlib import Path

import openpyxl

REPO = Path(__file__).resolve().parent.parent
OPS = REPO / 'config/standards/TPF_Operator_Standards.xlsx'

DATE = '2026-10-02'
MIRROR = f'tpf-app mirror {DATE}'
MARGIN = "TPF margin above the table maximum: +10 % reps / hold, -5 % time"

# ------------------------------------------------- existing rows that move --

# (pathway, benchmark): {column: value}. Only the named columns change.
MOVES = {
    ('US Marine Corps (PFT/CFT)', '3-mile run'): dict(
        elite='17:05',
        source=f'ORS (tpf-app mirror 2026-07-16); Elite above the PFT maximum 18:00 ({MARGIN}) — {MIRROR}'),
    ('US Marine Corps (PFT/CFT)', 'Pull-ups (no time)'): dict(
        elite=25,
        source=f'ORS (tpf-app mirror 2026-07-16); Elite above the PFT maximum 23 ({MARGIN}) — {MIRROR}'),
    ('US Marine Corps (PFT/CFT)', 'Push-ups (2 min)'): dict(
        elite=96,
        source=f'ORS (tpf-app mirror 2026-07-16); Elite above the PFT maximum 87 ({MARGIN}) — {MIRROR}'),
    ('US Marine Corps (PFT/CFT)', 'Plank (front)'): dict(
        elite='4:10',
        source=f'ORS (tpf-app mirror 2026-07-16); Elite above the PFT maximum 3:45 ({MARGIN}) — {MIRROR}'),
    ('US Police PFT', '1.5-mile run'): dict(
        elite='8:05',
        source=('US Navy PRT 1.5-mile, men 20-24 (Guide-5, Jan 2025, a US government work); '
                f'Elite above Outstanding High 8:30 ({MARGIN}) — {MIRROR}')),
    ('US Police PFT', 'Push-ups (1 min)'): dict(
        elite=74,
        source=('USAF PFRA 1-min push-ups, men under 25 (eff. 1 Mar 2026, a US government work); '
                f'Elite above the maximum 67 ({MARGIN}) — {MIRROR}')),
    ('US Police PFT', 'Sit-ups (1 min)'): dict(
        elite=64,
        source=('USAF PFRA 1-min sit-ups, men under 25 (eff. 1 Mar 2026, a US government work); '
                f'Elite above the maximum 58 ({MARGIN}) — {MIRROR}')),
    ('Navy SEAL (BUD/S)', 'Pull-ups (no time)'): dict(
        **{'pass': 10},
        source=f'ORS (tpf-app mirror 2026-07-16); Pass = the BUD/S PST minimum of 10 (was 8, below it) — {MIRROR}'),
}

# ------------------------------------------------------------ the Navy unit --

NAVY = 'US Navy (PRT)'
INSERT_AFTER = 'US Infantry'  # keeps the US general-service units together
NAVY_CITE = ('US Navy PRT Guide-5 (Jan 2025, a US government work), men 17-19: Probationary / '
             'Good High / Excellent High; Elite above Outstanding High (TPF margin: +10 % reps / '
             f'hold, -5 % time) — {MIRROR}')
TPF_OWN = ("TPF's own (the app's general-military row, shared with its US Army baseline; "
           f'the PRT has no strength, grip or power event) — {MIRROR}')

# (component, benchmark, unit, direction, pass, good, excellent, elite, id, alternative_group, source)
# Navy cells, men 17-19 (Probationary / Good High / Excellent High / Outstanding High):
#   1.5-mile 12:45 / 10:00 / 9:15 / 8:15     2,000 m row 9:20 / 8:10 / 7:30 / 7:00
#   500-yd swim 12:45 / 9:15 / 7:45 / 6:30   450 m swim 12:35 / 9:05 / 7:35 / 6:20
#   push-ups (2 min) 42 / 68 / 82 / 92       forearm plank 1:11 / 2:23 / 3:04 / 3:24
NAVY_ROWS = [
    ('running', '1.5-mile run', 'sec', 'lower-is-better', '12:45', '10:00', '9:15', '7:50', None, 'prt_cardio', NAVY_CITE),
    ('running', '2 km row (alternate)', 'sec', 'lower-is-better', '9:20', '8:10', '7:30', '6:40', 'row_2k', 'prt_cardio', NAVY_CITE),
    ('running', '500-yd swim (alternate)', 'sec', 'lower-is-better', '12:45', '9:15', '7:45', '6:10', None, 'prt_cardio', NAVY_CITE),
    ('running', '450 m swim (alternate)', 'sec', 'lower-is-better', '12:35', '9:05', '7:35', '6:00', None, 'prt_cardio', NAVY_CITE),
    ('lower_strength', 'Back Squat', 'kg', 'higher-is-better', 80, 105, 130, 155, None, None, TPF_OWN),
    ('lower_strength', 'Hex-bar DL', 'kg', 'higher-is-better', 100, 130, 160, 185, None, None, TPF_OWN),
    ('lower_strength', 'Conventional DL', 'kg', 'higher-is-better', 90, 115, 145, 170, None, None, TPF_OWN),
    ('upper_strength', 'Bench Press', 'kg', 'higher-is-better', 60, 80, 100, 120, None, None, TPF_OWN),
    ('upper_endurance', 'Push-ups (2 min)', 'reps', 'higher-is-better', 42, 68, 82, 101, None, None, NAVY_CITE),
    ('stability', 'Forearm plank', 'sec', 'higher-is-better', '1:11', '2:23', '3:04', '3:45', 'plank_front', None, NAVY_CITE),
    ('grip', 'Dead hang (grip)', 'sec', 'higher-is-better', '0:30', '0:50', '1:15', '1:40', None, None, TPF_OWN),
    ('power', 'Power Clean', 'kg', 'higher-is-better', 50, 70, 90, 110, None, None, TPF_OWN),
    ('power', 'Broad Jump', 'm', 'higher-is-better', 1.7, 1.9, 2.1, 2.3, None, None, TPF_OWN),
]

NAVY_WEIGHTS = dict(running=35, rucking=0, swimming=0, lower_strength=10, upper_strength=5,
                    upper_endurance=20, core_endurance=0, stability=20, grip=5, power=5)

README_LINE = (
    f"{DATE}, later (Navy PRT + the minimum / good / maximum rule, tpf-app mirror): a ladder "
    "read off a general military table puts the official maximum at Excellent at most, with "
    "Elite above it (TPF's margin: +10 % reps / hold, -5 % time) — USMC and US Police PFT "
    "Elites moved; SEAL pull-up Pass raised to the PST minimum (10). New unit 'US Navy (PRT)' "
    "on the Navy PRT Guide-5 (Jan 2025) table, men 17-19. Two new columns: 'id' (overrides "
    "the id codegen makes from the name; blank = as before) and 'alternative_group' "
    "(benchmarks sharing one score once, at the best — the Navy cardio event). Record: "
    "scripts/apply-navy-prt-and-military-tiers-2026-10-02.py."
)

# ---------------------------------------------------------------- helpers --

changes = []


def put(ws, row, col, value):
    cell = ws.cell(row=row, column=col)
    if cell.value != value:
        changes.append(f'{ws.title}!{cell.coordinate}: {cell.value!r} -> {value!r}')
        cell.value = value


def header_index(ws, header_row):
    return {str(c.value).strip().lower(): c.column for c in ws[header_row] if c.value is not None}


wb = openpyxl.load_workbook(OPS)

# ---------------------------------------------------------- Standards sheet --

ws = wb['Standards']
HEADER = 2
idx = header_index(ws, HEADER)
for name in ('id', 'alternative_group'):
    if name not in idx:
        col = max(idx.values()) + 1
        put(ws, HEADER, col, name)
        idx[name] = col


def key_of(r):
    return (ws.cell(row=r, column=idx['pathway']).value, ws.cell(row=r, column=idx['benchmark']).value)


seen = set()
for r in range(HEADER + 1, ws.max_row + 1):
    key = key_of(r)
    if key in MOVES:
        seen.add(key)
        for k, v in MOVES[key].items():
            put(ws, r, idx[k], v)
assert seen == set(MOVES), f'rows missing: {set(MOVES) - seen}'

# The Navy unit: update in place when present, else insert after INSERT_AFTER.
navy_rows = [r for r in range(HEADER + 1, ws.max_row + 1) if key_of(r)[0] == NAVY]
if not navy_rows:
    anchor = max(r for r in range(HEADER + 1, ws.max_row + 1) if key_of(r)[0] == INSERT_AFTER)
    ws.insert_rows(anchor + 1, amount=len(NAVY_ROWS))
    navy_rows = list(range(anchor + 1, anchor + 1 + len(NAVY_ROWS)))
assert len(navy_rows) == len(NAVY_ROWS), f'{NAVY}: {len(navy_rows)} rows on the sheet, {len(NAVY_ROWS)} expected'
for r, (component, bench, unit, direction, p, g, e, el, bid, group, src) in zip(navy_rows, NAVY_ROWS):
    values = {'region': 'US', 'pathway': NAVY, 'component': component, 'benchmark': bench,
              'unit': unit, 'direction': direction, 'pass': p, 'good': g, 'excellent': e,
              'elite': el, 'inferred': None, 'source': src, 'id': bid, 'alternative_group': group}
    for k, v in values.items():
        put(ws, r, idx[k], v)

# ------------------------------------------------------------ Weights sheet --

ws = wb['Weights']
widx = header_index(ws, 1)
assert sum(NAVY_WEIGHTS.values()) == 100
row = next((r for r in range(2, ws.max_row + 1) if ws.cell(row=r, column=widx['pathway']).value == NAVY), None)
if row is None:
    row = ws.max_row + 1
put(ws, row, widx['region'], 'US')
put(ws, row, widx['pathway'], NAVY)
for comp, w in NAVY_WEIGHTS.items():
    put(ws, row, widx[comp], w)
put(ws, row, widx['sum'], sum(NAVY_WEIGHTS.values()))

# ------------------------------------------------------------------- README --

ws = wb['README']
if not any(c.value == README_LINE for c in ws['A']):
    ws.cell(row=ws.max_row + 2, column=1, value=README_LINE)
    changes.append('README: appended the Navy PRT / military-rule note')

if changes:  # save only when something changed, so a re-run is a true no-op
    wb.save(OPS)

print(f'{len(changes)} cell change(s):')
for c in changes:
    print('  ' + c)
