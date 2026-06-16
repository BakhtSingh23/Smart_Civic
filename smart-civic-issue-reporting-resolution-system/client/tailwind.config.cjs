/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0F2C59', // Deep blue from logo
        accent: '#00A8E8', // Light blue checkmark from logo
        success: '#10B981',
        danger: '#EF4444',
        civic: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#b9d3ff',
          300: '#8ab5ff',
          400: '#5a90ff',
          500: '#2f6bff',
          600: '#1e4fd1',
          700: '#173aa6',
          800: '#132f85',
          900: '#0f2466',
        },
        slateink: {
          900: '#0b1220',
          800: '#111a2c',
          700: '#1a2440',
        },
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(47, 107, 255, 0.25)',
      },
    },
  },
  plugins: [],
};