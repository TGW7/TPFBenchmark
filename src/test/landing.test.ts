import { describe, expect, it } from 'vitest';
import { LANDING_COPY, type LandingCopy } from '../content/landingCopy';

// Operationalises the StoryBrand Build Guide's validation checklist (Section 6).
const BANNED = ['submit', 'click here', 'learn more'];
const count = (s: string, re: RegExp) => (s.toLowerCase().match(re) ?? []).length;

describe.each(Object.entries(LANDING_COPY))('StoryBrand copy — %s', (_brand, c: LandingCopy) => {
  it('hero has offer, benefit and a CTA (grunt test)', () => {
    expect(c.hero.headline.length).toBeGreaterThan(0);
    expect(c.hero.subhead.length).toBeGreaterThan(0);
    expect(c.hero.primaryCta.length).toBeGreaterThan(0);
  });

  it('hero is customer-first (you/your outnumber we/our)', () => {
    const text = `${c.hero.headline} ${c.hero.subhead}`;
    expect(count(text, /\byou\b|\byour\b/g)).toBeGreaterThan(count(text, /\bwe\b|\bour\b/g));
  });

  it('has a 3-step plan', () => {
    expect(c.plan.steps).toHaveLength(3);
  });

  it('names stakes and at least 3 value bullets', () => {
    expect(c.stakes.bullets.length).toBeGreaterThanOrEqual(3);
    expect(c.value.items.length).toBeGreaterThanOrEqual(3);
  });

  it('has empathy + at least one authority proof', () => {
    expect(c.guide.empathy.length).toBeGreaterThan(0);
    expect(c.guide.authority.length).toBeGreaterThanOrEqual(1);
  });

  it('uses specific-verb CTAs, never banned phrases', () => {
    for (const cta of [c.hero.primaryCta, c.hero.secondaryCta, c.options.app.cta, c.finalCta.primaryCta]) {
      expect(BANNED).not.toContain(cta.toLowerCase());
    }
  });

  it('has a one-liner and an aspirational identity', () => {
    expect(c.oneLiner.length).toBeGreaterThan(20);
    expect(c.aspirationalIdentity.length).toBeGreaterThan(0);
  });
});
