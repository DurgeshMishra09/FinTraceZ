import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from './fx';

export function Modal({ onClose, label, children, wide = false }: { onClose: () => void; label: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <motion.div className="fixed inset-0 z-[105] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog" aria-modal="true" aria-label={label}
        initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.4, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-h-[92svh] w-full overflow-y-auto border border-white/10 bg-ink-2 ${wide ? 'sm:max-w-4xl' : 'sm:max-w-xl'}`}
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-lg text-bone hover:bg-crimson">✕</button>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function InfoBody() {
  return (
    <div className="p-6 md:p-9">
      <p className="text-[11px] uppercase tracking-[.3em] text-crimson-2">About this prototype</p>
      <h3 className="mt-2 font-display text-4xl md:text-5xl">CLUES, NOT VERDICTS</h3>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-mist">
        <p>FinTrace Z helps a human investigator read a transaction list: it connects accounts, flags patterns that deserve a closer look, and explains why.</p>
        <p><strong className="text-bone">A flag is a lead, not proof.</strong> Normal activity such as payroll, shops and wallets can look unusual. A trained person must review the evidence.</p>
        <p><strong className="text-bone">What runs here:</strong> five transparent, rule-based checks in your browser. Your file is not uploaded.</p>
        <p><strong className="text-bone">What does not:</strong> there is no cross-bank training, differential privacy, secure aggregation or live IBM LinuxONE connection in this demo. Those are the planned architecture.</p>
        <p>The sample data is fictional. Please only upload data you are authorised to use.</p>
      </div>
    </div>
  );
}

const SCENES = [
  { k: 'EVERY TRANSFER', v: 'LEAVES A TRAIL.', s: 'Scam money is split and bounced through mule accounts within minutes.' },
  { k: '₹50,000.', v: 'NINE ACCOUNTS. 12 MINUTES.', s: 'Each bank sees only its own hop, and every hop looks normal.' },
  { k: 'CLUES,', v: 'NOT VERDICTS.', s: 'Five transparent checks. Every flag comes with a reason.' },
  { k: 'FOLLOW', v: 'THE MONEY.', s: 'Load records, review clues, trace transfers, reach a conclusion.' },
];
const SCENE_MS = 3200;

export function Reel({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    timer.current = setTimeout(() => { if (i < SCENES.length - 1) setI(i + 1); else onClose(); }, SCENE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [i, onClose]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') setI((n) => Math.min(n + 1, SCENES.length - 1)); if (e.key === 'ArrowLeft') setI((n) => Math.max(n - 1, 0)); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const sc = SCENES[i];
  return (
    <motion.div className="fixed inset-0 z-[108] flex flex-col items-center justify-center overflow-hidden bg-black px-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pointer-events-none absolute left-1/2 top-1/2 -ml-[30vw] -mt-[30vw] h-[60vw] w-[60vw] rounded-full bg-[radial-gradient(closest-side,rgba(229,19,43,.3),transparent)] blur-2xl" />
      <div className="absolute inset-x-0 top-0 flex gap-2 px-5 pt-5">
        {SCENES.map((_, n) => (
          <div key={n} className="h-[3px] flex-1 overflow-hidden bg-white/15">
            {n < i && <div className="h-full w-full bg-bone" />}
            {n === i && <motion.div key={i} className="h-full bg-crimson-2" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: SCENE_MS / 1000, ease: 'linear' }} />}
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }} transition={{ duration: 0.7, ease: EASE }} className="relative">
          <h2 className="font-display leading-[.88] tracking-wide" style={{ fontSize: 'clamp(3rem,11vw,9rem)' }}>
            <span className="text-outline">{sc.k}</span><br />{sc.v}
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-mist md:text-base">{sc.s}</p>
        </motion.div>
      </AnimatePresence>
      <button onClick={onClose} className="absolute right-5 top-10 text-xs uppercase tracking-[.3em] text-mist hover:text-white">Close ✕</button>
    </motion.div>
  );
}