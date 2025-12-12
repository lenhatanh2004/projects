/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
  darkMode: "class",
}
