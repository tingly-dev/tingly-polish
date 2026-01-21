import * as React from 'react';
import { Box, CircularProgress, SxProps, Theme, Typography } from '@mui/material';
import { CheckCircle as CheckIcon, CloudSync as SyncIcon } from '@mui/icons-material';

export interface SaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasPendingChanges: boolean;
  sx?: SxProps<Theme>;
}

export function SaveIndicator({ isSaving, lastSaved, hasPendingChanges, sx }: SaveIndicatorProps) {
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 5) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderRadius: '8px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease',
        ...sx,
      }}
    >
      {isSaving ? (
        <>
          <CircularProgress size={16} thickness={4} />
          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              color: 'text.secondary',
            }}
          >
            Saving...
          </Typography>
        </>
      ) : hasPendingChanges ? (
        <>
          <SyncIcon
            sx={{
              fontSize: '1rem',
              color: 'warning.main',
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              color: 'text.secondary',
            }}
          >
            Unsaved changes
          </Typography>
        </>
      ) : lastSaved ? (
        <>
          <CheckIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              color: 'text.secondary',
            }}
          >
            Saved {formatTimeAgo(lastSaved)}
          </Typography>
        </>
      ) : null}
    </Box>
  );
}
