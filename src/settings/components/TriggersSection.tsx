import * as React from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Collapse,
  Button,
} from '@mui/material';
import {
  Keyboard as KeyboardIcon,
  Translate as TranslateIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { Config } from '../../domain/types';
import { getConfig, updateConfig } from '../lib/api';
import { useAutoSave } from '../hooks/useAutoSave';
import { useSettingsContext } from '../contexts/SettingsContext';
import { TriggerKeys } from '../../popup/components/TriggerKeys';
import { LANGUAGE_NATIVE_NAMES, AVAILABLE_LANGUAGES } from '../../domain/constants';

const SECTION_ID = 'triggers';

export function TriggersSection() {
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
          <KeyboardIcon color="primary" sx={{ fontSize: '1.5rem' }} />
          <Box>
            <Typography variant="h5">Trigger Configuration</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure keyboard shortcuts for triggering actions
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
          {/* Translation T1 */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <TranslateIcon color="primary" sx={{ fontSize: '1.1rem' }} />
              <Typography variant="h6">Translate 1 (Primary)</Typography>
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
                  label="Translate 1 Trigger"
                  value={displayConfig.triggerTranslateT1 || ''}
                  onChange={(value) => handleFieldChange('triggerTranslateT1', value)}
                  helperText="Click keys to set the pattern that triggers T1 translation. Leave empty to disable auto-trigger."
                />
                <TextField
                  select
                  label="Translate 1 Target Language"
                  value={displayConfig.targetLanguageT1 || 'English'}
                  onChange={(e) => handleFieldChange('targetLanguageT1', e.target.value)}
                  fullWidth
                  size="small"
                >
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {LANGUAGE_NATIVE_NAMES[lang]}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </Box>

          {/* Translation T2 */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <TranslateIcon color="secondary" sx={{ fontSize: '1.1rem' }} />
              <Typography variant="h6">Translate 2 (Secondary)</Typography>
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
                  label="Translate 2 Trigger"
                  value={displayConfig.triggerTranslateT2 || ''}
                  onChange={(value) => handleFieldChange('triggerTranslateT2', value)}
                  helperText="Click keys to set the pattern that triggers T2 translation. Leave empty to disable auto-trigger."
                />
                <TextField
                  select
                  label="Translate 2 Target Language"
                  value={displayConfig.targetLanguageT2 || 'Chinese'}
                  onChange={(e) => handleFieldChange('targetLanguageT2', e.target.value)}
                  fullWidth
                  size="small"
                >
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {LANGUAGE_NATIVE_NAMES[lang]}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </Box>

          {/* Polish Trigger */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <TranslateIcon sx={{ fontSize: '1.1rem', color: 'success.main' }} />
              <Typography variant="h6">Polish</Typography>
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
              <TriggerKeys
                label="Polish Trigger"
                value={displayConfig.triggerPolish || ''}
                onChange={(value) => handleFieldChange('triggerPolish', value)}
                helperText="Click keys to set the pattern that triggers polish. Leave empty to disable auto-trigger."
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
              <strong>How it works:</strong> Type the trigger key pattern in any input field and the extension will automatically process your text. The default trigger is triple space (three spaces). Leave any trigger pattern empty to disable that auto-trigger feature.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
