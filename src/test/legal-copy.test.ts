/**
 * 2026-10-03 — the TPF app's legal review, area H (this site's rows H1–H4;
 * docs/LEGAL-FIXES-2026-10-03.md has every old → new wording, for counsel).
 *
 * The collection points are rendered to static HTML (react-dom/server; this
 * suite runs in node — no layout, no clicks; what it can see is which
 * attributes, words and links are in the markup). App.tsx itself is never
 * rendered (it reads `document` at mount), so the two facts that live only
 * there are pinned as source text.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BANNER_BUTTON_CLASS, ConsentBanner } from '../ui/ConsentBanner';
import { EmailCapture } from '../ui/EmailCapture';
import { SaveControls } from '../ui/SaveControls';
import {
  CONSENT_BANNER_COPY,
  EMAIL_LIST_COPY,
  POOL_COPY,
  PRIVACY_URL,
  SAVE_COPY,
  UNSUBSCRIBE_EMAIL,
} from '../content/legalCopy';
import { LANDING_COPY } from '../content/landingCopy';
import { BRAND_META } from '../brand';

// File contents as text through Vite's raw imports (no Node types in this
// repo — the pattern src/test/no-percentile-claims.test.ts uses).
const RAW = {
  ...import.meta.glob(['../ui/App.tsx', '../ui/SaveControls.tsx', '../content/legalCopy.ts', '../content/landingCopy.ts'], { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob(['../../index.html', '../../scripts/build-seo.mjs'], { query: '?raw', import: 'default', eager: true }),
} as Record<string, string>;
const read = (rel: string): string => {
  const key = rel.startsWith('src/') ? `../${rel.slice(4)}` : `../../${rel}`;
  const t = RAW[key];
  if (t == null) throw new Error(`not loaded: ${rel}`);
  return t;
};
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

describe('H3 — the cookie banner gives Decline and Accept equal weight', () => {
  const html = renderToStaticMarkup(createElement(ConsentBanner, { brand: 'lift' }));
  const buttons = [...html.matchAll(/<button([^>]*)>([^<]*)<\/button>/g)].map((m) => ({ attrs: m[1], label: m[2] }));

  it('both buttons carry exactly the same class', () => {
    expect(buttons.map((b) => b.label)).toEqual([CONSENT_BANNER_COPY.decline, CONSENT_BANNER_COPY.accept]);
    const cls = buttons.map((b) => /class="([^"]*)"/.exec(b.attrs)?.[1]);
    expect(cls[0]).toBe(BANNER_BUTTON_CLASS);
    expect(cls[1]).toBe(cls[0]);
  });

  it('says the cookie is linked to the account when signed in, and links the notice', () => {
    expect(text(html)).toContain('If you sign in, it’s linked to your TPF account.');
    expect(text(html)).not.toMatch(/never attach your name or email/i);
    expect(html).toContain(`href="${PRIVACY_URL}"`);
  });
});

describe('H1 — the percentile-pool box', () => {
  const render = (contribute: boolean) => renderToStaticMarkup(createElement(SaveControls, {
    onSave: () => {}, saving: false, saveMsg: null, saveFailed: false, poolAvailable: true, contribute, onContribute: () => {},
  }));

  it('renders unticked when not chosen (App starts it from POOL_OPT_IN_DEFAULT = false)', () => {
    const box = /<input type="checkbox"[^>]*>/.exec(render(false))?.[0] ?? '';
    expect(box).not.toContain('checked');
    expect(/<input type="checkbox"[^>]*>/.exec(render(true))?.[0]).toContain('checked');
  });

  it('says what is sent, what for, and that it cannot be taken back — and never "anonymised"', () => {
    const t = text(render(false));
    expect(t).toContain(POOL_COPY.label);
    expect(t).toContain('not your account, name, email or bodyweight');
    expect(t).toContain('can’t be found and removed later');
    expect(t).not.toMatch(/anonymi[sz]/i);
    expect(render(false)).toContain(`href="${PRIVACY_URL}"`);
  });

  it('says that saving copies 1RMs and race times into the TPF app', () => {
    expect(text(render(false))).toContain(SAVE_COPY.detail);
  });

  it('a failed save reads as an error (role="status", alert colour)', () => {
    const html = renderToStaticMarkup(createElement(SaveControls, {
      onSave: () => {}, saving: false, saveMsg: 'Couldn’t save', saveFailed: true, poolAvailable: false, contribute: false, onContribute: () => {},
    }));
    expect(html).toContain('role="status"');
    expect(html).toContain('var(--alert)');
    expect(html).not.toContain('type="checkbox"'); // no pool on this deployment → no box
  });

  it('App.tsx starts the box from POOL_OPT_IN_DEFAULT, shows it only beside Save, and sends no account id', () => {
    const app = read('src/ui/App.tsx');
    expect(app).toMatch(/useState\(POOL_OPT_IN_DEFAULT\)/);
    expect(app).not.toMatch(/useState\(true\)/);
    expect(app).not.toMatch(/anonymi[sz]ed numbers/i);
    expect(app).not.toMatch(/userId:\s*user\.id/);
    expect(app).not.toMatch(/<EmailCapture[^>]*userId/);
  });

  it('no user-facing source calls the pool "anonymised"', () => {
    for (const f of ['src/ui/App.tsx', 'src/ui/SaveControls.tsx', 'src/content/legalCopy.ts', 'src/content/landingCopy.ts']) {
      const src = read(f).split('\n').filter((l: string) => !/^\s*(\*|\/\/|\/\*|\{\/\*)/.test(l)).join('\n'); // code, not comments
      expect(src, f).not.toMatch(/anonymi[sz]/i);
    }
  });
});

describe('H2 — the standards-updates email list', () => {
  const html = renderToStaticMarkup(createElement(EmailCapture, { brand: 'lift', pathway: 'hybrid_athlete', configured: true }));
  const t = text(html);

  it('marketing consent is an explicit, unticked box, and the button needs it', () => {
    const box = /<input type="checkbox"[^>]*>/.exec(html)?.[0] ?? '';
    expect(box).not.toBe('');
    expect(box).not.toContain('checked');
    expect(t).toContain(EMAIL_LIST_COPY.consent);
    expect(/<button[^>]*>/.exec(html)?.[0]).toContain('disabled');
  });

  it('says what is kept and why, how to leave, and links the notice', () => {
    expect(t).toContain('only to send these updates');
    expect(t).toContain(`To unsubscribe, email ${UNSUBSCRIBE_EMAIL}`);
    expect(html).toContain(`href="${PRIVACY_URL}"`);
    expect(t).not.toMatch(/unsubscribe anytime/i);
  });

  it('renders nothing without a list to join', () => {
    expect(renderToStaticMarkup(createElement(EmailCapture, { brand: 'lift', configured: false }))).toBe('');
  });
});

describe('H4 — claims', () => {
  const all = JSON.stringify(LANDING_COPY);

  it('no "Free forever", and no "no tracking" now that there are (consented) analytics', () => {
    expect(all).not.toMatch(/forever/i);
    expect(all).not.toMatch(/no tracking/i);
    expect(read('index.html')).not.toMatch(/forever|no tracking/i);
    for (const b of Object.values(BRAND_META)) expect(`${b.tagline} ${b.fullName}`).not.toMatch(/forever|no tracking|official/i);
  });

  it('the landing copy claims no official standard', () => {
    expect(all).not.toMatch(/official/i);
    expect(all).not.toMatch(/Held to real standards/);
    expect(LANDING_COPY.operator.value.items.map((i) => i.body).join(' ')).toContain('TPF’s standards for your role or unit');
  });

  it('the six-tier HABS brands do not describe a four-tier curve or put Elite at 85', () => {
    for (const b of ['lift', 'hybrid'] as const) {
      expect(LANDING_COPY[b].explanatory, b).not.toMatch(/pass \/ good \/ excellent \/ elite/);
      expect(LANDING_COPY[b].explanatory, b).not.toMatch(/85\+ is elite/);
      expect(LANDING_COPY[b].explanatory, b).toContain('Beginner to Elite');
    }
  });

  it('the Operator SEO unit pages say the tiers are TPF\'s, not an official test', () => {
    const seo = read('scripts/build-seo.mjs');
    expect(seo).toContain('They are not an official test, and no military or police body endorses them.');
  });
});
