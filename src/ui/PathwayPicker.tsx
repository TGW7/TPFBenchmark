/** Choose the scoring pathway — flips the component weighting (and, for
 *  operator, the whole benchmark set). Grouped by `.group` (US / UK) when set. */

import type { PathwayConfig, PathwayId } from '../engine/types';

interface Props {
  pathways: PathwayConfig[];
  value: PathwayId;
  onChange: (id: PathwayId) => void;
}

export function PathwayPicker({ pathways, value, onChange }: Props) {
  const renderBtn = (p: PathwayConfig) => (
    <button
      key={p.id}
      role="tab"
      aria-selected={p.id === value}
      className={`btn ${p.id === value ? '' : 'ghost'}`}
      onClick={() => onChange(p.id)}
    >
      {p.label}
    </button>
  );

  const groups = [...new Set(pathways.map((p) => p.group).filter(Boolean))] as string[];
  if (groups.length === 0) {
    return (
      <div className="row" role="tablist" aria-label="Pathway">
        {pathways.map(renderBtn)}
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {groups.map((g) => (
        <div key={g}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>{g}</div>
          <div className="row" role="tablist" aria-label={`${g} pathways`}>
            {pathways.filter((p) => p.group === g).map(renderBtn)}
          </div>
        </div>
      ))}
    </div>
  );
}
