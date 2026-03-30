import { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { createTheme as muiCreateTheme } from '@mui/material/styles';

// Custom fonts via Google Fonts - Clean modern pairing
export const fontUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap';

// Inject Google Fonts on mount
export const injectFonts = () => {
  const link = document.createElement('link');
  link.href = fontUrl;
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  return () => {
    if (document.head.contains(link)) {
      document.head.removeChild(link);
    }
  };
};

// Clean modern light theme with blue accents
export const theme = muiCreateTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0ea5e9',
      light: '#38bdf8',
      dark: '#0284c7',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    success: {
      main: '#22c55e',
      light: '#4ade80',
      dark: '#16a34a',
      contrastText: '#ffffff',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      disabled: '#94a3b8',
    },
    divider: 'rgba(148, 163, 184, 0.2)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 14,
    h1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    h6: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem',
      fontWeight: 500,
    },
    subtitle2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem',
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem',
    },
    button: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      fontSize: '0.875rem',
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    caption: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.75rem',
    },
    overline: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '0 0 0 1px rgba(59, 130, 246, 0.1), 0 25px 30px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(59, 130, 246, 0.1), 0 35px 40px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(59, 130, 246, 0.1), 0 45px 50px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(59, 130, 246, 0.1), 0 55px 60px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(14, 165, 233, 0.1), 0 65px 70px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(14, 165, 233, 0.1), 0 75px 80px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(14, 165, 233, 0.1), 0 85px 90px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(14, 165, 233, 0.1), 0 95px 100px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(34, 197, 94, 0.1), 0 105px 110px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(34, 197, 94, 0.1), 0 115px 120px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(34, 197, 94, 0.1), 0 125px 130px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(34, 197, 94, 0.1), 0 135px 140px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(239, 68, 68, 0.1), 0 145px 150px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(239, 68, 68, 0.1), 0 155px 160px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(239, 68, 68, 0.1), 0 165px 170px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(239, 68, 68, 0.1), 0 175px 180px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(245, 158, 11, 0.1), 0 185px 190px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(245, 158, 11, 0.1), 0 195px 200px -5px rgba(0, 0, 0, 0.12)',
    '0 0 0 1px rgba(59, 130, 246, 0.1), 0 205px 210px -5px rgba(0, 0, 0, 0.12)',
  ],
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8fafc',
          backgroundImage: 'none',
        },
        '@keyframes fadeIn': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes slideIn': {
          '0%': { opacity: 0, transform: 'translateX(-8px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        '@keyframes fadeInUp': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes scaleIn': {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: 'rgba(148, 163, 184, 0.3)',
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(59, 130, 246, 0.5)',
              borderWidth: '1px',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3b82f6',
              borderWidth: '2px',
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
            },
          },
          '& .MuiInputLabel-root': {
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#64748b',
            '&.Mui-focused': {
              color: '#3b82f6',
            },
          },
          '& .MuiOutlinedInput-input': {
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.9375rem',
          },
          '& .MuiFormHelperText-root': {
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.75rem',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#ffffff',
          boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          color: '#ffffff',
          boxShadow: '0 1px 3px rgba(14, 165, 233, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: 'rgba(148, 163, 184, 0.4)',
          color: '#1e293b',
          '&:hover': {
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.06)',
          },
        },
        text: {
          color: '#3b82f6',
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.06)',
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#3b82f6',
        },
        circle: {
          strokeLinecap: 'round',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", sans-serif',
          fontSize: '0.9375rem',
          borderRadius: '8px',
          margin: '2px 4px',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(148, 163, 184, 0.3)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(59, 130, 246, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
            borderWidth: '2px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

// Custom CSS variables for consistency
export const cssVars = {
  // Colors
  colorPrimary: '#3b82f6',
  colorSecondary: '#0ea5e9',
  colorSuccess: '#22c55e',
  colorError: '#ef4444',
  colorWarning: '#f59e0b',
  colorBgDefault: '#f8fafc',
  colorBgPaper: '#ffffff',
  colorBgElevated: '#f1f5f9',
  colorBorder: 'rgba(148, 163, 184, 0.2)',

  // Text colors
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textMuted: '#cbd5e1',

  // Typography
  fontMono: '"JetBrains Mono", monospace',
  fontSans: '"Inter", sans-serif',
  fontDisplay: '"Space Grotesk", sans-serif',

  // Spacing
  borderRadius: '12px',
  borderRadiusSm: '8px',
  borderRadiusLg: '16px',
  headerHeight: '64px',
  tabHeight: '48px',
  footerHeight: '36px',

  // Shadows
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.06)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
  shadowGlow: '0 0 20px rgba(59, 130, 246, 0.15)',

  // Animations
  transitionFast: '0.15s ease',
  transitionNormal: '0.2s ease',
  transitionSlow: '0.3s ease',
} as const;

// Type-safe CSS variable accessor
export const v = (key: keyof typeof cssVars) => cssVars[key];
