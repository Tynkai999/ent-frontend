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
          50: '#eef4fc',
          100: '#d7e6f8',
          200: '#b0cdf1',
          300: '#82b0e8',
          400: '#4f8bdc',
          500: '#2f6fcf',
          600: '#1f57ad',
          700: '#19458a',
          800: '#153a71',
          900: '#12305d',
          DEFAULT: '#1F57AD',
        },
        'primary-dark': '#153A71',
        accent: {
          50: '#fffaf0',
          100: '#fff0d6',
          200: '#ffdda3',
          300: '#ffc670',
          400: '#ffab3d',
          500: '#f59416',
          600: '#cc7a10',
          700: '#a3620d',
          DEFAULT: '#F59416',
        },
        secondary: '#E5E7EB',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
