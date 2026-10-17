import type { ReactNode } from 'react';
import type { Palette } from '../lib/content';

export function PosterBackdrop({ palette, children, className = '' }: { palette: Palette; children?: ReactNode; className?: string }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ background: `radial-gradient(120% 90% at 85% 10%, ${palette.via} 0%, transparent 60%), radial-gradient(90% 80% at 0% 100%, ${palette.from} 0%, transparent 70%), linear-gradient(160deg, ${palette.from} 0%, ${palette.to} 100%)` }}
    >
      <div aria-hidden className="absolute -right-1/4 -top-1/3 h-[140%] w-[70%] rotate-[18deg] opacity-40 blur-2xl" style={{ background: `linear-gradient(90deg, transparent, ${palette.accent}55, transparent)` }} />
      <div aria-hidden className="absolute inset-0 opacity-[0.18] [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_4px)]" />
      {children}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
    </div>
  );
}