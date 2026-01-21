import * as React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Collapse,
  Button,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { Config } from '../../domain/types';
import { getConfig, updateConfig } from '../lib/api';
import { useAutoSave } from '../hooks/useAutoSave';
import { useSettingsContext } from '../contexts/SettingsContext';

const SECTION_ID = 'api';

export function ApiConfigSection() {
  const [config, setConfig] = React.useState<Config | null>(null);
  const [pendingChanges, setPendingChanges] = React.useState<Partial<Config>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { registerSection, unregisterSection } = useSettingsContext();

  // Merge config with pending changes for display
  const displayConfig = React.useMemo(() => {
    if (!config) return null;
    return { ...config, ...pendingChanges };
  }, [config, pendingChanges]);

  const autoSave = useAutoSave(
    config || ({} as Config),
    async (updatedConfig) => {
      await updateConfig(updatedConfig);
      setConfig(updatedConfig);
      setPendingChanges({});
    },
    {
      onError: (err) => {
        setError('Failed to save configuration');
        setTimeout(() => setError(null), 3000);
      },
    }
  );

  const handleFieldChange = React.useCallback(<K extends keyof Config>(
    field: K,
    value: Config[K]
  ) => {
    setPendingChanges(prev => ({ ...prev, [field]: value }));
    autoSave.updateConfig({ [field]: value } as Partial<Config>);
  }, [autoSave]);

  React.useEffect(() => {
    loadConfig();
  }, []);

  // Register this section with the context
  React.useEffect(() => {
    registerSection(SECTION_ID, {
      hasPendingChanges: autoSave.hasPendingChanges,
      save: autoSave.saveNow,
      discardChanges: autoSave.discardChanges,
    });

    return () => {
      unregisterSection(SECTION_ID);
    };
  }, [autoSave, registerSection, unregisterSection]);

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

  if (!config || !displayConfig) {
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
          <CloudIcon color="primary" sx={{ fontSize: '1.5rem' }} />
          <Box>
            <Typography variant="h5">API Configuration</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure your LLM API settings
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={autoSave.saveNow}
          disabled={autoSave.isSaving || !autoSave.hasPendingChanges}
        >
          {autoSave.isSaving ? 'Saving...' : 'Save'}
        </Button>
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
          {/* API Configuration */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <SettingsIcon color="primary" sx={{ fontSize: '1.1rem' }} />
              <Typography variant="h6">LLM Provider Settings</Typography>
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
                <TextField
                  label="API Key"
                  type="password"
                  value={displayConfig.apiKey || ''}
                  onChange={(e) => handleFieldChange('apiKey', e.target.value)}
                  placeholder="Enter your API key"
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Base URL"
                  value={displayConfig.baseUrl || ''}
                  onChange={(e) => handleFieldChange('baseUrl', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Model"
                  value={displayConfig.model || ''}
                  onChange={(e) => handleFieldChange('model', e.target.value)}
                  placeholder="gpt-4o-mini"
                  fullWidth
                  size="small"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={displayConfig.useMock || false}
                      onChange={(e) => handleFieldChange('useMock', e.target.checked)}
                    />
                  }
                  label="Use Mock API (for testing without API key)"
                  sx={{ mx: 0 }}
                />
              </Box>
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
              <strong>Note:</strong> Your API key is stored locally in your browser and never sent to any server other than the configured LLM API endpoint.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
