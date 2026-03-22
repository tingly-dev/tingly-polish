import type { Config, HistoryEntry } from '../../domain/types';
import { MessageTopics } from '../../infrastructure/messaging/MessageBus';

/**
 * Send message to background service
 */
export async function sendMessage<T = unknown, R = unknown>(
  type: typeof MessageTopics[keyof typeof MessageTopics],
  payload?: T
): Promise<R> {
  const response = await chrome.runtime.sendMessage({
    type,
    payload: payload ?? {},
  });

  if (response?.error) {
    throw new Error(response.error);
  }

  return response.data as R;
}

/**
 * Get configuration from background
 */
export async function getConfig(): Promise<Config> {
  return sendMessage<unknown, Config>(MessageTopics.GET_CONFIG);
}

/**
 * Update configuration
 */
export async function updateConfig(partial: Partial<Config>): Promise<Config> {
  return sendMessage<Partial<Config>, Config>(
    MessageTopics.UPDATE_CONFIG,
    partial
  );
}

/**
 * Reset configuration to defaults
 */
export async function resetConfig(): Promise<Config> {
  return sendMessage<unknown, Config>(MessageTopics.RESET_CONFIG);
}

/**
 * Get history entries
 */
export async function getHistory(): Promise<HistoryEntry[]> {
  return sendMessage<unknown, HistoryEntry[]>(MessageTopics.GET_HISTORY);
}

/**
 * Add history entry
 */
export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  return sendMessage<HistoryEntry, void>(
    MessageTopics.ADD_HISTORY,
    entry
  );
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  return sendMessage<unknown, void>(MessageTopics.CLEAR_HISTORY);
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than a minute
  if (diff < 60 * 1000) {
    return 'Just now';
  }

  // Less than an hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}m ago`;
  }

  // Today
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  // Older
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text for display
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Process text directly (for Quick Process panel)
 */
export async function processDirectText(
  text: string,
  type: 'translate-t1' | 'translate-t2' | 'polish'
): Promise<{ result: string; targetLanguage?: string }> {
  return sendMessage<{ text: string; type: 'translate-t1' | 'translate-t2' | 'polish' }, { result: string; targetLanguage?: string }>(
    'PROCESS_DIRECT_TEXT',
    { text, type }
  );
}
