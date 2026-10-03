# Legal-sweep fixes, the hybrid save bug, and predicted race times (2026-10-03)

**Not legal advice.** Every piece of wording below marked **for counsel** is a
draft written by an engineer to make the site say what the code does; none of
it has been read by a lawyer.

The owner, 2026-10-03: *"Fix all the new findings from that sweep"* (the TPF
app's `docs/LEGAL_REVIEW_FOR_COUNSEL_2026-10-03.md`, area H — this site's rows
are H1–H4), *"Fix benchmark bug"* (the `brand` CHECK that rejects
`'hybrid'`, found in passing in `docs/HABS-ALIGNMENT-2026-10-03.md` §8), and,
to *"Should the site fill in predicted race times like the app?"*
(`docs/HABS-ALIGNMENT-2026-10-03.md` §7 Q1), *"1 yes"*.

This document was written in two passes. **§1 was written first, before any
code changed**: the criteria, each marked *applies* / *N-A*. §2 onwards
records what was done against each row.

---

## 1. The criteria — written before the work

The sweep's area H, read at tpf-app `ea86b857`. Its own caveat: it read *"local
copies, which may be behind what is live"* — so each finding was re-checked
against this repo at `b89fa96` (`origin/main`) before being fixed; the
"state here" column is that re-check (read from the code, not run).

| # | Item | Source | State here at `b89fa96` | Verdict |
|---|---|---|---|---|
| C1 | Pool checkbox ticked by default | H1 | `useState(true)` in `src/ui/App.tsx` | **applies** — unticked (opt-in) |
| C2 | Pool rows carry the account id | H1 | `user_id: args.userId` in `src/data/pool.ts`; FK `on delete set null` | **applies** — send none; migration nulls existing rows and strips any that arrive |
| C3 | Pool rows carry other quasi-identifiers nothing reads | H1 (by extension) | `bodyweight_kg` to 0.01 kg; `created_at` to the microsecond (one save's rows share it exactly) — neither read by the percentile function or either recalibration script | **applies** — stop sending bodyweight; coarsen the timestamp |
| C4 | Wording at the point of collection: what is sent, what for, can it be withdrawn | H1 | "add your anonymised numbers to the percentile pool" — and the box shows to signed-out visitors, for whom it does nothing | **applies** — honest wording, privacy link, shown only where it acts (beside Save) |
| C5 | "Anonymised" | H1 Q2 | used in the UI and in code comments | **applies** — dropped from the UI; for counsel |
| C6 | Rows survive account deletion | H1 Q3 | yes (de-linked by the FK) | **applies** as a recorded decision — no link is kept, so they cannot be found to delete; for counsel |
| C7 | The site's saves copy 1RMs and race times into the app account | H1 | said only after saving | **applies** — said beside the Save button |
| C8 | Benchmark tables missing from the app's account export (B9) | H1 | app-side | **N-A here** — tpf-app is read-only for this work; recorded as an owner action |
| C9 | The site's own privacy notice | H1 Q4, H2, H3 | the site links the app's notice, which does not describe the pool, the email list or the benchmark saves | **N-A here** (the notice is the app's) — recorded as an owner/counsel action; the site's links stay pointed at the app's notice |
| C10 | `brand` CHECK allows only `'lift'`/`'operator'`; the hybrid site writes `'hybrid'` | owner, "Fix benchmark bug" | `0001_benchmark_init.sql` (profiles, entries, submissions), `0003` (published standards) | **applies** — migration for every table the client writes; `benchmark_published_standards` only if something writes `'hybrid'` to it (to check) |
| C11 | Failed saves are silent | same | `save()` awaits four calls and always says "Saved"; none checks an error | **applies** — surface it |
| C12 | `replaceEntries` deletes before it inserts | found while reading C11 | a rejected insert (the hybrid CHECK) leaves the athlete's saved entries **deleted** | **applies** — insert first, then delete the old rows |
| C13 | `syncToApp` writes even when its read failed | found while reading C11 | a failed `select` leaves `data` null, and the `update` then replaces the app's whole 1RM / race store with just the site's patch | **applies** — no write without a successful read |
| C14 | "Get standards updates": no privacy information at collection | H2 | none | **applies** — one line + privacy link |
| C15 | Marketing consent explicit, unticked, separate | H2 | the button is the only control | **applies** — an unticked box the button needs |
| C16 | "unsubscribe anytime" with no unsubscribe mechanism in the code | H2 | true | **applies** — say how (the app notice's own route: `enquiries@takepointfitness.com`) |
| C17 | Email rows store the account id | H2 | optional `user_id` | **applies** — stop sending it (nothing in this repo reads it); existing rows: owner question |
| C18 | Other email capture on the site | H2 | the sign-up form (an account, not a list) — none other | **N-A** — no other list |
| C19 | Cookie banner: Accept filled, Decline outline | H3 | `btn` vs `btn ghost` in `src/ui/ConsentBanner.tsx` | **applies** — one class, pinned by a test |
| C20 | Cookie banner wording | H3 | "never attach your name or email to it" while a signed-in visitor is `identify()`d by account id | **applies** — say it is linked to the account when signed in |
| C21 | "your percentile" / "84th percentile" / "percentile-based standards" | H4 | already removed 2026-10-02 (`src/test/no-percentile-claims.test.ts`); a percentile shows only when the server measures one | **N-A** (already fixed) — confirm, and record |
| C22 | "Free forever" | H4 | 3 × `src/content/landingCopy.ts` | **applies** — "Free to use" |
| C23 | "Free to use · private, no tracking" | H4 (by extension) | 3 × landing badges; false since analytics went in (the footer was already corrected) | **applies** |
| C24 | "official threshold tables" | H4 | marketing site only; not in this repo | **N-A here** — tpf-marketing not touched |
| C25 | Unit / standard wording that reads as official | H4, G2 | Operator SEO unit pages ("the {unit} standard"), Operator landing "Held to real standards — the standard set for your role or unit" | **applies** — say they are TPF's tiers, not an official test |
| C26 | "vs N athletes" | found while reading C21 | the count is pool ROWS, and one person saving twice is two rows | **applies** — "results" |
| C27 | Landing explanatory: "pass / good / excellent / elite curve" and "85+ is elite territory" on the six-tier HABS brands | found while reading C22 | wrong for HABS (six tiers, Elite = 100) | **applies** (lift, hybrid); Operator's four-tier wording is right |
| C28 | Meta tags | H4 | `index.html`, `src/main.tsx` (one-liner), SEO page meta | check each; change only a false claim |
| C29 | Marketing site (tpf-marketing): its banner, list and claims | H2–H4 | other repository | **N-A here** — not in this clone |
| P1 | Predicted race times feed HABS exactly as in the app | owner "1 yes" | the site scores typed values only | **applies** — port the app's prediction pure functions with its numbers |
| P2 | Prediction inputs: the site's typed races **and** the app's other typed races | P1 | the pull keeps only events the site has a benchmark for | **applies** — the app predicts from every typed event in a modality (a 1 km row predicts the 2 km), so the pull carries the rest as anchors |
| P3 | Predictions shown as predicted, never saved as typed, never pooled as a result | P1 | — | **applies** |
| P4 | Pool composite cell for the new score | P1 | `overall:<pathway>:v3` (2026-10-03) | **applies** — the score's definition changed again; new cell |
| P5 | `check:app-habs`: partial race coverage, the app's own prediction path, 0 differences | P1 | the check reported predictions as information only | **applies** |
| P6 | Operator (ORS) predictions — the app predicts for ORS too (`OperationalReadinessPanel.tsx`) | P1 | not asked | **N-A** — the owner's question was HABS's; recorded as an owner question |
| P7 | Re-run `check:app-habs`, `check:app-lift`, `check:app-ors`; typecheck, tests, build | brief | — | **applies** |

---

## 2. Every row of §1, answered

| # | Done | Where |
|---|---|---|
| C1 | **Done** — unticked by default (`POOL_OPT_IN_DEFAULT = false`) | `src/data/pool.ts`, `src/ui/App.tsx` |
| C2 | **Done** — client sends no account id; migration 0007 nulls old rows and a trigger strips it from new ones | `src/data/pool.ts`, `src/data/remote.ts`, `supabase/migrations/0007_pool_no_account_link.sql` |
| C3 | **Done** — no bodyweight sent; 0007 nulls it and keeps the month only | same |
| C4 | **Done** — wording below (§3); the box now sits beside Save, signed-in only | `src/ui/SaveControls.tsx`, `src/content/legalCopy.ts` |
| C5 | **Done** in the UI ("not linked to you"); **for counsel** whether any form of "anonymised" may be used (§3) | — |
| C6 | **Recorded** — rows are kept, de-linked, so they cannot be found to delete; the rows that predate opt-in are marked (`pre_opt_in`) so one statement removes them if the answer is "delete" (§10 Q1) | 0007 |
| C7 | **Done** — one line beside Save | `SAVE_COPY` |
| C8 | **Not done** (app-side, read-only here) — owner action, §10 | — |
| C9 | **Not done** (the notice is the app's) — owner/counsel action, §10 | — |
| C10 | **Done** — 0006 for profiles, entries, submissions; `benchmark_published_standards` left (only `lift` / `operator` are published); `benchmark_emails` has no CHECK | `supabase/migrations/0006_allow_hybrid_brand.sql` |
| C11 | **Done** — every write returns its error; `runSave` builds the message | `src/data/save.ts`, `src/data/remote.ts`, `src/ui/SaveControls.tsx` |
| C12 | **Done** — insert first, then delete the old rows; a failed insert deletes nothing | `replaceEntriesWith` in `src/data/remote.ts` |
| C13 | **Done** — no write without a successful read | `syncToAppWith` in `src/data/appSync.ts` |
| C14 | **Done** — notice + privacy link | `src/ui/EmailCapture.tsx` |
| C15 | **Done** — unticked box, button disabled until ticked, separate from pool and sign-up | same |
| C16 | **Done** — "To unsubscribe, email enquiries@takepointfitness.com" (the app notice's own route); "unsubscribe anytime" removed from the pitch | same |
| C17 | **Done** for new sign-ups; existing rows untouched (§10 Q3) | `captureEmail` |
| C18 | N-A — confirmed: the only other email field is the sign-in / sign-up form | — |
| C19 | **Done** — one class for both buttons, pinned | `src/ui/ConsentBanner.tsx`, `src/test/legal-copy.test.ts` |
| C20 | **Done** — wording below (§5) | same |
| C21 | **Confirmed, no change** — read: the dashboard shows a percentile only from `fetchPercentile`, which the server returns only once a cell's trust sum reaches 30; with none it says "Scored against TPF's own standards — not a ranking". The review's sentence "the percentile shown is an estimate" describes the code before 2026-10-02 | `src/ui/resultCopy.ts`, `src/test/no-percentile-claims.test.ts` |
| C22 | **Done** | `src/content/landingCopy.ts` |
| C23 | **Done** | same |
| C24 | N-A here — tpf-marketing not touched | — |
| C25 | **Done** — Operator landing value item, SEO unit pages | `landingCopy.ts`, `scripts/build-seo.mjs` |
| C26 | **Done** — "vs N results" | `src/ui/resultCopy.ts` |
| C27 | **Done** | `landingCopy.ts` |
| C28 | **Checked, no change needed** — `index.html` ("free … no sign-up"), the per-brand title and description set in `src/main.tsx` (the one-liner), the SEO pages' meta descriptions: no false claim found | — |
| C29 | N-A here | — |
| P1–P5 | **Done** — §6 | — |
| P6 | **Not done** — §10 Q5 | — |
| P7 | **Done** — §8 | — |

## 3. H1 — the percentile pool (for counsel)

**What a pool row holds now** (`src/data/pool.ts`; enforced again server-side by
0007): brand, benchmark cell, sex, age band, the value (a result, or the overall
score in one composite row), direction, a trust weight, the Operator unit — and
`created_at` truncated to the month. **No** account id, **no** bodyweight, no
per-save token (nothing needs to group a save's rows, and grouping them would
make a save one athlete's full set of numbers).

**What 0007 does to existing rows** (written, NOT applied): nulls `user_id` and
`bodyweight_kg`, truncates `created_at` to the month, marks every existing row
`pre_opt_in = true` (once only), adds the trigger, drops the "read own
submissions" policy. **Default** (owner question §10 Q1): the old rows are kept
and still count.

**Why the word "anonymised" is gone, and what counsel should know.** TPF also
holds each signed-in athlete's saved entries (`benchmark_entries`, with the
account). A pooled 5 km time and the same time in someone's saved entries can be
lined up by anyone who can read both tables — TPF. Removing the id, the
bodyweight, the exact timestamp and the per-save grouping makes that matching
weak (one value at a time, against everyone with the same sex and age band), not
impossible. The wording therefore says "not linked to you", not "anonymous".
Also: the insert is made with the athlete's signed-in session (the 0005 trust cap
relies on it), so Supabase's own request logs connect the request to the account
for their retention period — not checked how long that is.

| | Old | New (for counsel) |
|---|---|---|
| Pool box | ☑ (ticked) *Help improve the standards — add your anonymised numbers to the percentile pool.* — shown to every visitor, apart from Save | ☐ (unticked) **Add my results to the percentile pool (optional)** — *When you save, your results and overall score are sent with your sex and age band — not your account, name, email or bodyweight — and used to work out percentiles and to review TPF's standards. They aren't linked to you, so they can't be found and removed later.* [Privacy notice] — shown only to a signed-in athlete, under Save |
| Under Save | *(nothing until after saving)* | *Saves your details and numbers to your TPF account, and copies your 1RMs and race times into the TPF app.* |
| After saving | *Saved to your profile.* / *Saved — N lifts + M times synced to your TPF app.* — always, even when every write failed | the same on success, plus *Added to the percentile pool.* when ticked; on failure *Couldn't save — your results were NOT stored. Nothing was copied to the app or the pool. Please try again. (reason)*, or *Saved to your profile — but couldn't update your TPF app (reason).*, or *Couldn't add your numbers to the percentile pool (reason).* |

## 4. The hybrid brand bug (owner: "Fix benchmark bug")

- **Cause:** `0001` declared `brand ... check (brand in ('lift', 'operator'))` on
  `benchmark_profiles`, `benchmark_entries` and `benchmark_submissions`; the
  hybrid brand writes `'hybrid'`. On a database matching 0001 every hybrid save
  was rejected — and the athlete was told "Saved".
- **Worse than a rejected save:** `replaceEntries` deleted the athlete's saved
  entries and then inserted; the insert was rejected, so **each hybrid Save
  deleted that athlete's saved numbers**. Fixed (insert first).
- **Found while there:** `syncToApp` merged onto `data ?? {}` after a read it
  never checked, so a failed read would have **replaced the app's whole 1RM and
  race-time stores** with the session's patch. Fixed (no write after a failed
  read).
- **Migration:** `supabase/migrations/0006_allow_hybrid_brand.sql`, written,
  **NOT applied**. Apply it, then 0007, in the **TPF app's Supabase project** —
  the site has no project of its own (`.env.example`: "the SAME project as the
  Take Point Fitness app"; DEPLOY.md). The project's URL is the Vercel variable
  `VITE_SUPABASE_URL`; this clone has no `.env.local`, so the project was not
  named or contacted.
- **Not verified:** whether the live tables carry the 0001 CHECK (the live
  database was not read), whether any hybrid hostname is live, how many hybrid
  saves were attempted.

## 5. H2 and H3 — email list and cookie banner (for counsel)

| | Old | New (for counsel) |
|---|---|---|
| List pitch | *New benchmarks, recalibrated tiers, and training drops. No spam, unsubscribe anytime.* | *New benchmarks, recalibrated tiers, and training drops. No spam.* |
| List consent | *(none — the button alone)* | ☐ (unticked, required) *Yes, email me TPF Benchmark updates. I can unsubscribe at any time.* |
| List notice | *(none)* | *We keep your email address (with the site and pathway you signed up from) only to send these updates. To unsubscribe, email enquiries@takepointfitness.com.* [Privacy notice] |
| List storage | address, brand, source, pathway, **and the signed-in account id** | address, brand, source, pathway — no account id (existing rows untouched) |
| Banner text | *We'd like to measure which parts of the benchmark actually help — which means a cookie that recognises your browser across our sites. We never sell it and never attach your name or email to it. Decline and everything here still works.* [Privacy policy] | *We'd like to measure which parts of the benchmark help — which means an analytics cookie that recognises your browser across our sites. If you sign in, it's linked to your TPF account. Never sold, never used for ads, no screen recording. Decline and everything here still works.* [Privacy notice] |
| Banner buttons | Decline `btn ghost` (outline), Accept `btn` (filled) | both `btn ghost` (`BANNER_BUTTON_CLASS`) |

Why the banner text changed: a signed-in visitor is `identify()`d with their
account id (`src/lib/posthog.ts`), so the cookie IS tied to an account that
holds a name and email. "No screen recording": `disable_session_recording: true`.
All words are in `src/content/legalCopy.ts`.

## 6. Predicted race times (owner: "1 yes")

**What was ported** (`src/engine/racePrediction.ts`, read from tpf-app
`ea86b857`, every number as the app has it): Daniels VDOT (the demand and
fraction equations, the iteration, MAX_PLAUSIBLE_VDOT 90), the long-distance
damping (0.012, floor 0.90), `predictRaceTime` (logged anchors only, within
4.1×, the VDOT blended between the nearest shorter and longer race, one-sided
damping, 100 m isolated), the run / row / bike / swim event lists, the marathon
cap, the Riegel exponents (run 1.07, row 1.08, bike 1.05, swim 1.06) with the
bodyweight term (70 kg men's / 62 kg women's reference, row at 25 %), and
`raceTimesWithEquivalents` (fill order, nearest-source tie-break, rounding to
the second, dropping a stored prediction it cannot reproduce).

**How it feeds HABS** (`src/engine/habsPredict.ts`, `src/ui/App.tsx`): the race
store is built from (1) the athlete's other typed app results at events the
site has no field for — pulled on sign-in as **anchors**
(`anchorsFromAppProfile`), because the app predicts from every typed event in a
modality — and (2) the times typed on the site (the HABS races and the 500 m
row, `PREDICTION_RACE_EVENTS`), which win. The app's rule runs on it; each HABS
race of the pathway with no typed time is filled with its prediction for
**scoring only** (`scoringLogs`). Typed `logs` alone are saved, synced to the
app and pooled. The bodyweight is the profile's; sex M/F → the app's
male/female.

**How it is shown:** the field stays empty; its placeholder shows `≈ 40:55`
and a line under it reads *"Predicted 40:55 from your 5 km — counts toward your
score until you enter a time."* (with *"(from your TPF app results)"* when a
source is an app-only result). The count reads e.g. *"3 of 11 entered · 2
predicted."* plus one sentence explaining it (the wording seen in a static
render; the numbers there are an example).

**The pool:** the score changed for partial athletes, so the composite cell
moved to `overall:<pathway>:v4`; v3 rows are left untouched (§10 Q4).

**Not ported, by design:** the app's other input-layer rules — logged e1RMs and
runs beating typed values, the six-month "current" window (HABS-ALIGNMENT D18,
D20) — the site has no training log. The app's own two HABS surfaces pass
bodyweight differently when it is unset (`page.tsx` passes a default by sex,
`HabsPanel.tsx` passes null); the site always has a bodyweight, so this only
matters for an app athlete with no bodyweight saved, and only for row
predictions.

## 7. H4 — claims (for counsel)

| Where | Old | New |
|---|---|---|
| Landing "options" card, Lift | *Your score, tier and weak link — across every pathway. Free forever — sign in to save yours.* | *… Free to use — sign in to save yours.* |
| Same, Operator | *Your readiness score, tier and biggest gap. Free forever — sign in to save yours.* | *… Free to use — sign in to save yours.* |
| Same, Hybrid | *Your hybrid score, tier and weak side — free forever; sign in to save yours.* | *… free to use; sign in to save yours.* |
| Landing authority badge (3 brands) | *Free to use · private, no tracking* | *Free to use · analytics only if you say yes* |
| Operator value item | **Held to real standards** — *Scored against the standard set for your role or unit — not a generic chart.* | **Role-specific standards** — *Scored on TPF's standards for your role or unit, built from published test tables where they exist — not a generic chart.* |
| Lift explanatory | *… on a clear pass / good / excellent / elite curve …* / *Scores compress at the top — 85+ is elite territory, because it means being near the top in every area at once, not just one.* | *… on a clear six-tier curve, Beginner to Elite …* / *Scores compress at the top: a high overall score means being strong in every area at once, not just one.* |
| Hybrid explanatory | the same two phrases | the same two replacements |
| Operator explanatory | *… 85+ is elite territory, because it means …* | *… 85 is Excellent and 100 is Elite, because a high overall score means …* (its four-tier curve wording is right and stays) |
| Operator SEO unit pages (16 — measured in the build: all 16 carry it) | *Could you meet the {unit} standard? These are the per-event tiers (unisex, absolute) used to score readiness.* | *Could you meet the {unit} standard? These are Take Point Fitness's per-event tiers for the {unit} pathway (unisex, absolute), used to score readiness. They are not an official test, and no military or police body endorses them.* |
| Live percentile line / copied result | *live — vs 1,240 athletes* / *88th percentile of 1,240 athletes* | *live — vs 1,240 results* / *88th percentile of 1,240 results* |

**Looked at and left** (no false claim found, or not this sweep's to decide):
"Free tool. Free account. Free app. … a genuinely free version. No
subscription, no card, no trial." (the app has a free tier — not verified
here); "Built by ex-British Army PTIs" (not verifiable from code); "Standards
shown are a preview until calibrated" / "Standards are v1 beta, calibrating
with real athletes"; the SEO titles "{unit} Fitness Standards | TPF Operator"
(each page now carries the disclaimer; the title itself is a counsel question,
§10 Q6).

## 8. Checks, measured

All against tpf-app `ea86b857`, read-only, with the app's own `tsx`; the app's
HABS and prediction sources (`habs.ts`, `habs_pathways.ts`,
`habs_pathway_standards.ts`, `auto_benchmark_inputs.ts`, `race_predictor.ts`,
`multimodal_race_times_storage.ts`, `race_times_storage.ts`, `calc.ts`,
`constants.ts`) had no uncommitted changes and no change since `226b018a`.

```
[check:app-habs] model: 7 pathways × 9 weights, 9 labels, 15 benchmark memberships, 210 ladders, 9 Olympic-divisor flags: 0 difference(s)
[check:app-habs] athletes: 1644 (7 pathways × 2 sexes × 46 fixed + 400 random + 600 random with sparse races, app anchors and bodyweights); 743 carry app-only anchors
[check:app-habs] scores, typed values only: 1386 with a score, 1644 bit-identical, max |Δ| 0: 0 difference(s)
[check:app-habs] equivalents (the app's raceTimesWithEquivalents vs the site's port): 25438 run/row/bike/swim events, 17527 of them predicted: 0 difference(s)
[check:app-habs] scores, with predicted equivalents (the app's own prediction path vs the site's): 1448 with a score, 1644 bit-identical, max |Δ| 0, 1793 HABS races filled by the site: 0 difference(s)
[check:app-habs] information: predictions move 647 of 1644 athletes' score by more than 0.5 (max 100.0)
[check:app-lift] 4 WODs × 2 sexes, 16 base keys × 2 sexes, 68 app pathway rows: 0 difference(s)
[check:app-ors] 13 mirrored units, 176 site benchmark defs: 0 difference(s)
```

**The check can fail** (each mutation made in the site's port, run, reverted):
row exponent 1.08 → 1.081 (2,136 equivalent and 158 score differences); no
rounding (17,527 / 2,850); 4.1× → 4.3× (1,119 / 930); no VDOT blend (1,958 /
668); row bodyweight term off (1,782 / 255); damping 0.012 → 0.013 (3,660 /
1,570); marathon cap → 50 km (828 equivalents, 0 scores — HABS reads nothing
past a half marathon); 100 m in the distance chain (14 / 0); Riegel tie-break
`<` → `<=` (109 / 6); no VDOT plausibility guard (168 / 50); anchors ignored
(7,530 / 1,838). Two mutations it did not catch were redundant guards
(isolating 100 m — the distance chain excludes it anyway; the "typed time is
never replaced" check — a typed event is never `predicted`).

**Site gate:** `npx tsc --noEmit` exit 0; `npx vitest run` **35 files, 500
tests, 0 failures** (was 31 / 436); `npm run build` exit 0 (codegen, tsc, vite,
45 SEO pages + 2 sitemaps). The built bundle and pages contain none of
"forever", "no tracking", "anonymised"; the built Navy SEAL page carries the
new disclaimer. New tests: `src/test/save.test.ts`,
`src/test/race-prediction.test.ts`, `src/test/legal-copy.test.ts`,
`src/test/migrations-2026-10-03.test.ts`; extended: `pool.test.ts`,
`appsync.test.ts`, `habs-app-map.test.ts`, `habs-ui.test.ts`,
`no-percentile-claims.test.ts`. Mutation-checked: the pool box defaulting to
ticked, Accept going back to `btn`, delete-before-insert, write-after-failed-read
and an account id put back in a pool row each fail a test.

## 9. What was NOT checked

- **No browser.** No dev server or preview (the brief and the app's rules).
  The pool box, Save line, email form, banner and predicted fields were seen
  only as static HTML from react-dom/server; `src/ui/App.tsx`'s wiring is
  covered by `tsc` and source-text pins — App is never rendered in a test.
- **The migrations were never run** against Postgres, local or live. Their
  text is pinned against the client; whether they apply cleanly (the DO
  blocks, the trigger, `date_trunc` on the live column type) is unverified.
  Whether 0002–0005 are applied live was not checked either.
- **The live database was not read** — not the CHECKs, not how many pool rows,
  hybrid saves or email rows exist.
- **supabase-js against a real PostgREST:** `insert(...).select('id')` and
  `.not('id', 'in', '(…)')` are the library's documented forms; tested only
  against a fake client.
- **The pull's anchors against a real app account** — tested on the mapper only.
- **Supabase's request-log retention** (§3).
- **tpf-marketing** (H2–H4's marketing-site rows) — not in this clone.
- **Legal correctness of any wording** — none of it has been read by counsel.

## 10. Owner questions (each with the default used)

**Q1 — The pool rows collected while the box was ticked by default.**
*What it is:* every row in the pool before this change was added without the
athlete choosing to (the box was pre-ticked). 0007 marks them
`pre_opt_in = true`. *Why ask:* if the pool's basis is consent, those rows
arguably never had it (counsel's H1 Q1). *Options:* keep them de-linked and
counting (**default**); or delete them —
`delete from public.benchmark_submissions where pre_opt_in;` — which cannot be
undone, and empties most percentile cells (they need 30 trusted results each).
*Recommendation:* wait for counsel's answer to H1 Q1; delete if the basis is
consent.

**Q2 — Drop the `user_id` column from the pool.** *What it is:* 0007 leaves the
column (always null) so a browser tab still running the old page is stripped,
not rejected. *Default:* leave it; drop it in a later migration a week or so
after this deploys.

**Q3 — Existing email-list rows that carry an account id.** *What it is:* new
sign-ups no longer store it; old rows still do. *Default:* leave them until
counsel answers H2 (they may be needed to honour an unsubscribe by account).

**Q4 — The `overall:*:v3` pool rows** (HABS scores from earlier today, without
predictions). *Default:* leave them; nothing reads them.

**Q5 — Should Operator (ORS) also fill missing races with predictions?** *What
it is:* the app predicts for ORS too (`OperationalReadinessPanel.tsx`); the
site's Operator score does not. *Why ask:* the "1 yes" was to the HABS
question. *Default:* no change.

**Q6 — SEO page titles "{unit} Fitness Standards".** Each page now says the
tiers are TPF's and not an official test; whether the title itself must change
is counsel's G2 / H4 question. *Default:* titles unchanged.

**Q7 — A pulled race loses its "achieved on" date on Save.** `racePatchFromLogs`
rewrites every mapped race as a new record (`updatedAt` now, no `achievedOn`).
Pre-existing; not fixed. *Default:* leave until asked.

**Owner actions (not questions):** apply 0006 then 0007 in the TPF app's
Supabase project; the privacy notice must describe the benchmark site's pool,
saves and list (C9); the app's account export should include the benchmark
tables (C8, the review's B9); tpf-marketing's H2–H4 rows are untouched.
