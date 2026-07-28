import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { App } from './ui/App';
import { AuthProvider } from './auth/AuthContext';
import { ConsentBanner } from './ui/ConsentBanner';
import { brandMeta, detectBrand } from './brand';
import { LANDING_COPY } from './content/landingCopy';

// Brand is decided by hostname (benchmark.* vs operatorbenchmark.*).
const brand = detectBrand();
document.documentElement.setAttribute('data-brand', brand);

// Brand-aware SEO meta (the one-liner doubles as the meta description).
const meta = brandMeta();
document.title = `${meta.shortName} · ${meta.fullName} — free benchmark`;
let desc = document.querySelector('meta[name="description"]');
if (!desc) {
  desc = document.createElement('meta');
  desc.setAttribute('name', 'description');
  document.head.appendChild(desc);
}
desc.setAttribute('content', LANDING_COPY[brand].oneLiner);

// index.html's canonical + OG/Twitter tags are static, hardcoded to the Lift
// brand (the apex default) — uncorrected, the Operator domain self-declares
// benchmark.takepointfitness.com/ as canonical (telling Google not to index
// it separately) and every social share of an operatorbenchmark.* link shows
// Lift branding/copy. Correct all of them here too, not just title+description.
// Still a real gap for crawlers/unfurlers that never execute JS — the
// complete fix needs per-domain static builds; this covers Google (which
// does render JS) and any JS-executing viewer.
const pageUrl = `${location.origin}${location.pathname}`;
const { headline: ogTitle, subhead: ogDesc } = LANDING_COPY[brand].hero;
const heroImage = `${location.origin}/hero.jpg`;
document.querySelector('link[rel="canonical"]')?.setAttribute('href', pageUrl);
document.querySelector('meta[property="og:url"]')?.setAttribute('content', pageUrl);
document.querySelector('meta[property="og:title"]')?.setAttribute('content', ogTitle);
document.querySelector('meta[property="og:description"]')?.setAttribute('content', ogDesc);
document.querySelector('meta[property="og:image"]')?.setAttribute('content', heroImage);
document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', ogTitle);
document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', ogDesc);
document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', heroImage);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      {/* Cookieless, needs no consent — keeps baseline traffic visible even
          from visitors who decline PostHog. */}
      <Analytics />
      {/* Owns the consent decision and is the only thing that boots PostHog. */}
      <ConsentBanner brand={brand} />
    </AuthProvider>
  </StrictMode>,
);
