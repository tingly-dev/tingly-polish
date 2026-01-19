import * as React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Collapse,
} from '@mui/material';
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
  AutoFixHigh as AutoFixHighIcon,
  Psychology as PsychologyIcon,
  Translate as TranslateIcon,
} from '@mui/icons-material';
import type { Config } from '../../domain/types';
import {
  getConfig,
  updateConfig,
  resetConfig,
} from '../lib/api';

export function PromptsPage() {
  const [config, setConfig] = React.useState<Config>({
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    systemPrompt: '',
    userPromptTranslate: '',
    userPromptPolish: '',
    triggerTranslate: '   ',
    triggerPolish: '   ',
    useMock: true,
    targetLanguage: 'English',
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
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
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(config);
      showMessage('success', 'Prompts saved successfully');
    } catch {
      showMessage('error', 'Failed to save prompts');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset prompts to defaults?')) return;

    setSaving(true);
    try {
      const defaultConfig = await resetConfig();
      setConfig(defaultConfig);
      showMessage('success', 'Prompts reset to defaults');
    } catch {
      showMessage('error', 'Failed to reset prompts');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof Config>(field: K, value: Config[K]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
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

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Actions - Fixed at top */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Collapse in={!!message}>
          {message && (
            <Alert
              severity={message.type}
              sx={{ mb: 2, borderRadius: '12px' }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}
        </Collapse>
        <Box display="flex" gap={1.5}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            fullWidth
            startIcon={<SaveIcon />}
          >
            {saving ? 'Saving...' : 'Save Prompts'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={saving}
            startIcon={<RestoreIcon />}
          >
            Reset
          </Button>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, pt: 2 }}>
        <Box display="flex" flexDirection="column" gap={3}>
          {/* System Prompt */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <PsychologyIcon color="primary" sx={{ fontSize: '1.1rem' }} />
              <Typography variant="h6">System Prompt</Typography>
            </Box>

            <Box
              sx={{
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <TextField
                label="System Prompt"
                value={config.systemPrompt}
                onChange={(e) => updateField('systemPrompt', e.target.value)}
                multiline
                minRows={6}
                maxRows={12}
                placeholder="Enter the system prompt that defines the AI's behavior and role..."
                fullWidth
                helperText="This sets the AI's personality and overall behavior for all operations"
              />
            </Box>
          </Box>

          {/* Translation Prompt */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TranslateIcon color="secondary" sx={{ fontSize: '1.1rem' }} />
              <Typography variant="h6">Translation Prompt</Typography>
            </Box>

            <Box
              sx={{
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <TextField
                label="Translation Prompt"
                value={config.userPromptTranslate}
                onChange={(e) => updateField('userPromptTranslate', e.target.value)}
                multiline
                minRows={6}
                maxRows={12}
                placeholder="Enter the prompt template for translation..."
                fullWidth
                helperText="Available placeholders: {text}, {targetLanguage}"
              />
            </Box>
          </Box>

          {/* Polish Prompt */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <AutoFixHighIcon color="success" sx={{ fontSize: '1.1rem' }} />
              <Typography variant="h6">Polish Prompt</Typography>
            </Box>

            <Box
              sx={{
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <TextField
                label="Polish Prompt"
                value={config.userPromptPolish}
                onChange={(e) => updateField('userPromptPolish', e.target.value)}
                multiline
                minRows={6}
                maxRows={12}
                placeholder="Enter the prompt template for text polishing..."
                fullWidth
                helperText="Available placeholder: {text}"
              />
            </Box>
          </Box>

          {/* Quick Actions */}
          <Box
            sx={{
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: '16px',
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}
            >
              Quick Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Button
                variant="outlined"
                onClick={async () => {
                  const defaults = await import('../../domain/types').then(m => m.DEFAULT_CONFIG);
                  updateField('systemPrompt', defaults.systemPrompt);
                  showMessage('success', 'System prompt restored to default');
                }}
                startIcon={<RestoreIcon />}
                fullWidth
              >
                Restore Default System Prompt
              </Button>
              <Button
                variant="outlined"
                onClick={async () => {
                  const defaults = await import('../../domain/types').then(m => m.DEFAULT_CONFIG);
                  updateField('userPromptTranslate', defaults.userPromptTranslate);
                  showMessage('success', 'Translation prompt restored to default');
                }}
                startIcon={<RestoreIcon />}
                fullWidth
              >
                Restore Default Translation Prompt
              </Button>
              <Button
                variant="outlined"
                onClick={async () => {
                  const defaults = await import('../../domain/types').then(m => m.DEFAULT_CONFIG);
                  updateField('userPromptPolish', defaults.userPromptPolish);
                  showMessage('success', 'Polish prompt restored to default');
                }}
                startIcon={<RestoreIcon />}
                fullWidth
              >
                Restore Default Polish Prompt
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={async () => {
                  const defaults = await import('../../domain/types').then(m => m.DEFAULT_CONFIG);
                  updateField('systemPrompt', defaults.systemPrompt);
                  updateField('userPromptTranslate', defaults.userPromptTranslate);
                  updateField('userPromptPolish', defaults.userPromptPolish);
                  showMessage('success', 'All prompts restored to defaults');
                }}
                startIcon={<RestoreIcon />}
                fullWidth
              >
                Restore All Default Prompts
              </Button>
            </Box>
          </Box>

          {/* Bottom spacer */}
          <Box sx={{ height: 20 }} />
        </Box>
      </Box>
    </Box>
  );
}
