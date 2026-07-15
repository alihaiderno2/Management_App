export const colors = {
  pageBackground: '#0a0a0a',      // True dark background
  surface: '#121212',             // Slightly lighter dark for the card
  surfaceMuted: '#1a1a1a',
  border: '#1f1f1f',              // Clean, subtle stroke for borders
  ink: '#ffffff',                 // Bright white text
  inkMuted: '#a0a0a0',            // Muted gray for subtitles/labels
  onDark: '#ffffff',
  onDarkMuted: '#e0e0e0',
  buttonDark: '#1f1f1f',
  buttonDarkHover: '#2d2d2d',
  accent: '#6366f1',              // Indigo/accent primary
  accentHover: '#4f46e5',
  danger: '#ef4444',
} as const;

export type BrandColor = keyof typeof colors;