import * as React from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  History as HistoryIcon,
  Translate as TranslateIcon,
  AutoFixHigh as AutoFixHighIcon,
} from '@mui/icons-material';
import type { HistoryEntry } from '../../domain/types';
import {
  getHistory,
  clearHistory,
  copyToClipboard,
  formatTimestamp,
  truncateText,
} from '../lib/api';

type HistoryFilter = 'all' | 'translate' | 'polish';

export function HistorySection() {
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<HistoryFilter>('all');

  React.useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) return;

    try {
      await clearHistory();
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history', error);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredHistory = history.filter(entry => {
    if (filter === 'all') return true;
    return entry.type === filter;
  });

  const getEntryColor = (type: 'translate' | 'polish') => {
    return type === 'translate' ? 'primary' : 'secondary';
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
          Loading history...
        </Typography>
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
          <HistoryIcon color="primary" sx={{ fontSize: '1.5rem' }} />
          <Box>
            <Typography variant="h5">History</Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredHistory.length} {filteredHistory.length === 1 ? 'entry' : 'entries'}
            </Typography>
          </Box>
        </Box>

        {/* Clear button */}
        {history.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleClearHistory}
            startIcon={<DeleteIcon />}
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* Filter Bar */}
      {history.length > 0 && (
        <Box
          sx={{
            px: 4,
            py: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, value) => value && setFilter(value)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                borderRadius: '8px',
                textTransform: 'none',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
                px: 2.5,
                py: 1,
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#ffffff',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              },
            }}
          >
            <ToggleButton value="all">
              All
            </ToggleButton>
            <ToggleButton value="translate" startIcon={<TranslateIcon fontSize="small" />}>
              Translate
            </ToggleButton>
            <ToggleButton value="polish" startIcon={<AutoFixHighIcon fontSize="small" />}>
              Polish
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
        {filteredHistory.length === 0 ? (
          <Card
            variant="outlined"
            sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: 'background.paper',
              borderColor: 'divider',
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            <HistoryIcon
              sx={{
                fontSize: 64,
                color: 'text.disabled',
                mb: 3,
              }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {history.length === 0
                ? 'No history yet'
                : 'No entries match the current filter'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {history.length === 0
                ? 'Start translating or polishing text to see your history here!'
                : 'Try selecting a different filter to see more entries.'}
            </Typography>
          </Card>
        ) : (
          <Box display="flex" flexDirection="column" gap={2} maxWidth={900}>
            {filteredHistory.map((entry) => (
              <Card
                key={entry.id}
                sx={{
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '16px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: (theme) => `0 4px 12px ${theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'}`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                    <Box flex={1} minWidth={0}>
                      {/* Header */}
                      <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                        <Chip
                          icon={entry.type === 'translate' ? <TranslateIcon fontSize="small" /> : <AutoFixHighIcon fontSize="small" />}
                          label={entry.type}
                          size="small"
                          color={getEntryColor(entry.type)}
                          sx={{
                            height: 26,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            '& .MuiChip-icon': {
                              fontSize: '0.875rem',
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {formatTimestamp(entry.timestamp)}
                        </Typography>
                      </Box>

                      {/* Original */}
                      <Box mb={2}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5, display: 'block' }}
                        >
                          Original
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.9rem',
                            color: 'text.secondary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {truncateText(entry.original, 100)}
                        </Typography>
                      </Box>

                      {/* Processed */}
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5, display: 'block' }}
                        >
                          Result
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: '1rem',
                            color: entry.type === 'translate' ? 'primary.main' : 'secondary.main',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {truncateText(entry.processed, 100)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Copy button */}
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(entry.processed, entry.id)}
                      sx={{
                        bgcolor: copiedId === entry.id ? 'success.main' : 'action.hover',
                        color: copiedId === entry.id ? '#ffffff' : 'text.primary',
                        borderRadius: '8px',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: copiedId === entry.id ? 'success.dark' : 'action.selected',
                        },
                      }}
                      title={copiedId === entry.id ? 'Copied!' : 'Copy result'}
                    >
                      {copiedId === entry.id ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
