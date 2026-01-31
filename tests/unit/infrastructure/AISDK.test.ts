import { describe, it, expect } from 'vitest';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

const API_KEY = 'tingly-box-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJ0ZXN0LWNsaWVudCIsImV4cCI6MTc2NjQwMzQwNSwiaWF0IjoxNzY2MzE3MDA1fQ.AHtmsHxGGJ0jtzvrTZMHC3kfl3Os94HOhMA-zXFtHXQ';
const BASE_URL = 'http://localhost:12580/tingly/openai';
const MODEL = 'tingly-gpt';

describe('AI SDK Integration Tests', () => {
  describe('generateText with chat() factory', () => {
    it('should work with chat model factory', async () => {
      const client = createOpenAI({
        apiKey: API_KEY,
        baseURL: BASE_URL,
      });

      const result = await generateText({
        model: client.chat(MODEL),
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "test successful"' },
        ],
      });

      expect(result.text).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(0);
      console.log('Result with chat():', result.text);
    }, 30000);
  });

  describe('streamText with chat() factory', () => {
    it('should work with streaming', async () => {
      const client = createOpenAI({
        apiKey: API_KEY,
        baseURL: BASE_URL,
      });

      const result = await streamText({
        model: client.chat(MODEL),
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "stream test successful"' },
        ],
      });

      const chunks: string[] = [];
      for await (const chunk of result.textStream) {
        chunks.push(chunk);
      }

      const fullText = chunks.join('');
      expect(fullText).toBeTruthy();
      expect(fullText.length).toBeGreaterThan(0);
      expect(chunks.length).toBeGreaterThan(0);
      console.log('Streamed result:', fullText);
      console.log('Number of chunks:', chunks.length);
    }, 30000);
  });

  describe('generateText with system/prompt using chat()', () => {
    it('should work with system and prompt parameters', async () => {
      const client = createOpenAI({
        apiKey: API_KEY,
        baseURL: BASE_URL,
      });

      const result = await generateText({
        model: client.chat(MODEL),
        system: 'You are a helpful assistant.',
        prompt: 'Say "format test successful"',
      });

      expect(result.text).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(0);
      console.log('Result with system/prompt:', result.text);
    }, 30000);
  });

  describe('streamText with system/prompt using chat()', () => {
    it('should work with streaming using system and prompt', async () => {
      const client = createOpenAI({
        apiKey: API_KEY,
        baseURL: BASE_URL,
      });

      const result = await streamText({
        model: client.chat(MODEL),
        system: 'You are a helpful assistant.',
        prompt: 'Count from 1 to 5',
      });

      const chunks: string[] = [];
      for await (const chunk of result.textStream) {
        chunks.push(chunk);
      }

      const fullText = chunks.join('');
      expect(fullText).toBeTruthy();
      expect(fullText.length).toBeGreaterThan(0);
      expect(chunks.length).toBeGreaterThan(0);
      console.log('Streamed result with system/prompt:', fullText);
      console.log('Number of chunks:', chunks.length);
    }, 30000);
  });
});
