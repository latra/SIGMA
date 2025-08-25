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
        'sigma-orange': '#ea7317',
        'sigma-orange-light': '#f59e0b',
        'sigma-orange-dark': '#d97706',
        'hospital-blue': '#004e81',
        'hospital-blue-light': '#0066cc',
        'police-red': '#810000',
        'police-red-light': '#dc2626',
        'focus-blue': '#4fbbeb',
      },
    },
  },
  plugins: [],
} 