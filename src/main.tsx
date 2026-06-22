import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { App } from './ui/App';
import { AuthProvider } from './auth/AuthContext';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Analytics />
    </AuthProvider>
  </StrictMode>,
);
