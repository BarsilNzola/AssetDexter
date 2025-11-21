/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#937F71', // Warm brown
            dark: '#7D6B5E',
          },
          secondary: {
            DEFAULT: '#7DC0B5', // Teal
            dark: '#6BA89E',
          },
          background: {
            DEFAULT: '#EEECE6', // Cream
            card: '#E0CFBD', // Light tan
          },
          accent: {
            DEFAULT: '#B6846A', // Terracotta
          }
        },
        fontFamily: {
          'pokemon': ['"Press Start 2P"', 'cursive'],
          'sans': ['Inter', 'system-ui', 'sans-serif'],
        },
        animation: {
          'pulse-slow': 'pulse 3s linear infinite',
          'bounce-slow': 'bounce 2s infinite',
        }
      },
    },
    plugins: [],
}