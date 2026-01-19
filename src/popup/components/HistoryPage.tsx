import { useState, useEffect } from 'react';
import type { HistoryEntry } from '../../domain/types';
import {
  getHistory,
  clearHistory,
  copyToClipboard,
  formatTimestamp,
  truncateText,
} from '../lib/api';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Trash2, Copy, Check } from 'lucide-react';

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'translate' | 'polish'>('all');

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">History</h2>
          <p className="text-sm text-muted-foreground">
            {filteredHistory.length} {filteredHistory.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        {history.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearHistory}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filter */}
      {history.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'translate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('translate')}
          >
            Translate
          </Button>
          <Button
            variant={filter === 'polish' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('polish')}
          >
            Polish
          </Button>
        </div>
      )}

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {history.length === 0
                ? 'No history yet. Start translating or polishing text!'
                : 'No entries match the current filter.'}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          entry.type === 'translate'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {entry.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>

                    {/* Original */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Original:
                      </p>
                      <p className="text-sm">{truncateText(entry.original, 100)}</p>
                    </div>

                    {/* Processed */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Result:
                      </p>
                      <p className="text-sm">{truncateText(entry.processed, 100)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(entry.processed, entry.id)}
                      title="Copy result"
                    >
                      {copiedId === entry.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
