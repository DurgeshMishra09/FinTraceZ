import type { SignalKey } from './analyze';

export type ProfileId = 'investigator' | 'analyst' | 'judge';
export type SectionId = 'about' | 'case' | 'flags' | 'signals' | 'privacy';
export type Palette = { from: string; via: string; to: string; accent: string };

export const profile = {
  name: 'FINTRACE Z',
  display: 'FinTrace Z',
  team: 'Team Code Rhythm',
  label: 'TEAM CODE RHYTHM PRESENTS',
  event: 'IBM Z Datathon 2026',
  theme: 'AI Secured: Innovation Without Exposure',
  tagline: ['FOLLOW THE MONEY', 'EXPLAIN EVERY FLAG', 'PROTECT EVERY CUSTOMER'],
  intro:
    'Scam money is split and bounced through mule accounts in minutes, and every bank sees only one hop. FinTrace Z reads a list of transfers, finds the patterns worth a closer look, and draws the full trail from where the money started to where it ended.',
};

export const PROFILES: { id: ProfileId; name: string; blurb: string; glyph: string; color: string; order: SectionId[] }[] = [
  { id: 'investigator', name: 'Investigator', blurb: 'Load records, follow the transfers', glyph: '🔍', color: '#e5132b', order: ['case', 'about', 'flags', 'signals', 'privacy'] },
  { id: 'analyst', name: 'Bank Analyst', blurb: 'Learn the five signals first', glyph: '₹', color: '#d97706', order: ['flags', 'signals', 'case', 'about', 'privacy'] },
  { id: 'judge', name: 'Judge', blurb: 'What is live, what is planned', glyph: '⚖️', color: '#7c5cff', order: ['about', 'privacy', 'case', 'flags', 'signals'] },
];

export const SECTION_META: Record<SectionId, { nav: string; card: string; meta: string; glyph: string; palette: Palette }> = {
  about: { nav: 'Why It Matters', card: 'Why It Matters', meta: 'One hop at a time · 1 min', glyph: '₹', palette: { from: '#2a0509', via: '#6b1020', to: '#0a0709', accent: '#ff3d5a' } },
  case: { nav: 'Investigate', card: 'Start Investigation', meta: 'Load · Clues · Trail · Verdict', glyph: '▶', palette: { from: '#3a0710', via: '#9b1229', to: '#0c0608', accent: '#ff5a6e' } },
  flags: { nav: 'Red Flags', card: 'Five Red Flags', meta: 'Patterns worth a closer look', glyph: '⚑', palette: { from: '#2b1203', via: '#8a4a0b', to: '#0c0807', accent: '#f59e0b' } },
  signals: { nav: 'Top 5', card: 'Top 5 Signals', meta: 'Ranked by points', glyph: '5', palette: { from: '#160a2e', via: '#4a2a98', to: '#09070e', accent: '#a78bfa' } },
  privacy: { nav: 'Privacy', card: 'Privacy Design', meta: 'Live vs planned', glyph: '🔒', palette: { from: '#04201c', via: '#0f6b5c', to: '#060b0a', accent: '#34d399' } },
};

export const STEPS = [
  { n: 1, title: 'Load the records', blurb: 'Upload a CSV or try fictional sample data.' },
  { n: 2, title: 'Review the clues', blurb: 'Scored accounts, each with a plain-language reason.' },
  { n: 3, title: 'Follow the money', blurb: 'A top-down tree from the scam source to where it ended.' },
  { n: 4, title: 'The verdict', blurb: 'What the records show, and what to do next.' },
];

export type Flag = {
  key: SignalKey; no: string; title: string; tag: string; points: number; short: string;
  what: string; why: string; how: string; example: string; caution: string;
};

export const FLAGS: Flag[] = [
  { key: 'fast', no: '01', title: 'Fast Pass-Through', tag: 'Money in, money out', points: 35, short: 'Funds leave within minutes of arriving.',
    what: 'An account receives money and sends money onward within 5 minutes.',
    why: 'Scam proceeds are moved quickly so they can be cashed out before anyone can freeze them. Most people leave money in an account for hours or days.',
    how: 'For every account we compare each incoming transfer with each outgoing one. If any outgoing transfer follows an incoming one by 5 minutes or less, the account earns 35 points. This needs a timestamp column.',
    example: 'Mule-B receives ₹30,000 at 10:02 and sends ₹14,000 onward at 10:05.',
    caution: 'Payment apps, wallets and businesses legitimately forward money quickly.' },
  { key: 'funnel', no: '02', title: 'Fan-In Funnel', tag: 'Many in, then out', points: 25, short: 'Several accounts pay into one, which sends it on.',
    what: 'Three or more different accounts pay into one account, which then sends money onward.',
    why: 'Mule networks collect small amounts from many places into one account so a single large transfer can leave at once.',
    how: 'We count the distinct senders paying into each account. Three or more senders earns 25 points; two earns 15. The account must also send money out.',
    example: 'Five mule accounts each send between ₹5,500 and ₹13,500 to Mule-I.',
    caution: 'A busy cafe or shop also receives many small payments from different customers.' },
  { key: 'split', no: '03', title: 'Fan-Out Split', tag: 'One in, many out', points: 20, short: 'One payment is broken into smaller pieces.',
    what: 'An account splits its money between three or more different accounts.',
    why: 'Splitting makes each transfer look small and normal, and spreads the money so it is harder to freeze in one move.',
    how: 'We count the distinct accounts each account pays. Three or more earns 20 points; two earns 10.',
    example: 'Mule-B splits its money between Mule-D, Mule-E and Mule-F.',
    caution: 'Salaries, rent and bills also split into several payments.' },
  { key: 'chain', no: '04', title: 'Chain Hopping', tag: 'Hop after hop', points: 15, short: 'Money keeps moving three or more hops from the source.',
    what: 'An account is three or more hops away from where the money started and still passes money on.',
    why: 'Each extra hop distances the money from the victim and makes the trail harder to follow by hand.',
    how: 'We measure the shortest hop distance from each origin account. Accounts three or more hops out that still forward money earn 15 points.',
    example: 'Victim-01, then Mule-A, Mule-B, Mule-D, Mule-I, then the cash-out account.',
    caution: 'Long chains can exist in legitimate supply and payment networks.' },
  { key: 'cashout', no: '05', title: 'Cash-Out Point', tag: 'Where the trail ends', points: 25, short: 'The trail ends in one large exit.',
    what: 'An account receives ₹10,000 or more from fast pass-through accounts and sends nothing onward.',
    why: 'This is where money may leave the banking system, for example by ATM withdrawal. It is the last chance to hold funds.',
    how: 'We look for end-of-trail accounts that received ₹10,000 or more from at least one fast pass-through account. They earn 25 points.',
    example: 'Mule-I sends ₹45,000 to Cashout-ATM-01, which sends nothing onward.',
    caution: 'Some end points are simply savings accounts or ordinary merchants.' },
];

export const PRIVACY_LIVE = [
  'Your CSV is read in your browser and never uploaded',
  'Five transparent, rule-based checks with points per signal',
  'A plain-language reason for every flagged account',
  'An interactive money trail built from your rows',
];
export const PRIVACY_PLANNED = [
  'Local model per bank, trained on its own account graph',
  'Clipped updates plus Gaussian noise (differential privacy)',
  'Secure aggregation on IBM LinuxONE, with a tracked privacy budget',
  'Real-time scoring API, case ranking and SHAP-based reasons',
  'Benchmark: single-bank vs pooled vs federated and private',
];