/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#07090f',
          900: '#0a0e17',
          850: '#0b0f1a',
          800: '#0d1117',
          750: '#111827',
          700: '#141b2d',
          600: '#1a2540',
          500: '#1e2d4a',
          400: '#1e293b',
        },
        accent: {
          DEFAULT: '#3b82f6',
          light: '#38bdf8',
          dark: '#2563eb',
        },
        success: '#22c55e',
        danger: '#ef4444',
        warn: '#f59e0b',
        purple: '#a855f7',
        pink: '#ec4899',
        muted: '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'flow-line': 'flowLine 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        flowLine: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px 4px rgba(56,189,248,0.3)' },
          '50%': { boxShadow: '0 0 40px 12px rgba(56,189,248,0.6)' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(56,189,248,0.35)',
        'glow-cyan-lg': '0 0 40px rgba(56,189,248,0.55)',
        'glow-green': '0 0 16px rgba(34,197,94,0.4)',
        'glow-red': '0 0 16px rgba(239,68,68,0.4)',
        'card': '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.6), 0 0 0 1px rgba(56,189,248,0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
