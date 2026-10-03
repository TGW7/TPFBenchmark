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

/**
 * 2026-10-03 — every write below RETURNS its error (a message, or null on
 * success) instead of dropping it. Until then `save()` in src/ui/App.tsx
 * awaited four writes, checked none, and always said "Saved" — which is how a
 * hybrid-brand Save could fail on every attempt (the `brand` CHECK, migration
 * 0006) without anyone seeing it. src/data/save.ts turns these into the
 * message the athlete sees.
 */
export type WriteError = string | null;

const errText = (e: { message?: string } | null | undefined): WriteError =>
  e ? (e.message || 'unknown error') : null;

export async function saveProfile(userId: string, profile: AthleteProfile, pathway: PathwayId, brand: Brand): Promise<WriteError> {
  if (!supabase) return null;
  const { error } = await supabase.from('benchmark_profiles').upsert({
    user_id: userId, brand, sex: profile.sex, bodyweight_kg: profile.bodyweightKg,
    age_years: profile.ageYears ?? null, pathway, updated_at: new Date().toISOString(),
  });
  return errText(error);
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

/** The few query-builder calls replaceEntries makes — so a test can hand it a
 *  fake client (the real one is supabase-js's). */
export interface EntriesClient {
  from(table: 'benchmark_entries'): {
    insert(rows: Record<string, unknown>[]): { select(cols: 'id'): PromiseLike<{ data: { id: string }[] | null; error: { message?: string } | null }> };
    delete(): {
      eq(col: 'user_id', v: string): PromiseLike<{ error: { message?: string } | null }> & {
        not(col: 'id', op: 'in', list: string): PromiseLike<{ error: { message?: string } | null }>;
      };
    };
  };
}

/**
 * Replace the user's saved entries with the current session (simple full
 * sync).
 *
 * 2026-10-03 — INSERT FIRST, then delete the old rows. It used to delete
 * every saved entry and then insert; when the insert was rejected (every
 * hybrid-brand save, before migration 0006) the athlete's saved numbers were
 * simply gone. Now a failed insert leaves the old entries exactly as they
 * were, and a failed clean-up leaves both sets (reported, never silent —
 * loading merges by benchmark).
 */
export async function replaceEntriesWith(
  client: EntriesClient,
  userId: string,
  logs: AthleteLogs,
  brand: Brand,
): Promise<WriteError> {
  const rows = logsToRows(logs).map((r) => ({ ...r, user_id: userId, brand }));
  if (rows.length === 0) {
    const { error } = await client.from('benchmark_entries').delete().eq('user_id', userId);
    return errText(error);
  }
  const ins = await client.from('benchmark_entries').insert(rows).select('id');
  if (ins.error) return errText(ins.error);
  const kept = (ins.data ?? []).map((r) => r.id);
  if (kept.length === 0) return 'the saved entries could not be confirmed';
  const del = await client
    .from('benchmark_entries')
    .delete()
    .eq('user_id', userId)
    .not('id', 'in', `(${kept.join(',')})`);
  return errText(del.error);
}

export async function replaceEntries(userId: string, logs: AthleteLogs, brand: Brand): Promise<WriteError> {
  if (!supabase) return null;
  return replaceEntriesWith(supabase as unknown as EntriesClient, userId, logs, brand);
}

/** A contribution to the percentile pool (one row per scored benchmark).
 *  2026-10-03 — no account id and no bodyweight (src/data/pool.ts header;
 *  migration 0007 strips both server-side as well). */
export interface PoolRow {
  brand: Brand;
  benchmark_id: string;
  sex: AthleteProfile['sex'] | null;
  age_band: string | null;
  value: number;
  lower_is_better: boolean;
  trust: number;
  verified?: boolean;
  /** Operator only — the unit a benchmark was scored under (tiers are
   *  pathway-specific there, unlike Lift). See migration 0004. */
  pathway_id?: string | null;
}

export async function submitToPool(rows: PoolRow[]): Promise<WriteError> {
  if (!supabase || rows.length === 0) return null;
  const { error } = await supabase.from('benchmark_submissions').insert(rows.map((r) => ({ ...r, source: 'web' })));
  return errText(error);
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

/** Add an email to the list (list-building). Write-only; safe to call from anon.
 *  Only after the visitor ticked the marketing-consent box
 *  (src/ui/EmailCapture.tsx). 2026-10-03 — no longer stores the signed-in
 *  account id with the address: nothing in this repo reads it, and the
 *  notice at the point of collection says what IS stored. */
export async function captureEmail(args: {
  email: string; brand: Brand; source?: string; pathway?: string;
}): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('benchmark_emails').insert({
    email: args.email.trim().toLowerCase(),
    brand: args.brand,
    source: args.source ?? 'updates',
    pathway: args.pathway ?? null,
  });
  return !error;
}
