import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTrackProgress } from '../hooks/sectionProgress';

/** A section of the page. Fades up out of black with a short blur-to-focus and reports viewing progress. */
export default function Scene({ id, children, className = '', plain = false }: { id: string; children: ReactNode; className?: string; plain?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useTrackProgress(id, ref);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.55'] });
  const opacity = useTransform(scrollYProgress, [0, 1], [0.15, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.97, 1]);
  return (
    <motion.section id={id} ref={ref} style={plain ? undefined : { opacity, scale }} className={`relative scroll-mt-16 ${plain ? '' : 'py-16 sm:py-24'} ${className}`}>
      {children}
    </motion.section>
  );
}