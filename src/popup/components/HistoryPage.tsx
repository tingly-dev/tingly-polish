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

export function HistoryPage() {
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<'all' | 'translate' | 'polish'>('all');

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
      {/* Header - Sticky at top */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Title row */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <HistoryIcon color="primary" sx={{ fontSize: '1.25rem' }} />
            <Box>
              <Typography variant="h6">History</Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.75rem' }}
              >
                {filteredHistory.length} {filteredHistory.length === 1 ? 'entry' : 'entries'}
              </Typography>
            </Box>
          </Box>

          {/* Clear button */}
          {history.length > 0 && (
            <IconButton
              onClick={handleClearHistory}
              color="error"
              size="small"
              title="Clear all history"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Filter */}
        {history.length > 0 && (
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
                fontSize: '0.75rem',
                fontWeight: 600,
                px: 2,
                py: 0.75,
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
        )}
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, pt: 2 }}>
        {filteredHistory.length === 0 ? (
          <Card
            variant="outlined"
            sx={{
              textAlign: 'center',
              py: 6,
              bgcolor: 'background.paper',
              borderColor: 'divider',
            }}
          >
            <HistoryIcon
              sx={{
                fontSize: 48,
                color: 'text.disabled',
                mb: 2,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {history.length === 0
                ? 'No history yet. Start translating or polishing text!'
                : 'No entries match the current filter.'}
            </Typography>
          </Card>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {filteredHistory.map((entry, index) => (
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
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
                    <Box flex={1} minWidth={0}>
                      {/* Header */}
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <Chip
                          icon={entry.type === 'translate' ? <TranslateIcon fontSize="small" /> : <AutoFixHighIcon fontSize="small" />}
                          label={entry.type}
                          size="small"
                          color={getEntryColor(entry.type)}
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            '& .MuiChip-icon': {
                              fontSize: '0.8rem',
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem' }}
                        >
                          {formatTimestamp(entry.timestamp)}
                        </Typography>
                      </Box>

                      {/* Original */}
                      <Box mb={1}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem', fontWeight: 500, mb: 0.3, display: 'block' }}
                        >
                          Original
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.875rem',
                            color: 'text.secondary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {truncateText(entry.original, 70)}
                        </Typography>
                      </Box>

                      {/* Processed */}
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem', fontWeight: 500, mb: 0.3, display: 'block' }}
                        >
                          Result
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.875rem',
                            color: entry.type === 'translate' ? 'primary.main' : 'secondary.main',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {truncateText(entry.processed, 70)}
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
