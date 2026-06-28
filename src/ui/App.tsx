import { useEffect, useMemo, useState } from 'react';
import './theme.css';
import {
  ageBand,
  analyseWeaknesses,
  computeCapacityIndex,
  computeHRS,
  estimatedPercentile,
  toComponentScoreMap,
} from '../engine';
import type {
  AthleteLogs,
  AthleteProfile,
  ManualEntry,
  OrmEntry,
  PathwayId,
  RaceTimeEntry,
  WodEntry,
} from '../engine/types';
import { emptyLogs } from '../data/stores';
import { brandConfig } from '../data/brandConfig';
import { brandMeta, detectBrand } from '../brand';
import { LANDING_COPY } from '../content/landingCopy';
import { useAuth } from '../auth/AuthContext';
import { AuthPanel } from '../auth/AuthPanel';
import { fetchPercentile, fetchPoolCount, loadEntries, loadProfile, replaceEntries, saveProfile, submitToPool } from '../data/remote';
import { buildPoolSubmissions } from '../data/pool';
import { syncFromApp, syncToApp } from '../data/appSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { Dashboard } from './Dashboard';
import { WeaknessRadar, type RadarAxis } from './WeaknessRadar';
import { BenchmarkEntry } from './BenchmarkEntry';
import { WodLog } from './WodLog';
import { PathwayPicker } from './PathwayPicker';
import { ProfileBar } from './ProfileBar';
import { EmailCapture } from './EmailCapture';
import { BrowseStandards } from './BrowseStandards';
import { Landing } from './Landing';
import { Footer } from './Footer';
import { benchmarkLabel, componentLabel, formatPercentile } from './format';
import { event } from '../lib/analytics';
import { shareResult } from './shareImage';
import { type Units, loadUnits, saveUnits } from '../lib/units';

const BRAND = detectBrand();
const META = brandMeta();
const COPY = LANDING_COPY[BRAND];
const CFG = brandConfig(BRAND);
const SITE = BRAND === 'operator'
  ? 'https://operatorbenchmark.takepointfitness.com'
  : 'https://benchmark.takepointfitness.com';
const APP_NAME = BRAND === 'operator' ? 'TPF Operator' : 'Take Point Fitness';

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

function hasEntries(l: AthleteLogs): boolean {
  return Boolean(l.orm.length || l.raceTimes.length || l.manual.length || l.wod.length);
}
function dedupeByBenchmark<T extends { benchmarkId: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((e) => (seen.has(e.benchmarkId) ? false : (seen.add(e.benchmarkId), true)));
}
function mergeLogs(app: AthleteLogs, ours: AthleteLogs): AthleteLogs {
  return {
    orm: dedupeByBenchmark([...app.orm, ...ours.orm]),
    raceTimes: dedupeByBenchmark([...app.raceTimes, ...ours.raceTimes]),
    manual: ours.manual,
    wod: ours.wod,
  };
}

export function App() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AthleteLogs>(emptyLogs());
  const [profile, setProfile] = useState<AthleteProfile>({ sex: 'M', bodyweightKg: 80, ageYears: 30 });
  const [pathwayId, setPathwayId] = useState<PathwayId>(CFG.pathwayList[0].id);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
  );
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [contribute, setContribute] = useState(true);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [units, setUnitsState] = useState<Units>(loadUnits());
  function setUnits(u: Units) { setUnitsState(u); saveUnits(u); event('units_changed', { units: u }); }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [p, ours, appLogs] = await Promise.all([
        loadProfile(user.id),
        loadEntries(user.id),
        syncFromApp(user.id),
      ]);
      if (cancelled) return;
      if (p) { setProfile(p.profile); setPathwayId(p.pathway); }
      const merged = mergeLogs(appLogs, ours);
      if (hasEntries(merged)) setLogs(merged);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const pathway = CFG.pathways[pathwayId];
  const benchmarks = useMemo(() => CFG.benchmarksFor(pathwayId), [pathwayId]);
  const result = useMemo(
    () => computeHRS({ pathway, benchmarks, profile, logs }),
    [pathway, benchmarks, profile, logs],
  );
  const capacity = useMemo(
    () => computeCapacityIndex(CFG.wods, logs.wod, toComponentScoreMap(result.components), profile),
    [logs.wod, result.components, profile],
  );
  const weakness = useMemo(() => analyseWeaknesses(result), [result]);
  const hasData = result.overall != null;

  // Data-driven overall percentile from the pool; falls back to the tier estimate
  // until a (sex, age-band) cell has enough trusted submissions.
  const [poolPct, setPoolPct] = useState<number | null>(null);
  const [poolN, setPoolN] = useState<number | null>(null);
  useEffect(() => {
    const overall = result.overall;
    if (!isSupabaseConfigured || overall == null) { setPoolPct(null); setPoolN(null); return; }
    let cancelled = false;
    const t = setTimeout(() => {
      const cell = {
        brand: BRAND, benchmarkId: `overall:${pathwayId}`,
        sex: profile.sex, ageBand: ageBand(profile.ageYears) ?? null,
      };
      fetchPercentile({ ...cell, value: overall, lowerIsBetter: false })
        .then((p) => { if (!cancelled) setPoolPct(p); });
      fetchPoolCount(cell).then((n) => { if (!cancelled) setPoolN(n); });
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [pathwayId, profile.sex, profile.ageYears, result.overall]);
  const percentile = poolPct ?? estimatedPercentile(result.overall);

  // Radar axes: per-lift for strength pathways, per-component otherwise.
  const radarAxes = useMemo<RadarAxis[]>(() => {
    if (pathway.radar === 'benchmarks') {
      const scoreById = new Map<string, number | null>();
      for (const c of result.components) for (const b of c.benchmarks) scoreById.set(b.benchmarkId, b.percent);
      return benchmarks.map((b) => ({ label: benchmarkLabel(b), percent: scoreById.get(b.id) ?? null }));
    }
    return CFG.components.map((c) => ({
      label: componentLabel(c),
      percent: result.components.find((x) => x.component === c)?.percent ?? null,
    }));
  }, [pathway, benchmarks, result]);

  // WODs + Capacity Index don't apply to pure-strength pathways.
  const showWods = (pathway.showWods ?? true) && CFG.wodList.length > 0;

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  }
  function loadSample() { setLogs(CFG.sampleLogs); setProfile(CFG.sampleProfile); }

  function copyResult() {
    if (result.overall == null) return;
    const weak = weakness.limiters.map(componentLabel).join(', ') || '—';
    const text =
      `My ${META.shortName} — ${pathway.label}: ${Math.round(result.overall)}/100 ` +
      `(≈ ${formatPercentile(percentile)} percentile). Weakest: ${weak}. ` +
      `Score yours free → ${SITE}`;
    navigator.clipboard?.writeText(text).then(
      () => setShareMsg('Copied — paste it anywhere.'),
      () => setShareMsg('Couldn’t copy automatically.'),
    );
  }

  async function shareImg() {
    if (result.overall == null) return;
    event('result_shared', { brand: BRAND, pathway: pathwayId });
    try {
      const res = await shareResult(
        {
          brand: BRAND, shortName: META.shortName, scoreText: String(Math.round(result.overall)),
          percentileText: formatPercentile(percentile), pathway: pathway.label,
          weakest: weakness.limiters.map(componentLabel)[0] ?? '—', site: SITE.replace('https://', ''),
        },
        `My ${META.shortName} — ${Math.round(result.overall)} (${pathway.label}). Score yours free.`,
      );
      setShareMsg(res === 'shared' ? 'Shared!' : 'Image downloaded.');
    } catch {
      setShareMsg('Couldn’t make the image.');
    }
  }

  const addOrm = (e: OrmEntry) => setLogs((l) => ({ ...l, orm: [...l.orm, e] }));
  const addRaceTime = (e: RaceTimeEntry) => setLogs((l) => ({ ...l, raceTimes: [...l.raceTimes, e] }));
  const addManual = (e: ManualEntry) => setLogs((l) => ({ ...l, manual: [...l.manual, e] }));
  const addWod = (e: WodEntry) => setLogs((l) => ({ ...l, wod: [...l.wod, e] }));

  async function save() {
    if (!user) return;
    setSaveMsg('Saving…');
    await saveProfile(user.id, profile, pathwayId, BRAND);
    await replaceEntries(user.id, logs, BRAND);
    const sync = await syncToApp(user.id, logs);
    if (contribute) {
      await submitToPool(
        buildPoolSubmissions({ brand: BRAND, benchmarks, profile, logs, signedIn: true, userId: user.id, pathwayId, overall: result.overall }),
      );
    }
    setSaveMsg(
      sync.disabled
        ? 'Saved to your profile.'
        : `Saved — ${sync.ormWritten} lifts + ${sync.racesWritten} times synced to your TPF app.`,
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="brandmark">
            {META.shortName} <span className="accent">·</span> {META.fullName}
          </div>
          <div className="subtle">{META.tagline}</div>
        </div>
        <div className="row" style={{ alignItems: 'center' }}>
          <a className="btn cta-primary" href={META.appUrl}>Get the app</a>
          <AuthPanel />
          <button className="btn ghost" onClick={toggleTheme}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
        </div>
      </header>

      <nav className="row" style={{ margin: '12px 0' }}>
        <button className="btn ghost" onClick={() => scrollTo('calculator')}>Calculator</button>
        <button className="btn ghost" onClick={() => scrollTo('standards')}>Browse standards</button>
        <button className="btn ghost" onClick={() => scrollTo('why')}>Why it works</button>
      </nav>

      {/* ── Calculator: front and centre ── */}
      <section id="calculator">
        <div style={{ margin: '8px 0 18px' }}>
          <h1 className="display">{COPY.hero.headline}</h1>
          <p className="lead">{COPY.hero.subhead}</p>
        </div>

        <div className="banner">{CFG.synthetic ? '⚠️ ' : ''}{CFG.banner} Nothing is saved — entries clear when you leave{user ? ', unless you Save to your profile' : ''}.</div>

        <ProfileBar
          profile={profile}
          onChange={setProfile}
          onLoadSample={loadSample}
          onClear={() => { setLogs(emptyLogs()); setSaveMsg(null); }}
          hasData={hasData}
          units={units}
          onUnitsChange={setUnits}
        />

        {user && (
          <div className="row" style={{ marginBottom: 16, alignItems: 'center' }}>
            <button className="btn" onClick={save}>Save my results</button>
            {saveMsg && <span className="subtle">{saveMsg}</span>}
          </div>
        )}

        {isSupabaseConfigured && (
          <label className="row subtle" style={{ alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <input type="checkbox" checked={contribute} onChange={(e) => setContribute(e.target.checked)} />
            Help improve the standards — add your anonymised numbers to the percentile pool.
          </label>
        )}

        <div style={{ marginBottom: 16 }}>
          <div className="subtle" style={{ marginBottom: 6 }}>Score against:</div>
          <PathwayPicker pathways={CFG.pathwayList} value={pathwayId} onChange={(id) => { setPathwayId(id); event('pathway_selected', { pathway: id, brand: BRAND }); }} />
        </div>

        {!hasData && (
          <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
            <p style={{ margin: 0 }}>
              Enter your numbers below — or{' '}
              <button className="btn" style={{ padding: '2px 10px' }} onClick={loadSample}>load a sample athlete</button>{' '}
              to see how it works. Switch pathway any time without losing your entries.
            </p>
          </div>
        )}

        <Dashboard
          result={result}
          capacity={capacity}
          weakness={weakness}
          pathwayLabel={pathway.label}
          percentile={percentile}
          percentileLive={poolPct != null}
          percentileN={poolPct != null ? poolN : null}
          showCapacity={showWods}
        />

        {hasData && (
          <div className="row" style={{ marginTop: 16, alignItems: 'center' }}>
            <button className="btn" onClick={shareImg}>Share my result</button>
            <button className="btn ghost" onClick={copyResult}>Copy text</button>
            {shareMsg && <span className="subtle">{shareMsg}</span>}
          </div>
        )}

        {hasData && weakness.limiters[0] && (
          <div className="card" style={{ marginTop: 16, borderColor: 'var(--primary)' }}>
            <p style={{ margin: 0 }}>
              Your weak link is <strong>{componentLabel(weakness.limiters[0])}</strong>. The {APP_NAME} app
              turns it into a training plan and tracks it over time.{' '}
              <a className="btn" style={{ marginLeft: 6 }} href={META.appUrl}
                onClick={() => event('get_app_click', { from: 'bridge', brand: BRAND })}>Get the app →</a>
            </p>
          </div>
        )}

        {hasData && <EmailCapture brand={BRAND} pathway={pathwayId} userId={user?.id ?? null} />}

        <div className="grid cols-2" style={{ marginTop: 16 }}>
          <div className="card">
            <h2>{pathway.radar === 'benchmarks' ? 'Per-lift radar' : 'Weakness radar'}</h2>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <WeaknessRadar axes={radarAxes} />
            </div>
          </div>
          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <BenchmarkEntry
              benchmarks={benchmarks}
              profile={profile}
              onLogOrm={addOrm}
              onLogRaceTime={addRaceTime}
              onLogManual={addManual}
              units={units}
            />
            {showWods && <WodLog wods={CFG.wodList} sex={profile.sex} onLogWod={addWod} />}
          </div>
        </div>
      </section>

      {/* ── Standards, further down ── */}
      <section id="standards" style={{ marginTop: 40 }}>
        <BrowseStandards
          benchmarks={benchmarks}
          wods={CFG.wodList}
          sex={profile.sex}
          unisex={CFG.unisex}
          onSexChange={(s) => setProfile((p) => ({ ...p, sex: s }))}
        />
      </section>

      {/* ── Why it works (marketing / SEO content) ── */}
      <section id="why" style={{ marginTop: 16 }}>
        <Landing copy={COPY} meta={META} heroless onStart={() => scrollTo('calculator')} />
      </section>

      <Footer meta={META} onCalculator={() => scrollTo('calculator')} onStandards={() => scrollTo('standards')} />
    </div>
  );
}
