import { createTheme, alpha } from '@mui/material/styles';

const ACCENT = '#0FD4A4';
const BG = '#0B0D13';
const PAPER = '#13151F';
const BORDER = 'rgba(255,255,255,0.07)';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: BG,
      paper: PAPER,
    },
    primary: {
      main: ACCENT,
      light: alpha(ACCENT, 0.8),
      dark: '#0AB38A',
      contrastText: '#0B0D13',
    },
    secondary: {
      main: '#5B8EF0',
    },
    error: { main: '#FF4E6E' },
    warning: { main: '#FFB020' },
    success: { main: ACCENT },
    text: {
      primary: '#E2E6F0',
      secondary: '#525C78',
      disabled: '#2E3448',
    },
    divider: BORDER,
  },
  typography: {
    fontFamily: '"DM Sans", -apple-system, sans-serif',
    h1: { fontFamily: '"Sora", sans-serif', fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontFamily: '"Sora", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontFamily: '"Sora", sans-serif', fontWeight: 600, letterSpacing: '-0.02em' },
    h4: { fontFamily: '"Sora", sans-serif', fontWeight: 600, letterSpacing: '-0.015em' },
    h5: { fontFamily: '"Sora", sans-serif', fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontFamily: '"Sora", sans-serif', fontWeight: 600, letterSpacing: '-0.01em' },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.6 },
    caption: { fontFamily: '"DM Mono", monospace', letterSpacing: '0.02em' },
    overline: {
      fontFamily: '"DM Mono", monospace',
      letterSpacing: '0.1em',
      fontSize: '0.68rem',
    },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box' },
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#1E2230 transparent',
          '&::-webkit-scrollbar': { width: '5px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: '#1E2230',
            borderRadius: '10px',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          borderRadius: '8px',
        },
        contained: {
          background: ACCENT,
          color: '#0B0D13',
          '&:hover': { background: '#0AB38A' },
        },
        outlined: {
          borderColor: BORDER,
          color: '#E2E6F0',
          '&:hover': {
            borderColor: alpha(ACCENT, 0.4),
            background: alpha(ACCENT, 0.05),
          },
        },
        text: {
          '&:hover': { background: 'rgba(255,255,255,0.04)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${BORDER}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: BORDER,
          fontFamily: '"DM Sans", sans-serif',
          padding: '10px 14px',
        },
        head: {
          fontFamily: '"DM Mono", monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          color: '#525C78',
          textTransform: 'uppercase',
          fontWeight: 500,
          background: '#0F1119',
          padding: '10px 14px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background 0.1s ease',
          '&:hover': { background: 'rgba(255,255,255,0.02)' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontFamily: '"DM Sans", sans-serif',
          letterSpacing: '-0.01em',
          minWidth: 'auto',
          paddingLeft: 0,
          paddingRight: 0,
          marginRight: '28px',
          color: '#525C78',
          '&.Mui-selected': { fontWeight: 600, color: '#E2E6F0' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { background: ACCENT, height: '2px', borderRadius: '2px' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.05)',
          height: 6,
        },
        bar: { borderRadius: '4px' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"DM Mono", monospace',
          fontSize: '0.68rem',
          height: '22px',
          borderRadius: '5px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: '10px' },
      },
    },
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
    },
  },
});
