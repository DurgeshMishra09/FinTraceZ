import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { PROFILES, type ProfileId, type SectionId } from './lib/content';
import { useCase } from './lib/useCase';
import { SmoothScrollProvider, useSmoothScroll } from './hooks/smoothScroll';
import CustomCursor from './components/CustomCursor';
import Opening from './components/Opening';
import ProfileSelector from './components/ProfileSelector';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Explore from './components/Explore';
import Scene from './components/Scene';
import FinalCTA from './components/FinalCTA';
import { CaseRoom } from './components/CaseRoom';
import { FlagModalBody, Heading, Privacy, RedFlags, Reveal, TopSignals, WhyItMatters } from './components/Section';
import { InfoBody, Modal, Reel } from './components/Chrome';
import { EASE } from './components/fx';

type Stage = 'opening' | 'profiles' | 'home';
const STORAGE_KEY = 'fintrace-z-profile';

function readStoredProfile(): ProfileId | null {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return PROFILES.some((p) => p.id === v) ? (v as ProfileId) : null;
  } catch {
    return null;
  }
}

export default function App() {
  return (
    <SmoothScrollProvider>
      <Site />
    </SmoothScrollProvider>
  );
}

function Site() {
  const stored = readStoredProfile();
  const [stage, setStage] = useState<Stage>(stored ? 'home' : 'opening');
  const [profileId, setProfileId] = useState<ProfileId>(stored ?? 'investigator');
  const [playing, setPlaying] = useState(false);
  const [info, setInfo] = useState(false);
  const [flag, setFlag] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const c = useCase();
  const { scrollTo, lock, unlock } = useSmoothScroll();

  const order = PROFILES.find((p) => p.id === profileId)!.order;

  useEffect(() => {
    if (stage === 'home') return;
    lock();
    return unlock;
  }, [stage, lock, unlock]);

  const pickProfile = useCallback(
    (id: ProfileId) => {
      setProfileId(id);
      try { sessionStorage.setItem(STORAGE_KEY, id); } catch { /* the profile simply will not persist */ }
      if (stage !== 'home') {
        window.scrollTo(0, 0);
        setStage('home');
      } else {
        const p = PROFILES.find((v) => v.id === id)!;
        setToast(`Now investigating as ${p.name}: ${p.blurb.toLowerCase()}`);
        scrollTo(0, { offset: 0 });
      }
    },
    [stage, scrollTo],
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const startCase = useCallback(() => { setStep(0); window.setTimeout(() => scrollTo('#case'), 60); }, [scrollTo]);
  const closeFlag = useCallback(() => setFlag(null), []);
  const closeInfo = useCallback(() => setInfo(false), []);
  const closeReel = useCallback(() => setPlaying(false), []);

  const sections: Record<SectionId, ReactNode> = {
    about: <WhyItMatters />,
    case: (
      <div className="gutter">
        <Reveal><Heading kicker="The case room" title="LET'S LOOK" outline="AT THE FACTS." sub="Work through four steps, one at a time. Use the fictional sample, or load your own CSV. It is read in your browser and never uploaded." /></Reveal>
        <CaseRoom c={c} step={step} setStep={setStep} />
      </div>
    ),
    flags: <RedFlags onOpen={setFlag} />,
    signals: <TopSignals onOpen={setFlag} />,
    privacy: <Privacy />,
  };

  return (
    <LayoutGroup>
      <div className="grain" aria-hidden />
      <CustomCursor />

      <AnimatePresence>
        {stage === 'opening' && <Opening key="opening" onDone={() => setStage('profiles')} />}
        {stage === 'profiles' && <ProfileSelector key="profiles" onPick={pickProfile} />}
      </AnimatePresence>

      {stage === 'home' && (
        <motion.div initial={{ opacity: 0, scale: 1.03, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ duration: 1, ease: EASE }}>
          <Navbar order={order} profileId={profileId} onSwitch={pickProfile} />
          <main>
            <Hero key={`hero-${profileId}`} onPlay={() => setPlaying(true)} onStart={() => (profileId === 'analyst' ? scrollTo('#flags') : startCase())} onInfo={() => setInfo(true)} profileId={profileId} />
            <Explore order={order} />
            {order.map((id) => (
              <Scene key={id} id={id} plain={id === 'flags'} className={id === 'case' ? 'pb-16 sm:pb-24' : ''}>
                {sections[id]}
              </Scene>
            ))}
            <FinalCTA onReplay={() => setStage('opening')} onStart={startCase} />
          </main>
        </motion.div>
      )}

      <AnimatePresence>{playing && <Reel key="reel" onClose={closeReel} />}</AnimatePresence>
      <AnimatePresence>
        {flag !== null && <Modal key="flag" onClose={closeFlag} label="Red flag details" wide><FlagModalBody i={flag} go={setFlag} /></Modal>}
        {info && <Modal key="info" onClose={closeInfo} label="About this prototype"><InfoBody /></Modal>}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div role="status" className="glass fixed bottom-6 left-1/2 z-[150] w-[min(92vw,420px)] -translate-x-1/2 rounded-xl px-5 py-3 text-center text-sm text-bone" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}