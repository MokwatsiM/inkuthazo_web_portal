/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary color palette following the spec
        primary: {
          DEFAULT: '#6D28D9',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065'
        },
        // Keep brand for backward compatibility
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065'
        },
        // Accent/Positive color
        accent: {
          DEFAULT: '#06B6D4',
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63'
        },
        // Background and surface colors with dark mode support
        background: {
          DEFAULT: '#F7FAFC',
          dark: '#0F172A'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1E293B'
        },
        'surface-2': {
          DEFAULT: '#F8FAFC',
          dark: '#334155'
        },
        muted: {
          DEFAULT: '#6B7280',
          dark: '#94A3B8'
        },
        'text-primary': {
          DEFAULT: '#111827',
          dark: '#F1F5F9'
        },
        'text-secondary': {
          DEFAULT: '#6B7280',
          dark: '#CBD5E1'
        },
        danger: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        line: {
          DEFAULT: '#E6E9EE',
          dark: '#475569'
        },
        // Enhanced gray scale
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '1.35' }],
        'sm': ['14px', { lineHeight: '1.35' }],
        'base': ['14px', { lineHeight: '1.35' }],
        'lg': ['16px', { lineHeight: '1.35' }],
        'xl': ['18px', { lineHeight: '1.35' }],
        '2xl': ['20px', { lineHeight: '1.35' }],
        '3xl': ['24px', { lineHeight: '1.35' }],
        '4xl': ['28px', { lineHeight: '1.35' }],
        '5xl': ['32px', { lineHeight: '1.35' }],
        '6xl': ['40px', { lineHeight: '1.35' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      borderRadius: {
        'base': '12px',
        'input': '8px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'card': '0 6px 18px rgba(16, 24, 40, 0.06)',
        'card-hover': '0 8px 24px rgba(16, 24, 40, 0.12)',
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.25s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      screens: {
        'tablet': '768px',
        'desktop': '1200px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};