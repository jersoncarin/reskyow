import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

export default {
  darkMode: ['class'],
  content: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        'pulse-border': 'pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-border': {
          '0%, 100%': { border: '4px solid rgba(220, 38, 38, 0.5)' },
          '50%': { border: '4px solid rgba(220, 38, 38, 1)' },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    plugin(function ({ addUtilities }) {
      const fallbackHeightUtilities = {
        '@supports not (height: 100dvh)': {
          '.h-dvh': { height: '100vh' },
          '.min-h-dvh': { 'min-height': '100vh' },
          '.max-h-dvh': { 'max-height': '100vh' },
        },
        '@supports not (height: 100lvh)': {
          '.h-lvh': { height: '100vh' },
          '.min-h-lvh': { 'min-height': '100vh' },
          '.max-h-lvh': { 'max-height': '100vh' },
        },
        '@supports not (height: 100svh)': {
          '.h-svh': { height: '100vh' },
          '.min-h-svh': { 'min-height': '100vh' },
          '.max-h-svh': { 'max-height': '100vh' },
        },
      }

      addUtilities(fallbackHeightUtilities, { respectImportant: true })
    }),
  ],
} satisfies Config
