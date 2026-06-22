/** Athlete profile inputs (sex / bodyweight / age) + sample/clear controls. */

import type { AthleteProfile, Sex } from '../engine/types';
import { ageBand } from '../engine/percentile';

interface Props {
  profile: AthleteProfile;
  onChange: (p: AthleteProfile) => void;
  onLoadSample: () => void;
  onClear: () => void;
  hasData: boolean;
}

export function ProfileBar({ profile, onChange, onLoadSample, onClear, hasData }: Props) {
  const band = ageBand(profile.ageYears);
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row">
          <div className="field">
            <label htmlFor="sex">Sex</label>
            <select id="sex" value={profile.sex}
              onChange={(e) => onChange({ ...profile, sex: e.target.value as Sex })}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="bw">Bodyweight (kg)</label>
            <input id="bw" inputMode="decimal" style={{ width: 90 }} value={profile.bodyweightKg}
              onChange={(e) => onChange({ ...profile, bodyweightKg: Number(e.target.value) || 0 })} />
          </div>
          <div className="field">
            <label htmlFor="age">Age</label>
            <input id="age" inputMode="numeric" style={{ width: 70 }} value={profile.ageYears ?? ''}
              onChange={(e) => onChange({ ...profile, ageYears: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          {band && <span className="pill" style={{ alignSelf: 'flex-end', marginBottom: 6 }}>{profile.sex} · {band}</span>}
        </div>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <button className="btn ghost" onClick={onLoadSample}>Load sample</button>
          {hasData && <button className="btn ghost" onClick={onClear}>Clear all</button>}
        </div>
      </div>
    </div>
  );
}
