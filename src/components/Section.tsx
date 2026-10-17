import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, useMotionValue, useScroll, useTransform } from 'framer-motion';
import { FLAGS, PRIVACY_LIVE, PRIVACY_PLANNED } from '../lib/content';
import { PosterArt } from './Art';
import { EASE } from './fx';

export function useDesktop() {
  const [d, setD] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);
  useEffect(() => {
    const m = window.matchMedia('(min-width: 768px)');
    const f = () => setD(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return d;
}

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

export function Heading({ kicker, title, outline, sub }: { kicker: string; title: string; outline?: string; sub?: string }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.3em] text-crimson-2"><span className="h-px w-8 bg-crimson-2" />{kicker}</p>
        <h2 className="mt-3 font-display text-5xl leading-[.9] md:text-7xl">{title}{outline && <><br /><span className="text-outline">{outline}</span></>}</h2>
      </div>
      {sub && <p className="max-w-sm text-sm leading-relaxed text-mist">{sub}</p>}
    </div>
  );
}

export function WhyItMatters() {
  const beats = [
    { t: '10:00', h: 'A victim is tricked', d: 'Someone is persuaded to send ₹50,000 to what looks like a normal account.' },
    { t: '10:02', h: 'The money is split', d: 'Within minutes it fans out to several mule accounts, then onward, often at different banks.' },
    { t: '10:12', h: 'It is cashed out', d: 'Each bank saw one ordinary hop. By the time anyone puts the pieces together, the money has left.' },
  ];
  return (
    <div className="gutter">
      <Reveal><Heading kicker="Why this matters" title="EVERY BANK SEES" outline="ONLY ONE HOP" sub="Scam money is moved through mule accounts faster than any single bank can see. Banks cannot simply share customer data, so the trail goes cold." /></Reveal>
      <div className="grid gap-px bg-white/10 md:grid-cols-3">
        {beats.map((b, i) => (
          <Reveal key={b.t} delay={i * 0.1} className="bg-ink p-6 md:p-8">
            <p className="font-display text-5xl text-crimson-2">{b.t}</p>
            <h3 className="mt-4 text-lg font-bold">{b.h}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">{b.d}</p>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-6 grid gap-4 text-sm text-mist md:grid-cols-2">
        <p className="border-l border-crimson-2 pl-4"><span className="font-display text-3xl text-bone">₹22,849 crore</span><br />cyber-fraud losses in India in 2024 (press-reported government data)</p>
        <p className="border-l border-crimson-2 pl-4"><span className="font-display text-3xl text-bone">13.42 lakh cases</span><br />of UPI fraud worth ₹1,087 crore in 2023-24 (press-reported government data)</p>
      </Reveal>
    </div>
  );
}

function PosterCard({ i, onOpen }: { i: number; onOpen: (i: number) => void }) {
  const f = FLAGS[i];
  return (
    <button onClick={() => onOpen(i)} className="group relative block aspect-[4/5.2] w-[72vw] shrink-0 snap-start overflow-hidden border border-white/10 text-left transition hover:border-crimson-2/70 sm:w-[300px] md:w-[320px]">
      <div className="absolute inset-0 transition duration-700 group-hover:scale-105"><PosterArt k={f.key} /></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
      <span className="absolute left-4 top-3 font-display text-6xl text-outline">{f.no}</span>
      <span className="absolute right-4 top-4 border border-crimson-2/60 px-2 py-1 text-[10px] font-bold tracking-wider text-crimson-2">+{f.points} PTS</span>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[10px] uppercase tracking-[.25em] text-crimson-2">{f.tag}</p>
        <h3 className="mt-1 font-display text-4xl leading-none tracking-wide">{f.title}</h3>
        <p className="mt-2 text-xs text-mist">{f.short}</p>
        <p className="mt-3 text-[11px] uppercase tracking-[.2em] text-bone opacity-0 transition group-hover:opacity-100 max-md:opacity-100">View details ↗</p>
      </div>
    </button>
  );
}

export function RedFlags({ onOpen }: { onOpen: (i: number) => void }) {
  const desktop = useDesktop();
  const sec = useRef<HTMLElement>(null), track = useRef<HTMLDivElement>(null);
  const distRef = useRef(0);
  const [dist, setDist] = useState(0);
  const { scrollYProgress } = useScroll({ target: sec, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, (v) => -v * distRef.current);

  useEffect(() => {
    const m = () => {
      if (!track.current || !desktop) { distRef.current = 0; setDist(0); return; }
      const d = Math.max(0, track.current.scrollWidth - window.innerWidth);
      distRef.current = d; setDist(d);
    };
    m();
    window.addEventListener('resize', m);
    return () => window.removeEventListener('resize', m);
  }, [desktop]);

  const head = <Heading kicker="Red flags" title="FIVE PATTERNS" outline="WORTH A CLOSER LOOK" sub="Each poster is one check the tool runs. Open one to see what it means, why it matters and when it can be innocent." />;

  if (!desktop) {
    return (
      <section className="py-16">
        <div className="gutter">{head}</div>
        <div className="rail flex snap-x gap-4 overflow-x-auto px-4 pb-4">{FLAGS.map((_, i) => <PosterCard key={i} i={i} onOpen={onOpen} />)}</div>
        <p className="gutter mt-3 text-xs text-smoke">Swipe sideways →</p>
      </section>
    );
  }
  return (
    <section ref={sec} className="relative" style={{ height: `calc(100vh + ${dist}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="gutter">{head}</div>
        <motion.div ref={track} style={{ x }} className="flex w-max gap-6 px-[var(--gutter)] will-change-transform">
          {FLAGS.map((_, i) => <PosterCard key={i} i={i} onOpen={onOpen} />)}
        </motion.div>
        <p className="gutter mt-6 text-[10px] uppercase tracking-[.3em] text-smoke">Keep scrolling to move the row</p>
      </div>
    </section>
  );
}

export function TopSignals({ onOpen }: { onOpen: (i: number) => void }) {
  const ranked = FLAGS.map((f, i) => ({ f, i })).sort((a, b) => b.f.points - a.f.points || a.i - b.i);
  return (
    <div className="gutter">
      <Reveal><Heading kicker="Top 5 signals" title="WHICH CLUES" outline="COUNT THE MOST" sub="Ranked by how many points each pattern adds to an account's score (capped at 100). It is a demo ranking, not a probability of fraud." /></Reveal>
      <div className="divide-y divide-white/10 border-y border-white/10">
        {ranked.map(({ f, i }, n) => (
          <Reveal key={f.key} delay={n * 0.05}>
            <button onClick={() => onOpen(i)} className="group flex w-full items-center gap-4 py-5 text-left md:gap-8">
              <span className="w-14 shrink-0 text-center font-display text-7xl leading-none text-outline transition group-hover:[-webkit-text-stroke-color:#ff3d5a] md:w-28 md:text-9xl">{n + 1}</span>
              <span className="hidden h-28 w-20 shrink-0 overflow-hidden border border-white/10 sm:block"><PosterArt k={f.key} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-3xl tracking-wide md:text-5xl">{f.title}</span>
                <span className="mt-1 block text-sm text-mist">{f.short}</span>
                <span className="mt-3 block h-[3px] w-full max-w-sm bg-white/10"><motion.span className="block h-full bg-crimson-2" initial={{ width: '0%' }} whileInView={{ width: `${(f.points / 35) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE }} /></span>
              </span>
              <span className="shrink-0 font-display text-3xl text-crimson-2 md:text-5xl">+{f.points}</span>
            </button>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function FlagModalBody({ i, go }: { i: number; go: (n: number) => void }) {
  const f = FLAGS[i];
  const rows: [string, string][] = [['What it is', f.what], ['Why it matters', f.why], ['How we check it', f.how], ['Example in the sample', f.example]];
  return (
    <div className="grid md:grid-cols-[.8fr_1.2fr]">
      <div className="relative hidden aspect-[3/4] md:block md:aspect-auto"><PosterArt k={f.key} /><span className="absolute left-4 top-3 font-display text-7xl text-outline">{f.no}</span></div>
      <div className="p-6 md:p-9">
        <p className="text-[11px] uppercase tracking-[.3em] text-crimson-2">{f.tag} · +{f.points} points</p>
        <h3 className="mt-2 font-display text-5xl leading-none md:text-6xl">{f.title}</h3>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-mist">
          {rows.map(([k, v]) => <p key={k}><strong className="mb-0.5 block text-[10px] uppercase tracking-[.25em] text-smoke">{k}</strong>{v}</p>)}
          <p className="border-l-2 border-crimson-2 pl-4 text-bone"><strong className="mb-0.5 block text-[10px] uppercase tracking-[.25em] text-crimson-2">When it can be innocent</strong>{f.caution}</p>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => go((i + FLAGS.length - 1) % FLAGS.length)} className="glass px-4 py-3 text-sm hover:border-crimson-2">← Previous</button>
          <span className="text-xs text-smoke">{i + 1} / {FLAGS.length}</span>
          <button onClick={() => go((i + 1) % FLAGS.length)} className="glass px-4 py-3 text-sm hover:border-crimson-2">Next →</button>
        </div>
      </div>
    </div>
  );
}

export function Privacy() {
  const flow = ['Bank A, B, N', 'Clip + add noise', 'Secure aggregator', 'Global model', 'Ranked, explained alerts'];
  return (
    <div className="gutter">
      <Reveal><Heading kicker="Built around privacy" title="SHARE LEARNING." outline="NOT CUSTOMER DATA." sub="The idea: each bank trains locally and shares only protected model updates. This is what is real today and what is planned." /></Reveal>
      <Reveal className="mb-10 flex flex-wrap items-stretch gap-2 text-xs md:flex-nowrap">
        {flow.map((s, i) => (
          <div key={s} className="flex flex-1 basis-[40%] items-center gap-2 md:basis-0">
            <div className="glass flex-1 px-3 py-4 text-center">{s}</div>
            {i < flow.length - 1 && <span className="hidden text-crimson-2 md:block">→</span>}
          </div>
        ))}
      </Reveal>
      <div className="grid gap-px bg-white/10 md:grid-cols-2">
        <Reveal className="bg-ink p-6 md:p-8">
          <p className="inline-block border border-emerald-400/40 px-2 py-1 text-[10px] font-bold uppercase tracking-[.25em] text-emerald-300">Live in this demo</p>
          <ul className="mt-5 space-y-3 text-sm text-mist">{PRIVACY_LIVE.map((t) => <li key={t} className="flex gap-3"><span className="text-emerald-300">✓</span>{t}</li>)}</ul>
        </Reveal>
        <Reveal delay={0.1} className="bg-ink p-6 md:p-8">
          <p className="inline-block border border-amber-300/40 px-2 py-1 text-[10px] font-bold uppercase tracking-[.25em] text-amber-300">Planned, not built yet</p>
          <ul className="mt-5 space-y-3 text-sm text-mist">{PRIVACY_PLANNED.map((t) => <li key={t} className="flex gap-3"><span className="text-amber-300">◌</span>{t}</li>)}</ul>
        </Reveal>
      </div>
      <p className="mt-6 max-w-2xl border-l border-crimson-2 pl-4 text-sm leading-relaxed text-bone">This browser prototype does not perform real cross-bank training and does not prove a live IBM LinuxONE connection. It shows the investigation experience the planned system would feed.</p>
    </div>
  );
}