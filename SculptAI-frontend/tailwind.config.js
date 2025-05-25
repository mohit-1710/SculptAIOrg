/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066FF',
      },
      height: {
        '[300px]': '300px',
        '[320px]': '320px',
        '[340px]': '340px',
        '[350px]': '350px',
        '[380px]': '380px',
        '[400px]': '400px',
      },
      keyframes: {
        move: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        slideLine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'move': 'move 3s linear infinite',
        'slide-line': 'slideLine 2s ease-in-out infinite',
      },
      columns: {
        '1': '1',
        '2': '2',
        '3': '3'
      },
      backgroundImage: {
        'gradient-line': 'linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))',
      },
    },
  },
  plugins: [],
}

/* filepath: d:\Sculpt AI\SculptAI\SculptAI-frontend\src\index.css */
