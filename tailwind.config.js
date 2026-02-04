/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        eand: {
          red: '#E00800',
          'ocean-blue': '#18114B',
          'bright-green': '#47CB6C',
          burgundy: '#7C0124',
          'dark-green': '#16363A',
          mauve: '#631C46',
          'sand-red': '#D18D86',
          beige: '#E2E2D7',
          grey: '#71716F',
          'medium-grey': '#9C9C99',
          'light-grey': '#DADAD7',
        },
      },
      fontFamily: {
        arabic: ['Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
