/**
 * StoryBrand landing page — sections in the guide's mandated order:
 * header → stakes → value → guide → plan → explanatory → options → repeat CTA.
 * (Footer is rendered site-wide by App.) Copy comes from content/landingCopy.ts.
 */

import type { BrandMeta } from '../brand';
import type { LandingCopy } from '../content/landingCopy';

interface Props {
  copy: LandingCopy;
  meta: BrandMeta;
  /** Transitional CTA target — into the free calculator. */
  onStart: () => void;
  /** Skip the big hero (when the page already leads with the calculator). */
  heroless?: boolean;
}

export function Landing({ copy, meta, onStart, heroless }: Props) {
  const StartBtn = ({ block = false }: { block?: boolean }) => (
    <button className="btn cta-primary" style={block ? { width: '100%' } : undefined} onClick={onStart}>
      {copy.hero.primaryCta}
    </button>
  );
  const AppBtn = ({ label }: { label: string }) => (
    <a className="btn ghost" href={meta.appUrl}>{label}</a>
  );

  return (
    <div>
      {/* 1 — Header / hero (grunt test: offer · benefit · how to act) */}
      {!heroless && (
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <div className="eyebrow">{copy.hero.eyebrow}</div>
            <h1 className="display">{copy.hero.headline}</h1>
            <p className="lead">{copy.hero.subhead}</p>
            <div className="ctarow">
              <StartBtn />
              <AppBtn label={copy.hero.secondaryCta} />
            </div>
          </div>
          <div className="lp-visual">
            <img
              className="hero-img"
              src="/hero.jpg"
              alt={`A Take Point Fitness athlete training at full effort — ${copy.hero.successLabel.toLowerCase()}.`}
            />
            <div className="hero-badge">
              <span className="eyebrow" style={{ margin: 0 }}>Your result</span>
              <strong style={{ fontSize: '1.05rem' }}>≈ {copy.hero.successPercentile} percentile</strong>
              <span className="pill">{copy.hero.successLabel}</span>
            </div>
          </div>
        </section>
      )}

      {/* 2 — The stakes (agitate the internal problem, lightly) */}
      <section className="lp-section">
        <h2 className="lp-h2">{copy.stakes.heading}</h2>
        <ul className="stakes">
          {copy.stakes.bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>
      </section>

      {/* 3 — Value proposition (benefit-led) */}
      <section className="lp-section">
        <h2 className="lp-h2">{copy.value.heading}</h2>
        <div className="valuegrid">
          {copy.value.items.map((v) => (
            <div className="vitem card" key={v.title}>
              <h3>{v.title}</h3>
              <p className="subtle" style={{ margin: 0 }}>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 — The guide (empathy + authority) */}
      <section className="lp-section guide">
        <p className="lead" style={{ maxWidth: 720 }}>{copy.guide.empathy}</p>
        <div className="authority">
          {copy.guide.authority.map((a) => <span className="badge" key={a}>{a}</span>)}
        </div>
      </section>

      {/* 5 — The plan (3 steps) */}
      <section className="lp-section">
        <h2 className="lp-h2">{copy.plan.heading}</h2>
        <div className="steps">
          {copy.plan.steps.map((s, i) => (
            <div className="step" key={s.title}>
              <div className="stepnum">{i + 1}</div>
              <div>
                <h3 style={{ margin: '0 0 2px' }}>{s.title}</h3>
                <p className="subtle" style={{ margin: 0 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="ctarow" style={{ marginTop: 20 }}><StartBtn /></div>
      </section>

      {/* 6 — Explanatory paragraph (skimmers / SEO) */}
      <section className="lp-section">
        <p className="explain">{copy.explanatory}</p>
      </section>

      {/* 8 — Options (free tool vs paid app) */}
      <section className="lp-section">
        <h2 className="lp-h2">{copy.options.heading}</h2>
        <div className="options">
          <div className="opt card">
            <h3>{copy.options.free.title}</h3>
            <p className="subtle">{copy.options.free.body}</p>
            <StartBtn block />
          </div>
          <div className="opt card" style={{ borderColor: 'var(--primary)' }}>
            <h3>{copy.options.app.title}</h3>
            <p className="subtle">{copy.options.app.body}</p>
            <a className="btn" style={{ width: '100%', textAlign: 'center' }} href={meta.appUrl}>{copy.options.app.cta}</a>
          </div>
        </div>
      </section>

      {/* 9 — Repeat direct CTA */}
      <section className="lp-section finalcta card">
        <h2 className="lp-h2" style={{ marginBottom: 6 }}>{copy.finalCta.heading}</h2>
        <p className="subtle" style={{ marginTop: 0 }}>{copy.finalCta.sub}</p>
        <div className="ctarow" style={{ justifyContent: 'center' }}>
          <StartBtn />
          <AppBtn label={copy.finalCta.secondaryCta} />
        </div>
        <p className="subtle" style={{ marginTop: 16, fontStyle: 'italic' }}>{copy.aspirationalIdentity}</p>
      </section>
    </div>
  );
}
