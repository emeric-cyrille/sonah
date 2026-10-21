import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Papier crème, encre indigo (tissu ndop), ocre, terre cuite, vert forêt
        paper: { DEFAULT: '#f6f1e7', soft: '#fbf8f2', deep: '#ede5d4' },
        ink: { DEFAULT: '#181b34', soft: '#3d3f57', muted: '#6b6878' },
        indigo: { DEFAULT: '#26306b', deep: '#1a2150' },
        sun: { DEFAULT: '#e8a317', soft: '#f6d68a' },
        clay: { DEFAULT: '#c4532d', soft: '#f0c9b6' },
        leaf: { DEFAULT: '#0f6b4f', deep: '#0b5540' },
        line: '#e0d6c2',
        night: { DEFAULT: '#0b0d22', soft: '#141838' },
        kente: { red: '#b3261e', green: '#0f6b4f', gold: '#e8a317' },
        earth: '#3b2416',
        velvet: '#0d0b0a',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      maxWidth: {
        content: '76rem',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
