/**
 * 2026-10-02 — the site says "percentile" only for a MEASURED pool percentile.
 *
 * Since the 2026-10-02 standards rebuild every tier is TPF's own standard
 * (docs/STANDARDS.md, "Provenance"), not a population percentile. Until that
 * day the dashboard and the copied result showed "≈ Nth percentile" from
 * `estimatedPercentile(score)` — a fixed tier-score → percentile mapping —
 * whenever the pool had no data; the landing pages promised "your percentile";
 * the SEO pages said a tier "sits around the 70th percentile of trained
 * athletes". None of that described a population.
 *
 * The rule now (src/ui/resultCopy.ts): a percentile appears only when
 * `fetchPercentile` returns one, which the server does only once the cell has
 * enough trusted submissions. These tests pin the rule's pure parts and scan
 * the user-facing copy for the old claims. The React components themselves are
 * not rendered here (no DOM test setup in this repository) — the scans below
 * read their source.
 */
import { describe, expect, it } from 'vitest';
import * as engine from '../engine';
import { LANDING_COPY } from '../content/landingCopy';
import { BRAND_META } from '../brand';
import { livePercentileLine, noPercentileNote, resultShareText } from '../ui/resultCopy';

// File contents as text, through Vite's raw imports (this repository has no
// Node type definitions, so no node:fs in tests). Keys are paths relative to
// this file.
const RAW = {
  ...import.meta.glob(['../**/*.ts', '../**/*.tsx', '!./**'], { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob(['../../index.html', '../../scripts/build-seo.mjs', '../../docs/STANDARDS.md'], { query: '?raw', import: 'default', eager: true }),
} as Record<string, string>;
/** `rel` is repo-relative, e.g. 'src/ui/App.tsx' or 'index.html'. */
const read = (rel: string): string => {
  const key = rel.startsWith('src/') ? `../${rel.slice(4)}` : `../../${rel}`;
  const text = RAW[key];
  if (text == null) throw new Error(`not loaded: ${rel} (${key})`);
  return text;
};
const filesUnder = (dir: string): string[] =>
  Object.keys(RAW)
    .filter((k) => k.startsWith('../') && !k.startsWith('../../'))
    .map((k) => `src/${k.slice(3)}`)
    .filter((f) => f.startsWith(`${dir}/`));

/** Source with block, line and JSX comments removed (comments may quote the
 *  old wording to explain the change). */
const code = (rel: string) =>
  read(rel).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** A claim that a tier or score sits at a population percentile / top N %. */
const POPULATION_CLAIM = /\d+(st|nd|rd|th)\s+percentile|top\s+~?\d+(\.\d+)?\s*%|≈\s*[^<\n]{0,40}percentile/i;

describe('resultCopy — a percentile only when measured', () => {
  it('no pool percentile → no percentile line', () => {
    expect(livePercentileLine(null, 500)).toBeNull();
    expect(livePercentileLine(NaN, 500)).toBeNull();
  });

  it('a measured pool percentile reads as one, with the pool size', () => {
    expect(livePercentileLine(73.4, 1240)).toEqual({ main: '73rd percentile', context: `live — vs ${(1240).toLocaleString()} athletes` });
    expect(livePercentileLine(51, null)).toEqual({ main: '51st percentile', context: 'live — vs real athletes' });
  });

  it('the no-percentile note says the score is against TPF’s standards, and promises a percentile only when a pool exists', () => {
    for (const pool of [true, false]) {
      const note = noPercentileNote(pool);
      expect(note).toMatch(/TPF’s own standards/);
      expect(note).toMatch(/not a ranking/);
      expect(note).not.toMatch(POPULATION_CLAIM);
    }
    expect(noPercentileNote(true)).toMatch(/A percentile appears once/);
    expect(noPercentileNote(false)).not.toMatch(/percentile/);
  });

  const base = { scoreLabel: 'HABS Score', pathwayLabel: 'General', overall: 84.4, weak: 'Engine', site: 'https://x.test' };

  it('the copied result makes no percentile claim without a measured one', () => {
    const t = resultShareText({ ...base, livePercentile: null, poolN: 900 });
    expect(t).toBe('My HABS Score — General: 84/100 (Intermediate). Weakest: Engine. Score yours free → https://x.test');
    expect(t).not.toMatch(/percentile/i);
  });

  it('the copied result carries a measured percentile when there is one', () => {
    const t = resultShareText({ ...base, livePercentile: 88, poolN: 1240 });
    expect(t).toContain(`(Intermediate, 88th percentile of ${(1240).toLocaleString()} athletes)`);
  });

  it('an empty weak list reads as a dash', () => {
    expect(resultShareText({ ...base, weak: '', livePercentile: null })).toContain('Weakest: —.');
  });
});

describe('no score-to-percentile estimate anywhere', () => {
  it('the engine no longer exports estimatedPercentile', () => {
    expect('estimatedPercentile' in engine).toBe(false);
  });

  it('no source file imports or calls one', () => {
    const files = filesUnder('src');
    expect(files.length).toBeGreaterThan(40); // the glob really loaded the source
    expect(files.some((f) => f.startsWith('src/test/'))).toBe(false);
    for (const f of files) {
      const src = code(f);
      expect(src, f).not.toMatch(/\bestimatedPercentile\b/);
    }
  });
});

describe('user-facing copy makes no population-percentile claim', () => {
  it('landing copy (every brand) never promises "your percentile"', () => {
    for (const [brand, copy] of Object.entries(LANDING_COPY)) {
      expect(JSON.stringify(copy), brand).not.toMatch(/percentile/i);
    }
  });

  it('brand taglines say "where you stand", not "where you rank"', () => {
    for (const b of Object.values(BRAND_META)) {
      expect(b.tagline, b.brand).not.toMatch(/percentile|\brank\b/i);
    }
  });

  it('index.html meta and no-JS fallback make no percentile claim', () => {
    expect(read('index.html')).not.toMatch(/percentile|where you rank/i);
  });

  it('the SEO page builder never places a tier at a population percentile', () => {
    const seo = read('scripts/build-seo.mjs');
    // Comments in the builder may quote the old wording to explain the change;
    // check the template strings only.
    const templates = seo.match(/`[^`]*`/g) ?? [];
    for (const t of templates) expect(t).not.toMatch(POPULATION_CLAIM);
    expect(seo).toMatch(/not a population percentile/);
  });

  it('the UI source shows no "≈ … percentile" and no "top N %"', () => {
    const files = filesUnder('src/ui').concat(filesUnder('src/content'));
    expect(files).toContain('src/ui/Landing.tsx');
    expect(files).toContain('src/ui/Dashboard.tsx');
    for (const f of files) {
      expect(code(f), f).not.toMatch(POPULATION_CLAIM);
    }
  });

  it('docs/STANDARDS.md no longer maps tiers onto percentiles', () => {
    const doc = read('docs/STANDARDS.md');
    expect(doc).not.toMatch(/\|\s*≈ percentile/); // the old table column (the correction note may quote it)
    expect(doc).toMatch(/not population\s+percentiles/);
  });
});
