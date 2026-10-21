import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Palette inspirée du drapeau camerounais, ajustée pour le contraste
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#0a8a5f',
          600: '#007a5e',
          700: '#00634c',
          800: '#044d3c',
          900: '#05382d',
        },
        sun: { 400: '#fcd116', 500: '#e8b800' },
        flag: { red: '#ce1126' },
        ink: { 900: '#0f172a', 700: '#334155', 500: '#64748b' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
};

export default config;
