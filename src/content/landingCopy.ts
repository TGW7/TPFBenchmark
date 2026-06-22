/**
 * Landing copy, derived from docs/BRANDSCRIPT.md and structured to the
 * StoryBrand homepage wireframe (header → stakes → value → guide → plan →
 * explanatory → options → repeat CTA → footer).
 *
 * Copy rules applied: customer-first ("you" > "we" above the fold), specific
 * verb buttons, internal problem named, no jargon, benefits before features.
 *
 * Authority lines use ONLY genuinely-true anchors — no fabricated stats /
 * testimonials (see BRANDSCRIPT.md row 3b).
 */

import type { Brand } from '../brand';

export interface PlanStep {
  title: string;
  body: string;
}
export interface ValueItem {
  title: string;
  body: string;
}

export interface LandingCopy {
  hero: {
    eyebrow: string;
    headline: string; // the customer's desire
    subhead: string; // the one-liner, condensed
    primaryCta: string; // transitional on this property (free tool)
    secondaryCta: string; // direct CTA to the paid app
    /** Aspirational "success state" shown in the hero visual. */
    successScore: number;
    successPercentile: string;
    successLabel: string;
  };
  stakes: { heading: string; bullets: string[] };
  value: { heading: string; items: ValueItem[] };
  guide: { empathy: string; authority: string[] };
  plan: { heading: string; steps: PlanStep[] };
  explanatory: string;
  options: {
    heading: string;
    free: { title: string; body: string };
    app: { title: string; body: string; cta: string };
  };
  finalCta: { heading: string; sub: string; primaryCta: string; secondaryCta: string };
  oneLiner: string;
  aspirationalIdentity: string;
}

const LIFT: LandingCopy = {
  hero: {
    eyebrow: 'Free benchmark · no sign-up',
    headline: 'Know if your training is actually working.',
    subhead:
      'Score your lifts and times against your goal, see your percentile for your age and sex, and find the one weak link holding you back.',
    primaryCta: 'Score yourself free',
    secondaryCta: 'Get the app',
    successScore: 84,
    successPercentile: '84th',
    successLabel: 'Strong all-rounder',
  },
  stakes: {
    heading: 'Training hard and still guessing?',
    bullets: [
      'You’re plateauing — with no idea which lift or engine is holding you back.',
      'Generic “standards” online don’t fit your goal or your bodyweight.',
      'Months of effort, and no clear read on whether any of it is paying off.',
    ],
  },
  value: {
    heading: 'Stop guessing. Start knowing.',
    items: [
      { title: 'Know your number', body: 'One clear score for your whole profile, weighted to the goal you actually train for.' },
      { title: 'Find your weak link', body: 'See the single area that will raise your score the most — so you train what matters.' },
      { title: 'Compare fairly', body: 'Your percentile for your sex and age — not a one-size chart built for someone else.' },
      { title: 'Pick your path', body: 'Gym-Goer, Powerlifter, CrossFit or HYROX — each scored on what counts for that goal.' },
    ],
  },
  guide: {
    empathy:
      'We train the way you do — and we got tired of grinding for months with no clear signal it was working.',
    authority: [
      'Built by ex-British Army PTIs',
      'Transparent, percentile-based standards — no black box',
      'Free, no account needed, no tracking',
    ],
  },
  plan: {
    heading: 'Three steps to your score',
    steps: [
      { title: 'Pick your pathway', body: 'Choose the goal you train for.' },
      { title: 'Enter your lifts & times', body: 'A few numbers — no sign-up.' },
      { title: 'See your score & weak link', body: 'Know where you stand and what to fix next.' },
    ],
  },
  explanatory:
    'Take Point Fitness turns your scattered numbers into one honest read. Enter your squat, deadlift, bench, runs, rows and benchmark workouts, choose the pathway that matches your goal, and the calculator scores each lift and time on a clear pass / good / excellent / elite curve — adjusted for your bodyweight, sex and age. It weights everything toward the goal you care about, estimates your percentile, and shows the weak link that’s costing you the most. It’s free and needs no account. When you’re ready to fix what it finds, the Take Point Fitness app turns your weak link into a plan and tracks the number as it climbs.',
  options: {
    heading: 'Free to find out. Built to improve.',
    free: { title: 'The benchmark', body: 'Your score, percentile and weak link — across every pathway. Free, forever, no account.' },
    app: {
      title: 'The Take Point Fitness app',
      body: 'Turn your weak link into a plan, log your training, and watch your score climb. Your benchmark syncs straight in.',
      cta: 'Get the app',
    },
  },
  finalCta: {
    heading: 'See where you really stand.',
    sub: 'Two minutes, no sign-up. Score yourself and find your weak link.',
    primaryCta: 'Score yourself free',
    secondaryCta: 'Get the app',
  },
  oneLiner:
    'Most lifters and hybrid athletes train hard but never know if it’s working. Take Point Fitness scores your strength and conditioning against your goal, so you can stop guessing and see exactly where you stand — and what to fix.',
  aspirationalIdentity: 'The athlete who trains with intent and evidence — not on vibes.',
};

const OPERATOR: LandingCopy = {
  hero: {
    eyebrow: 'Free readiness benchmark · no sign-up',
    headline: 'Know you’re mission-ready — not guessing.',
    subhead:
      'Score your strength, engine and work capacity against operator standards, see your percentile, and find the gap that would fail you when it counts.',
    primaryCta: 'Score yourself free',
    secondaryCta: 'Get the app',
    successScore: 84,
    successPercentile: '84th',
    successLabel: 'Mission-ready',
  },
  stakes: {
    heading: 'Gym-fit isn’t the same as ready.',
    bullets: [
      'You don’t know if your fitness holds up under load, distance and fatigue.',
      'Generic standards don’t reflect what the role actually demands.',
      'You find the gap the hard way — when it matters most.',
    ],
  },
  value: {
    heading: 'Know your readiness. Close the gap.',
    items: [
      { title: 'Know your readiness', body: 'One clear score across strength, engine and work capacity, weighted to your standard.' },
      { title: 'Find the gap', body: 'See the weakness that would fail you first — and train it before it’s tested.' },
      { title: 'Held to real standards', body: 'Scored against tactical demands and your age and sex — not a generic chart.' },
      { title: 'Pick your standard', body: 'Choose the role or unit benchmark that matches the job.' },
    ],
  },
  guide: {
    empathy:
      'We’ve carried the weight too — and we know the cost of finding a weakness in the field instead of in training.',
    authority: [
      'Built by ex-British Army PTIs',
      'Standards modelled on tactical demands',
      'Free, no account needed, no tracking',
    ],
  },
  plan: {
    heading: 'Three steps to your readiness',
    steps: [
      { title: 'Pick your standard', body: 'Choose the role or unit benchmark.' },
      { title: 'Enter your numbers', body: 'A few lifts and times — no sign-up.' },
      { title: 'See your readiness & the gap', body: 'Know where you stand and what to close.' },
    ],
  },
  explanatory:
    'Take Point Fitness Operator turns your fitness into one honest readiness read. Enter your lifts, carries, runs and work-capacity efforts, choose the standard that matches the job, and the calculator scores each against a clear pass / good / excellent / elite curve — adjusted for your bodyweight, sex and age. It weights everything toward the demands of the role, estimates your percentile, and shows the gap most likely to fail you first. It’s free and needs no account. When you’re ready to close it, the Take Point Fitness Operator app turns that gap into a plan and tracks your readiness over time.',
  options: {
    heading: 'Free to find out. Built to close the gap.',
    free: { title: 'The benchmark', body: 'Your readiness score, percentile and biggest gap. Free, forever, no account.' },
    app: {
      title: 'The TPF Operator app',
      body: 'Turn your gap into a plan, log your training, and track readiness over time. Your benchmark syncs straight in.',
      cta: 'Get the app',
    },
  },
  finalCta: {
    heading: 'Find your gap before it finds you.',
    sub: 'Two minutes, no sign-up. Score your readiness and see what to close.',
    primaryCta: 'Score yourself free',
    secondaryCta: 'Get the app',
  },
  oneLiner:
    'Most tactical athletes train hard but guess at whether they’d hold up when it counts. Take Point Fitness Operator scores your fitness against operator standards, so you can see your readiness and close the gap before it matters.',
  aspirationalIdentity: 'The operator who’s measurably ready — not hoping.',
};

export const LANDING_COPY: Record<Brand, LandingCopy> = { lift: LIFT, operator: OPERATOR };
