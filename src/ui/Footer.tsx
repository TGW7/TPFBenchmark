/** Junk-drawer footer — every secondary link, kept out of the main flow. */

import type { BrandMeta } from '../brand';

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
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <span className="subtle" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>Take Point Fitness</span>
            <a className="linklike" href={meta.appUrl}>Get the app</a>
            <a className="linklike" href={otherBrand.href}>{otherBrand.label}</a>
            <a className="linklike" href="https://takepointfitness.com">Main site</a>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <span className="subtle" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>Legal</span>
            <a className="linklike" href="https://takepointfitness.com/privacy">Privacy</a>
            <a className="linklike" href="https://takepointfitness.com/terms">Terms</a>
          </div>
        </div>
      </div>
      <p className="subtle" style={{ marginTop: 20, fontSize: '0.78rem' }}>
        © Take Point Fitness. Free benchmark — no account, no tracking. Standards shown are a preview until calibrated.
      </p>
    </footer>
  );
}
