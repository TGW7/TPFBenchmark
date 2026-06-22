/**
 * In-memory log stores for the four sources (race_times, orm, manual, wod).
 *
 * Deliberately tiny — the engine is pure and takes AthleteLogs as input, so this
 * is just a holding pen the UI writes into. Swap for a real persistence layer
 * (localStorage / API) later without touching the engine.
 */

import type {
  AthleteLogs,
  ManualEntry,
  OrmEntry,
  RaceTimeEntry,
  WodEntry,
} from '../engine/types';

export function emptyLogs(): AthleteLogs {
  return { orm: [], raceTimes: [], manual: [], wod: [] };
}

export class AthleteStore {
  private logs: AthleteLogs;

  constructor(initial?: Partial<AthleteLogs>) {
    this.logs = { ...emptyLogs(), ...initial };
  }

  addOrm(e: OrmEntry): void {
    this.logs.orm.push(e);
  }
  addRaceTime(e: RaceTimeEntry): void {
    this.logs.raceTimes.push(e);
  }
  addManual(e: ManualEntry): void {
    this.logs.manual.push(e);
  }
  addWod(e: WodEntry): void {
    this.logs.wod.push(e);
  }

  /** Return a shallow snapshot safe to hand to the (pure) engine. */
  getLogs(): AthleteLogs {
    return {
      orm: [...this.logs.orm],
      raceTimes: [...this.logs.raceTimes],
      manual: [...this.logs.manual],
      wod: [...this.logs.wod],
    };
  }

  clear(): void {
    this.logs = emptyLogs();
  }
}
