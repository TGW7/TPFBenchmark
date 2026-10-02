/**
 * 2026-10-02 — standards rebuild (owner: "Remove any standards taken from
 * places we don't have permission for and replace them with ones we can
 * use"; tpf-app docs/build/51_STANDARDS_REBUILD_2026-10-02.md).
 *
 * The stated basis of every standard is now "TPF's own standards (owner-set),
 * checked against <permitted anchor>". This pins that no stated source in the
 * generated sourcing data, and nothing in the landing copy, names or credits a
 * source TPF has no permission to use — the claim the workbook's source
 * columns used to make ("StrengthLevel + Kilgore 2023", "runninglevel /
 * RunRepeat", "Concept2 rankings", "btwb", "parkrun", HYROX results analyses,
 * Cooper Institute LE standards) — and that the lift rows no longer carry the
 * wrong "CC0 / public domain" licence.
 *
 * The workbook's own prohibition text ("do NOT copy … Strength Level …") lives
 * on its Read me sheet, which codegen never reads, so it cannot trip this.
 */
import { describe, expect, it } from 'vitest';
import { BENCHMARK_SOURCING } from '../config/generated/standards.generated';
import { LANDING_COPY } from '../content/landingCopy';

const FORBIDDEN =
  /strength[\s-]*level|running[\s-]*level|rowing[\s-]*level|kilgore|concept[\s-]*2|\bc2\b|beyond the whiteboard|\bbtwb\b|wod[\s-]*score|cooper|hyrox[\s-]*data[\s-]*lab|parkrun|ironman|runrepeat|\bcpat\b|\biaff\b|muscle\s*&\s*strength|henselmans|elite-15|mcintyre|jacoby/i;

describe('stated sources name no source TPF lacks permission for', () => {
  it('the pattern catches the strings the sources used to say (it can fail)', () => {
    for (const old of [
      'StrengthLevel + Kilgore 2023 + IPF/USAPL (reference); expert-curated absolute tiers',
      'runninglevel/RunRepeat + 5-500 club anchor (2026-07)',
      'Concept2 rankings (reference only)',
      'Concept2 logbook percentiles, hybrid-adjusted (2026-07)',
      'C2 logbook, gym-pop adjusted',
      'btwb CF 5k percentiles',
      'parkrun aggregate distributions a useful reference — confirm their data policy first',
      'HYROX pro strong-end (McIntyre/Jacoby) + Elite-15 surveys (2026-07)',
      'Natural BB standards (M&S natural ladder, Henselmans) (2026-07)',
      'Cooper Institute LE PT',
      'Strength-Level-style reference tables',
    ]) {
      expect(FORBIDDEN.test(old), old).toBe(true);
    }
  });

  it('no generated sourcing field names one', () => {
    for (const row of BENCHMARK_SOURCING) {
      for (const [field, value] of Object.entries(row)) {
        if (typeof value !== 'string') continue;
        expect(FORBIDDEN.test(value), `${row.id}.${field}: ${value}`).toBe(false);
      }
    }
  });

  it('no lift row claims a public-domain licence (they are TPF\'s own)', () => {
    for (const row of BENCHMARK_SOURCING) {
      if (row.source !== 'orm') continue;
      expect(row.license, row.id).not.toMatch(/public domain|cc0/i);
      expect(row.license, row.id).toBe("TPF's own");
    }
  });

  it('the landing copy names none either', () => {
    for (const [brand, copy] of Object.entries(LANDING_COPY)) {
      const text = JSON.stringify(copy);
      expect(FORBIDDEN.test(text), brand).toBe(false);
    }
  });
});
