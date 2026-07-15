/**
 * Remote persistence (Layer 2) over Supabase. Pure row<->logs mappers are
 * exported for testing; the async fns no-op/return safe defaults when Supabase
 * isn't configured.
 *
 * `benchmark_*` tables are owned by this repo. Pushing 1RMs/times into the app's
 * OWN tables (true two-way sync) is the documented contract still to wire up
 * (needs the app's schema) — see ROADMAP.md.
 */

import { supabase } from '../lib/supabase';
import { emptyLogs } from './stores';
import type { Brand } from '../brand';
import type { AthleteLogs, AthleteProfile, PathwayId } from '../engine/types';

export interface EntryRow {
  kind: 'orm' | 'race' | 'manual' | 'wod';
  benchmark_id: string;
  payload: Record<string, unknown>;
}

/** Flatten session logs into DB rows. */
export function logsToRows(logs: AthleteLogs): EntryRow[] {
  return [
    ...logs.orm.map((e): EntryRow => ({
      kind: 'orm', benchmark_id: e.benchmarkId, payload: { weightKg: e.weightKg, reps: e.reps },
    })),
    ...logs.raceTimes.map((e): EntryRow => ({
      kind: 'race', benchmark_id: e.benchmarkId, payload: { modality: e.modality, event: e.event, timeSec: e.timeSec },
    })),
    ...logs.manual.map((e): EntryRow => ({
      kind: 'manual', benchmark_id: e.benchmarkId, payload: { value: e.value },
    })),
    ...logs.wod.map((e): EntryRow => ({
      kind: 'wod', benchmark_id: e.wodId,
      payload: { value: e.value, scaling: e.scaling, repsCompleted: e.repsCompleted, repsPrescribed: e.repsPrescribed },
    })),
  ];
}

/** Rebuild session logs from DB rows. */
export function rowsToLogs(rows: EntryRow[]): AthleteLogs {
  const logs = emptyLogs();
  for (const r of rows) {
    const p = r.payload;
    if (r.kind === 'orm') logs.orm.push({ benchmarkId: r.benchmark_id, weightKg: Number(p.weightKg), reps: Number(p.reps) });
    else if (r.kind === 'race') logs.raceTimes.push({ benchmarkId: r.benchmark_id, modality: String(p.modality ?? ''), event: String(p.event ?? ''), timeSec: Number(p.timeSec) });
    else if (r.kind === 'manual') logs.manual.push({ benchmarkId: r.benchmark_id, value: Number(p.value) });
    else if (r.kind === 'wod') logs.wod.push({ wodId: r.benchmark_id, value: Number(p.value), scaling: p.scaling as AthleteLogs['wod'][number]['scaling'], repsCompleted: p.repsCompleted != null ? Number(p.repsCompleted) : undefined, repsPrescribed: p.repsPrescribed != null ? Number(p.repsPrescribed) : undefined });
  }
  return logs;
}

// ---- async (no-op when not configured) ------------------------------------

export async function loadProfile(userId: string): Promise<{ profile: AthleteProfile; pathway: PathwayId } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('benchmark_profiles')
    .select('sex, bodyweight_kg, age_years, pathway')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data || !data.sex) return null;
  return {
    profile: { sex: data.sex, bodyweightKg: Number(data.bodyweight_kg), ageYears: data.age_years ?? undefined },
    pathway: data.pathway as PathwayId,
  };
}

export async function saveProfile(userId: string, profile: AthleteProfile, pathway: PathwayId, brand: Brand): Promise<void> {
  if (!supabase) return;
  await supabase.from('benchmark_profiles').upsert({
    user_id: userId, brand, sex: profile.sex, bodyweight_kg: profile.bodyweightKg,
    age_years: profile.ageYears ?? null, pathway, updated_at: new Date().toISOString(),
  });
}

export async function loadEntries(userId: string): Promise<AthleteLogs> {
  if (!supabase) return emptyLogs();
  const { data, error } = await supabase
    .from('benchmark_entries')
    .select('kind, benchmark_id, payload')
    .eq('user_id', userId);
  if (error || !data) return emptyLogs();
  return rowsToLogs(data as EntryRow[]);
}

/** Replace the user's saved entries with the current session (simple full sync). */
export async function replaceEntries(userId: string, logs: AthleteLogs, brand: Brand): Promise<void> {
  if (!supabase) return;
  await supabase.from('benchmark_entries').delete().eq('user_id', userId);
  const rows = logsToRows(logs).map((r) => ({ ...r, user_id: userId, brand }));
  if (rows.length) await supabase.from('benchmark_entries').insert(rows);
}

/** Anonymous contribution to the percentile pool (one row per scored benchmark). */
export interface PoolRow {
  brand: Brand;
  benchmark_id: string;
  sex: AthleteProfile['sex'] | null;
  age_band: string | null;
  bodyweight_kg: number;
  value: number;
  lower_is_better: boolean;
  trust: number;
  verified?: boolean;
  user_id?: string | null;
  /** Operator only — the unit a benchmark was scored under (tiers are
   *  pathway-specific there, unlike Lift). See migration 0004. */
  pathway_id?: string | null;
}

export async function submitToPool(rows: PoolRow[]): Promise<void> {
  if (!supabase || rows.length === 0) return;
  await supabase.from('benchmark_submissions').insert(rows.map((r) => ({ ...r, source: 'web' })));
}

/** Trust-weighted population percentile (null until the cell has enough data). */
export async function fetchPercentile(args: {
  brand: Brand; benchmarkId: string; sex: string | null; ageBand: string | null;
  value: number; lowerIsBetter: boolean;
}): Promise<number | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('benchmark_percentile', {
    p_brand: args.brand, p_benchmark_id: args.benchmarkId, p_sex: args.sex,
    p_age_band: args.ageBand, p_value: args.value, p_lower_is_better: args.lowerIsBetter,
  });
  return error || data == null ? null : Number(data);
}

/** How many real athletes sit in a (brand, benchmark, sex, age-band) cell. */
export async function fetchPoolCount(args: {
  brand: Brand; benchmarkId: string; sex: string | null; ageBand: string | null;
}): Promise<number | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('benchmark_pool_count', {
    p_brand: args.brand, p_benchmark_id: args.benchmarkId, p_sex: args.sex, p_age_band: args.ageBand,
  });
  return error || data == null ? null : Number(data);
}

/** Add an email to the list (list-building). Write-only; safe to call from anon. */
export async function captureEmail(args: {
  email: string; brand: Brand; source?: string; pathway?: string; userId?: string | null;
}): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('benchmark_emails').insert({
    email: args.email.trim().toLowerCase(),
    brand: args.brand,
    source: args.source ?? 'updates',
    pathway: args.pathway ?? null,
    user_id: args.userId ?? null,
  });
  return !error;
}
