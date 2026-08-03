/** Junk-drawer footer — every secondary link, kept out of the main flow. */

import type { BrandMeta } from '../brand';
import { clearConsent } from '../lib/consent';
import { stopAnalytics } from '../lib/posthog';

/**
 * Withdrawing consent has to be as easy as giving it, so this sits next to the
 * privacy links on every page. Stops capture immediately, then reloads so the
 * banner reappears and the visitor can choose again.
 */
function reopenConsent() {
  stopAnalytics();
  clearConsent();
  location.reload();
}

interface Props {
  meta: BrandMeta;
  onCalculator: () => void;
  onStandards: () => void;
}

export function Footer({ meta, onCalculator, onStandards }: Props) {
  const otherBrand =
    meta.brand === 'lift'
      ? { label: 'Operator version', href: 'https://operatorbenchmark.takepointfitness.com' }
      : { label: 'Lift version', href: 'https://benchmark.takepointfitness.com' };

  return (
    <footer style={{ marginTop: 48, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
        <div>
          <div className="brandmark" style={{ fontSize: '1.1rem' }}>
            {meta.scoreLabel} <span className="accent">·</span> Take Point Fitness
          </div>
          <div className="subtle" style={{ maxWidth: 320 }}>{meta.tagline}</div>
        </div>
        <div className="row" style={{ gap: 28, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <span className="subtle" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>Tools</span>
            <button className="linklike" onClick={onCalculator}>Calculator</button>
            <button className="linklike" onClick={onStandards}>Browse standards</button>
            {/* Only internal link into the 44 static SEO pages from the live
                app — otherwise they're islands with no on-site discovery path. */}
            {meta.brand === 'operator' ? (
              <a className="linklike" href="/units/">All unit standards</a>
            ) : (
              <>
                <a className="linklike" href="/standards/">All lift standards</a>
                <a className="linklike" href="/pathways/">All pathways</a>
              </>
            )}
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <span className="subtle" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>Take Point Fitness</span>
            <a className="linklike" href={meta.appUrl}>Get the app</a>
            <a className="linklike" href={otherBrand.href}>{otherBrand.label}</a>
            <a className="linklike" href="https://www.takepointfitness.com">Main site</a>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <span className="subtle" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>Legal</span>
            {/* These paths never existed on the marketing site (no /legal/*
                prefix) — Search Console flagged the 404. The real pages live
                on the app, same as the marketing site's own footer links them. */}
            <a className="linklike" href={`${meta.appUrl}/legal/privacy`}>Privacy</a>
            <a className="linklike" href={`${meta.appUrl}/legal/terms`}>Terms</a>
            <button className="linklike" onClick={reopenConsent}>Cookie settings</button>
          </div>
        </div>
      </div>
      <p className="subtle" style={{ marginTop: 20, fontSize: '0.78rem' }}>
        {/* "No tracking" stopped being true the moment analytics went in.
            Consent is opt-in and declining changes nothing, so the honest
            version of the claim is the no-account one. */}
        © Take Point Fitness. Free benchmark — no account needed, and analytics
        only if you say yes. Standards shown are a preview until calibrated.
      </p>
    </footer>
  );
}
