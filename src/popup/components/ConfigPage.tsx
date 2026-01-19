import * as React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  InputAdornment,
  Alert,
  Collapse,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
  Settings as SettingsIcon,
  Translate as TranslateIcon,
  AutoFixHigh as AutoFixHighIcon,
} from '@mui/icons-material';
import type { Config } from '../../domain/types';
import {
  getConfig,
  updateConfig,
  resetConfig,
} from '../lib/api';

export function ConfigPage() {
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
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" disableGutters>
      <Collapse in={!!message}>
        {message && (
          <Alert
            severity={message.type}
            sx={{ mb: 2 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}
      </Collapse>

      {/* API Configuration */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <SettingsIcon color="primary" />
          <Typography variant="h6">API Configuration</Typography>
        </Box>

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
          />
        </Box>
      </Paper>

      {/* Prompt Configuration */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AutoFixHighIcon color="primary" />
          <Typography variant="h6">Prompt Configuration</Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="System Prompt"
            value={config.systemPrompt}
            onChange={(e) => updateField('systemPrompt', e.target.value)}
            multiline
            rows={3}
            placeholder="System prompt for LLM"
            fullWidth
            size="small"
          />

          <TextField
            label="Translation Prompt"
            value={config.userPromptTranslate}
            onChange={(e) => updateField('userPromptTranslate', e.target.value)}
            multiline
            rows={3}
            placeholder="Use {text} and {targetLanguage} as placeholders"
            fullWidth
            size="small"
            helperText="Available placeholders: {text}, {targetLanguage}"
          />

          <TextField
            label="Polish Prompt"
            value={config.userPromptPolish}
            onChange={(e) => updateField('userPromptPolish', e.target.value)}
            multiline
            rows={3}
            placeholder="Use {text} as placeholder"
            fullWidth
            size="small"
            helperText="Available placeholder: {text}"
          />

          <Button
            variant="outlined"
            onClick={async () => {
              const defaults = await import('../../domain/types').then(m => m.DEFAULT_CONFIG);
              updateField('systemPrompt', defaults.systemPrompt);
              updateField('userPromptTranslate', defaults.userPromptTranslate);
              updateField('userPromptPolish', defaults.userPromptPolish);
            }}
            startIcon={<RestoreIcon />}
            fullWidth
          >
            Restore Default Prompts
          </Button>
        </Box>
      </Paper>

      {/* Trigger Configuration */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <TranslateIcon color="primary" />
          <Typography variant="h6">Trigger Configuration</Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Translation Trigger"
            value={config.triggerTranslate}
            onChange={(e) => updateField('triggerTranslate', e.target.value)}
            placeholder="   (triple space)"
            fullWidth
            size="small"
            helperText="Type this pattern in an input to trigger translation"
          />

          <TextField
            label="Polish Trigger"
            value={config.triggerPolish}
            onChange={(e) => updateField('triggerPolish', e.target.value)}
            placeholder="   (triple space)"
            fullWidth
            size="small"
            helperText="Type this pattern in an input to trigger polish"
          />

          <TextField
            select
            label="Target Language"
            value={config.targetLanguage}
            onChange={(e) => updateField('targetLanguage', e.target.value)}
            fullWidth
            size="small"
            SelectProps={{
              native: true,
            }}
          >
            <option value="English">English</option>
            <option value="Chinese">Chinese</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Italian">Italian</option>
            <option value="Portuguese">Portuguese</option>
            <option value="Russian">Russian</option>
            <option value="Arabic">Arabic</option>
          </TextField>
        </Box>
      </Paper>

      {/* Actions */}
      <Box display="flex" gap={1}>
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
        >
          Reset All
        </Button>
      </Box>
    </Container>
  );
}
