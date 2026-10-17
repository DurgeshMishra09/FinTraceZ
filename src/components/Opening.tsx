import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { profile } from '../lib/content';
import { useReducedMotionPref } from '../hooks/useMedia';
import { EASE, Magnetic } from './fx';
import { HeroNetwork } from './Art';

/** black → studio card → title over the account network → tagline → PLAY */
const TIMELINE = [
  { at: 300, beat: 1 },
  { at: 1900, beat: 2 },
  { at: 3400, beat: 4 },
  { at: 4300, beat: 5 },
  { at: 5000, beat: 6 },
];

export default function Opening({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotionPref();
  const [beat, setBeat] = useState(reduced ? 6 : 0);

  useEffect(() => {
    if (reduced) return;
    const timers = TIMELINE.map(({ at, beat }) => window.setTimeout(() => setBeat(beat), at));
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') onDone(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

  return (
    <motion.div className="fixed inset-0 z-[120] overflow-hidden bg-black" exit={{ opacity: 0, scale: 1.04, filter: 'blur(12px)' }} transition={{ duration: 0.9, ease: EASE }} role="dialog" aria-label="Opening titles">
      <motion.div className="absolute inset-x-0 top-0 z-30 h-[7vh] bg-black" initial={{ y: 0 }} animate={{ y: beat >= 6 ? '-100%' : 0 }} transition={{ duration: 1.2, ease: EASE }} />
      <motion.div className="absolute inset-x-0 bottom-0 z-30 h-[7vh] bg-black" initial={{ y: 0 }} animate={{ y: beat >= 6 ? '100%' : 0 }} transition={{ duration: 1.2, ease: EASE }} />

      <motion.div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 50% at 50% 55%, rgba(229,19,43,0.22), transparent 70%)' }} initial={{ opacity: 0 }} animate={{ opacity: beat >= 2 ? [0, 0.9, 0.5, 1] : 0 }} transition={{ duration: 1.4 }} />

      <AnimatePresence>
        {beat === 1 && (
          <motion.div key="studio" className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: 'blur(6px)' }} transition={{ duration: 0.6 }}>
            <motion.p className="px-4 text-center font-sans text-xs font-semibold text-mist sm:text-sm" initial={{ letterSpacing: '0.2em', opacity: 0 }} animate={{ letterSpacing: '0.5em', opacity: 1 }} transition={{ duration: 1.6, ease: EASE }}>
              {profile.label}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the account network takes the place of a portrait */}
      <motion.div
        className="absolute inset-x-0 bottom-0 z-0 mx-auto flex h-[58vh] w-full max-w-[1100px] items-end justify-center sm:h-[68vh]"
        initial={{ opacity: 0, scale: 1.12, filter: 'blur(18px) brightness(0.3)' }}
        animate={beat >= 4 ? { opacity: 1, scale: 1, filter: 'blur(0px) brightness(1)' } : {}}
        transition={{ duration: 1.6, ease: EASE }}
      >
        <HeroNetwork className="h-full w-full" />
      </motion.div>
      <div aria-hidden className="absolute inset-0 z-[1] bg-[radial-gradient(70%_60%_at_50%_40%,transparent_30%,rgba(0,0,0,0.85)_100%)]" />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
        <motion.h1
          className="font-display leading-[0.82] text-bone drop-shadow-[0_8px_40px_rgba(0,0,0,0.8)]"
          style={{ fontSize: 'clamp(2.6rem, 11vw, 10rem)', maxWidth: 'calc(100vw - 32px)' }}
          initial={{ opacity: 0, scale: 1.3, filter: 'blur(20px)', letterSpacing: '0.5em' }}
          animate={beat >= 2 ? { opacity: 1, scale: 1, filter: 'blur(0px)', letterSpacing: '0.04em', y: beat >= 4 ? (window.innerWidth < 768 ? '-12vh' : '-25vh') : 0 } : {}}
          transition={{ duration: 1.3, ease: EASE }}
        >
          {profile.name}
        </motion.h1>
      </div>

      <div className="absolute inset-x-0 bottom-[8vh] z-20 flex flex-col items-center gap-6 px-4 text-center">
        <motion.p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-bone/90 sm:text-sm sm:tracking-[0.4em]" initial={{ opacity: 0, y: 14 }} animate={beat >= 5 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: EASE }}>
          {profile.tagline.join('  •  ')}
        </motion.p>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={beat >= 6 ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.7, ease: EASE }}>
          <Magnetic>
            <button type="button" data-cursor="play" onClick={onDone} tabIndex={beat >= 6 ? 0 : -1} className="group flex items-center gap-3 rounded-full bg-bone px-9 py-4 font-sans text-base font-bold tracking-wide text-ink shadow-[0_0_60px_rgba(229,19,43,0.45)] transition hover:bg-white">
              <span className="text-lg transition-transform group-hover:scale-125">▶</span> PLAY
            </button>
          </Magnetic>
        </motion.div>
      </div>

      <button type="button" onClick={onDone} className="absolute right-4 top-[calc(7vh+12px)] z-40 rounded-full border border-white/20 px-3 py-2 font-sans text-[11px] font-semibold tracking-[0.2em] text-mist transition hover:border-white/60 hover:text-bone sm:px-4">
        SKIP INTRO
      </button>
    </motion.div>
  );
}