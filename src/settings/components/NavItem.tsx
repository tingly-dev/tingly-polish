import * as React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

export interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  sx?: SxProps<Theme>;
}

export function NavItem({ icon, label, active, onClick, sx }: NavItemProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 3,
        py: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderLeft: '3px solid',
        borderColor: active ? 'primary.main' : 'transparent',
        bgcolor: active ? 'primary.main' : 'transparent',
        color: active ? 'primary.contrastText' : 'text.primary',
        '&:hover': {
          bgcolor: active ? 'primary.dark' : 'action.hover',
        },
        ...sx,
      }}
    >
      {icon}
      <Box
        sx={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '0.875rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </Box>
    </Box>
  );
}
