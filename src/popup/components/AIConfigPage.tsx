import * as React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Collapse,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
  Translate as TranslateIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material';
import type { Config } from '../../domain/types';
import {
  getConfig,
  updateConfig,
  resetConfig,
} from '../lib/api';
import { TriggerKeys } from './TriggerKeys';

export function AIConfigPage() {
  const [config, setConfig] = React.useState<Config>({
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    systemPrompt: '',
    userPromptTranslate: '',
    userPromptPolish: '',
    triggerTranslateT1: '   ',
    triggerTranslateT2: '   ',
    triggerPolish: '   ',
    targetLanguageT1: 'English',
    targetLanguageT2: 'Chinese',
    useMock: true,
    siteMappings: [],
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
      showMessage('success', 'Configuration saved successfully');
    } catch {
      showMessage('error', 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset to default configuration?')) return;

    setSaving(true);
    try {
      const defaultConfig = await resetConfig();
      setConfig(defaultConfig);
      showMessage('success', 'Configuration reset to defaults');
    } catch {
      showMessage('error', 'Failed to reset configuration');
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
            {saving ? 'Saving...' : 'Save Configuration'}
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
          {/* API Configuration */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <CloudIcon color="primary" sx={{ fontSize: '1.1rem' }} />
              <Typography variant="h6">API Configuration</Typography>
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
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="API Key"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => updateField('apiKey', e.target.value)}
                  placeholder="Enter your API key"
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Base URL"
                  value={config.baseUrl}
                  onChange={(e) => updateField('baseUrl', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Model"
                  value={config.model}
                  onChange={(e) => updateField('model', e.target.value)}
                  placeholder="gpt-4o-mini"
                  fullWidth
                  size="small"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.useMock}
                      onChange={(e) => updateField('useMock', e.target.checked)}
                    />
                  }
                  label="Use Mock API (for testing)"
                  sx={{ mx: 0 }}
                />
              </Box>
            </Box>
          </Box>

          {/* Trigger Configuration */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TranslateIcon color="primary" sx={{ fontSize: '1.1rem' }} />
              <Typography variant="h6">Trigger Configuration</Typography>
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
              <Box display="flex" flexDirection="column" gap={2.5}>
                {/* Translation T1 */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.main' }}>
                    Translation T1 (Primary)
                  </Typography>
                  <TriggerKeys
                    label="Translation T1 Trigger"
                    value={config.triggerTranslateT1}
                    onChange={(value) => updateField('triggerTranslateT1', value)}
                    helperText="Click keys to set the pattern that triggers T1 translation"
                  />
                  <TextField
                    select
                    label="T1 Target Language"
                    value={config.targetLanguageT1}
                    onChange={(e) => updateField('targetLanguageT1', e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ mt: 2 }}
                  >
                    {['English', 'Chinese', 'Japanese', 'Korean', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Arabic'].map((lang) => (
                      <MenuItem key={lang} value={lang}>
                        {lang}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 1 }} />

                {/* Translation T2 */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'secondary.main' }}>
                    Translation T2 (Secondary)
                  </Typography>
                  <TriggerKeys
                    label="Translation T2 Trigger"
                    value={config.triggerTranslateT2}
                    onChange={(value) => updateField('triggerTranslateT2', value)}
                    helperText="Click keys to set the pattern that triggers T2 translation"
                  />
                  <TextField
                    select
                    label="T2 Target Language"
                    value={config.targetLanguageT2}
                    onChange={(e) => updateField('targetLanguageT2', e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ mt: 2 }}
                  >
                    {['English', 'Chinese', 'Japanese', 'Korean', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Arabic'].map((lang) => (
                      <MenuItem key={lang} value={lang}>
                        {lang}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 1 }} />

                {/* Polish */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Polish
                  </Typography>
                  <TriggerKeys
                    label="Polish Trigger"
                    value={config.triggerPolish}
                    onChange={(value) => updateField('triggerPolish', value)}
                    helperText="Click keys to set the pattern that triggers polish"
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Bottom spacer */}
          <Box sx={{ height: 20 }} />
        </Box>
      </Box>
    </Box>
  );
}
