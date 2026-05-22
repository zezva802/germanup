import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'rgba(74,222,128,0.08)',
          100: 'rgba(74,222,128,0.15)',
          200: 'rgba(74,222,128,0.25)',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#4ADE80',
          600: '#4ADE80',
          700: '#22C55E',
          800: '#16A34A',
          900: '#15803D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
