import React, { useState } from 'react';
import {
  Box,
  ThemeProvider,
  CssBaseline,
  Button,
  Typography,
  Chip,
} from '@mui/material';
import { theme, injectFonts } from './theme';
import {
  Translate as TranslateIcon,
  AutoFixHigh as PolishIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

function ActionButton({
  icon,
  label,
  onClick,
  color = '#6366f1',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <Button
      fullWidth
      onClick={onClick}
      sx={{
        py: 1.25,
        px: 2,
        borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid',
        borderColor: 'rgba(51, 65, 85, 0.6)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1.5,
        textTransform: 'none',
        transition: 'all 0.15s ease',
        '&:hover': {
          background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
          borderColor: color,
        },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
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
    </Button>
  );
}

export function App() {
  const [mounted, setMounted] = useState(false);
  const [processing, setProcessing] = useState(false);

  React.useEffect(() => {
    const cleanup = injectFonts();
    setMounted(true);
    return cleanup;
  }, []);

  const handleAction = async (action: 'translate' | 'polish') => {
    if (processing) return;
    setProcessing(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
      } catch {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['dist/content-script.js'],
        });
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_SELECTED_TEXT',
      });

      if (response?.data?.selectedText) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'PROCESS_TEXT',
          payload: {
            text: response.data.selectedText,
            action,
          },
        });
      } else {
        alert('Please select some text on the page first.');
      }
    } catch (error) {
      console.error(`Tingly Polish: ${action} failed`, error);
      alert(`Failed to ${action}. Please make sure you have selected some text.`);
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenSettings = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/settings/index.html'),
    });
    window.close();
  };

  if (!mounted) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          width: 280,
          bgcolor: 'background.default',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: '0.7rem',
                color: '#fff',
              }}
            >
              TP
            </Typography>
          </Box>
          <Typography
            sx={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'text.primary',
              flex: 1,
            }}
          >
            Tingly Polish
          </Typography>
          <Chip
            label="Active"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 500,
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#22c55e',
              border: 'none',
            }}
          />
        </Box>

        {/* Actions */}
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <ActionButton
            icon={<TranslateIcon sx={{ fontSize: '1rem' }} />}
            label="Translate"
            onClick={() => handleAction('translate')}
            color="#6366f1"
          />

          <ActionButton
            icon={<PolishIcon sx={{ fontSize: '1rem' }} />}
            label="Polish"
            onClick={() => handleAction('polish')}
            color="#14b8a6"
          />

          <ActionButton
            icon={<SettingsIcon sx={{ fontSize: '1rem' }} />}
            label="Settings"
            onClick={handleOpenSettings}
            color="#94a3b8"
          />
        </Box>

        {/* Footer hint */}
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(15, 23, 42, 0.3)',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.65rem',
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            Select text on page for quick actions
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
