import React, { useState } from 'react';
import {
  Box,
  ThemeProvider,
  CssBaseline,
  TextField,
  Button,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
} from '@mui/material';
import { theme, injectFonts } from './theme';
import {
  Translate as TranslateIcon,
  AutoFixHigh as PolishIcon,
  Settings as SettingsIcon,
  ContentCopy as CopyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { getConfig, processDirectText, copyToClipboard } from './lib/api';

function ActionButton({
  icon,
  label,
  onClick,
  color = '#6366f1',
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      fullWidth
      onClick={onClick}
      disabled={disabled}
      sx={{
        py: 1,
        px: 2,
        borderRadius: 2,
        background: disabled
          ? 'rgba(30, 41, 59, 0.3)'
          : 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid',
        borderColor: disabled ? 'rgba(51, 65, 85, 0.3)' : 'rgba(51, 65, 85, 0.6)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1,
        textTransform: 'none',
        transition: 'all 0.15s ease',
        '&:hover': disabled
          ? {}
          : {
              background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
              borderColor: color,
            },
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.5,
          background: disabled
            ? 'rgba(100, 116, 139, 0.3)'
            : `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
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
          fontSize: '0.8rem',
          fontWeight: 500,
          color: disabled ? 'text.disabled' : 'text.primary',
        }}
      >
        {label}
      </Typography>
    </Button>
  );
}

export function App() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentOp, setCurrentOp] = useState<string | null>(null);
  const [config, setConfig] = useState<{ targetLanguageT1: string; targetLanguageT2: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResult, setShowResult] = useState(false);

  React.useEffect(() => {
    const cleanup = injectFonts();
    setMounted(true);
    loadConfig();
    return cleanup;
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getConfig();
      setConfig({
        targetLanguageT1: data.targetLanguageT1,
        targetLanguageT2: data.targetLanguageT2,
      });
    } catch {
      // Use defaults
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleProcess = async (type: 'translate-t1' | 'translate-t2' | 'polish') => {
    if (!input.trim() || processing) return;

    setProcessing(true);
    setCurrentOp(type);
    setResult('');
    setShowResult(false);

    try {
      const response = await processDirectText(input, type);
      setResult(response.result);
      setShowResult(true);
      showMessage('success', 'Processing completed');
    } catch (error) {
      console.error('Processing failed:', error);
      showMessage('error', error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setProcessing(false);
      setCurrentOp(null);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const success = await copyToClipboard(result);
    if (success) {
      showMessage('success', 'Copied to clipboard');
    } else {
      showMessage('error', 'Failed to copy');
    }
  };

  const handleOpenSettings = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/settings/index.html'),
    });
    window.close();
  };

  if (!mounted) return null;

  const hasInput = input.trim().length > 0;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          width: 340,
          maxHeight: 500,
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
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
              width: 26,
              height: 26,
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
                fontSize: '0.65rem',
                color: '#fff',
              }}
            >
              TP
            </Typography>
          </Box>
          <Typography
            sx={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '0.85rem',
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
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 500,
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#22c55e',
              border: 'none',
            }}
          />
        </Box>

        {/* Message Alert */}
        <Collapse in={!!message}>
          <Box sx={{ px: 2, pt: 1.5 }}>
            {message && (
              <Alert
                severity={message.type}
                sx={{
                  borderRadius: '8px',
                  py: 0,
                  '& .MuiAlert-message': { py: 0, px: 0 },
                }}
                onClose={() => setMessage(null)}
              >
                {message.text}
              </Alert>
            )}
          </Box>
        </Collapse>

        {/* Main Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Input Field */}
            <Box>
              <TextField
                multiline
                minRows={3}
                maxRows={6}
                placeholder="Enter text to translate or polish..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={processing}
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                  },
                }}
              />
              <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.65rem' }}
                >
                  {input.length} / 5000
                </Typography>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box display="flex" flexDirection="column" gap={0.75}>
              <ActionButton
                icon={processing && currentOp === 'translate-t1' ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <TranslateIcon sx={{ fontSize: '0.9rem' }} />}
                label={`T1: ${config?.targetLanguageT1 || 'English'}`}
                onClick={() => handleProcess('translate-t1')}
                color="#6366f1"
                disabled={processing || !hasInput}
              />
              <ActionButton
                icon={processing && currentOp === 'translate-t2' ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <TranslateIcon sx={{ fontSize: '0.9rem' }} />}
                label={`T2: ${config?.targetLanguageT2 || 'Chinese'}`}
                onClick={() => handleProcess('translate-t2')}
                color="#8b5cf6"
                disabled={processing || !hasInput}
              />
              <ActionButton
                icon={processing && currentOp === 'polish' ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <PolishIcon sx={{ fontSize: '0.9rem' }} />}
                label="Polish"
                onClick={() => handleProcess('polish')}
                color="#14b8a6"
                disabled={processing || !hasInput}
              />
            </Box>

            {/* Result Area */}
            {showResult && result && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  position: 'relative',
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setShowResult(false)}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    color: 'text.secondary',
                  }}
                >
                  <CloseIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 1, fontSize: '0.65rem' }}
                >
                  Result:
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    pr: 3,
                  }}
                >
                  {result}
                </Typography>
                <Button
                  size="small"
                  startIcon={<CopyIcon sx={{ fontSize: '0.9rem' }} />}
                  onClick={handleCopy}
                  sx={{
                    mt: 1.5,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                  }}
                >
                  Copy
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(15, 23, 42, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.6rem',
              color: 'text.secondary',
            }}
          >
            Or select text on page for quick actions
          </Typography>
          <IconButton
            size="small"
            onClick={handleOpenSettings}
            sx={{ color: 'text.secondary' }}
          >
            <SettingsIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
