export type Tx = { id: string; from: string; to: string; amount: number; time: string; ts: number | null };
export type SignalKey = 'fast' | 'funnel' | 'split' | 'chain' | 'cashout';
export type Signal = { key: SignalKey; label: string; points: number; detail: string };
export type Level = 'High' | 'Medium' | 'Low';
export type Alert = { account: string; score: number; level: Level; signals: Signal[]; inflow: number; outflow: number; txs: Tx[] };
export type Analysis = {
  alerts: Alert[];
  accounts: string[];
  origins: string[];
  endpoints: string[];
  dist: Map<string, number>;
  inflow: Map<string, number>;
  originAmount: number;
  spanMinutes: number | null;
  timed: boolean;
  trail: Set<string>;
  trailOrigins: string[];
  trailEndpoints: string[];
  trailAmount: number;
  trailMinutes: number | null;
};

export const MAX_ROWS = 5000;
export const MAX_BYTES = 5 * 1024 * 1024;
export const FAST_WINDOW_MIN = 5;
export const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export const SAMPLE_CSV = `transaction_id,sender,receiver,amount,timestamp
T01,Victim-01,Mule-A,50000,2026-10-17 10:00:00
T02,Mule-A,Mule-B,30000,2026-10-17 10:02:10
T03,Mule-A,Mule-C,20000,2026-10-17 10:03:05
T04,Mule-B,Mule-D,14000,2026-10-17 10:05:20
T05,Mule-B,Mule-E,9000,2026-10-17 10:05:45
T06,Mule-B,Mule-F,6000,2026-10-17 10:06:30
T07,Mule-C,Mule-G,12000,2026-10-17 10:06:10
T08,Mule-C,Mule-H,7000,2026-10-17 10:07:00
T09,Mule-D,Mule-I,13500,2026-10-17 10:08:40
T10,Mule-E,Mule-I,8500,2026-10-17 10:09:15
T11,Mule-F,Mule-I,5500,2026-10-17 10:10:00
T12,Mule-G,Mule-I,11500,2026-10-17 10:10:30
T13,Mule-H,Mule-I,6500,2026-10-17 10:11:10
T14,Mule-I,Cashout-ATM-01,45000,2026-10-17 10:12:20
T15,Salary-Corp,Riya-S,52000,2026-10-17 09:00:00
T16,Riya-S,Landlord-R,18000,2026-10-17 11:30:00
T17,Riya-S,Grocer-K,2400,2026-10-17 14:10:00
T18,Customer-21,Cafe-Owner,850,2026-10-17 10:04:00
T19,Customer-22,Cafe-Owner,640,2026-10-17 10:07:00
T20,Customer-23,Cafe-Owner,920,2026-10-17 10:11:00
T21,Cafe-Owner,Supplier-M,6200,2026-10-17 18:00:00
`;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const ALIASES = {
  id: ['transactionid', 'id', 'txid', 'txnid'],
  from: ['senderid', 'sender', 'from', 'source', 'fromaccount', 'senderaccount', 'payer', 'origin'],
  to: ['receiverid', 'receiver', 'to', 'destination', 'toaccount', 'receiveraccount', 'payee', 'beneficiary'],
  amount: ['amount', 'value', 'transactionamount', 'amt'],
  time: ['timestamp', 'time', 'datetime', 'date', 'transactiondate'],
};

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseTime(s: string): number | null {
  if (!s) return null;
  let t = Date.parse(s.includes('T') ? s : s.replace(' ', 'T'));
  if (!Number.isFinite(t)) t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

export type ParseResult = { txs: Tx[]; skipped: number; truncated: boolean };

export function parseCSV(raw: string): ParseResult {
  const text = raw.replace(/^\uFEFF/, '').trim();
  if (!text) throw new Error('This file is empty. Add a header row and at least one transaction.');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('Add a header row and at least one transaction.');
  const header = splitLine(lines[0]).map(norm);
  const find = (names: string[]) => header.findIndex((h) => names.includes(h));
  const fi = find(ALIASES.from), ti = find(ALIASES.to), ai = find(ALIASES.amount), di = find(ALIASES.time), ii = find(ALIASES.id);
  const missing = [fi < 0 && 'sender', ti < 0 && 'receiver', ai < 0 && 'amount'].filter(Boolean);
  if (missing.length) {
    throw new Error(`Missing required column(s): ${missing.join(', ')}. Found: ${splitLine(lines[0]).join(', ') || 'none'}.`);
  }
  const body = lines.slice(1);
  const truncated = body.length > MAX_ROWS;
  const txs: Tx[] = [];
  let skipped = 0;
  body.slice(0, MAX_ROWS).forEach((line, i) => {
    const c = splitLine(line);
    const amount = Number((c[ai] || '').replace(/[^0-9.\-]/g, ''));
    const from = c[fi] || '', to = c[ti] || '';
    if (!from || !to || from === to || !Number.isFinite(amount) || amount <= 0) { skipped++; return; }
    const time = di >= 0 ? c[di] || '' : '';
    txs.push({ id: (ii >= 0 && c[ii]) || `R${i + 1}`, from, to, amount, time, ts: parseTime(time) });
  });
  if (!txs.length) throw new Error('No valid rows found. Each row needs a sender, a receiver and an amount above zero.');
  return { txs, skipped, truncated };
}

const push = (m: Map<string, Tx[]>, k: string, t: Tx) => { const a = m.get(k); if (a) a.push(t); else m.set(k, [t]); };
const sum = (a: Tx[]) => a.reduce((s, t) => s + t.amount, 0);
const fmtGap = (ms: number) => (ms < 60000 ? `${Math.round(ms / 1000)} seconds` : `${(ms / 60000).toFixed(1).replace(/\.0$/, '')} minutes`);

export function analyse(txs: Tx[]): Analysis {
  const ins = new Map<string, Tx[]>(), outs = new Map<string, Tx[]>();
  txs.forEach((t) => { push(ins, t.to, t); push(outs, t.from, t); });
  const accounts = [...new Set(txs.flatMap((t) => [t.from, t.to]))];
  const origins = accounts.filter((a) => !ins.has(a) && outs.has(a));
  const endpoints = accounts.filter((a) => ins.has(a) && !outs.has(a));

  const dist = new Map<string, number>();
  const queue = [...origins];
  origins.forEach((o) => dist.set(o, 0));
  for (let q = 0; q < queue.length; q++) {
    const a = queue[q];
    (outs.get(a) || []).forEach((t) => { if (!dist.has(t.to)) { dist.set(t.to, (dist.get(a) as number) + 1); queue.push(t.to); } });
  }

  const fastGap = new Map<string, number>();
  accounts.forEach((a) => {
    let best = Infinity;
    (ins.get(a) || []).forEach((i) => (outs.get(a) || []).forEach((o) => {
      if (i.ts === null || o.ts === null) return;
      const gap = o.ts - i.ts;
      if (gap >= 0 && gap <= FAST_WINDOW_MIN * 60000 && gap < best) best = gap;
    }));
    if (best !== Infinity) fastGap.set(a, best);
  });

  const alerts: Alert[] = [];
  accounts.forEach((a) => {
    if (origins.includes(a)) return;
    const inn = ins.get(a) || [], out = outs.get(a) || [];
    const inflow = sum(inn), outflow = sum(out);
    const signals: Signal[] = [];
    const gap = fastGap.get(a);
    if (gap !== undefined) signals.push({ key: 'fast', label: 'Fast pass-through', points: 35, detail: `Sent money onward ${fmtGap(gap)} after receiving it.` });
    const senders = new Set(inn.map((t) => t.from)).size;
    if (out.length && senders >= 2) signals.push({ key: 'funnel', label: 'Fan-in funnel', points: senders >= 3 ? 25 : 15, detail: `${senders} different accounts paid in, then money was sent onward.` });
    const receivers = new Set(out.map((t) => t.to)).size;
    if (receivers >= 2) signals.push({ key: 'split', label: 'Fan-out split', points: receivers >= 3 ? 20 : 10, detail: `Money was split between ${receivers} different accounts.` });
    const d = dist.get(a);
    if (d !== undefined && d >= 3 && out.length) signals.push({ key: 'chain', label: 'Chain hopping', points: 15, detail: `${d} hops from where the money started, and it still passes money on.` });
    if (!out.length && inn.length && inflow >= 10000 && inn.some((t) => fastGap.has(t.from))) {
      signals.push({ key: 'cashout', label: 'Cash-out point', points: 25, detail: `${money(inflow)} stops here after passing through fast pass-through accounts.` });
    }
    if (!signals.length) return;
    const score = Math.min(100, signals.reduce((s, x) => s + x.points, 0));
    alerts.push({ account: a, score, level: score >= 60 ? 'High' : score >= 40 ? 'Medium' : 'Low', signals, inflow, outflow, txs: [...inn, ...out] });
  });
  alerts.sort((x, y) => y.score - x.score || y.inflow - x.inflow);

  const stamps = txs.map((t) => t.ts).filter((x): x is number => x !== null);
  const spanMinutes = stamps.length > 1 ? (Math.max(...stamps) - Math.min(...stamps)) / 60000 : null;
  const inflow = new Map<string, number>();
  accounts.forEach((a) => inflow.set(a, sum(ins.get(a) || [])));
  const originAmount = origins.reduce((s, o) => s + sum(outs.get(o) || []), 0);

  const trail = new Set<string>();
  let trailOrigins: string[] = [];
  if (alerts.length) {
    const up = new Set<string>([alerts[0].account]);
    const uq = [alerts[0].account];
    for (let q = 0; q < uq.length; q++) (ins.get(uq[q]) || []).forEach((t) => { if (!up.has(t.from)) { up.add(t.from); uq.push(t.from); } });
    trailOrigins = origins.filter((o) => up.has(o));
    const dq = [...trailOrigins];
    trailOrigins.forEach((o) => trail.add(o));
    for (let q = 0; q < dq.length; q++) (outs.get(dq[q]) || []).forEach((t) => { if (!trail.has(t.to)) { trail.add(t.to); dq.push(t.to); } });
  }
  const trailTxs = txs.filter((t) => trail.has(t.from));
  const trailStamps = trailTxs.map((t) => t.ts).filter((x): x is number => x !== null);
  const trailMinutes = trailStamps.length > 1 ? (Math.max(...trailStamps) - Math.min(...trailStamps)) / 60000 : null;
  const trailAmount = trailOrigins.reduce((s, o) => s + sum(outs.get(o) || []), 0);
  const trailEndpoints = endpoints.filter((e) => trail.has(e)).sort((a, b) => (inflow.get(b) || 0) - (inflow.get(a) || 0));
  return { alerts, accounts, origins, endpoints, dist, inflow, originAmount, spanMinutes, timed: stamps.length > 0, trail, trailOrigins, trailEndpoints, trailAmount, trailMinutes };
}