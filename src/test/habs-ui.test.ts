/**
 * 2026-10-03 — the calculator's entry grid and dashboard on the HABS brands,
 * rendered to static HTML (react-dom/server; this suite runs in node, so no
 * layout and no interaction — what it can see is which headings, labels and
 * scores are in the markup). The props are built the way src/ui/App.tsx builds
 * them; App itself is not rendered (it reads `document` at mount).
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BenchmarkGrid } from '../ui/BenchmarkGrid';
import { Dashboard } from '../ui/Dashboard';
import { analyseWeaknesses, computeCapacityIndex, computeHabs, habsAsHrsResult, habsBenchmarkScore } from '../engine';
import type { AthleteLogs, BenchmarkDef, ComponentId } from '../engine/types';
import { HABS_OLYMPIC_IDS, habsWeightsFor, inHabsScore, liftBenchmarksFor } from '../config/habs';
import { HABS_COMPONENT_LABEL, HABS_OUTSIDE_HEADING, HABS_OUTSIDE_NOTE } from '../config/habsDisplay';
import { componentLabel, formatScore, scoreTier } from '../ui/format';

const P = 'hybrid_athlete';
const benchmarks = liftBenchmarksFor(P);
const logs: AthleteLogs = {
  orm: [
    { benchmarkId: 'back_squat_1rm', weightKg: 145, reps: 1 },
    { benchmarkId: 'barbell_row_1rm', weightKg: 80, reps: 1 },
    { benchmarkId: 'front_squat_1rm', weightKg: 100, reps: 1 },
  ],
  raceTimes: [{ benchmarkId: 'run_5k', modality: 'run', event: '5k', timeSec: 1170 }],
  manual: [],
  wod: [],
};
const labelOf = (c: ComponentId) => HABS_COMPONENT_LABEL[c] ?? componentLabel(c);
const outsideIds = new Set(benchmarks.filter((b) => !inHabsScore(b, P)).map((b) => b.id));
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, '\'').replace(/\s+/g, ' ');

describe('the entry grid on a HABS brand', () => {
  const html = renderToStaticMarkup(createElement(BenchmarkGrid, {
    benchmarks, profile: { sex: 'M', bodyweightKg: 80 }, units: 'metric', logs, resetKey: 0,
    onOrm: () => {}, onRaceTime: () => {}, onManual: () => {},
    groupOf: (b: BenchmarkDef) => labelOf(b.habsComponent ?? b.component),
    outside: {
      ids: outsideIds, heading: HABS_OUTSIDE_HEADING, note: HABS_OUTSIDE_NOTE,
      scoreOf: (b: BenchmarkDef) => {
        const s = habsBenchmarkScore(b, 'M', logs, HABS_OLYMPIC_IDS);
        return s == null ? null : `${scoreTier(s)} · ${formatScore(s)}`;
      },
    },
  }));
  const t = text(html);

  it('groups the score\'s benchmarks under the app\'s component names, then the standards outside it', () => {
    const order = ['Running (intensity)', 'Running (distance)', 'Rowing / erg', 'Lower-body strength',
      'Upper-body push', 'Upper-body pull', 'Power', HABS_OUTSIDE_HEADING];
    const at = order.map((h) => t.indexOf(h));
    expect(at.every((i) => i >= 0), JSON.stringify(at)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(t).not.toContain('Upper Strength');
    expect(t).not.toContain('Gymnastics');
  });

  it('counts only the score\'s benchmarks as "entered", and shows an outside standard\'s own tier', () => {
    // hybrid_athlete scores 11: mile, 5 km, 10 km, half, 2 km row, squat, deadlift, bench, press, row, power clean.
    expect(t).toContain('3 of 11 entered.');
    const extras = t.slice(t.indexOf(HABS_OUTSIDE_HEADING));
    expect(extras).toContain('Front Squat');
    expect(extras).toContain('Experienced · 70'); // front squat 100 kg = the men's Experienced
    expect(extras).not.toContain('Back Squat');
  });
});

describe('the dashboard on a HABS brand', () => {
  const habs = computeHabs({ benchmarks, weights: habsWeightsFor(P), sex: 'M', logs, olympicIds: HABS_OLYMPIC_IDS });
  const result = habsAsHrsResult(P, habs);
  const html = renderToStaticMarkup(createElement(Dashboard, {
    result, capacity: computeCapacityIndex({}, [], {}, { sex: 'M', bodyweightKg: 80 }),
    weakness: analyseWeaknesses(result), pathwayLabel: 'Hybrid Athlete', livePercentile: null,
    showCapacity: false, stacked: true, labelOf,
  }));
  const t = text(html);

  it('shows the HABS score, its coverage and the app-labelled limiters and gaps', () => {
    // squat 80 (lower), row 70 (pull), 5 km 80 (intensity): (80·20 + 70·9.6 + 80·13.3) / 42.9
    expect(habs.score).toBeCloseTo((80 * 20 + 70 * 9.6 + 80 * 13.3) / 42.9, 10);
    expect(t).toContain(`${Math.round(42.9)}% of pathway tested`);
    expect(t).toContain('Upper-body pull');
    expect(t).toContain('Running (distance): untested');
    expect(t).not.toContain('Gymnastics');
  });
});
