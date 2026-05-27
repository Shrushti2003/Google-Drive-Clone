/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#101828',
        mist: '#F6F8FB',
        line: '#E5E7EB',
        brand: {
          50: '#EEF6FF',
          100: '#D9EBFF',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF'
        },
        violet: {
          500: '#7C3AED',
          600: '#6D28D9'
        }
      },
      boxShadow: {
        soft: '0 18px 60px rgba(15, 23, 42, 0.08)',
        lift: '0 24px 80px rgba(37, 99, 235, 0.16)'
      }
    }
  },
  plugins: []
};
