/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        betel: {
          blue: '#113CFC',
          green: '#00A878',
          red: '#FF2E1F',
          purple: '#5F18F2',
          yellow: '#F7D002',
          ink: '#101114',
          paper: '#F7F8FC',
        },
      },
      boxShadow: {
        soft: '0 16px 45px rgba(16, 17, 20, 0.09)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
