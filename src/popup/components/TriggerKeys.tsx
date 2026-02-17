import * as React from 'react';
import { Box, Typography, TextField, InputAdornment } from '@mui/material';
import { Keyboard as KeyboardIcon } from '@mui/icons-material';

interface TriggerKeysProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}

// Display name for special keys
const KEY_NAMES: Record<string, string> = {
  ' ': '␣',
  '\t': '⇥',
  '\n': '↵',
  '\r': '↩',
  '\b': '⌫',
};

// Get display text for a key
function getKeyDisplay(char: string): string {
  return KEY_NAMES[char] || char;
}

// Visual key display component
function KeyChip({ char }: { char: string }) {
  return (
    <Box
      sx={{
        minWidth: 24,
        height: 22,
        px: 0.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: '4px',
      }}
    >
      <Typography
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'primary.main',
          lineHeight: 1,
        }}
      >
        {getKeyDisplay(char)}
      </Typography>
    </Box>
  );
}

export function TriggerKeys({ label, value, onChange, helperText }: TriggerKeysProps) {
  const keys = value.split('');

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <KeyboardIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
        <Typography
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'text.primary',
          }}
        >
          {label}
        </Typography>
        {keys.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
            {keys.map((char, index) => (
              <KeyChip key={index} char={char} />
            ))}
          </Box>
        )}
      </Box>

      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type trigger pattern..."
        fullWidth
        size="small"
        helperText={helperText}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
                Pattern
              </Typography>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-input': {
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            letterSpacing: '0.15em',
          },
        }}
      />
    </Box>
  );
}
