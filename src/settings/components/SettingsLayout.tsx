import * as React from 'react';
import { Box, BoxProps } from '@mui/material';

export interface SettingsLayoutProps extends BoxProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsLayout({ sidebar, children, sx, ...props }: SettingsLayoutProps) {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        bgcolor: 'background.default',
        overflow: 'hidden',
        ...sx,
      }}
      {...props}
    >
      {/* Sidebar */}
      <Box
        sx={{
          width: 220,
          height: '100%',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Logo/Brand */}
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              <Box
                sx={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: '#ffffff',
                  letterSpacing: '0.05em',
                }}
              >
                TP
              </Box>
            </Box>
            <Box>
              <Box
                sx={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  letterSpacing: '-0.01em',
                }}
              >
                Tingly Polish
              </Box>
              <Box
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                }}
              >
                Settings
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Navigation Items */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            py: 2,
          }}
        >
          {sidebar}
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
