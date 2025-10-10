/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e1fbf2',
          100: '#c3f6e5',
          200: '#8ef0cd',
          300: '#59e9b4',
          400: '#34D399', // Vibrant Mint Green
          500: '#2dbb88',
          600: '#269c71',
          700: '#207f5d',
          800: '#1a664c',
          900: '#15523e',
          950: '#0d3428',
        },
        background: {
          light: '#FAFBFC',
          dark: '#1E2622', // Deep Forest Green
        },
        surface: {
          light: '#FFFFFF',
          dark: '#2A3430', // Charcoal Green
        },
        'text-primary': '#F3F4F6', // Off-White
        'text-secondary': '#9CA3AF', // Light Slate Gray
        'text-muted': '#A1A1AA',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Clash Display"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.01em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'soft': '0 4px 16px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)',
        'elevated': '0 8px 16px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'button': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'nav': '0 -1px 3px rgba(0, 0, 0, 0.05), 0 -1px 2px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.125rem',
        'pill': '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.27, 0.22, 0.21, 1.03)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.27, 0.22, 0.21, 1.03)',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.27, 0.22, 0.21, 1.03)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.27, 0.22, 0.21, 1.03)',
        'pulse-glow': 'pulseGlow 2s infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(12, 187, 140, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(12, 187, 140, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(8px)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)',
      },
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}