import React, { useState } from 'react';
import {
  Box,
  ThemeProvider,
  CssBaseline,
  Button,
  Typography,
  Divider,
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
  description,
  onClick,
  color = '#6366f1',
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <Button
      fullWidth
      onClick={onClick}
      sx={{
        p: 2.5,
        mb: 1.5,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%)',
        border: '1px solid',
        borderColor: 'rgba(51, 65, 85, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textTransform: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
          borderColor: color,
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 20px ${color}30`,
        },
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.5,
          color: '#ffffff',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, textAlign: 'left' }}>
        <Typography
          sx={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'text.primary',
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.75rem',
            color: 'text.secondary',
            mt: 0.3,
          }}
        >
          {description}
        </Typography>
      </Box>
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

  const handleTranslate = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      // Check if content script is loaded
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
      } catch {
        // Content script not loaded, inject it
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['dist/content-script.js'],
        });
      }

      // Get selected text from page
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_SELECTED_TEXT',
      });

      if (response?.data?.selectedText) {
        // Process the selected text
        await chrome.tabs.sendMessage(tab.id, {
          type: 'PROCESS_TEXT',
          payload: {
            text: response.data.selectedText,
            action: 'translate',
          },
        });
      } else {
        // Show message that no text is selected
        alert('Please select some text on the page first.');
      }
    } catch (error) {
      console.error('Tingly Polish: Translate failed', error);
      alert('Failed to translate. Please make sure you have selected some text.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePolish = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      // Check if content script is loaded
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
      } catch {
        // Content script not loaded, inject it
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['dist/content-script.js'],
        });
      }

      // Get selected text from page
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_SELECTED_TEXT',
      });

      if (response?.data?.selectedText) {
        // Process the selected text
        await chrome.tabs.sendMessage(tab.id, {
          type: 'PROCESS_TEXT',
          payload: {
            text: response.data.selectedText,
            action: 'polish',
          },
        });
      } else {
        // Show message that no text is selected
        alert('Please select some text on the page first.');
      }
    } catch (error) {
      console.error('Tingly Polish: Polish failed', error);
      alert('Failed to polish. Please make sure you have selected some text.');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenSettings = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/settings/index.html'),
    });
    // Close popup
    window.close();
  };

  if (!mounted) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          width: 360,
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Logo */}
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
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
                  fontSize: '0.85rem',
                  color: '#ffffff',
                  letterSpacing: '0.05em',
                }}
              >
                TP
              </Box>
            </Box>

            {/* Title */}
            <Box sx={{ flex: 1 }}>
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
            </Box>

            {/* Status chip */}
            <Chip
              label="Active"
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 500,
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            />
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              color: 'text.secondary',
              mb: 2,
              px: 0.5,
            }}
          >
            Select an action:
          </Typography>

          <ActionButton
            icon={<TranslateIcon sx={{ fontSize: '1.25rem' }} />}
            label="Translate"
            description="Translate selected text"
            onClick={handleTranslate}
            color="#6366f1"
          />

          <ActionButton
            icon={<PolishIcon sx={{ fontSize: '1.25rem' }} />}
            label="Polish"
            description="Improve writing quality"
            onClick={handlePolish}
            color="#14b8a6"
          />

          <Divider sx={{ my: 2, borderColor: 'rgba(51, 65, 85, 0.5)' }} />

          <ActionButton
            icon={<SettingsIcon sx={{ fontSize: '1.25rem' }} />}
            label="Settings"
            description="Configure extension"
            onClick={handleOpenSettings}
            color="#94a3b8"
          />
        </Box>

        {/* Footer */}
        <Box
          sx={{
            mt: 'auto',
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(15, 23, 42, 0.3)',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.7rem',
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            Or select text on page to see floating button
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
