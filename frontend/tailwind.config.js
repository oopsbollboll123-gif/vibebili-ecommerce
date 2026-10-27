/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sheinBlack: '#222222',
        sheinOrange: '#ff6600',
      }
    },
  },
  plugins: [],
}