import * as React from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Paper,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Webhook as WebIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import type { SiteMapping } from '../../domain/types';
import { getConfig, updateConfig } from '../lib/api';
import { useSettingsContext } from '../contexts/SettingsContext';
import { DEFAULT_SITE_MAPPINGS } from '../../domain/types';

interface SiteMappingFormData {
  id: string;
  name: string;
  urlPattern: string;
  inputSelectors: string;
  enabled: boolean;
}

const EMPTY_MAPPING: SiteMappingFormData = {
  id: '',
  name: '',
  urlPattern: '',
  inputSelectors: '',
  enabled: true,
};

export function SiteMappingsSection() {
  const { registerSection, unregisterSection } = useSettingsContext();
  const [config, setConfig] = React.useState<SiteMapping[] | null>(null);
  const [mappings, setMappings] = React.useState<SiteMapping[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingMapping, setEditingMapping] = React.useState<SiteMappingFormData | null>(null);
  const [error, setError] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Load config on mount
  React.useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getConfig();
      const siteMappings = data.siteMappings || [];
      setConfig(siteMappings);
      setMappings(siteMappings);
    } catch (err) {
      setError('Failed to load configuration');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Update local state when config changes
  React.useEffect(() => {
    if (config) {
      setMappings(config);
    }
  }, [config]);

  const hasChanges = React.useMemo(() => {
    return JSON.stringify(mappings) !== JSON.stringify(config || []);
  }, [mappings, config]);

  const handleSave = React.useCallback(async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const currentConfig = await getConfig();
      await updateConfig({ ...currentConfig, siteMappings: mappings });
      setConfig(mappings);
    } catch (err) {
      setError('Failed to save site mappings');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [mappings, hasChanges]);

  const handleDiscard = React.useCallback(() => {
    setMappings(config || []);
  }, [config]);

  React.useEffect(() => {
    if (registerSection) {
      registerSection('sitemappings', {
        hasPendingChanges: hasChanges,
        save: handleSave,
        discardChanges: handleDiscard,
      });
    }
    return () => {
      if (unregisterSection) {
        unregisterSection('sitemappings');
      }
    };
  }, [hasChanges, handleSave, handleDiscard, registerSection, unregisterSection]);

  const handleAdd = () => {
    setEditingMapping({ ...EMPTY_MAPPING, id: Date.now().toString() });
    setDialogOpen(true);
    setError('');
  };

  const handleEdit = (mapping: SiteMapping) => {
    setEditingMapping({
      id: mapping.id,
      name: mapping.name,
      urlPattern: mapping.urlPattern,
      inputSelectors: mapping.inputSelectors.join(', '),
      enabled: mapping.enabled,
    });
    setDialogOpen(true);
    setError('');
  };

  const handleDelete = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
  };

  const handleSaveDialog = () => {
    if (!editingMapping) return;

    // Validate
    if (!editingMapping.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!editingMapping.urlPattern.trim()) {
      setError('URL pattern is required');
      return;
    }
    if (!editingMapping.inputSelectors.trim()) {
      setError('Input selectors are required');
      return;
    }

    const selectors = editingMapping.inputSelectors
      .split(',')
      .map(s => s.trim())
      .filter(s => s);

    if (selectors.length === 0) {
      setError('At least one input selector is required');
      return;
    }

    const newMapping: SiteMapping = {
      id: editingMapping.id,
      name: editingMapping.name.trim(),
      urlPattern: editingMapping.urlPattern.trim(),
      inputSelectors: selectors,
      enabled: editingMapping.enabled,
    };

    const existingIndex = mappings.findIndex(m => m.id === editingMapping.id);
    if (existingIndex >= 0) {
      const updated = [...mappings];
      updated[existingIndex] = newMapping;
      setMappings(updated);
    } else {
      setMappings([...mappings, newMapping]);
    }

    setDialogOpen(false);
    setEditingMapping(null);
    setError('');
  };

  const handleToggleEnabled = (id: string) => {
    setMappings(
      mappings.map(m =>
        m.id === id ? { ...m, enabled: !m.enabled } : m
      )
    );
  };

  const handleResetToDefaults = () => {
    setMappings([...DEFAULT_SITE_MAPPINGS]);
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
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <WebIcon color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Custom Site Mappings
            </Typography>
          </Box>
          <Typography color="text.secondary">
            Configure custom input selectors for specific websites.
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<RefreshIcon />}
            onClick={handleResetToDefaults}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Mapping
          </Button>
          <Button
            variant="contained"
            startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Built-in Mappings:</strong> Basecamp (enabled), Notion, and Gmail are pre-configured.
          You can edit them or create custom mappings for other sites.
          <br /><br />
          <strong>URL Pattern Examples:</strong> <code>*.basecamp.com</code> for any subdomain,
          <code> mail.google.com</code> for exact domain. Use <code>*</code> as a wildcard.
        </Typography>
      </Alert>

      {/* Mappings List */}
      <Stack spacing={2}>
        {mappings.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No custom site mappings configured. Click "Add Site Mapping" to create one.
            </Typography>
          </Paper>
        ) : (
          mappings.map((mapping) => (
            <Paper key={mapping.id} sx={{ p: 3 }}>
              <Box display="flex" alignItems="flex-start" gap={2}>
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="h6" fontWeight={600}>
                      {mapping.name}
                    </Typography>
                    {!mapping.enabled && (
                      <Typography variant="caption" color="text.secondary">
                        (Disabled)
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      URL Pattern:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', bgcolor: 'background.default', px: 1, py: 0.5, borderRadius: 0.5 }}
                    >
                      {mapping.urlPattern}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Input Selectors:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {mapping.inputSelectors.map((selector, idx) => (
                        <Typography
                          key={idx}
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            bgcolor: 'action.hover',
                            px: 1,
                            py: 0.5,
                            borderRadius: 0.5,
                          }}
                        >
                          {selector}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </Box>

                <Divider orientation="vertical" flexItem />

                <Stack spacing={1} alignItems="center">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={mapping.enabled}
                        onChange={() => handleToggleEnabled(mapping.id)}
                        size="small"
                      />
                    }
                    label="Enabled"
                  />
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(mapping)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(mapping.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Paper>
          ))
        )}
      </Stack>

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMapping?.id && mappings.find(m => m.id === editingMapping.id)
            ? 'Edit Site Mapping'
            : 'Add Site Mapping'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <TextField
              label="Name"
              fullWidth
              size="small"
              value={editingMapping?.name || ''}
              onChange={(e) =>
                setEditingMapping(prev => prev ? { ...prev, name: e.target.value } : null)
              }
              placeholder="e.g., Basecamp"
              autoFocus
            />

            <TextField
              label="URL Pattern"
              fullWidth
              size="small"
              value={editingMapping?.urlPattern || ''}
              onChange={(e) =>
                setEditingMapping(prev => prev ? { ...prev, urlPattern: e.target.value } : null)
              }
              placeholder="e.g., *.basecamp.com or github.com/*"
              helperText="Use * as a wildcard. Example: *.example.com matches all subdomains."
            />

            <TextField
              label="Input Selectors"
              fullWidth
              size="small"
              multiline
              rows={3}
              value={editingMapping?.inputSelectors || ''}
              onChange={(e) =>
                setEditingMapping(prev => prev ? { ...prev, inputSelectors: e.target.value } : null)
              }
              placeholder="e.g., trix-editor, [contenteditable], textarea.my-class"
              helperText="Comma-separated CSS selectors for input elements."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={editingMapping?.enabled ?? true}
                  onChange={(e) =>
                    setEditingMapping(prev => prev ? { ...prev, enabled: e.target.checked } : null)
                  }
                />
              }
              label="Enable this mapping"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveDialog}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
