import * as React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Collapse,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Translate as TranslateIcon,
  AutoFixHigh as AutoFixHighIcon,
  Restore as RestoreIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { Config } from '../../domain/types';
import { getConfig, updateConfig } from '../lib/api';
import { useAutoSave } from '../hooks/useAutoSave';
import { useSettingsContext } from '../contexts/SettingsContext';
import { DEFAULT_CONFIG } from '../../domain/types';

const SECTION_ID = 'prompts';

export function PromptsSection() {
  const [config, setConfig] = React.useState<Config | null>(null);
  const [pendingChanges, setPendingChanges] = React.useState<Partial<Config>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ type: 'success'; text: string } | null>(null);
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
      onError: () => {
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

  const restorePrompt = async (field: keyof Config, fieldName: string) => {
    if (!config) return;
    const defaultValue = DEFAULT_CONFIG[field];
    if (typeof defaultValue === 'string') {
      handleFieldChange(field, defaultValue as Config[keyof Config]);
      showMessage(`${fieldName} restored to default`);
    }
  };

  const restoreAll = async () => {
    if (!config) return;
    handleFieldChange('systemPrompt', DEFAULT_CONFIG.systemPrompt);
    handleFieldChange('userPromptTranslate', DEFAULT_CONFIG.userPromptTranslate);
    handleFieldChange('userPromptPolish', DEFAULT_CONFIG.userPromptPolish);
    showMessage('All prompts restored to defaults');
  };

  const showMessage = (text: string) => {
    setMessage({ type: 'success', text });
    setTimeout(() => setMessage(null), 3000);
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
          <PsychologyIcon color="primary" sx={{ fontSize: '1.5rem' }} />
          <Box>
            <Typography variant="h5">Prompt Templates</Typography>
            <Typography variant="body2" color="text.secondary">
              Customize AI behavior and prompt templates
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button
            variant="outlined"
            onClick={restoreAll}
            startIcon={<RestoreIcon />}
          >
            Restore All
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={autoSave.saveNow}
            disabled={autoSave.isSaving || !autoSave.hasPendingChanges}
          >
            {autoSave.isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>

      {/* Success Alert */}
      <Collapse in={!!message}>
        <Box sx={{ px: 4, pt: 3 }}>
          {message && (
            <Alert
              severity="success"
              sx={{ borderRadius: '12px' }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}
        </Box>
      </Collapse>

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
        <Box display="flex" flexDirection="column" gap={4} maxWidth={900}>
          {/* System Prompt */}
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <PsychologyIcon color="primary" sx={{ fontSize: '1.1rem' }} />
                <Typography variant="h6">System Prompt</Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => restorePrompt('systemPrompt', 'System prompt')}
                startIcon={<RestoreIcon />}
              >
                Restore Default
              </Button>
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
                label="System Prompt"
                value={displayConfig.systemPrompt || ''}
                onChange={(e) => handleFieldChange('systemPrompt', e.target.value)}
                multiline
                minRows={6}
                maxRows={15}
                placeholder="Enter the system prompt that defines the AI's behavior and role..."
                fullWidth
                helperText="This sets the AI's personality and overall behavior for all operations"
              />
            </Box>
          </Box>

          {/* Translation Prompt */}
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <TranslateIcon color="secondary" sx={{ fontSize: '1.1rem' }} />
                <Typography variant="h6">Translation Prompt</Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => restorePrompt('userPromptTranslate', 'Translation prompt')}
                startIcon={<RestoreIcon />}
              >
                Restore Default
              </Button>
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
                label="Translation Prompt"
                value={displayConfig.userPromptTranslate || ''}
                onChange={(e) => handleFieldChange('userPromptTranslate', e.target.value)}
                multiline
                minRows={6}
                maxRows={15}
                placeholder="Enter the prompt template for translation..."
                fullWidth
                helperText="Available placeholders: {text}, {targetLanguage}"
              />
            </Box>
          </Box>

          {/* Polish Prompt */}
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <AutoFixHighIcon color="success" sx={{ fontSize: '1.1rem' }} />
                <Typography variant="h6">Polish Prompt</Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => restorePrompt('userPromptPolish', 'Polish prompt')}
                startIcon={<RestoreIcon />}
              >
                Restore Default
              </Button>
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
                label="Polish Prompt"
                value={displayConfig.userPromptPolish || ''}
                onChange={(e) => handleFieldChange('userPromptPolish', e.target.value)}
                multiline
                minRows={6}
                maxRows={15}
                placeholder="Enter the prompt template for text polishing..."
                fullWidth
                helperText="Available placeholder: {text}"
              />
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
              <strong>Tip:</strong> Use placeholders like <code>{'{text}'}</code> and <code>{'{targetLanguage}'}</code> in your prompts. These will be automatically replaced with the actual content when processing.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
