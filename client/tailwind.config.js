/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // Blue-600
          dark: '#1d4ed8',    // Blue-700
          light: '#eff6ff',   // Blue-50
        },
        secondary: {
          DEFAULT: '#dc2626', // Red-600
          dark: '#b91c1c',    // Red-700
          light: '#fef2f2',   // Red-50
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}