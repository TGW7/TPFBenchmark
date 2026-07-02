/** Radial HRS gauge — pure SVG, themed with the four TPF tokens only. */

import { formatPercent, scoreColor } from './format';

interface GaugeProps {
  value: number | null;
  /** Curve caps at 110 (elite bonus); the gauge ring uses the same ceiling. */
  max?: number;
  caption?: string;
  /** Short score name shown under the number (brand-aware: HABS / ORS). */
  label?: string;
}

export function Gauge({ value, max = 110, caption, label = 'HABS' }: GaugeProps) {
  const size = 200;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const fraction = value == null ? 0 : Math.max(0, Math.min(1, value / max));
  const dash = circumference * fraction;
  const color = scoreColor(value);

  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img"
        aria-label={`Overall ${label} ${formatPercent(value)}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {value != null && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle"
          fontSize="2.4rem" fontWeight={800} fill={color}>
          {formatPercent(value)}
        </text>
        <text x={cx} y={cy + 26} textAnchor="middle" fontSize="0.7rem" fill="var(--fg-muted)"
          letterSpacing="0.08em">
          {label}
        </text>
      </svg>
      {caption && <div className="subtle">{caption}</div>}
    </div>
  );
}
