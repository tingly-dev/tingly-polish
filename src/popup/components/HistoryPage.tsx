import * as React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
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

  const getEntryIcon = (type: 'translate' | 'polish') => {
    return type === 'translate' ? <TranslateIcon /> : <AutoFixHighIcon />;
  };

  const getEntryColor = (type: 'translate' | 'polish') => {
    return type === 'translate' ? 'primary' : 'secondary';
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
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredHistory.length} {filteredHistory.length === 1 ? 'entry' : 'entries'}
          </Typography>
        </Box>
        {history.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleClearHistory}
            startIcon={<DeleteIcon />}
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* Filter */}
      {history.length > 0 && (
        <ButtonGroup variant="outlined" size="small" fullWidth sx={{ mb: 2 }}>
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'translate' ? 'contained' : 'outlined'}
            onClick={() => setFilter('translate')}
            startIcon={<TranslateIcon />}
          >
            Translate
          </Button>
          <Button
            variant={filter === 'polish' ? 'contained' : 'outlined'}
            onClick={() => setFilter('polish')}
            startIcon={<AutoFixHighIcon />}
          >
            Polish
          </Button>
        </ButtonGroup>
      )}

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            {history.length === 0
              ? 'No history yet. Start translating or polishing text!'
              : 'No entries match the current filter.'}
          </Typography>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={1}>
          {filteredHistory.map((entry) => (
            <Card key={entry.id} variant="outlined">
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box flex={1} minWidth={0}>
                    {/* Header */}
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip
                        icon={getEntryIcon(entry.type)}
                        label={entry.type}
                        size="small"
                        color={getEntryColor(entry.type)}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(entry.timestamp)}
                      </Typography>
                    </Box>

                    {/* Original */}
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary" fontWeight="medium">
                        Original:
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {truncateText(entry.original, 80)}
                      </Typography>
                    </Box>

                    {/* Processed */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="medium">
                        Result:
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {truncateText(entry.processed, 80)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Actions */}
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(entry.processed, entry.id)}
                    title="Copy result"
                  >
                    {copiedId === entry.id ? (
                      <CheckIcon color="success" fontSize="small" />
                    ) : (
                      <CopyIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}
