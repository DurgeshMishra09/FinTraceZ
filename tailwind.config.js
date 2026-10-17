/** Tailwind 3 (pure JS) — same tokens the Tailwind 4 @theme block defined. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#07070a', 2: '#0e0e13', 3: '#16161d' },
        crimson: { DEFAULT: '#e5132b', 2: '#ff3d5a' },
        bone: '#f4f1ec',
        mist: '#a7a6ad',
        smoke: '#6d6c75',
      },
      fontFamily: {
        display: ["'Bebas Neue'", "'Oswald'", 'Impact', 'sans-serif'],
        serif: ["'Instrument Serif'", 'Georgia', 'serif'],
        sans: ["'Inter'", 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      transitionTimingFunction: {
        cine: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      // Tailwind 4 defaults, kept so borders and rings look the same as before
      borderColor: { DEFAULT: 'currentColor' },
      ringWidth: { DEFAULT: '1px' },
      ringColor: { DEFAULT: 'currentColor' },
    },
  },
  plugins: [],
};
