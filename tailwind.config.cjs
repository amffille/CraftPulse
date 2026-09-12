/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mc: {
          green: '#2e8540',
          darkgreen: '#1b5e20',
          emerald: '#10b981',
          dirt: '#866043',
          dark: '#121417',
          panel: '#1a1d24',
          card: '#222631',
          border: '#2e3444',
          accent: '#3b82f6'
        }
      }
    },
  },
  plugins: [],
};
