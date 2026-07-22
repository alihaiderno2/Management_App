import { createTheme } from '@mui/material/styles';
import { colors } from './colors';

export const theme = createTheme({
  palette: {
    background: { default: colors.pageBackground, paper: colors.surface },
    primary: { main: colors.accent },
    error: { main: colors.danger },
    text: { primary: colors.ink, secondary: colors.inkMuted },
  },
  typography: {
    fontFamily: 'var(--font-sans)',
  },
  shape: { borderRadius: 10 },
});