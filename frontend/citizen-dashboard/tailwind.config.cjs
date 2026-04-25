/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../shared/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#03070f',
        card:  '#0a1628',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
