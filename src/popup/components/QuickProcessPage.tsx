import * as React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Translate as TranslateIcon,
  AutoFixHigh as PolishIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import type { Config } from '../../domain/types';
import { getConfig, processDirectText } from '../lib/api';
import { copyToClipboard } from '../lib/api';

export function QuickProcessPage() {
  const [input, setInput] = React.useState('');
  const [result, setResult] = React.useState('');
  const [processing, setProcessing] = React.useState(false);
  const [currentOp, setCurrentOp] = React.useState<string | null>(null);
  const [config, setConfig] = React.useState<Config | null>(null);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getConfig();
      setConfig(data);
    } catch {
      showMessage('error', 'Failed to load configuration');
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

    try {
      const response = await processDirectText(input, type);
      setResult(response.result);
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

  const getOperationLabel = (type: 'translate-t1' | 'translate-t2' | 'polish') => {
    if (type === 'translate-t1') return `T1: ${config?.targetLanguageT1 || 'English'}`;
    if (type === 'translate-t2') return `T2: ${config?.targetLanguageT2 || 'Chinese'}`;
    return 'Polish';
  };

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Header */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6">Quick Process</Typography>
        <Typography variant="body2" color="text.secondary">
          Enter text below to translate or polish directly
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Box display="flex" flexDirection="column" gap={3}>
          {/* Message Alert */}
          {message && (
            <Alert
              severity={message.type}
              sx={{ borderRadius: '12px' }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}

          {/* Input Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Input Text
            </Typography>
            <TextField
              multiline
              minRows={4}
              maxRows={10}
              placeholder="Enter text to process..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={processing}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="caption" color="text.secondary">
                {input.length} / 5000 characters
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Actions
            </Typography>
            <Box display="flex" gap={1.5} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={processing && currentOp === 'translate-t1' ? <CircularProgress size={16} /> : <TranslateIcon />}
                onClick={() => handleProcess('translate-t1')}
                disabled={processing || !input.trim()}
                sx={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  minWidth: 120,
                }}
              >
                {processing && currentOp === 'translate-t1' ? 'Processing...' : `T1: ${config?.targetLanguageT1 || 'English'}`}
              </Button>
              <Button
                variant="contained"
                startIcon={processing && currentOp === 'translate-t2' ? <CircularProgress size={16} /> : <TranslateIcon />}
                onClick={() => handleProcess('translate-t2')}
                disabled={processing || !input.trim()}
                sx={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  minWidth: 120,
                }}
              >
                {processing && currentOp === 'translate-t2' ? 'Processing...' : `T2: ${config?.targetLanguageT2 || 'Chinese'}`}
              </Button>
              <Button
                variant="contained"
                startIcon={processing && currentOp === 'polish' ? <CircularProgress size={16} /> : <PolishIcon />}
                onClick={() => handleProcess('polish')}
                disabled={processing || !input.trim()}
                sx={{
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                  minWidth: 120,
                }}
              >
                {processing && currentOp === 'polish' ? 'Processing...' : 'Polish'}
              </Button>
            </Box>
          </Box>

          {/* Result Section */}
          {result && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Result
              </Typography>
              <Card
                sx={{
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <CardContent sx={{ position: 'relative' }}>
                  <Typography
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      pr: 4,
                    }}
                  >
                    {result}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={handleCopy}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                    }}
                  >
                    Copy
                  </Button>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Bottom spacer */}
          <Box sx={{ height: 20 }} />
        </Box>
      </Box>
    </Box>
  );
}
