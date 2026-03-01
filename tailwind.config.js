/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      colors: {
        kidblue:   '#4F46E5',
        kidgreen:  '#22C55E',
        kidred:    '#EF4444',
        kidyellow: '#FACC15',
        kidorange: '#F97316',
        kidpink:   '#EC4899',
        kidpurple: '#A855F7',
      },
      keyframes: {
        'star-pop': {
          '0%':   { transform: 'scale(0) rotate(-20deg)', opacity: '0' },
          '70%':  { transform: 'scale(1.3) rotate(5deg)',  opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)',    opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-8px)' },
          '40%':      { transform: 'translateX(8px)' },
          '60%':      { transform: 'translateX(-6px)' },
          '80%':      { transform: 'translateX(6px)' },
        },
        bounce2: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        'star-pop':  'star-pop 0.5s ease-out forwards',
        shake:       'shake 0.5s ease-in-out',
        bounce2:     'bounce2 0.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
