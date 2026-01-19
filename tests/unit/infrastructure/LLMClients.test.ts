import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockLLMClient } from '../../src/infrastructure/llm/LLMClients';
import { DEFAULT_CONFIG } from '../../src/domain/types';

describe('MockLLMClient', () => {
  let client: MockLLMClient;

  beforeEach(() => {
    client = new MockLLMClient();
  });

  describe('isAvailable', () => {
    it('should always be available', () => {
      expect(client.isAvailable()).toBe(true);
    });
  });

  describe('getModel', () => {
    it('should return mock-model', () => {
      expect(client.getModel()).toBe('mock-model');
    });
  });

  describe('translate', () => {
    it('should translate known words', async () => {
      const result = await client.translate('hello', 'Chinese');
      expect(result).toBe('你好');
    });

    it('should translate to Japanese', async () => {
      const result = await client.translate('hello', 'Japanese');
      expect(result).toBe('こんにちは');
    });

    it('should translate to Spanish', async () => {
      const result = await client.translate('hello', 'Spanish');
      expect(result).toBe('Hola');
    });

    it('should handle unknown text with prefix', async () => {
      const result = await client.translate('unknown text', 'German');
      expect(result).toContain('unknown text');
      expect(result).toContain('German');
    });

    it('should add delay to simulate API', async () => {
      const start = Date.now();
      await client.translate('test', 'English');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(500);
    });

    it('should be case insensitive for known words', async () => {
      const result1 = await client.translate('HELLO', 'Chinese');
      const result2 = await client.translate('Hello', 'Chinese');
      const result3 = await client.translate('hello', 'Chinese');

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  describe('polish', () => {
    it('should polish known phrases', async () => {
      const result = await client.polish('i am good');
      expect(result).toBe('I am doing well, thank you.');
    });

    it('should capitalize words for unknown text', async () => {
      const result = await client.polish('hello world');
      expect(result).toBe('Hello World');
    });

    it('should improve simple greetings', async () => {
      const result = await client.polish('thanks');
      expect(result).toContain('Thank');
    });

    it('should handle ok', async () => {
      const result = await client.polish('ok');
      expect(result).toBe('Certainly, that sounds good.');
    });

    it('should add (polished) for unchanged text', async () => {
      const result = await client.polish('Hello World');
      expect(result).toBe('Hello World (polished)');
    });

    it('should add delay to simulate API', async () => {
      const start = Date.now();
      await client.polish('test');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(600);
    });
  });

  describe('updateConfig', () => {
    it('should update config without throwing', () => {
      expect(() => {
        client.updateConfig(DEFAULT_CONFIG);
      }).not.toThrow();
    });
  });
});
