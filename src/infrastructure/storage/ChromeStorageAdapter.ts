import type {
  Config,
  HistoryEntry,
  IConfigRepository,
  IHistoryRepository,
} from '../../domain/types.js';
import {
  DEFAULT_CONFIG,
  STORAGE_KEYS,
  MAX_HISTORY_ENTRIES,
} from '../../domain/types.js';

/**
 * Chrome Storage Adapter - Config Repository
 */
export class ChromeConfigRepository implements IConfigRepository {
  private subscribers: Set<(config: Config) => void> = new Set();
  private cachedConfig: Config | null = null;

  async getConfig(): Promise<Config> {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    const result = await chrome.storage.local.get(STORAGE_KEYS.CONFIG);
    const stored = result[STORAGE_KEYS.CONFIG];

    if (stored) {
      // Migrate legacy config to new T1/T2 format
      const migrated = this.migrateConfig(stored);
      // Merge with defaults to handle new fields
      // For siteMappings, use stored value if it exists and is not empty, otherwise use defaults
      this.cachedConfig = {
        ...DEFAULT_CONFIG,
        ...migrated,
        siteMappings: migrated.siteMappings && migrated.siteMappings.length > 0
          ? migrated.siteMappings
          : DEFAULT_CONFIG.siteMappings,
      };
      // Save migrated config if changes were made
      if (stored !== migrated) {
        await this.saveConfig(this.cachedConfig);
      }
    } else {
      this.cachedConfig = { ...DEFAULT_CONFIG };
      await this.saveConfig(this.cachedConfig);
    }

    return this.cachedConfig;
  }

  /**
   * Migrate legacy config to new T1/T2 format
   */
  private migrateConfig(config: Partial<Config>): Partial<Config> {
    const migrated = { ...config };

    // Migrate T1 from legacy fields
    if (!migrated.targetLanguageT1 && migrated.targetLanguage) {
      migrated.targetLanguageT1 = migrated.targetLanguage;
    }
    if (!migrated.triggerTranslateT1 && migrated.triggerTranslate) {
      migrated.triggerTranslateT1 = migrated.triggerTranslate;
    }

    // Set T2 defaults if not present
    if (!migrated.targetLanguageT2) {
      migrated.targetLanguageT2 = 'Chinese';
    }
    if (!migrated.triggerTranslateT2) {
      migrated.triggerTranslateT2 = '   ';
    }

    return migrated;
  }

  async updateConfig(partial: Partial<Config>): Promise<Config> {
    const current = await this.getConfig();
    const updated = { ...current, ...partial };
    await this.saveConfig(updated);
    return updated;
  }

  async resetConfig(): Promise<Config> {
    this.cachedConfig = { ...DEFAULT_CONFIG };
    await this.saveConfig(this.cachedConfig);
    return this.cachedConfig;
  }

  private async saveConfig(config: Config): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.CONFIG]: config });
    this.cachedConfig = config;
    this.notifySubscribers(config);
  }

  subscribe(callback: (config: Config) => void): () => void {
    this.subscribers.add(callback);

    // Also listen to Chrome storage changes from other contexts
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes[STORAGE_KEYS.CONFIG]) {
        const newConfig = changes[STORAGE_KEYS.CONFIG].newValue as Config;
        this.cachedConfig = newConfig;
        this.notifySubscribers(newConfig);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
      chrome.storage.onChanged.removeListener(listener);
    };
  }

  private notifySubscribers(config: Config): void {
    this.subscribers.forEach(callback => callback(config));
  }
}

/**
 * Chrome Storage Adapter - History Repository
 */
export class ChromeHistoryRepository implements IHistoryRepository {
  private subscribers: Set<(entries: HistoryEntry[]) => void> = new Set();
  private cachedHistory: HistoryEntry[] = [];

  async addEntry(entry: HistoryEntry): Promise<void> {
    const history = await this.getHistory();
    const updated = [entry, ...history].slice(0, MAX_HISTORY_ENTRIES);
    await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: updated });
    this.cachedHistory = updated;
    this.notifySubscribers(updated);
  }

  async getHistory(limit?: number): Promise<HistoryEntry[]> {
    if (this.cachedHistory.length > 0) {
      return limit ? this.cachedHistory.slice(0, limit) : this.cachedHistory;
    }

    const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
    this.cachedHistory = result[STORAGE_KEYS.HISTORY] ?? [];

    return limit
      ? this.cachedHistory.slice(0, limit)
      : this.cachedHistory;
  }

  async clearHistory(): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: [] });
    this.cachedHistory = [];
    this.notifySubscribers([]);
  }

  subscribe(callback: (entries: HistoryEntry[]) => void): () => void {
    this.subscribers.add(callback);

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes[STORAGE_KEYS.HISTORY]) {
        const newHistory = changes[STORAGE_KEYS.HISTORY].newValue as HistoryEntry[];
        this.cachedHistory = newHistory;
        this.notifySubscribers(newHistory);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      this.subscribers.delete(callback);
      chrome.storage.onChanged.removeListener(listener);
    };
  }

  private notifySubscribers(entries: HistoryEntry[]): void {
    this.subscribers.forEach(callback => callback(entries));
  }
}

/**
 * Cache storage for LLM responses
 */
export class ChromeCacheStorage {
  async get(key: string): Promise<{ response: string; timestamp: number } | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CACHE);
    const cache = result[STORAGE_KEYS.CACHE] ?? {};

    const entry = cache[key];
    if (entry && Date.now() - entry.timestamp < 60 * 60 * 1000) {
      return entry;
    }

    return null;
  }

  async set(key: string, response: string): Promise<void> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CACHE);
    const cache = result[STORAGE_KEYS.CACHE] ?? {};

    cache[key] = {
      response,
      timestamp: Date.now(),
    };

    await chrome.storage.local.set({ [STORAGE_KEYS.CACHE]: cache });
  }

  async clear(): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.CACHE]: {} });
  }
}
