/**
 * Shareable result card — renders an on-brand SVG, rasterises to PNG, and shares
 * via the native share sheet (mobile) or downloads (desktop). This is the
 * word-of-mouth unit: a screenshot-ready score people post.
 */

const escapeXml = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export interface ShareData {
  brand: 'lift' | 'operator';
  shortName: string;
  scoreText: string;
  percentileText: string;
  pathway: string;
  weakest: string;
  site: string;
}

export function resultCardSVG(d: ShareData): string {
  const accent = d.brand === 'operator' ? '#5c6e3a' : '#b2342a';
  const paper = '#f4f1e8';
  const ink = '#161616';
  const F = 'font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="1080" height="1080" fill="${paper}"/>
  <rect width="1080" height="16" fill="${accent}"/>
  <text x="80" y="140" ${F} font-size="40" font-weight="800" fill="${ink}">TAKE POINT FITNESS <tspan fill="${accent}">·</tspan> ${escapeXml(d.shortName)}</text>
  <text x="80" y="205" ${F} font-size="34" fill="${ink}" opacity="0.55">${escapeXml(d.pathway)}</text>
  <text x="540" y="585" text-anchor="middle" ${F} font-size="380" font-weight="800" fill="${accent}">${escapeXml(d.scoreText)}</text>
  <text x="540" y="675" text-anchor="middle" ${F} font-size="56" font-weight="700" fill="${ink}">≈ ${escapeXml(d.percentileText)} percentile</text>
  <text x="80" y="840" ${F} font-size="40" fill="${ink}">Weakest link: <tspan font-weight="700">${escapeXml(d.weakest)}</tspan></text>
  <line x1="80" y1="912" x2="1000" y2="912" stroke="${ink}" stroke-opacity="0.15" stroke-width="2"/>
  <text x="80" y="992" ${F} font-size="38" font-weight="700" fill="${accent}">Score yours free — ${escapeXml(d.site)}</text>
</svg>`;
}

export function svgToPngBlob(svg: string, size = 1080): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no canvas context'));
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
    };
    img.onerror = () => reject(new Error('SVG render failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

export async function shareResult(d: ShareData, text: string): Promise<'shared' | 'downloaded'> {
  const blob = await svgToPngBlob(resultCardSVG(d));
  const file = new File([blob], 'tpf-score.png', { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    await navigator.share({ files: [file], text });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tpf-score.png';
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
