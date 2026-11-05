import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: '#1e3a8a',
          darkBlue: '#0f2963',
          lightBlue: '#e0e7ff',
          gold: '#b45309',
          lightGold: '#fef3c7',
          gray: '#f8fafc',
          border: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Prompt', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['Kanit', 'Prompt', 'sans-serif'],
        kanit: ['Kanit', 'sans-serif'],
        prompt: ['Prompt', 'sans-serif'],
        sarabun: ['"TH Sarabun New"', '"TH Sarabun PSK"', 'sans-serif'],
      },
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)',
        'fluid-sm': 'clamp(0.8125rem, 0.76rem + 0.25vw, 0.875rem)',
        'fluid-label': 'clamp(0.875rem, 0.82rem + 0.25vw, 0.9375rem)',
        'fluid-base': 'clamp(0.9375rem, 0.875rem + 0.3vw, 1.0625rem)',
        'fluid-lg': 'clamp(1.0625rem, 1rem + 0.35vw, 1.1875rem)',
        'fluid-xl': 'clamp(1.25rem, 1.125rem + 0.5vw, 1.4375rem)',
        'fluid-2xl': 'clamp(1.4375rem, 1.25rem + 0.8vw, 1.75rem)',
        'fluid-3xl': 'clamp(1.6875rem, 1.45rem + 1vw, 2.125rem)',
      },
      screens: {
        print: { raw: 'print' },
      },
    },
  },
  plugins: [],
};

export default config;
