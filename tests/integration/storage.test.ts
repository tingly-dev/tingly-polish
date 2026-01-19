import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TextProcessor } from '../../../src/domain/services/TextProcessor';
import type { HistoryEntry } from '../../../src/domain/types';

// Mock chrome API
const mockChromeStorage = {
  data: {} as Record<string, any>,
  get: vi.fn((keys: string | string[], callback?: (items: Record<string, any>) => void) => {
    const result: Record<string, any> = {};
    const keyArray = Array.isArray(keys) ? keys : [keys];

    for (const key of keyArray) {
      if (mockChromeStorage.data[key] !== undefined) {
        result[key] = mockChromeStorage.data[key];
      }
    }

    if (callback) {
      callback(result);
    }
    return Promise.resolve(result);
  }),
  set: vi.fn((items: Record<string, any>, callback?: () => void) => {
    Object.assign(mockChromeStorage.data, items);
    if (callback) callback();
    return Promise.resolve();
  }),
  clear: vi.fn(() => {
    mockChromeStorage.data = {};
    return Promise.resolve();
  }),
  onChanged: {
    listeners: [] as Array<(changes: Record<string, any>, areaName: string) => void>,
    addListener: vi.fn((callback: (changes: Record<string, any>, areaName: string) => void) => {
      mockChromeStorage.onChanged.listeners.push(callback);
    }),
    removeListener: vi.fn((callback: (changes: Record<string, any>, areaName: string) => void) => {
      const index = mockChromeStorage.onChanged.listeners.indexOf(callback);
      if (index > -1) {
        mockChromeStorage.onChanged.listeners.splice(index, 1);
      }
    }),
  },
};

vi.stubGlobal('chrome', {
  storage: {
    local: mockChromeStorage,
    sync: mockChromeStorage,
  },
});

describe('Chrome Storage Integration', () => {
  const textProcessor = new TextProcessor();

  beforeEach(() => {
    // Clear mock storage before each test
    mockChromeStorage.data = {};
    mockChromeStorage.get.mockClear();
    mockChromeStorage.set.mockClear();
    mockChromeStorage.onChanged.listeners = [];
  });

  describe('Storage behavior', () => {
    it('should store and retrieve data', async () => {
      const testData = { key: 'value' };

      await mockChromeStorage.set({ 'test-key': testData });
      const result = await mockChromeStorage.get('test-key');

      expect(result['test-key']).toEqual(testData);
    });

    it('should handle missing keys', async () => {
      const result = await mockChromeStorage.get('non-existent');

      expect(result['non-existent']).toBeUndefined();
    });

    it('should retrieve multiple keys', async () => {
      await mockChromeStorage.set({ key1: 'value1', key2: 'value2' });
      const result = await mockChromeStorage.get(['key1', 'key2']);

      expect(result['key1']).toBe('value1');
      expect(result['key2']).toBe('value2');
    });
  });

  describe('History storage pattern', () => {
    it('should store history entries', async () => {
      const entry: HistoryEntry = {
        id: 'test-1',
        original: 'hello',
        processed: 'Hello (polished)',
        type: 'polish',
        timestamp: Date.now(),
      };

      await mockChromeStorage.set({ 'tingly-polish-history': [entry] });
      const result = await mockChromeStorage.get('tingly-polish-history');

      expect(result['tingly-polish-history']).toHaveLength(1);
      expect(result['tingly-polish-history'][0].original).toBe('hello');
    });

    it('should append to history', async () => {
      const entry1: HistoryEntry = {
        id: 'test-1',
        original: 'hello',
        processed: 'Hello',
        type: 'translate',
        timestamp: Date.now(),
      };

      const entry2: HistoryEntry = {
        id: 'test-2',
        original: 'world',
        processed: 'World',
        type: 'translate',
        timestamp: Date.now(),
      };

      await mockChromeStorage.set({ 'tingly-polish-history': [entry1] });

      const current = await mockChromeStorage.get('tingly-polish-history');
      const updated = [...current['tingly-polish-history'], entry2];

      await mockChromeStorage.set({ 'tingly-polish-history': updated });

      const result = await mockChromeStorage.get('tingly-polish-history');
      expect(result['tingly-polish-history']).toHaveLength(2);
    });

    it('should clear history', async () => {
      const entry: HistoryEntry = {
        id: 'test-1',
        original: 'hello',
        processed: 'Hello',
        type: 'translate',
        timestamp: Date.now(),
      };

      await mockChromeStorage.set({ 'tingly-polish-history': [entry] });
      await mockChromeStorage.set({ 'tingly-polish-history': [] });

      const result = await mockChromeStorage.get('tingly-polish-history');
      expect(result['tingly-polish-history']).toEqual([]);
    });
  });

  describe('Config storage pattern', () => {
    it('should store configuration', async () => {
      const config = {
        apiKey: 'test-key',
        baseUrl: 'https://api.example.com',
        model: 'test-model',
      };

      await mockChromeStorage.set({ 'tingly-polish-config': config });
      const result = await mockChromeStorage.get('tingly-polish-config');

      expect(result['tingly-polish-config']).toEqual(config);
    });

    it('should update partial config', async () => {
      const initialConfig = {
        apiKey: 'old-key',
        baseUrl: 'https://api.example.com',
        model: 'test-model',
      };

      await mockChromeStorage.set({ 'tingly-polish-config': initialConfig });

      const current = await mockChromeStorage.get('tingly-polish-config');
      const updated = { ...current['tingly-polish-config'], apiKey: 'new-key' };

      await mockChromeStorage.set({ 'tingly-polish-config': updated });

      const result = await mockChromeStorage.get('tingly-polish-config');
      expect(result['tingly-polish-config'].apiKey).toBe('new-key');
      expect(result['tingly-polish-config'].baseUrl).toBe('https://api.example.com');
    });
  });

  describe('Change notifications', () => {
    it('should notify listeners on storage change', async () => {
      const listener = vi.fn();
      mockChromeStorage.onChanged.addListener(listener);

      await mockChromeStorage.set({ 'test-key': 'value' });

      const change = {
        'test-key': {
          oldValue: undefined,
          newValue: 'value',
        },
      };

      // Manually trigger listeners (in real Chrome, this happens automatically)
      mockChromeStorage.onChanged.listeners.forEach(l => l(change, 'local'));

      expect(listener).toHaveBeenCalledWith(change, 'local');
    });

    it('should handle multiple listeners', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      mockChromeStorage.onChanged.addListener(listener1);
      mockChromeStorage.onChanged.addListener(listener2);

      const change = {
        'test-key': {
          oldValue: undefined,
          newValue: 'value',
        },
      };

      mockChromeStorage.onChanged.listeners.forEach(l => l(change, 'local'));

      expect(listener1).toHaveBeenCalledWith(change, 'local');
      expect(listener2).toHaveBeenCalledWith(change, 'local');
    });
  });
});
