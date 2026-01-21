import * as React from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Collapse,
} from '@mui/material';
import {
  Keyboard as KeyboardIcon,
  Translate as TranslateIcon,
} from '@mui/icons-material';
import type { Config } from '../../domain/types';
import { getConfig, updateConfig } from '../lib/api';
import { useAutoSave } from '../hooks/useAutoSave';
import { TriggerKeys } from '../../popup/components/TriggerKeys';

export function TriggersSection() {
  const [config, setConfig] = React.useState<Config | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getConfig();
      setConfig(data);
    } catch (err) {
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const autoSave = useAutoSave(
    config || ({} as Config),
    async (updatedConfig) => {
      await updateConfig(updatedConfig);
      setConfig(updatedConfig);
    },
    {
      onError: (err) => {
        setError('Failed to save configuration');
        setTimeout(() => setError(null), 3000);
      },
    }
  );

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100%"
        gap={2}
      >
        <CircularProgress size={32} />
        <Typography
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
            color: 'text.secondary',
          }}
        >
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!config) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <Alert severity="error">Failed to load configuration</Alert>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Header */}
      <Box
        sx={{
          p: 4,
          pb: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <KeyboardIcon color="primary" sx={{ fontSize: '1.5rem' }} />
          <Box>
            <Typography variant="h5">Trigger Configuration</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure keyboard shortcuts for triggering actions
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Error Alert */}
      <Collapse in={!!error}>
        <Box sx={{ px: 4, pt: 3 }}>
          {error && (
            <Alert
              severity="error"
              sx={{ borderRadius: '12px' }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
        </Box>
      </Collapse>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
        <Box display="flex" flexDirection="column" gap={4} maxWidth={800}>
          {/* Trigger Keys */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <TranslateIcon color="primary" sx={{ fontSize: '1.1rem' }} />
              <Typography variant="h6">Trigger Keys</Typography>
            </Box>

            <Box
              sx={{
                p: 4,
                bgcolor: 'background.paper',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box display="flex" flexDirection="column" gap={3}>
                <TriggerKeys
                  label="Translation Trigger"
                  value={config.triggerTranslate}
                  onChange={(value) => autoSave.updateConfig({ triggerTranslate: value })}
                  helperText="Click keys to set the pattern that triggers translation"
                />
                <TriggerKeys
                  label="Polish Trigger"
                  value={config.triggerPolish}
                  onChange={(value) => autoSave.updateConfig({ triggerPolish: value })}
                  helperText="Click keys to set the pattern that triggers polish"
                />
              </Box>
            </Box>
          </Box>

          {/* Target Language */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <TranslateIcon color="secondary" sx={{ fontSize: '1.1rem' }} />
              <Typography variant="h6">Translation Settings</Typography>
            </Box>

            <Box
              sx={{
                p: 4,
                bgcolor: 'background.paper',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <TextField
                select
                label="Target Language"
                value={config.targetLanguage}
                onChange={(e) => autoSave.updateConfig({ targetLanguage: e.target.value })}
                fullWidth
                size="small"
              >
                {['English', 'Chinese', 'Japanese', 'Korean', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Arabic'].map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    {lang}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          {/* Info Box */}
          <Box
            sx={{
              p: 3,
              bgcolor: 'primary.50',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'primary.200',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              <strong>How it works:</strong> Type the trigger key pattern in any input field and the extension will automatically process your text. The default trigger is triple space (three spaces).
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
