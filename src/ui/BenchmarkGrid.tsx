/**
 * All benchmarks for the pathway as editable boxes at once — fill any or all,
 * and the score updates live. Replaces the one-at-a-time "log a benchmark"
 * card. Each row upserts its entry into the logs (or removes it when cleared),
 * so there's exactly one entry per benchmark and editing is idempotent.
 *
 * Rows keep local input state (so decimals / partial typing feel natural) and
 * remount from the logs when `resetKey` bumps — i.e. on Load sample / Clear /
 * sign-in prefill.
 */

import { useState } from 'react';
import { auditEntry, calc1RMVal } from '../engine';
import type { AthleteLogs, AthleteProfile, BenchmarkDef } from '../engine/types';
import { type Units, weightUnit, toKg, fromKg } from '../lib/units';
import { benchmarkLabel } from './format';

interface Props {
  benchmarks: BenchmarkDef[];
  profile: AthleteProfile;
  units: Units;
  logs: AthleteLogs;
  /** Bumps when logs are replaced wholesale (sample / clear / sign-in) to re-seed rows. */
  resetKey: number;
  onOrm: (benchmarkId: string, weightKg: number | null, reps: number) => void;
  onRaceTime: (bench: BenchmarkDef, timeSec: number | null) => void;
  onManual: (benchmarkId: string, value: number | null) => void;
}

function parseTimeInput(s: string): number | null {
  const str = s.trim();
  if (!str) return null;
  if (!str.includes(':')) {
    const n = Number(str);
    return Number.isFinite(n) ? n : null;
  }
  const parts = str.split(':').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function fmtTime(sec: number): string {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${m}:${pad(ss)}`;
}

const fmtWeight = (kg: number, units: Units) => String(Math.round(fromKg(kg, units) * 100) / 100);

interface RowProps {
  bench: BenchmarkDef;
  profile: AthleteProfile;
  units: Units;
  initial: { w: string; r: string; t: string; v: string };
  onOrm: Props['onOrm'];
  onRaceTime: Props['onRaceTime'];
  onManual: Props['onManual'];
}

function BenchmarkRow({ bench, profile, units, initial, onOrm, onRaceTime, onManual }: RowProps) {
  const [w, setW] = useState(initial.w);
  const [r, setR] = useState(initial.r);
  const [t, setT] = useState(initial.t);
  const [v, setV] = useState(initial.v);
  const [warn, setWarn] = useState<string | null>(null);

  function flag(level: 'ok' | 'review' | 'reject', message?: string) {
    setWarn(level === 'ok' ? null : (message ?? null));
  }

  function commitOrm(weightStr: string, repsStr: string) {
    const weight = Number(weightStr);
    const reps = Number(repsStr) || 1;
    if (!weightStr.trim() || !Number.isFinite(weight) || weight <= 0) { onOrm(bench.id, null, reps); setWarn(null); return; }
    const weightKg = toKg(weight, units);
    const audit = auditEntry(bench, calc1RMVal(weightKg, reps), profile);
    flag(audit.level, audit.message);
    onOrm(bench.id, weightKg, reps);
  }
  function commitRace(str: string) {
    const sec = parseTimeInput(str);
    if (sec == null || sec <= 0) { onRaceTime(bench, null); setWarn(null); return; }
    const audit = auditEntry(bench, sec, profile);
    flag(audit.level, audit.message);
    onRaceTime(bench, sec);
  }
  function commitManual(str: string) {
    const val = Number(str);
    if (!str.trim() || !Number.isFinite(val)) { onManual(bench.id, null); setWarn(null); return; }
    const audit = auditEntry(bench, val, profile);
    flag(audit.level, audit.message);
    onManual(bench.id, val);
  }

  return (
    <div className="bench-cell">
      <label className="bench-name">{benchmarkLabel(bench)}</label>
      {bench.source === 'orm' && (
        <div className="row bench-inputs">
          <input inputMode="decimal" placeholder={weightUnit(units)} aria-label={`${benchmarkLabel(bench)} weight`}
            value={w} style={{ width: 76 }}
            onChange={(e) => { setW(e.target.value); commitOrm(e.target.value, r); }} />
          <span className="subtle">×</span>
          <input inputMode="numeric" aria-label={`${benchmarkLabel(bench)} reps`}
            value={r} style={{ width: 44 }}
            onChange={(e) => { setR(e.target.value); commitOrm(w, e.target.value); }} />
          <span className="subtle">reps</span>
        </div>
      )}
      {bench.source === 'race_times' && (
        <div className="row bench-inputs">
          <input placeholder="mm:ss" aria-label={`${benchmarkLabel(bench)} time`}
            value={t} style={{ width: 92 }}
            onChange={(e) => { setT(e.target.value); commitRace(e.target.value); }} />
        </div>
      )}
      {bench.source === 'manual' && (
        <div className="row bench-inputs">
          <input inputMode="decimal" aria-label={benchmarkLabel(bench)}
            value={v} style={{ width: 76 }}
            onChange={(e) => { setV(e.target.value); commitManual(e.target.value); }} />
          <span className="subtle">{bench.unit}</span>
        </div>
      )}
      {warn && <div className="bench-warn">⚠️ {warn}</div>}
    </div>
  );
}

export function BenchmarkGrid({ benchmarks, profile, units, logs, resetKey, onOrm, onRaceTime, onManual }: Props) {
  const list = benchmarks.filter((b) => !b.optional);
  return (
    <div className="card">
      <div className="bench-grid">
        {list.map((b) => {
          const orm = logs.orm.find((e) => e.benchmarkId === b.id);
          const race = logs.raceTimes.find((e) => e.benchmarkId === b.id);
          const man = logs.manual.find((e) => e.benchmarkId === b.id);
          const initial = {
            w: orm ? fmtWeight(orm.weightKg, units) : '',
            r: orm ? String(orm.reps) : '1',
            t: race ? fmtTime(race.timeSec) : '',
            v: man ? String(man.value) : '',
          };
          return (
            <BenchmarkRow
              key={`${b.id}:${resetKey}`}
              bench={b}
              profile={profile}
              units={units}
              initial={initial}
              onOrm={onOrm}
              onRaceTime={onRaceTime}
              onManual={onManual}
            />
          );
        })}
      </div>
      <p className="subtle" style={{ marginTop: 12, marginBottom: 0 }}>
        Fill in what you know — leave the rest blank. Your score updates as you type.
      </p>
    </div>
  );
}
