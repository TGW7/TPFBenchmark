/**
 * Shareable score card — a faithful port of the tpf-app HABS share card
 * (tpf-app/src/lib/habs_share.ts), so the benchmark and the paid app hand
 * out the SAME word-of-mouth unit: a portrait PNG with the TPF Hybrid
 * brand-blue styling, a big score ring, level number, component bars and a
 * follow-us footer.
 *
 * Brand-aware only where identity demands it: the HABS brands (lift /
 * hybrid — both the Hybrid Athlete Benchmark) render in TPF Hybrid steel
 * blue; the Operator brand (a distinct product — Operational Readiness
 * Score) keeps its tactical olive. Everything else — layout, gold level
 * accent, dark ground — is shared, matching the app card pixel-for-pixel.
 *
 * Replaces the earlier square cream SVG card (shareImage.ts).
 */

import type { Brand } from '../brand';

const W = 1080;
const H = 1620;

const GOLD = '#ffcc44'; // brand-neutral "achievement" accent (matches the app)

interface CardTheme {
  accent: string;
  accentLight: string;
  accentDark: string;
  /** RGB triplet of `accent`, for rgba() tints (frame, badges). */
  accentRgb: string;
  /** RGB triplet of `accentLight`, for the badge stroke. */
  accentLightRgb: string;
  /** Spaced brand sub-line under the wordmark. */
  sub: string;
  logo: string;
}

// Blue = the app's exact TPF Hybrid palette (BRAND_META.hybrid.primaryColor
// in tpf-app; #3B7DD8 steel blue). Both HABS brands use it.
const HABS_THEME: CardTheme = {
  accent: '#3B7DD8',
  accentLight: '#7ab8ff',
  accentDark: '#2a65bb',
  accentRgb: '59,125,216',
  accentLightRgb: '122,184,255',
  sub: 'H Y B R I D   A T H L E T E',
  logo: '/tpf-logo-3d-blue.png',
};

const CARD_THEME: Record<Brand, CardTheme> = {
  lift: HABS_THEME,
  hybrid: HABS_THEME,
  operator: {
    accent: '#7d8f4a',
    accentLight: '#b7c77f',
    accentDark: '#5c6e3a',
    accentRgb: '125,143,74',
    accentLightRgb: '183,199,127',
    sub: 'O P E R A T O R',
    logo: '/tpf-logo-3d.png',
  },
};

export interface ScoreCardData {
  brand: Brand;
  /** Overall score (clamped 0–100 for display). */
  score: number;
  /** 0–20 ladder level. */
  level: number;
  /** e.g. "HABS Score" / "ORS". */
  scoreLabel: string;
  /** Active pathway label, named under the score. */
  pathwayLabel: string;
  /** Scored components only, each 0–100. */
  components: Array<{ label: string; score: number }>;
  /** Marketing site display string (e.g. "benchmark.takepointfitness.com"). */
  siteDisplay: string;
  /** Paid-app display string (e.g. "hybridapp.takepointfitness.com"). */
  appDisplay: string;
}

/** Load the TPF emblem; resolve null on any failure so the card renders
 *  text-only rather than rejecting. */
function loadLogo(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    } catch {
      resolve(null);
    }
  });
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  t: CardTheme,
  cx: number,
  cy: number,
  r: number,
  glyph: (c: CanvasRenderingContext2D) => void,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${t.accentRgb},.18)`;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = `rgba(${t.accentLightRgb},.6)`;
  ctx.stroke();
  glyph(ctx);
  ctx.restore();
}

function drawFacebookIcon(ctx: CanvasRenderingContext2D, t: CardTheme, cx: number, cy: number, r: number) {
  drawBadge(ctx, t, cx, cy, r, (c) => {
    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `900 ${Math.round(r * 1.15)}px Arial`;
    c.fillText('f', cx + r * 0.06, cy + r * 0.08);
  });
}

function drawInstagramIcon(ctx: CanvasRenderingContext2D, t: CardTheme, cx: number, cy: number, r: number) {
  drawBadge(ctx, t, cx, cy, r, (c) => {
    const half = r * 0.62;
    const rad = half * 0.42;
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(2, r * 0.13);
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(cx - half + rad, cy - half);
    c.lineTo(cx + half - rad, cy - half);
    c.quadraticCurveTo(cx + half, cy - half, cx + half, cy - half + rad);
    c.lineTo(cx + half, cy + half - rad);
    c.quadraticCurveTo(cx + half, cy + half, cx + half - rad, cy + half);
    c.lineTo(cx - half + rad, cy + half);
    c.quadraticCurveTo(cx - half, cy + half, cx - half, cy + half - rad);
    c.lineTo(cx - half, cy - half + rad);
    c.quadraticCurveTo(cx - half, cy - half, cx - half + rad, cy - half);
    c.closePath();
    c.stroke();
    c.beginPath();
    c.arc(cx, cy, half * 0.48, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(cx + half * 0.6, cy - half * 0.6, Math.max(1.5, r * 0.07), 0, Math.PI * 2);
    c.fillStyle = '#ffffff';
    c.fill();
  });
}

function drawXIcon(ctx: CanvasRenderingContext2D, t: CardTheme, cx: number, cy: number, r: number) {
  drawBadge(ctx, t, cx, cy, r, (c) => {
    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `800 ${Math.round(r * 1.05)}px Arial`;
    c.fillText('X', cx, cy + r * 0.05);
  });
}

export async function renderScoreCard(d: ScoreCardData): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const t = CARD_THEME[d.brand];
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const score = Math.max(0, Math.min(100, d.score));

  // ── Ground ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#101318');
  bg.addColorStop(1, '#0a0c0f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = `rgba(${t.accentRgb},.55)`;
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // ── Header ──
  const logo = await loadLogo(t.logo);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8e6e3';
  let headerEnd: number;
  if (logo) {
    const lw = 96;
    const lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, W / 2 - lw / 2, 64, lw, lh);
    ctx.font = '700 40px Arial';
    ctx.fillText('TAKE POINT FITNESS', W / 2, 64 + lh + 48);
    ctx.font = '600 26px Arial';
    ctx.fillStyle = t.accentLight;
    ctx.fillText(t.sub, W / 2, 64 + lh + 88);
    headerEnd = 64 + lh + 88;
  } else {
    ctx.font = '700 46px Arial';
    ctx.fillText('TAKE POINT FITNESS', W / 2, 128);
    ctx.font = '600 26px Arial';
    ctx.fillStyle = t.accentLight;
    ctx.fillText(t.sub, W / 2, 170);
    headerEnd = 170;
  }

  // ── Free-calculator line ──
  ctx.fillStyle = '#9aa3ad';
  ctx.font = '700 22px Arial';
  ctx.fillText('FREE BENCHMARK CALCULATOR AT', W / 2, headerEnd + 48);
  ctx.fillStyle = GOLD;
  ctx.font = '700 28px Arial';
  ctx.fillText(d.siteDisplay, W / 2, headerEnd + 82);

  // ── Score ring + level ──
  const cx = W / 2;
  const cy = 515;
  const r = 205;
  const pct = score / 100;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,.10)';
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.5);
  ctx.stroke();
  const ringGrad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
  ringGrad.addColorStop(0, t.accentDark);
  ringGrad.addColorStop(1, t.accentLight);
  ctx.strokeStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
  ctx.stroke();

  ctx.fillStyle = GOLD;
  ctx.font = '800 52px Arial';
  ctx.fillText('LEVEL', cx, cy - 72);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 190px Arial';
  ctx.fillText(String(d.level), cx, cy + 85);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 34px Arial';
  ctx.fillText(`${d.scoreLabel.toUpperCase()} ${Math.round(score)} / 100`, cx, cy + r + 55);
  ctx.fillStyle = '#e8e6e3';
  ctx.font = '800 46px Arial';
  ctx.fillText(d.pathwayLabel.toUpperCase(), cx, cy + r + 105);

  // ── Component bars (up to 8 — the triathlete scores swim + bike) ──
  const scored = d.components;
  const barX = 150;
  const barW = W - 300;
  const rowH = scored.length >= 8 ? 49 : 56;
  let y = cy + r + 105 + 50;
  ctx.textAlign = 'left';
  for (const c of scored) {
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '600 26px Arial';
    ctx.fillText(c.label.toUpperCase(), barX, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 26px Arial';
    ctx.fillText(String(Math.round(c.score)), barX + barW, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.fillRect(barX, y + 10, barW, 12);
    ctx.fillStyle = t.accent;
    ctx.fillRect(barX, y + 10, barW * Math.max(0, Math.min(1, c.score / 100)), 12);
    y += rowH;
  }

  // ── Footer — site + app links, then a follow-us row. Floors at a fixed
  // distance from the bottom so it clears the bars whether 1 or 8 scored. ──
  const footerBlockH = 283;
  const footerY = Math.max(y + 40, H - footerBlockH - 40);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#9aa3ad';
  ctx.font = '700 22px Arial';
  ctx.fillText('SCORE YOURS FREE AT', cx, footerY);
  ctx.fillStyle = t.accentLight;
  ctx.font = '700 32px Arial';
  ctx.fillText(d.siteDisplay, cx, footerY + 34);

  ctx.fillStyle = '#9aa3ad';
  ctx.font = '700 22px Arial';
  ctx.fillText('OR GET THE APP AT', cx, footerY + 76);
  ctx.fillStyle = t.accentLight;
  ctx.font = '700 27px Arial';
  ctx.fillText(d.appDisplay, cx, footerY + 110);

  ctx.fillStyle = '#9aa3ad';
  ctx.font = '700 20px Arial';
  ctx.fillText('FOLLOW US', cx, footerY + 156);

  const iconY = footerY + 211;
  drawFacebookIcon(ctx, t, cx - 170, iconY, 34);
  drawInstagramIcon(ctx, t, cx, iconY, 34);
  drawXIcon(ctx, t, cx + 170, iconY, 34);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

export async function shareScoreCard(d: ScoreCardData, text: string): Promise<'shared' | 'downloaded' | 'failed'> {
  const blob = await renderScoreCard(d);
  if (!blob) return 'failed';
  const file = new File([blob], 'tpf-score.png', { type: 'image/png' });

  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  try {
    if (nav.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({ files: [file], text });
      return 'shared';
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'shared';
    // fall through to download
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tpf-score.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    try { await navigator.clipboard?.writeText(text); } catch { /* clipboard optional */ }
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
