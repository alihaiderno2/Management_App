// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss';
import { colors } from './lib/colors';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'page-bg': colors.pageBackground,
        surface: colors.surface,
        'surface-muted': colors.surfaceMuted,
        border: colors.border,
        ink: colors.ink,
        'ink-muted': colors.inkMuted,
        'on-dark': colors.onDark,
        'on-dark-muted': colors.onDarkMuted,
        'button-dark': colors.buttonDark,
        'button-dark-hover': colors.buttonDarkHover,
        accent: colors.accent,
        'accent-hover': colors.accentHover,
        danger: colors.danger,
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;