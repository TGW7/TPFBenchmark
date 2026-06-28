/** Overall HRS dashboard: gauge + coverage + Capacity Index + limiters. */

import type { CapacityResult, HrsResult, WeaknessReport } from '../engine/types';
import { wodPublicName } from '../config/wods';
import { Gauge } from './Gauge';
import { componentLabel, formatPercent, formatPercentile, formatSigned } from './format';

interface DashboardProps {
  result: HrsResult;
  capacity: CapacityResult;
  weakness: WeaknessReport;
  pathwayLabel: string;
  percentile: number | null;
  /** true when the percentile is measured from the live data pool (vs estimated). */
  percentileLive?: boolean;
  /** Pool size behind a live percentile — shows "vs N athletes". */
  percentileN?: number | null;
  /** Capacity Index is WOD-derived — hidden for pathways without WODs. */
  showCapacity?: boolean;
}

function capacityVerdict(index: number | null): string {
  if (index == null) return 'Log WODs with populated tiers to compute.';
  if (index > 0.5) return 'Punches above raw numbers — pacing, skill, fatigue resistance.';
  if (index < -0.5) return 'Under-expresses potential — engine/skill lag the strength base.';
  return 'Expresses raw fitness about as expected.';
}

export function Dashboard({ result, capacity, weakness, pathwayLabel, percentile, percentileLive = false, percentileN = null, showCapacity = true }: DashboardProps) {
  const coveragePct = Math.round(result.coverage * 100);
  const scoredWods = capacity.perWod.filter((w) => w.delta != null);

  return (
    <div className={`grid ${showCapacity ? 'cols-3' : 'cols-2'}`}>
      <div className="card">
        <h2>Overall · {pathwayLabel}</h2>
        <Gauge value={result.overall} caption={`${coveragePct}% of pathway tested`} />
        {percentile != null && (
          <p style={{ textAlign: 'center', margin: '6px 0 0' }}>
            ≈ <strong>{formatPercentile(percentile)}</strong> percentile{' '}
            <span className="subtle">
              {percentileLive
                ? (percentileN ? `(live — vs ${percentileN.toLocaleString()} athletes)` : '(live — vs real athletes)')
                : '(estimated)'}
            </span>
          </p>
        )}
      </div>

      {showCapacity && (
        <div className="card">
          <h2>Capacity Index</h2>
          <div className={`bignum ${capacity.index != null && capacity.index < 0 ? 'alert' : 'good'}`}>
            {formatSigned(capacity.index)}
          </div>
          <p className="subtle" style={{ marginTop: 6 }}>{capacityVerdict(capacity.index)}</p>
          {scoredWods.length > 0 ? (
            scoredWods.map((w) => (
              <div className="statline" key={w.wodId}>
                <span>{wodPublicName(w.wodId)}</span>
                <span className="muted">
                  {formatPercent(w.actual)} vs {formatPercent(w.predicted)} ={' '}
                  <strong>{formatSigned(w.delta)}</strong>
                </span>
              </div>
            ))
          ) : (
            <p className="subtle">No WODs with both a result and a prediction yet.</p>
          )}
        </div>
      )}

      <div className="card">
        <h2>Limiters & gaps</h2>
        {weakness.limiters.length > 0 ? (
          <>
            <p className="subtle" style={{ margin: '0 0 6px' }}>Train these first:</p>
            {weakness.limiters.map((c) => {
              const cs = weakness.ranked.find((r) => r.component === c);
              return (
                <div className="statline" key={c}>
                  <span>{componentLabel(c)}</span>
                  <span className="muted">{formatPercent(cs?.percent ?? null)}</span>
                </div>
              );
            })}
          </>
        ) : (
          <p className="subtle">No tested components yet.</p>
        )}
        {weakness.coverageGaps.length > 0 && (
          <p style={{ marginTop: 10 }}>
            {weakness.coverageGaps.map((c) => (
              <span className="pill alert" key={c} style={{ marginRight: 6, marginBottom: 6 }}>
                {componentLabel(c)}: untested
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
