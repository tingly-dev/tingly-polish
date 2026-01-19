// Cyber-terminal theme (preserved for future use)
// To use: Import and createTheme from this file instead of default theme

import { Theme } from '@mui/material/styles';

export const cyberFontUrl = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@500;700;900&display=swap';

export const cyberTheme: Theme = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#00f5ff',
      light: '#4df8ff',
      dark: '#00b8cc',
      contrastText: '#0a0a0f',
    },
    secondary: {
      main: '#ff0080',
      light: '#ff4da6',
      dark: '#cc0066',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ff2a6d',
      light: '#ff5a8f',
      dark: '#cc1e4f',
      contrastText: '#ffffff',
    },
    success: {
      main: '#05ffa1',
      light: '#5affbb',
      dark: '#04cc80',
      contrastText: '#0a0a0f',
    },
    info: {
      main: '#00f5ff',
      light: '#4df8ff',
      dark: '#00b8cc',
      contrastText: '#0a0a0f',
    },
    warning: {
      main: '#ffb800',
      light: '#ffce4d',
      dark: '#cc9200',
      contrastText: '#0a0a0f',
    },
    background: {
      default: '#0a0a0f',
      paper: '#0d0d15',
    },
    text: {
      primary: '#e0e0f0',
      secondary: '#7070a0',
      disabled: '#404060',
    },
    divider: '#1a1a2e',
  },
  typography: {
    fontFamily: '"JetBrains Mono", monospace',
    h1: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 700,
      letterSpacing: '0.05em',
    },
    h2: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 700,
      letterSpacing: '0.05em',
    },
    h3: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 600,
      letterSpacing: '0.04em',
    },
    h4: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 700,
      letterSpacing: '0.05em',
    },
    h5: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.03em',
    },
    h6: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 500,
    },
    subtitle1: {
      fontFamily: '"JetBrains Mono", monospace',
    },
    subtitle2: {
      fontFamily: '"JetBrains Mono", monospace',
    },
    body1: {
      fontFamily: '"JetBrains Mono", monospace',
    },
    body2: {
      fontFamily: '"JetBrains Mono", monospace',
    },
    button: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
    caption: {
      fontFamily: '"JetBrains Mono", monospace',
    },
    overline: {
      fontFamily: '"Orbitron", sans-serif',
      letterSpacing: '0.1em',
    },
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
  shape: {
    borderRadius: 2,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a0f',
          backgroundImage: `
            linear-gradient(rgba(0, 245, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 245, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        },
        '@keyframes pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
};
