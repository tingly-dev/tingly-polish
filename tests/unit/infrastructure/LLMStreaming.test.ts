import { describe, it, expect } from 'vitest';
import { OpenAIAdapter, MockLLMClient } from '../../../src/infrastructure/llm/LLMClients';

describe('LLM Streaming Tests', () => {
  describe('MockLLMClient Streaming', () => {
    it('should stream translation in chunks', async () => {
      const client = new MockLLMClient();
      const chunks: string[] = [];

      for await (const chunk of client.translateStream('hello', 'Chinese')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      const result = chunks.join('');
      expect(result).toContain('你好');
    });

    it('should stream polish in chunks', async () => {
      const client = new MockLLMClient();
      const chunks: string[] = [];

      for await (const chunk of client.polishStream('hello world')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      const result = chunks.join('');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('OpenAIAdapter Streaming with Tingly Proxy', () => {
    it('should stream translation using real API', { timeout: 30000 }, async () => {
      const config = {
        apiKey: 'tingly-box-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJ0ZXN0LWNsaWVudCIsImV4cCI6MTc2NjQwMzQwNSwiaWF0IjoxNzY2MzE3MDA1fQ.AHtmsHxGGJ0jtzvrTZMHC3kfl3Os94HOhMA-zXFtHXQ',
        baseUrl: 'http://localhost:12580/tingly/openai',
        model: 'tingly-gpt',
        systemPrompt: 'You are a helpful assistant.',
        userPromptTranslate: 'Translate to {targetLanguage}: {text}',
        userPromptPolish: 'Polish: {text}',
        triggerTranslate: '   ',
        triggerPolish: '   ',
        useMock: false,
        targetLanguage: 'English',
      };

      const client = new OpenAIAdapter(config);
      const chunks: string[] = [];

      for await (const chunk of client.translateStream('Hello', 'Chinese')) {
        chunks.push(chunk);
        console.log('Chunk:', chunk);
      }

      const result = chunks.join('');
      console.log('Final result:', result);
      expect(chunks.length).toBeGreaterThan(0);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should stream polish using real API', { timeout: 30000 }, async () => {
      const config = {
        apiKey: 'tingly-box-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJ0ZXN0LWNsaWVudCIsImV4cCI6MTc2NjQwMzQwNSwiaWF0IjoxNzY2MzE3MDA1fQ.AHtmsHxGGJ0jtzvrTZMHC3kfl3Os94HOhMA-zXFtHXQ',
        baseUrl: 'http://localhost:12580/tingly/openai',
        model: 'tingly-gpt',
        systemPrompt: 'You are a helpful assistant.',
        userPromptTranslate: 'Translate to {targetLanguage}: {text}',
        userPromptPolish: 'Polish this text: {text}',
        triggerTranslate: '   ',
        triggerPolish: '   ',
        useMock: false,
        targetLanguage: 'English',
      };

      const client = new OpenAIAdapter(config);
      const chunks: string[] = [];

      for await (const chunk of client.polishStream('i am good')) {
        chunks.push(chunk);
        console.log('Chunk:', chunk);
      }

      const result = chunks.join('');
      console.log('Final result:', result);
      expect(chunks.length).toBeGreaterThan(0);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
