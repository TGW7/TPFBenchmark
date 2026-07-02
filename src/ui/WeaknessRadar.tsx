/** Radar over arbitrary axes (components OR per-lift). Pure SVG, TPF tokens. */

import { formatPercent } from './format';

export interface RadarAxis {
  label: string;
  percent: number | null;
}

interface RadarProps {
  axes: RadarAxis[];
  /** Radial scale ceiling (display caps at 100 even with elite bonus). */
  scale?: number;
}

export function WeaknessRadar({ axes, scale = 100 }: RadarProps) {
  const n = axes.length;
  const frac = (p: number | null) => Math.max(0, Math.min(1, (p ?? 0) / scale));

  // A polygon needs ≥3 axes; otherwise fall back to bars.
  if (n < 3) {
    return (
      <div style={{ width: '100%', maxWidth: 320 }}>
        {axes.map((a) => (
          <div key={a.label}>
            <div className="barlabel"><span>{a.label}</span><span>{formatPercent(a.percent)}</span></div>
            <div className="bartrack">
              <div className={`barfill ${a.percent != null && a.percent < 50 ? 'weak' : ''}`} style={{ width: `${frac(a.percent) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const size = 320;
  const LABEL_PAD = 56; // horizontal room so long axis labels (e.g. "gymnastics") don't clip
  const cx = size / 2;
  const cy = size / 2;
  const radius = 104;
  const angle = (i: number) => ((-90 + (360 / n) * i) * Math.PI) / 180;
  const point = (i: number, rad: number): [number, number] => [
    cx + rad * Math.cos(angle(i)),
    cy + rad * Math.sin(angle(i)),
  ];
  const rings = [0.25, 0.5, 0.75, 1];
  const ngon = (rad: number) => axes.map((_, i) => point(i, rad).join(',')).join(' ');
  const dataPoints = axes.map((a, i) => point(i, radius * frac(a.percent)));
  const dataPoly = dataPoints.map((p) => p.join(',')).join(' ');

  return (
    <svg viewBox={`${-LABEL_PAD} 0 ${size + LABEL_PAD * 2} ${size}`} width="100%" style={{ maxWidth: size + LABEL_PAD }} role="img" aria-label="Score radar">
      {rings.map((lvl) => (
        <polygon key={lvl} points={ngon(radius * lvl)} fill="none" stroke="var(--line)" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, radius);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" />;
      })}
      <polygon points={dataPoly} fill="var(--primary)" fillOpacity={0.18} stroke="var(--primary)" strokeWidth={2} />
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill={axes[i].percent == null ? 'var(--line)' : 'var(--primary)'} />
      ))}
      {axes.map((a, i) => {
        const [x, y] = point(i, radius + 18);
        const anchor = x < cx - 4 ? 'end' : x > cx + 4 ? 'start' : 'middle';
        return (
          <text key={a.label} x={x} y={y} textAnchor={anchor} dominantBaseline="middle"
            fontSize="0.62rem" fill={a.percent == null ? 'var(--fg-muted)' : 'var(--fg)'}>
            {a.label}
            <tspan dx={4} fill="var(--fg-muted)">{formatPercent(a.percent)}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
