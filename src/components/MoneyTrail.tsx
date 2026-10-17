import { useEffect, useMemo, useState } from 'react';
import { money } from '../lib/analyze';
import type { Analysis, Tx } from '../lib/analyze';

/* Money trail: a top-down tree.
 * - the scam source sits on top with the amount it sent
 * - accounts are numbered in the order they first received money
 * - every split is labelled with its amount
 * - every account where the money stops has a down arrow
 * - click an account: its path from the start (time order) and how its money divides onward
 * - big trails switch to a click-through view, one account at a time */

type Edge = { from: string; to: string; amount: number; count: number; ts: number | null; first: number };
type Layout = { layer: Map<string, number>; topo: string[]; back: Set<Edge>; out: Map<string, Edge[]>; inn: Map<string, Edge[]> };
type Placed = { id: string; x: number; y: number };
type Model = {
  edges: Edge[]; nodes: string[]; lay: Layout; origins: string[]; rank: Map<string, number>; num: Map<string, number>;
  inflow: Map<string, number>; outflow: Map<string, number>; firstTs: Map<string, number | null>;
};

const BIG_NODES = 14;
const NW = 160, NH = 58, GX = 30, GY = 118, PADX = 28, PADT = 40, PADB = 96;

const pad = (n: number) => String(n).padStart(2, '0');
const clock = (ts: number | null, sec = false) => {
  if (ts === null) return '';
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}${sec ? ':' + pad(d.getSeconds()) : ''}`;
};
const cut = (s: string, n = 17) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function aggregate(txs: Tx[], keep: Set<string> | null): Edge[] {
  const m = new Map<string, Edge>();
  txs.forEach((t, i) => {
    if (keep && (!keep.has(t.from) || !keep.has(t.to))) return;
    const k = t.from + '\u0000' + t.to;
    const e = m.get(k);
    if (e) {
      e.amount += t.amount;
      e.count++;
      if (t.ts !== null && (e.ts === null || t.ts < e.ts)) e.ts = t.ts;
    } else m.set(k, { from: t.from, to: t.to, amount: t.amount, count: 1, ts: t.ts, first: i });
  });
  return [...m.values()];
}

function layoutOf(nodes: string[], edges: Edge[]): Layout {
  const out = new Map<string, Edge[]>(), inn = new Map<string, Edge[]>();
  nodes.forEach((n) => { out.set(n, []); inn.set(n, []); });
  edges.forEach((e) => { out.get(e.from)?.push(e); inn.get(e.to)?.push(e); });
  const color = new Map<string, number>();
  const back = new Set<Edge>();
  const order: string[] = [];
  const dfs = (start: string) => {
    const stack: { id: string; i: number }[] = [{ id: start, i: 0 }];
    color.set(start, 1);
    while (stack.length) {
      const top = stack[stack.length - 1];
      const list = out.get(top.id) || [];
      if (top.i < list.length) {
        const e = list[top.i++];
        const c = color.get(e.to) || 0;
        if (c === 1) back.add(e);
        else if (c === 0) { color.set(e.to, 1); stack.push({ id: e.to, i: 0 }); }
      } else { color.set(top.id, 2); order.push(top.id); stack.pop(); }
    }
  };
  nodes.filter((n) => !(inn.get(n) || []).length).forEach((n) => { if (!color.get(n)) dfs(n); });
  nodes.forEach((n) => { if (!color.get(n)) dfs(n); });
  const topo = order.reverse();
  const layer = new Map<string, number>();
  nodes.forEach((n) => layer.set(n, 0));
  topo.forEach((u) => (out.get(u) || []).forEach((e) => { if (!back.has(e)) layer.set(e.to, Math.max(layer.get(e.to) || 0, (layer.get(u) || 0) + 1)); }));
  return { layer, topo, back, out, inn };
}

function place(nodes: string[], lay: Layout, rank: Map<string, number>): { pos: Map<string, Placed>; w: number; h: number } {
  const layers: string[][] = [];
  nodes.forEach((n) => { const l = lay.layer.get(n) || 0; (layers[l] ||= []).push(n); });
  for (let i = 0; i < layers.length; i++) if (!layers[i]) layers[i] = [];
  const rk = (n: string) => rank.get(n) ?? 0;
  layers.forEach((l) => l.sort((a, b) => rk(a) - rk(b)));
  const xs = new Map<string, number>();
  const spread = (l: string[]) => l.forEach((n, i) => xs.set(n, i));
  layers.forEach(spread);
  const bary = (n: string, dir: 'up' | 'down') => {
    const es = ((dir === 'up' ? lay.inn.get(n) : lay.out.get(n)) || []).filter((e) => !lay.back.has(e));
    const ps = es.map((e) => xs.get(dir === 'up' ? e.from : e.to)).filter((v): v is number => v !== undefined);
    return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : (xs.get(n) as number);
  };
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < layers.length; i++) { layers[i].sort((a, b) => bary(a, 'up') - bary(b, 'up') || rk(a) - rk(b)); spread(layers[i]); }
    for (let i = layers.length - 2; i >= 0; i--) { layers[i].sort((a, b) => bary(a, 'down') - bary(b, 'down') || rk(a) - rk(b)); spread(layers[i]); }
  }
  const widest = Math.max(1, ...layers.map((l) => l.length));
  const W = PADX * 2 + widest * NW + (widest - 1) * GX;
  const pos = new Map<string, Placed>();
  layers.forEach((l, li) => {
    const rowW = l.length * NW + Math.max(0, l.length - 1) * GX;
    const x0 = (W - rowW) / 2;
    l.forEach((n, i) => pos.set(n, { id: n, x: x0 + i * (NW + GX), y: PADT + li * (NH + GY) }));
  });
  return { pos, w: W, h: PADT + layers.length * (NH + GY) - GY + PADB };
}

const reach = (start: string, map: Map<string, Edge[]>, back: Set<Edge>, dir: 'out' | 'in') => {
  const seen = new Set<string>([start]);
  const q = [start];
  for (let i = 0; i < q.length; i++) (map.get(q[i]) || []).forEach((e) => { if (back.has(e)) return; const n = dir === 'out' ? e.to : e.from; if (!seen.has(n)) { seen.add(n); q.push(n); } });
  return seen;
};

/** Shortest hop path from any origin to the target, following forward edges only. */
function pathTo(target: string, origins: string[], lay: Layout): Edge[] {
  const parent = new Map<string, Edge | null>();
  origins.forEach((o) => parent.set(o, null));
  const q = [...origins];
  for (let i = 0; i < q.length && !parent.has(target); i++) (lay.out.get(q[i]) || []).forEach((e) => { if (!lay.back.has(e) && !parent.has(e.to)) { parent.set(e.to, e); q.push(e.to); } });
  const path: Edge[] = [];
  let cur: string | undefined = target;
  while (cur) { const e: Edge | null | undefined = parent.get(cur); if (!e) break; path.unshift(e); cur = e.from; }
  return path;
}

/** Where an account's money ends up, split in proportion to what each branch carried. Money an account keeps counts as ending there. */
function endsFrom(start: string, amount: number, lay: Layout): Map<string, number> {
  const acc = new Map<string, number>([[start, amount]]);
  const ends = new Map<string, number>();
  const sum = (es: Edge[]) => es.reduce((s, e) => s + e.amount, 0);
  lay.topo.forEach((u) => {
    const a = acc.get(u);
    if (!a) return;
    const outs = (lay.out.get(u) || []).filter((e) => !lay.back.has(e));
    if (!outs.length) { ends.set(u, (ends.get(u) || 0) + a); return; }
    const tot = sum(outs);
    const inn = sum(lay.inn.get(u) || []);
    const pass = u === start || inn <= 0 ? 1 : Math.min(1, tot / inn);
    const kept = a * (1 - pass);
    if (kept > a * 0.005) ends.set(u, (ends.get(u) || 0) + kept);
    outs.forEach((e) => acc.set(e.to, (acc.get(e.to) || 0) + (a * pass * e.amount) / tot));
  });
  return ends;
}

export function MoneyTrail({ txs, analysis, focus }: { txs: Tx[]; analysis: Analysis; focus: string | null }) {
  const scopeAll = analysis.trail.size === 0;
  const [showAll, setShowAll] = useState(false);
  const useAll = scopeAll || showAll;

  const model = useMemo<Model>(() => {
    const edges = aggregate(txs, useAll ? null : analysis.trail);
    const nodes = [...new Set(edges.flatMap((e) => [e.from, e.to]))];
    const lay = layoutOf(nodes, edges);
    const origins = nodes.filter((n) => !(lay.inn.get(n) || []).length);
    const timed = edges.every((e) => e.ts !== null);
    const ekey = (e: Edge) => (timed ? (e.ts as number) : e.first);
    const firstIn = new Map<string, number>();
    nodes.forEach((n) => {
      const ins = lay.inn.get(n) || [];
      if (ins.length) firstIn.set(n, Math.min(...ins.map(ekey)));
      else firstIn.set(n, Math.min(...(lay.out.get(n) || []).map(ekey)) - 1);
    });
    const sorted = [...nodes].sort((a, b) => (firstIn.get(a) as number) - (firstIn.get(b) as number) || a.localeCompare(b));
    const rank = new Map<string, number>();
    const num = new Map<string, number>();
    let k = 0;
    sorted.forEach((n, i) => { rank.set(n, i); if (!origins.includes(n)) num.set(n, ++k); });
    const inflow = new Map<string, number>(), outflow = new Map<string, number>(), firstTs = new Map<string, number | null>();
    nodes.forEach((n) => {
      const ins = lay.inn.get(n) || [];
      inflow.set(n, ins.reduce((s, e) => s + e.amount, 0));
      outflow.set(n, (lay.out.get(n) || []).reduce((s, e) => s + e.amount, 0));
      const ts = ins.map((e) => e.ts).filter((v): v is number => v !== null);
      firstTs.set(n, ts.length ? Math.min(...ts) : null);
    });
    return { edges, nodes, lay, origins, rank, num, inflow, outflow, firstTs };
  }, [txs, analysis, useAll]);

  const big = model.nodes.length > BIG_NODES;
  const [mode, setMode] = useState<'tree' | 'click'>(big ? 'click' : 'tree');
  useEffect(() => { setMode(big ? 'click' : 'tree'); }, [big, useAll]);

  const alertOf = useMemo(() => new Map(analysis.alerts.map((a) => [a.account, a])), [analysis]);
  const [sel, setSel] = useState<string | null>(focus);
  useEffect(() => { setSel(focus); }, [focus]);
  const picked = sel && model.nodes.includes(sel) ? sel : null;
  const active = mode === 'click' ? picked ?? analysis.alerts.find((a) => model.nodes.includes(a.account))?.account ?? model.origins[0] ?? model.nodes[0] ?? null : picked;

  // Everything is drawn in tree view; click-through view draws a focused slice only.
  const drawn = useMemo(() => {
    if (mode === 'tree' || !active) return model.nodes;
    const keep = new Set<string>([active]);
    pathTo(active, model.origins, model.lay).forEach((e) => { keep.add(e.from); keep.add(e.to); });
    (model.lay.inn.get(active) || []).forEach((e) => keep.add(e.from));
    (model.lay.out.get(active) || []).forEach((e) => keep.add(e.to));
    return model.nodes.filter((n) => keep.has(n));
  }, [mode, active, model]);

  const view = useMemo(() => {
    const set = new Set(drawn);
    const edges = model.edges.filter((e) => set.has(e.from) && set.has(e.to));
    const lay = layoutOf(drawn, edges);
    return { edges, lay, ...place(drawn, lay, model.rank) };
  }, [drawn, model]);

  const anc = useMemo(() => (active ? reach(active, model.lay.inn, model.lay.back, 'in') : null), [active, model]);
  const desc = useMemo(() => (active ? reach(active, model.lay.out, model.lay.back, 'out') : null), [active, model]);
  const route = useMemo(() => (active ? pathTo(active, model.origins, model.lay) : []), [active, model]);
  const routeSet = useMemo(() => new Set(route), [route]);

  const select = (n: string) => setSel((s) => (mode === 'tree' && s === n ? null : n));
  const nodeColor = (n: string) => { const a = alertOf.get(n); return a?.level === 'High' ? '#ff3d5a' : a?.level === 'Medium' ? '#f59e0b' : a ? '#a7a6ad' : '#3a3a46'; };
  const totalSent = model.origins.reduce((s, o) => s + (model.outflow.get(o) || 0), 0);

  if (!model.nodes.length) return <p className="border border-white/10 p-4 text-sm text-mist">There are no transfers to draw.</p>;

  const btn = 'border border-white/15 px-2.5 py-1.5 text-mist hover:border-crimson-2 hover:text-bone';
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="border border-white/15 px-2.5 py-1.5 text-mist">{model.nodes.length} accounts · {model.edges.length} routes · {money(totalSent)} from the source</span>
        {!scopeAll && <button onClick={() => setShowAll((v) => !v)} className={btn}>{showAll ? 'Show only the flagged trail' : 'Show every account in the file'}</button>}
        {model.nodes.length <= 40 && <button onClick={() => setMode((m) => (m === 'tree' ? 'click' : 'tree'))} className={btn}>{mode === 'tree' ? 'Switch to click-through view' : 'Switch to full tree'}</button>}
      </div>

      {mode === 'click' && (
        <p className="mb-3 border-l-2 border-crimson-2 pl-3 text-xs leading-relaxed text-mist">
          This trail is large, so it opens one account at a time. Click any account to open it: you see the path it took from the start and every transfer it sent onward, till the end.
        </p>
      )}
      {mode === 'click' && model.origins.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-smoke">Sources:</span>
          {model.origins.slice(0, 12).map((o) => (
            <button key={o} onClick={() => setSel(o)} className={`border px-2.5 py-1 ${active === o ? 'border-crimson-2 bg-crimson text-white' : 'border-white/15 text-mist hover:border-crimson-2'}`}>{cut(o, 20)}</button>
          ))}
        </div>
      )}

      <div className="overflow-auto border border-white/10 bg-black/30" style={{ maxHeight: '78svh' }}>
        <svg width={view.w} height={view.h} viewBox={`0 0 ${view.w} ${view.h}`} className="mx-auto block" role="group" aria-label="Money trail from top to bottom in time order" style={{ minWidth: view.w }}>
          <defs>
            {[['a', '#6d6c75'], ['b', '#ff3d5a'], ['c', '#f4f1ec']].map(([id, c]) => (
              <marker key={id} id={`ah-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill={c} /></marker>
            ))}
          </defs>

          {view.edges.map((e) => {
            const a = view.pos.get(e.from), b = view.pos.get(e.to);
            if (!a || !b) return null;
            const isBack = view.lay.back.has(e);
            const x1 = a.x + NW / 2, y1 = a.y + NH, x2 = b.x + NW / 2, y2 = b.y, midY = (y1 + y2) / 2;
            const d = isBack
              ? `M${a.x + NW} ${a.y + NH / 2} C ${a.x + NW + 60} ${a.y + NH / 2}, ${b.x + NW + 60} ${b.y + NH / 2}, ${b.x + NW} ${b.y + NH / 2}`
              : `M${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2 - 2}`;
            const lx = isBack ? Math.max(a.x, b.x) + NW + 60 : (x1 + x2) / 2;
            const ly = isBack ? (a.y + b.y) / 2 + NH / 2 : (y1 + y2) / 2;
            const onRoute = routeSet.has(e);
            const onward = !!desc && desc.has(e.from) && desc.has(e.to);
            const dim = !!active && !onRoute && !onward;
            const stroke = onRoute ? '#ff3d5a' : onward ? '#f4f1ec' : '#6d6c75';
            const label = money(e.amount);
            const lw = label.length * 7.2 + 14;
            return (
              <g key={e.from + '>' + e.to} opacity={dim ? 0.14 : 1} style={{ transition: 'opacity .25s' }}>
                <path d={d} fill="none" stroke={stroke} strokeWidth={onRoute ? 2.6 : 1.6} strokeDasharray={isBack ? '5 5' : undefined} markerEnd={`url(#ah-${onRoute ? 'b' : onward ? 'c' : 'a'})`} />
                <g transform={`translate(${lx - lw / 2} ${ly - 11})`}>
                  <rect width={lw} height={22} rx={11} fill="#0b0b10" stroke={stroke} strokeOpacity={0.7} />
                  <text x={lw / 2} y={15} textAnchor="middle" fontSize="11.5" fontWeight={600} fill="#f4f1ec" fontFamily="Inter, sans-serif">{label}</text>
                </g>
                <title>{`${e.from} to ${e.to}: ${money(e.amount)}${e.count > 1 ? ` in ${e.count} transfers` : ''}${e.ts !== null ? ', first at ' + clock(e.ts, true) : ''}${isBack ? ' (money returns upward)' : ''}`}</title>
              </g>
            );
          })}

          {[...view.pos.values()].map((p) => {
            const n = p.id;
            const isOrigin = model.origins.includes(n);
            const isEnd = !(model.lay.out.get(n) || []).length;
            const out = model.outflow.get(n) || 0, inn = model.inflow.get(n) || 0;
            const held = Math.max(0, inn - out);
            const dim = !!active && !!anc && !!desc && !anc.has(n) && !desc.has(n);
            const isSel = active === n;
            const hidden = mode === 'click' ? (model.lay.out.get(n) || []).filter((e) => !view.pos.has(e.to)).length : 0;
            const col = nodeColor(n);
            const ts = model.firstTs.get(n);
            return (
              <g key={n} transform={`translate(${p.x} ${p.y})`} opacity={dim ? 0.2 : 1} style={{ cursor: 'pointer', transition: 'opacity .25s' }} onClick={() => select(n)} tabIndex={0} role="button"
                aria-label={`${n}. ${isOrigin ? 'Where the money started.' : 'Account ' + model.num.get(n) + '.'} ${isEnd ? 'Money ends here.' : ''}`}
                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(n); } }}>
                {isOrigin && <text x={NW / 2} y={-12} textAnchor="middle" fontSize="10.5" letterSpacing="2.5" fontWeight={700} fill="#ff3d5a" fontFamily="Inter, sans-serif">{n.toLowerCase().includes('victim') ? 'SCAM SOURCE' : 'SOURCE'}</text>}
                <rect width={NW} height={NH} rx={10} fill={isOrigin ? '#3a0710' : '#111118'} stroke={isSel ? '#f4f1ec' : col} strokeWidth={isSel ? 2.6 : 1.6} />
                <circle cx={22} cy={NH / 2} r={13} fill={isOrigin ? '#e5132b' : '#1c1c26'} stroke={col} />
                <text x={22} y={NH / 2 + 4.5} textAnchor="middle" fontSize="13" fontWeight={700} fill="#f4f1ec" fontFamily="Inter, sans-serif">{isOrigin ? '★' : model.num.get(n)}</text>
                <text x={42} y={23} fontSize="12.5" fontWeight={700} fill="#f4f1ec" fontFamily="Inter, sans-serif">{cut(n)}</text>
                <text x={42} y={40} fontSize="10.5" fill="#a7a6ad" fontFamily="Inter, sans-serif">{isOrigin ? `sent ${money(out)}` : `got ${money(inn)}`}{ts ? ` · ${clock(ts)}` : ''}</text>
                {hidden > 0 && (
                  <g transform={`translate(${NW / 2 - 42} ${NH + 8})`}>
                    <rect width={84} height={20} rx={10} fill="#0b0b10" stroke="#a7a6ad" strokeOpacity={0.5} />
                    <text x={42} y={14} textAnchor="middle" fontSize="10.5" fill="#f4f1ec" fontFamily="Inter, sans-serif">▾ {hidden} onward</text>
                  </g>
                )}
                {isEnd && !isOrigin && (
                  <g>
                    <line x1={NW / 2} x2={NW / 2} y1={NH} y2={NH + 38} stroke="#ff3d5a" strokeWidth={2.4} markerEnd="url(#ah-b)" />
                    <text x={NW / 2} y={NH + 56} textAnchor="middle" fontSize="11.5" fontWeight={700} fill="#ff8796" fontFamily="Inter, sans-serif">Money ends: {money(inn)}</text>
                  </g>
                )}
                {!isEnd && !isOrigin && hidden === 0 && held > Math.max(1, inn * 0.02) && <text x={NW / 2} y={NH + 15} textAnchor="middle" fontSize="10" fill="#a7a6ad" fontFamily="Inter, sans-serif">keeps {money(held)}</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-smoke">
        Read from the top down. ★ is where the money started, numbers show the order accounts first received money, and each label is the amount sent along that route. A red arrow marks an account where money ends. Border colour shows the clue level: red High, amber Medium, grey Low.
      </p>

      <TrailPanel active={active} model={model} route={route} alertOf={alertOf} onPick={setSel} mode={mode} />
    </div>
  );
}

function TrailPanel({ active, model, route, alertOf, onPick, mode }: { active: string | null; model: Model; route: Edge[]; alertOf: Map<string, Analysis['alerts'][number]>; onPick: (n: string) => void; mode: 'tree' | 'click' }) {
  const label = (n: string) => (model.origins.includes(n) ? '★ ' : model.num.get(n) ? `${model.num.get(n)}. ` : '') + n;

  if (!active) {
    const ledger = [...model.edges].sort((a, b) => (a.ts ?? a.first) - (b.ts ?? b.first));
    return (
      <div className="mt-5 border border-white/10 bg-ink-2 p-4 md:p-5">
        <p className="text-[10px] uppercase tracking-[.25em] text-smoke">Every transfer, in time order</p>
        <p className="mt-1 text-xs text-mist">Click an account in the tree to see its own path from the start and how its money divides.</p>
        <ol className="mt-4 divide-y divide-white/5 text-sm">
          {ledger.map((e) => (
            <li key={e.from + '>' + e.to} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
              <span className="w-16 shrink-0 font-mono text-xs text-crimson-2">{clock(e.ts, true) || '·'}</span>
              <span className="min-w-0 flex-1"><button onClick={() => onPick(e.from)} className="break-all hover:underline">{label(e.from)}</button> <span className="text-crimson-2">→</span> <button onClick={() => onPick(e.to)} className="break-all hover:underline">{label(e.to)}</button></span>
              <span className="font-semibold">{money(e.amount)}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const outs = [...(model.lay.out.get(active) || [])].sort((a, b) => (a.ts ?? a.first) - (b.ts ?? b.first));
  const inn = model.inflow.get(active) || 0, out = model.outflow.get(active) || 0;
  const endList = [...endsFrom(active, inn || out, model.lay).entries()].filter(([id]) => id !== active).sort((a, b) => b[1] - a[1]);
  const al = alertOf.get(active);
  const isOrigin = model.origins.includes(active);

  return (
    <div className="mt-5 border border-crimson-2/40 bg-ink-2">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-4 md:p-5">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[.25em] text-crimson-2">{isOrigin ? 'Where the money started' : `Account ${model.num.get(active)} in time order`}</p>
          <h4 className="mt-1 break-all font-display text-3xl tracking-wide">{active}</h4>
          <p className="mt-1 text-xs text-mist">{isOrigin ? `Sent ${money(out)} in total` : `Received ${money(inn)} · sent onward ${money(out)}`}{al ? ` · clue score ${al.score} (${al.level})` : ''}</p>
        </div>
        {mode === 'tree' && <button onClick={() => onPick(active)} className="border border-white/15 px-3 py-1.5 text-xs text-mist hover:border-crimson-2 hover:text-bone">Clear selection</button>}
      </div>

      <div className="grid gap-px bg-white/10 md:grid-cols-2">
        <div className="bg-ink-2 p-4 md:p-5">
          <p className="text-[10px] uppercase tracking-[.25em] text-smoke">1 · Path from the start, in time order</p>
          {route.length === 0 ? <p className="mt-3 text-sm text-mist">This account is where the trail begins.</p> : (
            <ol className="mt-3 space-y-3">
              {route.map((e, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-crimson-2/60 text-[11px] text-crimson-2">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[11px] text-crimson-2">{clock(e.ts, true)}</span>
                    <button onClick={() => onPick(e.from)} className="break-all hover:underline">{e.from}</button> <span className="text-crimson-2">→</span> <button onClick={() => onPick(e.to)} className="break-all hover:underline">{e.to}</button>
                    <span className="block font-semibold">{money(e.amount)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="bg-ink-2 p-4 md:p-5">
          <p className="text-[10px] uppercase tracking-[.25em] text-smoke">2 · How it divides from here</p>
          {outs.length === 0 ? (
            <p className="mt-3 text-sm text-mist"><strong className="text-bone">The money ends here: {money(inn)}.</strong> Nothing leaves this account, so it is the last point where funds could be held.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {outs.map((e) => (
                <li key={e.to} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0"><span className="font-mono text-[11px] text-crimson-2">{clock(e.ts, true)}</span> <span className="text-crimson-2">→</span> <button onClick={() => onPick(e.to)} className="break-all hover:underline">{label(e.to)}</button></span>
                    <span className="shrink-0 font-semibold">{money(e.amount)}</span>
                  </div>
                  <div className="mt-1 h-[3px] bg-white/10"><div className="h-full bg-crimson-2" style={{ width: `${Math.min(100, (e.amount / Math.max(out, 1)) * 100)}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {endList.length > 0 && (
        <div className="border-t border-white/10 p-4 md:p-5">
          <p className="text-[10px] uppercase tracking-[.25em] text-smoke">3 · Where this account&apos;s money ends up, till the end</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {endList.map(([id, amt]) => (
              <li key={id}>
                <button onClick={() => onPick(id)} className="flex w-full items-center justify-between gap-3 border border-white/10 px-3 py-2 text-left text-sm hover:border-crimson-2">
                  <span className="min-w-0 break-all"><span className="text-crimson-2">↓</span> {id}</span>
                  <span className="shrink-0 font-semibold">{money(amt)}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-smoke">When an account splits its money, each end point is shown in proportion to what each branch carried.</p>
        </div>
      )}
    </div>
  );
}