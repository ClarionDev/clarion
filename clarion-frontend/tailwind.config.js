/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gray-dark': '#1a1a1a',
        'gray-medium': '#2a2a2a',
        'gray-light': '#3c3c3c',
        'accent-blue': '#3b82f6',
        'accent-green': '#10b981',
        'text-primary': '#f0f0f0',
        'text-secondary': '#a0a0a0',
      }
    },
  },
  plugins: [],
}
