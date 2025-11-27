/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        'deep-space': '#0B1120',
        'cyber-cyan': '#00F0FF',
        'neon-blue': '#2E5CFF',
        'emerald-green': '#10B981',
        'alert-red': '#FF3B30'
      }
    }
  },
  plugins: []
}

