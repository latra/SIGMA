/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: "selector", // Disable automatic dark mode detection
  theme: {
    extend: {
      colors: {
        'hospital-blue': '#004e81',
        'focus-blue': '#4fbbeb',
      },
    },
  },
  plugins: [],
} 