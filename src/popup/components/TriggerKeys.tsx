import * as React from 'react';
import { Box, Typography, TextField } from '@mui/material';

interface TriggerKeysProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}

// Display name for special keys
const KEY_NAMES: Record<string, string> = {
  ' ': 'Space',
  '\t': 'Tab',
  '\n': 'Enter',
  '\r': 'Return',
  '\b': '⌫',
  '\f': 'Form Feed',
  '\v': 'Vertical Tab',
};

// Get display text for a key
function getKeyDisplay(char: string): string {
  return KEY_NAMES[char] || char;
}

// Check if a character is a special key (takes more space)
function isSpecialKey(char: string): boolean {
  return char in KEY_NAMES;
}

// Visual key display component (read-only)
function KeyDisplay({ char }: { char: string }) {
  const isSpecial = isSpecialKey(char);
  const display = getKeyDisplay(char);

  return (
    <Box
      sx={{
        minWidth: isSpecial ? 65 : 36,
        height: 32,
        px: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.04) 100%)',
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: '5px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      <Typography
        sx={{
          fontFamily: isSpecial ? 'Space Grotesk, sans-serif' : 'monospace',
          fontSize: isSpecial ? '0.6rem' : '0.85rem',
          fontWeight: 500,
          color: 'primary.main',
          textAlign: 'center',
          textTransform: isSpecial ? 'uppercase' : 'none',
          letterSpacing: isSpecial ? '0.05em' : '0',
          lineHeight: 1.2,
        }}
      >
        {display}
      </Typography>
    </Box>
  );
}

export function TriggerKeys({ label, value, onChange, helperText }: TriggerKeysProps) {
  const keys = value.split('');

  return (
    <Box>
      <Typography
        sx={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'text.secondary',
          mb: 1,
        }}
      >
        {label}
      </Typography>

      {/* Key display preview */}
      <Box
        sx={{
          minHeight: 40,
          mb: 1,
          p: 1.5,
          bgcolor: 'rgba(99, 102, 241, 0.03)',
          border: '1px solid',
        borderColor: 'rgba(99, 102, 241, 0.2)',
        borderRadius: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.6,
        alignItems: 'center',
        '&:empty': {
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&::before': {
            content: '"No trigger pattern set"',
            color: 'text.disabled',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.75rem',
            fontStyle: 'italic',
          },
        },
      }}
      >
        {keys.length === 0 ? null : keys.map((char, index) => (
          <KeyDisplay key={index} char={char} />
        ))}
      </Box>

      {/* Edit input */}
      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type trigger pattern..."
        fullWidth
        size="small"
        helperText={helperText}
        sx={{
          '& .MuiOutlinedInput-input': {
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
          },
        }}
      />
    </Box>
  );
}
