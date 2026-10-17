import type { SignalKey } from '../lib/analyze';

const NODES: [number, number][] = [[70, 250], [190, 150], [190, 350], [320, 90], [320, 230], [320, 400], [450, 160], [450, 330], [560, 250]];
const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7], [6, 8], [7, 8]];

export function HeroNetwork({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 620 500" fill="none" role="img" aria-label="Illustration of connected accounts passing money along">
      <circle cx="310" cy="250" r="220" stroke="#e5132b" strokeOpacity=".18" />
      <circle cx="310" cy="250" r="150" stroke="#e5132b" strokeOpacity=".14" strokeDasharray="4 8" />
      {EDGES.map(([a, b], i) => {
        const [x1, y1] = NODES[a], [x2, y2] = NODES[b];
        const d = `M${x1} ${y1} L${x2} ${y2}`;
        return (
          <g key={i}>
            <path d={d} stroke="#ff3d5a" strokeOpacity=".4" strokeWidth="1.5" />
            <circle r="3.5" fill="#ff8796">
              <animateMotion dur={`${2.4 + (i % 4) * 0.5}s`} begin={`${(i * 0.37).toFixed(2)}s`} repeatCount="indefinite" path={d} />
            </circle>
          </g>
        );
      })}
      {NODES.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === 0 ? 17 : i === 8 ? 15 : 10} fill={i === 0 ? '#e5132b' : '#111118'} stroke={i === 8 ? '#f4f1ec' : '#ff3d5a'} strokeWidth="2" />
          <circle cx={x} cy={y} r="3" fill="#f4f1ec" />
        </g>
      ))}
    </svg>
  );
}

export function PosterArt({ k }: { k: SignalKey }) {
  const line = { stroke: '#ff3d5a', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const };
  const node = (x: number, y: number, r = 9, hot = false) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={hot ? '#e5132b' : '#111118'} stroke="#ff3d5a" strokeWidth="2" />;
  let art;
  if (k === 'fast') {
    art = (
      <g>
        <circle cx="120" cy="150" r="64" {...line} />
        <path d="M120 150V106M120 150l30 18" {...line} strokeWidth={3} />
        <path d="M14 150h42M184 150h42M214 140l12 10-12 10" {...line} />
        <text x="120" y="250" textAnchor="middle" fill="#f4f1ec" fontSize="30" fontFamily="Bebas Neue, Impact, sans-serif" letterSpacing="3">UNDER 5 MIN</text>
      </g>
    );
  } else if (k === 'funnel') {
    const ys = [60, 105, 150, 195, 240];
    art = (
      <g>
        {ys.map((y) => <path key={y} d={`M34 ${y} L170 150`} {...line} strokeOpacity={0.7} />)}
        {ys.map((y) => node(34, y, 8))}
        {node(170, 150, 14, true)}
        <path d="M184 150h40M214 140l12 10-12 10" {...line} />
      </g>
    );
  } else if (k === 'split') {
    const ys = [60, 105, 150, 195, 240];
    art = (
      <g>
        {ys.map((y) => <path key={y} d={`M70 150 L206 ${y}`} {...line} strokeOpacity={0.7} />)}
        {ys.map((y) => node(206, y, 8))}
        {node(70, 150, 14, true)}
        <path d="M10 150h46" {...line} />
      </g>
    );
  } else if (k === 'chain') {
    const pts: [number, number][] = [[34, 70], [100, 130], [64, 190], [140, 235], [190, 170], [206, 90]];
    art = (
      <g>
        <path d={pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')} {...line} strokeDasharray="2 7" />
        {pts.map(([x, y], i) => node(x, y, 9, i === 0))}
      </g>
    );
  } else {
    art = (
      <g>
        {node(52, 150, 13, true)}
        <path d="M70 150h60M120 140l12 10-12 10" {...line} />
        <rect x="140" y="104" width="80" height="92" rx="8" {...line} />
        <rect x="154" y="118" width="52" height="26" rx="3" {...line} strokeOpacity={0.6} />
        <text x="180" y="176" textAnchor="middle" fill="#f4f1ec" fontSize="26" fontFamily="Bebas Neue, Impact, sans-serif">₹</text>
      </g>
    );
  }
  return (
    <svg viewBox="0 0 240 300" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id={`pg-${k}`} cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor="#e5132b" stopOpacity=".38" />
          <stop offset="1" stopColor="#0b0b0f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="300" fill="#0e0e13" />
      <rect width="240" height="300" fill={`url(#pg-${k})`} />
      {art}
    </svg>
  );
}