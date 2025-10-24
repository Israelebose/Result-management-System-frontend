/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Scan all JS/JSX/TS/TSX files in src/
  ],
  theme: {
    extend: {
      // Optional: Extend colors, fonts, or other utilities
      colors: {
        
        gray: {
          400: '#9ca3af', // Used in dark mode for inputs
          500: '#6b7280', // Used in light mode for inputs
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Enable dark mode with 'dark' class
};