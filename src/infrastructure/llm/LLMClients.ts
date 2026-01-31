import type { ILLMClient } from '../../domain/types.js';
import type { Config } from '../../domain/types.js';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

/**
 * OpenAI-compatible LLM client adapter using ai-sdk/openai
 * This SDK provides automatic streaming with clean API
 */
export class OpenAIAdapter implements ILLMClient {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  updateConfig(config: Config): void {
    this.config = config;
  }

  isAvailable(): boolean {
    return !!this.config.apiKey;
  }

  getModel(): string {
    return this.config.model;
  }

  private createClient() {
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    return createOpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
    });
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    const userPrompt = this.config.userPromptTranslate
      .replace('{text}', text)
      .replace('{targetLanguage}', targetLanguage);

    console.log('Tingly Polish: translate API request', {
      systemPrompt: this.config.systemPrompt,
      systemPromptLength: this.config.systemPrompt?.length,
      userPrompt: userPrompt,
      userPromptLength: userPrompt?.length,
      model: this.config.model,
      baseUrl: this.config.baseUrl,
    });

    // Validate inputs
    if (!this.config.systemPrompt || this.config.systemPrompt.trim().length === 0) {
      console.error('Tingly Polish: systemPrompt is empty!');
      throw new Error('System prompt is required but not configured');
    }
    if (!userPrompt || userPrompt.trim().length === 0) {
      console.error('Tingly Polish: userPrompt is empty!');
      throw new Error('User prompt is required but not provided');
    }

    try {
      const client = this.createClient();
      const result = await generateText({
        model: client.chat(this.config.model),
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        onFinish: ({ text, usage, finishReason }) => {
          console.log('Tingly Polish: Translation finished', {
            textLength: text?.length ?? 0,
            usage,
            finishReason,
          });
        },
      });
      return result.text ?? text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Translation failed: ${error.message}`);
      }
      throw new Error('Translation failed: Unknown error');
    }
  }

  async polish(text: string): Promise<string> {
    const userPrompt = this.config.userPromptPolish.replace('{text}', text);

    console.log('Tingly Polish: polish API request', {
      systemPrompt: this.config.systemPrompt,
      systemPromptLength: this.config.systemPrompt?.length,
      userPrompt: userPrompt,
      userPromptLength: userPrompt?.length,
      model: this.config.model,
      baseUrl: this.config.baseUrl,
    });

    // Validate inputs
    if (!this.config.systemPrompt || this.config.systemPrompt.trim().length === 0) {
      console.error('Tingly Polish: systemPrompt is empty!');
      throw new Error('System prompt is required but not configured');
    }
    if (!userPrompt || userPrompt.trim().length === 0) {
      console.error('Tingly Polish: userPrompt is empty!');
      throw new Error('User prompt is required but not provided');
    }

    try {
      const client = this.createClient();
      const result = await generateText({
        model: client.chat(this.config.model),
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        onFinish: ({ text, usage, finishReason }) => {
          console.log('Tingly Polish: Polish finished', {
            textLength: text?.length ?? 0,
            usage,
            finishReason,
          });
        },
      });
      return result.text ?? text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Polish failed: ${error.message}`);
      }
      throw new Error('Polish failed: Unknown error');
    }
  }

  async *translateStream(text: string, targetLanguage: string): AsyncIterable<string> {
    const userPrompt = this.config.userPromptTranslate
      .replace('{text}', text)
      .replace('{targetLanguage}', targetLanguage);

    console.log('Tingly Polish: translateStream API request', {
      systemPrompt: this.config.systemPrompt,
      systemPromptLength: this.config.systemPrompt?.length,
      userPrompt: userPrompt,
      userPromptLength: userPrompt?.length,
      model: this.config.model,
      baseUrl: this.config.baseUrl,
    });

    // Validate inputs
    if (!this.config.systemPrompt || this.config.systemPrompt.trim().length === 0) {
      console.error('Tingly Polish: systemPrompt is empty!');
      throw new Error('System prompt is required but not configured');
    }
    if (!userPrompt || userPrompt.trim().length === 0) {
      console.error('Tingly Polish: userPrompt is empty!');
      throw new Error('User prompt is required but not provided');
    }

    try {
      const client = this.createClient();
      const result = await streamText({
        model: client.chat(this.config.model),
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        onFinish: ({ text, usage, finishReason }) => {
          console.log('Tingly Polish: Translation stream finished', {
            textLength: text?.length ?? 0,
            usage,
            finishReason,
          });
        },
      });
      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Translation streaming failed: ${error.message}`);
      }
      throw new Error('Translation streaming failed: Unknown error');
    }
  }

  async *polishStream(text: string): AsyncIterable<string> {
    const userPrompt = this.config.userPromptPolish.replace('{text}', text);

    console.log('Tingly Polish: polishStream API request', {
      systemPrompt: this.config.systemPrompt,
      systemPromptLength: this.config.systemPrompt?.length,
      userPrompt: userPrompt,
      userPromptLength: userPrompt?.length,
      model: this.config.model,
      baseUrl: this.config.baseUrl,
    });

    // Validate inputs
    if (!this.config.systemPrompt || this.config.systemPrompt.trim().length === 0) {
      console.error('Tingly Polish: systemPrompt is empty!');
      throw new Error('System prompt is required but not configured');
    }
    if (!userPrompt || userPrompt.trim().length === 0) {
      console.error('Tingly Polish: userPrompt is empty!');
      throw new Error('User prompt is required but not provided');
    }

    try {
      const client = this.createClient();
      const result = await streamText({
        model: client.chat(this.config.model),
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        onFinish: ({ text, usage, finishReason }) => {
          console.log('Tingly Polish: Polish stream finished', {
            textLength: text?.length ?? 0,
            usage,
            finishReason,
          });
        },
      });

      let chunkCount = 0;
      for await (const chunk of result.textStream) {
        chunkCount++;
        if (chunkCount === 1) {
          console.log('Tingly Polish: First chunk received:', chunk);
        }
        if (chunkCount % 10 === 0) {
          console.log(`Tingly Polish: ${chunkCount} chunks received from AI SDK`);
        }
        yield chunk;
      }
      console.log(`Tingly Polish: Total chunks from AI SDK: ${chunkCount}`);
    } catch (error) {
      console.error('Tingly Polish: Stream error:', error);
      if (error instanceof Error) {
        throw new Error(`Polish streaming failed: ${error.message}`);
      }
      throw new Error('Polish streaming failed: Unknown error');
    }
  }
}

/**
 * Mock LLM client for development and testing
 * Returns simulated responses without making API calls
 */
export class MockLLMClient implements ILLMClient {
  private config: Config;

  constructor(config: Config = {
    apiKey: 'mock-key',
    baseUrl: 'https://mock.example.com',
    model: 'mock-model',
    systemPrompt: '',
    userPromptTranslate: '',
    userPromptPolish: '',
    triggerTranslate: '   ',
    triggerPolish: '   ',
    useMock: true,
    targetLanguage: 'English',
  }) {
    this.config = config;
  }

  updateConfig(config: Config): void {
    this.config = config;
  }

  isAvailable(): boolean {
    return true; // Mock is always available
  }

  getModel(): string {
    return 'mock-model';
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    // Simulate API delay
    await this.delay(500 + Math.random() * 500);

    const translations: Record<string, Record<string, string>> = {
      'hello': {
        'Chinese': '你好',
        'Japanese': 'こんにちは',
        'Korean': '안녕하세요',
        'Spanish': 'Hola',
        'French': 'Bonjour',
        'German': 'Hallo',
        'English': 'Hello',
      },
      'world': {
        'Chinese': '世界',
        'Japanese': '世界',
        'Korean': '세계',
        'Spanish': 'mundo',
        'French': 'monde',
        'German': 'Welt',
        'English': 'World',
      },
    };

    const lowerText = text.toLowerCase().trim();

    // Check for exact match
    if (translations[lowerText]?.[targetLanguage]) {
      return translations[lowerText][targetLanguage];
    }

    // Generic mock translation
    const prefixes: Record<string, string> = {
      'Chinese': '【译】',
      'Japanese': '【訳】',
      'Korean': '【역】',
      'Spanish': '【Trad】',
      'French': '【Trad】',
      'German': '【Übers】',
      'English': '【Trans】',
    };

    const prefix = prefixes[targetLanguage] || '【Trans】';
    return `${prefix} ${text} (${targetLanguage})`;
  }

  async polish(text: string): Promise<string> {
    // Simulate API delay
    await this.delay(600 + Math.random() * 600);

    // Mock polish improvements
    const improvements: Record<string, string> = {
      'i am good': 'I am doing well, thank you.',
      'hello world': 'Hello, World!',
      'thanks': 'Thank you very much for your assistance.',
      'ok': 'Certainly, that sounds good.',
      'please help': 'I would greatly appreciate your assistance with this matter.',
    };

    const lowerText = text.toLowerCase().trim();

    if (improvements[lowerText]) {
      return improvements[lowerText];
    }

    // Generic mock polish
    const polished = text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return polished === text
      ? `${text} (polished)`
      : polished;
  }

  async *translateStream(text: string, targetLanguage: string): AsyncIterable<string> {
    // Simulate streaming with chunks
    const result = await this.translate(text, targetLanguage);
    const chunkSize = 5;

    for (let i = 0; i < result.length; i += chunkSize) {
      await this.delay(50);
      yield result.substring(i, i + chunkSize);
    }
  }

  async *polishStream(text: string): AsyncIterable<string> {
    // Simulate streaming with chunks
    const result = await this.polish(text);
    const chunkSize = 5;

    for (let i = 0; i < result.length; i += chunkSize) {
      await this.delay(50);
      yield result.substring(i, i + chunkSize);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * LLM Client Factory
 * Creates appropriate client based on configuration
 */
export class LLMClientFactory {
  static create(config: Config): ILLMClient {
    if (config.useMock || !config.apiKey) {
      return new MockLLMClient(config);
    }

    return new OpenAIAdapter(config);
  }

  static createMock(): MockLLMClient {
    return new MockLLMClient();
  }

  static createOpenAI(config: Config): OpenAIAdapter {
    return new OpenAIAdapter(config);
  }
}
