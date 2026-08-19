import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vexilon: {
          primary: '#bc13fe',
          dark: '#0a0a0a',
          light: '#ffffff',
          gray: '#1f1f1f',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-oswald)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
