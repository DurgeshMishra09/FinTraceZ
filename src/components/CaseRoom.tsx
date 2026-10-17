import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { STEPS } from '../lib/content';
import { money } from '../lib/analyze';
import type { Alert } from '../lib/analyze';
import type { CaseApi } from '../lib/useCase';
import { MoneyTrail } from './MoneyTrail';

const levelColor = (l: Alert['level']) => (l === 'High' ? 'text-crimson-2 border-crimson-2/60' : l === 'Medium' ? 'text-amber-300 border-amber-300/40' : 'text-mist border-white/20');

function downloadFindings(c: CaseApi) {
  if (!c.analysis) return;
  const rows = [['account', 'score', 'level', 'signals', 'received', 'sent_onward'], ...c.analysis.alerts.map((a) => [a.account, a.score, a.level, a.signals.map((s) => s.label).join(' | '), a.inflow, a.outflow])];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'fintrace-z-findings.csv'; a.click();
  URL.revokeObjectURL(url);
}

export function CaseRoom({ c, step, setStep }: { c: CaseApi; step: number; setStep: (n: number) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const a = c.analysis;
  const ready = !!a;
  const ep = Math.min(step, 3);

  const startAnalysis = () => { c.run(); setStep(1); };
  const onFile = async (f?: File | null) => { if (f) await c.load(f); };
  const trailAlert = a?.alerts[0];

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Steps">
        {STEPS.map((e, i) => {
          const locked = i > 0 && !ready;
          return (
            <button key={e.n} role="tab" aria-selected={ep === i} disabled={locked} onClick={() => setStep(i)} className={`border px-4 py-2 text-xs uppercase tracking-[.18em] transition ${ep === i ? 'border-crimson-2 bg-crimson text-white' : 'border-white/15 text-mist hover:border-white/40 hover:text-white'} ${locked ? 'cursor-not-allowed opacity-35 hover:border-white/15 hover:text-mist' : ''}`}>
              {e.n}. {e.title}
            </button>
          );
        })}
      </div>

      <div className="min-w-0 border border-white/10 bg-ink-2">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[.25em] text-smoke">Step {ep + 1} of 4</p>
            <p className="mt-1 font-semibold">{STEPS[ep].title}</p>
          </div>
          <div className="h-1 w-24 overflow-hidden bg-white/10 md:w-40"><motion.div className="h-full bg-crimson-2" animate={{ width: `${((ep + 1) / 4) * 100}%` }} /></div>
        </div>

        <div className="p-5 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={ep} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
              {ep === 0 && (
                <>
                  <p className="text-sm leading-relaxed text-mist">Choose a CSV of transfers. We need a <strong className="text-bone">sender</strong>, a <strong className="text-bone">receiver</strong> and an <strong className="text-bone">amount</strong>. A <strong className="text-bone">timestamp</strong> lets us measure how fast money moved. Your file stays in your browser.</p>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                    onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
                    className={`mt-6 flex flex-col items-center border border-dashed px-5 py-10 text-center transition ${drag ? 'border-crimson-2 bg-crimson/10' : 'border-white/20 hover:border-crimson-2'}`}
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-2xl">↑</div>
                    <h3 className="font-semibold">Drop your CSV file here</h3>
                    <p className="mt-2 text-xs text-mist">or choose a file from your device (up to 5,000 rows)</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                      <button onClick={() => input.current?.click()} className="bg-bone px-5 py-3 text-sm font-bold text-ink transition hover:bg-crimson-2 hover:text-white">Choose CSV file</button>
                      <button onClick={() => c.load()} className="border border-crimson-2/60 px-5 py-3 text-sm font-semibold text-crimson-2 transition hover:bg-crimson hover:text-white">Try fictional sample data</button>
                    </div>
                    <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
                    <a href="/sample_transactions.csv" download className="mt-4 text-xs text-mist underline underline-offset-4 hover:text-white">Download the sample CSV to see the format</a>
                  </div>
                  {c.error && <p role="alert" className="mt-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{c.error}</p>}
                  {c.txs.length > 0 && (
                    <div className="mt-8">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-mist">{c.isSample ? 'Fictional sample data loaded' : 'File loaded'}</p>
                          <h3 className="mt-1 break-all text-lg font-bold">{c.filename}</h3>
                        </div>
                        <span className="border border-emerald-400/30 px-3 py-1 text-xs text-emerald-300">{c.txs.length} transfers read</span>
                      </div>
                      {c.note && <p className="mt-3 text-xs text-amber-200/80">{c.note}</p>}
                      <div className="mt-4 max-h-60 overflow-auto border border-white/10">
                        <table className="w-full min-w-[520px] text-left text-xs">
                          <thead className="sticky top-0 bg-ink-3 text-mist"><tr>{['ID', 'Sender', 'Receiver', 'Amount', 'Time'].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
                          <tbody>{c.txs.slice(0, 8).map((t, i) => <tr key={i} className="border-t border-white/5"><td className="p-3 text-smoke">{t.id}</td><td className="p-3">{t.from}</td><td className="p-3">{t.to}</td><td className="p-3">{money(t.amount)}</td><td className="p-3 text-mist">{t.time || '—'}</td></tr>)}</tbody>
                        </table>
                      </div>
                      {c.txs.length > 8 && <p className="mt-2 text-xs text-smoke">Showing 8 of {c.txs.length} rows.</p>}
                      <button onClick={startAnalysis} className="group mt-6 flex min-h-12 items-center gap-3 bg-crimson px-6 py-3 font-bold transition hover:bg-crimson-2">Analyse these transfers <span className="transition group-hover:translate-x-1">→</span></button>
                    </div>
                  )}
                </>
              )}

              {ep === 1 && a && (
                <>
                  <p className="text-sm leading-relaxed text-mist">These accounts matched one or more checks. Start at the top, read the reason, then verify the transfers behind it. Scores are a demo ranking, not a probability of fraud.</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[['Transfers', c.txs.length], ['Accounts', a.accounts.length], ['Flagged', a.alerts.length], ['High priority', a.alerts.filter((x) => x.level === 'High').length]].map(([l, v]) => (
                      <div key={l as string} className="glass p-4"><p className="text-xs text-mist">{l}</p><p className="mt-1 font-display text-4xl">{v}</p></div>
                    ))}
                  </div>
                  {a.alerts.length === 0 ? (
                    <p className="mt-5 border border-white/10 p-4 text-sm text-mist">No account matched the checks. That does not prove the transfers are safe. Check that timestamps are present and review the records manually.</p>
                  ) : (
                    <div className="mt-5 space-y-2">
                      {a.alerts.map((al) => {
                        const isOpen = open === al.account;
                        return (
                          <div key={al.account} className="border border-white/10">
                            <button onClick={() => setOpen(isOpen ? null : al.account)} aria-expanded={isOpen} className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/[.03]">
                              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border font-display text-2xl ${levelColor(al.level)}`}>{al.score}</span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-semibold">{al.account} <span className={`ml-2 border px-1.5 py-0.5 align-middle text-[10px] uppercase tracking-wider ${levelColor(al.level)}`}>{al.level}</span></span>
                                <span className="mt-1 block truncate text-xs text-mist">{al.signals.map((s) => s.label).join(' · ')}</span>
                              </span>
                              <span className={`text-mist transition ${isOpen ? 'rotate-90' : ''}`}>›</span>
                            </button>
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="border-t border-white/10 bg-black/20 p-4 text-sm">
                                    <ul className="space-y-3">
                                      {al.signals.map((s) => (
                                        <li key={s.key} className="flex gap-3"><span className="mt-0.5 shrink-0 font-display text-xl text-crimson-2">+{s.points}</span><span><span className="font-semibold">{s.label}.</span> <span className="text-mist">{s.detail}</span></span></li>
                                      ))}
                                    </ul>
                                    <p className="mt-4 text-xs text-smoke">Received {money(al.inflow)} · Sent onward {money(al.outflow)} · {al.txs.length} related transfers</p>
                                    <button onClick={() => { setFocus(al.account); setStep(2); }} className="mt-4 border border-crimson-2/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-crimson-2 hover:bg-crimson hover:text-white">See on the money trail →</button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button onClick={() => { setFocus(null); setStep(2); }} className="mt-6 bg-bone px-5 py-3 text-sm font-bold text-ink hover:bg-crimson-2 hover:text-white">Follow the money →</button>
                </>
              )}

              {ep === 2 && a && (
                <>
                  <p className="text-sm leading-relaxed text-mist">Money flows from the top down: from where it started to where it ended, in time order. Every route shows the amount sent, and a red arrow marks where money stops. The tree is built only from your rows.</p>
                  <div className="mt-5"><MoneyTrail txs={c.txs} analysis={a} focus={focus ?? null} /></div>
                  <button onClick={() => setStep(3)} className="mt-6 bg-crimson px-5 py-3 text-sm font-bold transition hover:bg-crimson-2">See the verdict →</button>
                </>
              )}

              {ep === 3 && a && (
                <>
                  <div className="border-l-2 border-crimson-2 pl-4">
                    <p className="text-xs uppercase tracking-[.2em] text-crimson-2">Investigation summary</p>
                    <h3 className="mt-2 text-2xl font-bold">{a.alerts.some((x) => x.level === 'High') ? 'A pattern worth urgent review' : a.alerts.some((x) => x.level === 'Medium') ? 'Some patterns worth reviewing' : a.alerts.length ? 'Only weak signals found' : 'No strong patterns found'}</h3>
                  </div>
                  <div className="mt-6 grid gap-px bg-white/10 md:grid-cols-3">
                    <div className="bg-ink-2 p-4"><p className="text-[10px] uppercase tracking-[.25em] text-smoke">Where it started</p><p className="mt-2 text-sm text-bone">{a.trailOrigins.length ? a.trailOrigins.join(', ') : 'No clear origin'}</p><p className="mt-1 text-xs text-mist">{a.trailAmount ? `${money(a.trailAmount)} entered the trail` : 'Amount unknown'}</p></div>
                    <div className="bg-ink-2 p-4"><p className="text-[10px] uppercase tracking-[.25em] text-smoke">Where it ended</p><p className="mt-2 text-sm text-bone">{a.trailEndpoints.length ? a.trailEndpoints.slice(0, 3).join(', ') : 'No end point found'}</p><p className="mt-1 text-xs text-mist">{a.trailEndpoints[0] ? `${money(a.inflow.get(a.trailEndpoints[0]) || 0)} reached the largest end point` : 'Money may continue outside this file'}</p></div>
                    <div className="bg-ink-2 p-4"><p className="text-[10px] uppercase tracking-[.25em] text-smoke">How fast</p><p className="mt-2 text-sm text-bone">{a.trailMinutes !== null ? `${a.trailMinutes < 1 ? 'Under a minute' : `About ${Math.round(a.trailMinutes)} minutes`}` : 'Needs timestamps'}</p><p className="mt-1 text-xs text-mist">From the first to the last transfer in this trail</p></div>
                  </div>
                  {trailAlert && (
                    <div className="mt-6">
                      <p className="text-[10px] uppercase tracking-[.25em] text-smoke">Review these first</p>
                      <div className="mt-2 divide-y divide-white/10 border border-white/10">
                        {a.alerts.slice(0, 3).map((al) => (
                          <button key={al.account} onClick={() => { setFocus(al.account); setStep(2); }} className="flex w-full items-center gap-3 p-3 text-left text-sm hover:bg-white/[.03]">
                            <span className={`flex h-9 w-9 items-center justify-center rounded-full border font-display text-lg ${levelColor(al.level)}`}>{al.score}</span>
                            <span className="min-w-0 flex-1"><span className="font-semibold">{al.account}</span> <span className="text-xs text-mist">· {al.signals[0].detail}</span></span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-6">
                    <p className="text-[10px] uppercase tracking-[.25em] text-smoke">Recommended next steps</p>
                    <ol className="mt-3 space-y-3 text-sm leading-relaxed text-mist">
                      {['Check the flagged transfers against the original bank records and confirm the timestamps.', 'Pass the top accounts to an authorised investigator or the bank\u2019s fraud team for review.', 'If an end point can still hold funds, raise it quickly through the proper channel. Speed matters.', 'Look for innocent explanations first: payroll, shops, wallets and family transfers can look like these patterns.'].map((s, i) => (
                        <li key={i} className="flex gap-3"><span className="font-display text-xl text-crimson-2">{i + 1}</span>{s}</li>
                      ))}
                    </ol>
                  </div>
                  <p className="mt-6 border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-mist">An alert is a lead, not proof of fraud. This prototype uses transparent rules on the rows you loaded. Thresholds are not calibrated for real banks, and it does not use cross-bank training or a live IBM LinuxONE connection.</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={() => downloadFindings(c)} className="bg-bone px-5 py-3 text-sm font-bold text-ink hover:bg-crimson-2 hover:text-white">Download findings (CSV)</button>
                    <button onClick={() => setStep(2)} className="glass px-5 py-3 text-sm">Back to money trail</button>
                    <button onClick={() => { c.reset(); setFocus(null); setOpen(null); setStep(0); }} className="px-5 py-3 text-sm text-mist underline underline-offset-4 hover:text-white">Start a new case</button>
                  </div>
                </>
              )}

              {ep > 0 && !a && (
                <div className="py-10 text-center">
                  <p className="text-mist">Load some records first. Steps 2 to 4 unlock after the analysis runs.</p>
                  <button onClick={() => setStep(0)} className="mt-5 bg-crimson px-6 py-3 font-bold hover:bg-crimson-2">Go to step 1</button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}