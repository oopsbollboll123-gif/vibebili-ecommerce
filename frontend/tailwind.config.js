/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy
        sheinBlack: '#1a1a1a',
        sheinOrange: '#e85d26',

        // VibeBili Design Tokens — Baoyu Design System
        vibe: {
          black:   '#111111',
          white:   '#fafafa',
          ink:     '#1a1a1a',
          muted:   '#6b7280',
          subtle:  '#9ca3af',
          border:  '#e5e7eb',
          surface: '#f8f7f5',
          card:    '#ffffff',
          // Brand accent — warm amber-orange, NOT harsh red-orange
          accent:  '#d4642c',
          'accent-light': '#fef0e8',
          'accent-hover': '#c4571f',
          // Status
          success: '#16a34a',
          warning: '#d97706',
          danger:  '#dc2626',
          info:    '#2563eb',
          // Neutral scale
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],    // 10px
        xs:    ['0.75rem',  { lineHeight: '1.125rem' }], // 12px
        sm:    ['0.875rem', { lineHeight: '1.375rem' }], // 14px
        base:  ['1rem',     { lineHeight: '1.625rem' }], // 16px
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        xl:    ['1.25rem',  { lineHeight: '1.875rem' }], // 20px
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],     // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
        '4xl': ['2.25rem',  { lineHeight: '2.75rem' }],  // 36px
        '5xl': ['3rem',     { lineHeight: '3.5rem' }],   // 48px
        '6xl': ['3.75rem',  { lineHeight: '1' }],        // 60px
      },
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)',
        'card-md': '0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'card-lg': '0 10px 30px -6px rgba(0,0,0,0.12), 0 4px 10px -4px rgba(0,0,0,0.08)',
        'product': '0 2px 8px rgba(0,0,0,0.06)',
        'product-hover': '0 8px 28px rgba(0,0,0,0.12)',
        'drawer':  '−24px 0 80px rgba(0,0,0,0.15)',
        'btn':     '0 1px 2px rgba(0,0,0,0.08)',
        'btn-md':  '0 2px 8px rgba(0,0,0,0.15)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-right':'slideRight 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-sm':  'bounceSm 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer':    'shimmer 1.5s infinite linear',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight:{ from: { opacity: '0', transform: 'translateX(100%)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.92)' }, to: { opacity: '1', transform: 'scale(1)' } },
        bounceSm:  { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.06)' } },
        shimmer:   { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
