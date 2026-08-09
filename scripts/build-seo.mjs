/**
 * Programmatic SEO page generator (postbuild).
 *
 * Reads the codegen'd data JSON and emits static, crawlable HTML pages into
 * dist/ — one per Lift benchmark, Lift pathway, and Operator unit, plus index
 * pages and a full sitemap. Each page has its own title/meta/OG/canonical, the
 * tier table, internal links, and a CTA into the calculator ("/").
 *
 * Vercel serves these static files before the SPA catch-all rewrite, so
 * /standards/back-squat, /pathways/hyrox, /units/navy-seal resolve as real URLs.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BENCHMARK_DISPLAY } from '../src/config/benchmarkDisplay.ts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(REPO, 'dist');
const LIFT_HOST = 'https://benchmark.takepointfitness.com';
const OP_HOST = 'https://operatorbenchmark.takepointfitness.com';

const lift = JSON.parse(readFileSync(resolve(REPO, 'src/config/generated/lift.data.json'), 'utf8'));
const operator = JSON.parse(readFileSync(resolve(REPO, 'src/config/generated/operator.data.json'), 'utf8'));

// ---- formatting ------------------------------------------------------------
// Six-tier (Beginner/Novice/Experienced/Intermediate/Advanced/Elite, anchored
// 50/60/70/80/90/100%) superseded the legacy four-tier pass/good/excellent/elite
// (50/70/85/100%) for lift/hybrid standards in 2026-07 — but only benchmarks the
// app's HABS actually covers got novice/intermediate/advanced values; the
// gymnastics/skill benchmarks (broad_jump, strict_pullups, ...) and ALL Operator
// standards never did, so they're still genuinely four-tier, not stale. Detect
// per benchmark via `novice != null`, the same signal src/engine/tier-curve.ts
// uses to pick a scoring curve — never hardcode which ids are which.
const TIERS4 = ['pass', 'good', 'excellent', 'elite'];
const TIER4_LABEL = { pass: 'Pass', good: 'Good', excellent: 'Excellent', elite: 'Elite' };
const TIERS6 = ['pass', 'novice', 'good', 'intermediate', 'advanced', 'elite'];
const TIER6_LABEL = { pass: 'Beginner', novice: 'Novice', good: 'Experienced', intermediate: 'Intermediate', advanced: 'Advanced', elite: 'Elite' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clock = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.round(s % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};
function fmt(unit, v) {
  if (v == null) return '—';
  if (String(unit).includes(':')) return clock(v);
  if (unit === 'xBW') return `${v}× BW`;
  if (unit === 'cm') return `${v} cm`;
  if (unit === 'm') return `${v} m`;
  if (unit === 'kg') return `${v} kg`;
  if (unit === 'reps') return `${v} reps`;
  if (unit === 'rounds') return `${v} rounds`;
  if (unit === 'level') return `L${v}`;
  return String(v);
}

// Label + slug now come from the shared BENCHMARK_DISPLAY (src/config/
// benchmarkDisplay.ts) — was hand-duplicated here and in src/ui/format.ts.
const BENCH = Object.fromEntries(
  Object.entries(BENCHMARK_DISPLAY).filter(([, d]) => d.slug).map(([id, d]) => [id, [d.label, d.slug]]),
);
const PATHWAY = {
  gym_goer: ['Gym-Goer', 'gym-goer'], hybrid_athlete: ['Hybrid Athlete', 'hybrid-athlete'],
  crossfit_generalist: ['CrossFit', 'crossfit'], hyrox: ['HYROX', 'hyrox'],
  powerlifter: ['Powerlifter', 'powerlifter'], bodybuilder: ['Bodybuilder', 'bodybuilder'],
};
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---- HTML shell ------------------------------------------------------------
function page({ brand, path, title, description, h1, lede, body, host, jsonLd = [] }) {
  // 2026-07-13 — non-operator accent is TPF Hybrid blue (matches the app +
  // the live benchmark theme). Operator keeps tactical olive.
  const accent = brand === 'operator' ? '#5c6e3a' : '#3b7dd8';
  const cta = brand === 'operator' ? 'Score your readiness free' : 'Score yourself free';
  return `<!doctype html>
<html lang="en" data-theme="light" data-brand="${brand}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${host}${path}" />
<link rel="icon" type="image/png" href="/tpf-mark.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="${accent}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${host}/hero.jpg" />
<meta property="og:url" content="${host}${path}" />
<meta name="twitter:card" content="summary_large_image" />
${jsonLd.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}
<style>
:root{--ink:#161616;--paper:#f4f1e8;--accent:${accent};--line:#dcd8cc;--muted:#5b5b5b}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:20px}
header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--accent);padding-bottom:12px}
.brand{font-weight:800;letter-spacing:.02em}.brand b{color:var(--accent)}
a{color:var(--accent)}
.btn{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px}
h1{font-size:2rem;line-height:1.15;margin:24px 0 8px}
.lede{font-size:1.15rem;color:var(--muted);margin:0 0 20px}
table{width:100%;border-collapse:collapse;margin:16px 0;font-variant-numeric:tabular-nums}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line)}
th{font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
td.r,th.r{text-align:right}
.cta{margin:28px 0;padding:20px;border:1px solid var(--accent);border-radius:12px;text-align:center}
.links{display:flex;flex-wrap:wrap;gap:8px 16px;margin:12px 0}
footer{margin-top:40px;border-top:1px solid var(--line);padding-top:16px;color:var(--muted);font-size:.85rem}
.note{color:var(--muted);font-size:.85rem}
h2{font-size:1.3rem;margin:28px 0 8px}
ul{padding-left:20px}li{margin:6px 0}
details{border-bottom:1px solid var(--line);padding:10px 0}
summary{font-weight:600;cursor:pointer}
details p{margin:8px 0 0;color:var(--muted)}
</style>
</head>
<body><div class="wrap">
<header>
  <div class="brand">Take Point Fitness <b>·</b> ${brand === 'operator' ? 'Operator' : 'Benchmark'}</div>
  <a class="btn" href="/">${cta}</a>
</header>
<main>
<h1>${esc(h1)}</h1>
<p class="lede">${esc(lede)}</p>
${body}
<div class="cta">
  <p style="margin:0 0 12px;font-weight:600">See exactly where you rank — free, no sign-up.</p>
  <a class="btn" href="/">${cta} →</a>
</div>
</main>
<footer>
  © Take Point Fitness — free benchmark. Standards are v1 beta, calibrating with real athletes.
  <div class="links" style="margin-top:8px">
    <a href="/">Calculator</a><a href="/standards/">Lift standards</a>
    <a href="/pathways/">Pathways</a><a href="/units/">Operator units</a>
  </div>
</footer>
</div></body></html>`;
}

function table(headers, rows) {
  const head = headers.map((h, i) => `<th class="${i ? 'r' : ''}">${esc(h)}</th>`).join('');
  const body = rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i ? 'r' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

// ---- structured data + FAQ -------------------------------------------------
function faqPage(faqs) {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
function breadcrumb(host, items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: host + it.path,
    })),
  };
}
function faqHtml(faqs) {
  return `<h2>FAQ</h2>${faqs
    .map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
    .join('')}`;
}
const bullets = (items) => `<ul>${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

// "How to improve" tips — keyed by training quality, not standards numbers, so
// the no-hardcoded-numbers rule stays intact. Useful evergreen content for SEO.
// Category per id comes from the shared BENCHMARK_DISPLAY.tip.
const TIPS = {
  barbell: [
    'Train the lift 2–3×/week with progressive overload — add a little load or a rep most sessions.',
    'Keep most volume in the 3–6 rep range for strength, with lighter back-off sets for size.',
    'Fix the limiting position (depth, lockout, bracing) before chasing a bigger number.',
  ],
  oly: [
    'Olympic lifts are technique-first — clean reps under a coach beat grinding heavy singles.',
    'Drill the positions (start, power position, turnover) and add load only when the bar path stays clean.',
    'Build the supporting pull strength and front-rack mobility so the catch isn’t the bottleneck.',
  ],
  pull: [
    'Accumulate pulling volume — weighted reps for strength, higher-rep sets for capacity.',
    'Grease the groove: frequent sub-maximal sets through the day build reps quickly.',
    'Train the full range with scapular control; half-reps don’t carry over.',
  ],
  press_bw: [
    'Build overhead strength (strict press, handstand holds) before chasing kipping reps.',
    'Progress from box or pike push-ups toward free handstand push-ups as strength allows.',
    'Train midline and shoulder stability so you can hold the inverted position.',
  ],
  core_bw: [
    'Build hanging knee/leg raises for strength, then drill the toes-to-bar rhythm.',
    'Grip and lat endurance usually fail first — train them with hangs and pulls.',
    'Keep the reps strict before adding a kip to link them.',
  ],
  skill: [
    'Double-unders are timing — practise short, frequent sets with relaxed wrists.',
    'Use a correctly sized rope and a consistent jump height; fatigue wrecks the rhythm.',
    'Build calf and ankle endurance so the form holds when you’re tired.',
  ],
  power: [
    'Train explosively — jumps, throws and fast eccentrics raise rate of force development.',
    'A stronger squat and hinge lift the ceiling for power output.',
    'Quality over fatigue: full recovery between explosive efforts.',
  ],
  core: [
    'Build anti-extension and bracing strength (planks, ab-wheel, hollow holds).',
    'Train the brace under load — heavy carries and squats make it transfer.',
    'Add time or load gradually; a solid position beats a longer sloppy hold.',
  ],
  engine: [
    'Mix easy aerobic volume (zone 2) with a weekly interval session at goal pace.',
    'Build the aerobic base first; speed work sharpens it later.',
    'Consistency beats heroics — 3–5 sessions a week, mostly easy.',
  ],
  power_engine: [
    'Short pieces reward power and turnover — train sprints and intervals.',
    'Drill technique and stroke rate; wasted motion costs you splits.',
    'Underpin it with leg strength and a solid aerobic base.',
  ],
};
const tipsFor = (id) => TIPS[BENCHMARK_DISPLAY[id]?.tip] ?? [
  'Train the underlying quality 2–3×/week and re-test every 6–8 weeks.',
  'Fix your weakest position or pacing before adding intensity.',
  'Track it — what gets measured improves.',
];

const out = [];
function emit(path, html) {
  const dir = resolve(DIST, '.' + path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html);
  out.push(path);
}

// ---- Lift benchmark pages --------------------------------------------------
const liftBench = lift.sourcing.filter((b) => !b.optional && BENCH[b.id] && lift.standards[b.id]);
for (const b of liftBench) {
  const [label, slug] = BENCH[b.id];
  const t = lift.standards[b.id];
  const sixTier = t.M.novice != null;
  const TIERS = sixTier ? TIERS6 : TIERS4;
  const TIER_LABEL = sixTier ? TIER6_LABEL : TIER4_LABEL;
  const rows = TIERS.map((k) => [TIER_LABEL[k], fmt(b.unit, t.M[k]), fmt(b.unit, t.F[k])]);
  const inPathways = Object.entries(lift.weights)
    .filter(([, w]) => (w[b.component] ?? 0) > 0)
    .map(([pid]) => PATHWAY[pid]).filter(Boolean);
  const dir = b.lowerIsBetter ? 'lower is faster' : b.normalization === 'bodyweight' ? 'as a multiple of bodyweight' : 'higher is better';
  const tips = tipsFor(b.id);
  const tierNames = TIERS.map((k) => TIER_LABEL[k].toLowerCase()).join(' / ');
  const faqs = sixTier ? [
    { q: `What is a good ${label}?`, a: `An "Experienced" ${label} sits around the 70th percentile of trained athletes — see the table above for the exact figure for your sex. "Advanced" is roughly the top 10%, and "Elite" is the top 5%.` },
    { q: `How is the ${label} scored?`, a: `Your result is placed on a 0–100 curve anchored at the ${tierNames} tiers${b.normalization === 'bodyweight' ? ', measured as a multiple of bodyweight and adjusted for sex' : ', adjusted for sex'}. ${b.lowerIsBetter ? 'A faster time scores higher.' : 'A higher number scores higher.'}` },
    { q: `How can I improve my ${label}?`, a: tips.join(' ') },
  ] : [
    { q: `What is a good ${label}?`, a: `A "Good" ${label} sits around the 70th percentile of trained athletes — see the table above for the exact figure for your sex. "Excellent" is roughly the top 15%, and "Elite" is the top 5%.` },
    { q: `How is the ${label} scored?`, a: `Your result is placed on a 0–100 curve anchored at the ${tierNames} tiers${b.normalization === 'bodyweight' ? ', measured as a multiple of bodyweight and adjusted for sex' : ', adjusted for sex'}. ${b.lowerIsBetter ? 'A faster time scores higher.' : 'A higher number scores higher.'}` },
    { q: `How can I improve my ${label}?`, a: tips.join(' ') },
  ];
  emit(`/standards/${slug}/`, page({
    brand: 'lift', host: LIFT_HOST, path: `/standards/${slug}/`,
    title: `${label} Standards | Take Point Fitness`,
    description: `${label} standards by tier and sex (${dir}). See what counts as a good ${label.toLowerCase()} and score yours free.`,
    h1: `${label} Standards`,
    lede: `How does your ${label.toLowerCase()} stack up? These are the ${tierNames} tiers (${dir}), by sex.`,
    body: table(['Tier', 'Male', 'Female'], rows) +
      (sixTier
        ? `<p class="note">Tiers map to roughly the 50th / 60th / 70th / 80th / 90th / 100th percentile of trained athletes.</p>`
        : `<p class="note">Tiers map to roughly the 50th / 70th / 85th / top 5% of trained athletes.</p>`) +
      (inPathways.length ? `<p>Counts toward: ${inPathways.map(([l, s]) => `<a href="/pathways/${s}/">${esc(l)}</a>`).join(' · ')}</p>` : '') +
      `<h2>How to improve your ${esc(label)}</h2>` + bullets(tips) +
      faqHtml(faqs),
    jsonLd: [
      breadcrumb(LIFT_HOST, [{ name: 'Home', path: '/' }, { name: 'Standards', path: '/standards/' }, { name: label, path: `/standards/${slug}/` }]),
      faqPage(faqs),
    ],
  }));
}

// ---- Lift pathway pages ----------------------------------------------------
for (const [pid, [label, slug]] of Object.entries(PATHWAY)) {
  const w = lift.weights[pid] ?? {};
  const comps = Object.entries(w).filter(([, v]) => (v ?? 0) > 0);
  const benchLinks = liftBench.filter((b) => (w[b.component] ?? 0) > 0)
    .map((b) => `<a href="/standards/${BENCH[b.id][1]}/">${esc(BENCH[b.id][0])}</a>`);
  const compNames = comps.map(([c]) => c.replace(/_/g, ' ')).join(', ');
  const faqs = [
    { q: `What does the ${label} score measure?`, a: `It weights ${comps.length} training areas (${compNames}) into a single 0–100 score, so you can see where you’re strong and where you’re holding yourself back.` },
    { q: `How do I improve my ${label} score?`, a: `Your score is dragged down most by your weakest weighted area, not your best lift. Find that area in the free calculator and train it — that’s the fastest way to raise the number.` },
  ];
  emit(`/pathways/${slug}/`, page({
    brand: 'lift', host: LIFT_HOST, path: `/pathways/${slug}/`,
    title: `${label} Fitness Standards | Take Point Fitness`,
    description: `${label} standards: what to train and how you're scored across ${comps.length} areas. Free calculator, see your weak link.`,
    h1: `${label} Standards`,
    lede: `What does it take to be a strong ${label}? Your score weights ${comps.length} areas — here's what counts and how to benchmark it.`,
    body: table(['Area', 'Weight'], comps.map(([c, v]) => [c.replace(/_/g, ' '), `${v}%`])) +
      (benchLinks.length ? `<p>Benchmarks: ${benchLinks.join(' · ')}</p>` : '') +
      faqHtml(faqs),
    jsonLd: [
      breadcrumb(LIFT_HOST, [{ name: 'Home', path: '/' }, { name: 'Pathways', path: '/pathways/' }, { name: label, path: `/pathways/${slug}/` }]),
      faqPage(faqs),
    ],
  }));
}

// ---- Operator unit pages ---------------------------------------------------
for (const u of operator) {
  const slug = slugify(u.id);
  const rows = u.benchmarks.map((b) => [b.name, ...TIERS4.map((k) => fmt(b.unit, b.thresholds[k]))]);
  const eventNames = u.benchmarks.slice(0, 4).map((b) => b.name).join(', ');
  const faqs = [
    { q: `What are the ${u.label} fitness requirements?`, a: `The ${u.label} standard is scored per event — ${eventNames}${u.benchmarks.length > 4 ? ' and more' : ''} — across strength, engine and work capacity. See the table above for the pass / good / excellent / elite tiers.` },
    { q: `How do I train for the ${u.label} standard?`, a: `Build a deep aerobic base, train load carriage and rucking, and keep your strength high relative to bodyweight. Test against the standard regularly and attack your weakest event first.` },
  ];
  emit(`/units/${slug}/`, page({
    brand: 'operator', host: OP_HOST, path: `/units/${slug}/`,
    title: `${u.label} Fitness Standards | TPF Operator`,
    description: `${u.label} fitness standards across strength, engine and work capacity. Score your readiness free against the ${u.label} benchmark.`,
    h1: `${u.label} Fitness Standards`,
    lede: `Could you meet the ${u.label} standard? These are the per-event tiers (unisex, absolute) used to score readiness.`,
    body: table(['Benchmark', 'Pass', 'Good', 'Excellent', 'Elite'], rows) +
      `<p class="note">${u.region} unit. Some tiers are expert-derived (beta) and recalibrate with athlete data.</p>` +
      faqHtml(faqs),
    jsonLd: [
      breadcrumb(OP_HOST, [{ name: 'Home', path: '/' }, { name: 'Operator Units', path: '/units/' }, { name: u.label, path: `/units/${slug}/` }]),
      faqPage(faqs),
    ],
  }));
}

// ---- index pages -----------------------------------------------------------
const indexList = (items) => `<div class="links">${items.map(([l, href]) => `<a href="${href}">${esc(l)}</a>`).join('')}</div>`;
emit('/standards/', page({
  brand: 'lift', host: LIFT_HOST, path: '/standards/',
  title: 'Strength & Fitness Standards by Lift | Take Point Fitness',
  description: 'Browse strength and fitness standards for every major lift and benchmark — squat, deadlift, bench, runs, rows and more.',
  h1: 'Benchmark Standards', lede: 'Pick a lift or benchmark to see the beginner-to-elite tiers by sex.',
  body: indexList(liftBench.map((b) => [BENCH[b.id][0], `/standards/${BENCH[b.id][1]}/`])),
}));
emit('/pathways/', page({
  brand: 'lift', host: LIFT_HOST, path: '/pathways/',
  title: 'Training Pathways & Standards | Take Point Fitness',
  description: 'Gym-Goer, Hybrid Athlete, CrossFit, HYROX, Powerlifter, Bodybuilder — see the standards for each goal.',
  h1: 'Pathways', lede: 'Choose the goal you train for and see how you’re scored.',
  body: indexList(Object.values(PATHWAY).map(([l, s]) => [l, `/pathways/${s}/`])),
}));
emit('/units/', page({
  brand: 'operator', host: OP_HOST, path: '/units/',
  title: 'Military & Tactical Fitness Standards by Unit | TPF Operator',
  description: 'Fitness standards for US & UK military and tactical units — Navy SEAL, Royal Marines, Para, SFAS, SWAT and more.',
  h1: 'Operator Units', lede: 'Pick a unit to see its fitness standards and score your readiness.',
  body: `<h2>US</h2>${indexList(operator.filter((u) => u.region === 'US').map((u) => [u.label, `/units/${slugify(u.id)}/`]))}` +
        `<h2>UK</h2>${indexList(operator.filter((u) => u.region === 'UK').map((u) => [u.label, `/units/${slugify(u.id)}/`]))}`,
}));

// ---- sitemaps ----------------------------------------------------------------
// One file PER HOST, each listing only that host's own URLs — a sitemap
// listing a different domain's URLs is against the sitemap protocol (Google:
// "all URLs must reside on the same host as the sitemap") and those entries
// are liable to be silently ignored. Two separate custom domains on the same
// Vercel project/build, so this can't be "one sitemap, host-negotiated" —
// each host's robots.txt must point at its own file (see public/robots.txt).
const liftUrls = [`${LIFT_HOST}/`, ...out.filter((p) => !p.startsWith('/units')).map((p) => LIFT_HOST + p)];
const operatorUrls = [`${OP_HOST}/`, ...out.filter((p) => p.startsWith('/units')).map((p) => OP_HOST + p)];
function writeSitemap(filename, urls) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>
`;
  writeFileSync(resolve(DIST, filename), xml);
}
writeSitemap('sitemap-lift.xml', liftUrls);
writeSitemap('sitemap-operator.xml', operatorUrls);

// ---- IndexNow key file ------------------------------------------------------
// This is a static build with no server, so unlike tpf-app/tpf-marketing's
// dynamic /api/indexnow/key route, the key has to be baked in at build time.
// Written as a plain file named after the key itself (the IndexNow spec's own
// convention) at the dist root, so it's served as a real static file on both
// benchmark.* and operatorbenchmark.* without needing a rewrite exception —
// vercel.json's SPA catch-all only applies when no static file matches.
// Set INDEXNOW_KEY in Vercel (both this project's only deploy target) and
// redeploy; rotate by changing the env var, which changes the filename too,
// so the old key file simply stops being referenced.
const indexNowKey = process.env.INDEXNOW_KEY;
if (indexNowKey) {
  writeFileSync(resolve(DIST, `${indexNowKey}.txt`), indexNowKey);
  console.log(`[seo] wrote IndexNow key file /${indexNowKey}.txt`);
} else {
  console.log('[seo] INDEXNOW_KEY not set — skipping IndexNow key file');
}

console.log(`[seo] generated ${out.length} pages + 2 sitemaps (${liftUrls.length} lift + ${operatorUrls.length} operator urls) into dist/`);
