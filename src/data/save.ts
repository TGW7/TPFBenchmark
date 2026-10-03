/**
 * The "Save my results" sequence, and what the athlete is told about it
 * (2026-10-03, the owner: "Fix benchmark bug").
 *
 * Until this date `save()` in src/ui/App.tsx awaited four writes, checked none
 * of them, and always ended on "Saved". On the hybrid brand every write was
 * rejected by the database's `brand` CHECK (fixed by migration 0006), and the
 * athlete was told their results were saved. Now each step reports its error
 * and the message says what happened.
 *
 * The order is the old one: profile, entries, the TPF app, then the pool. If
 * the profile or entries fail, nothing after them runs — the athlete's own
 * save failed, and there is no point copying it anywhere. A failure syncing
 * to the app or adding to the pool is reported on its own: the save itself
 * stands.
 *
 * Pure orchestration over injected steps, so it is tested without Supabase
 * (src/test/save.test.ts).
 */

import type { WriteError } from './remote';
import type { SyncResult } from './appSync';

export interface SaveSteps {
  saveProfile: () => Promise<WriteError>;
  replaceEntries: () => Promise<WriteError>;
  syncToApp: () => Promise<SyncResult>;
  /** null = the athlete did not tick the pool box (or there is nothing new to
   *  add), so nothing is sent. */
  submitToPool: (() => Promise<WriteError>) | null;
}

export interface SaveOutcome {
  /** True when the athlete's own results were stored. */
  saved: boolean;
  /** What the page shows. */
  message: string;
  /** True when the pool step ran and succeeded (the page then remembers the
   *  rows so the same ones are not added twice in one visit). */
  pooled: boolean;
}

export const SAVE_FAILED =
  'Couldn’t save — your results were NOT stored. Nothing was copied to the app or the pool. Please try again.';

export async function runSave(steps: SaveSteps): Promise<SaveOutcome> {
  const profileErr = await safe(steps.saveProfile);
  if (profileErr) return { saved: false, message: `${SAVE_FAILED} (${profileErr})`, pooled: false };
  const entriesErr = await safe(steps.replaceEntries);
  if (entriesErr) return { saved: false, message: `${SAVE_FAILED} (${entriesErr})`, pooled: false };

  let sync: SyncResult;
  try {
    sync = await steps.syncToApp();
  } catch (e) {
    sync = { ormWritten: 0, racesWritten: 0, disabled: false, error: e instanceof Error ? e.message : String(e) };
  }

  const poolErr = steps.submitToPool ? await safe(steps.submitToPool) : null;
  const pooled = Boolean(steps.submitToPool) && !poolErr;

  const parts: string[] = [];
  if (sync.disabled) parts.push('Saved to your profile.');
  else if (sync.error) parts.push(`Saved to your profile — but couldn’t update your TPF app (${sync.error}).`);
  else parts.push(`Saved — ${sync.ormWritten} lifts + ${sync.racesWritten} times synced to your TPF app.`);
  if (steps.submitToPool) {
    parts.push(poolErr ? `Couldn’t add your numbers to the percentile pool (${poolErr}).` : 'Added to the percentile pool.');
  }
  return { saved: true, message: parts.join(' '), pooled };
}

/** A step that throws is a failed step, not an unhandled rejection. */
async function safe(step: () => Promise<WriteError>): Promise<WriteError> {
  try {
    return await step();
  } catch (e) {
    return e instanceof Error ? e.message || 'unknown error' : String(e);
  }
}
