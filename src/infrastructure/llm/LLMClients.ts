import type { ILLMClient } from '../../domain/types.js';
import type { Config } from '../../domain/types.js';
import OpenAI from 'openai';

/**
 * OpenAI-compatible LLM client adapter
 * Supports OpenAI API and compatible services (Azure, local models, etc.)
 */
export class OpenAIAdapter implements ILLMClient {
  private client: OpenAI | null = null;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.initializeClient();
  }

  private initializeClient(): void {
    if (!this.config.apiKey || this.config.useMock) {
      this.client = null;
      return;
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
      dangerouslyAllowBrowser: true, // For extension context
    });
  }

  updateConfig(config: Config): void {
    this.config = config;
    this.initializeClient();
  }

  isAvailable(): boolean {
    return this.client !== null && !!this.config.apiKey;
  }

  getModel(): string {
    return this.config.model;
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    if (!this.client) {
      throw new Error('LLM client not available. Check API key configuration.');
    }

    const systemPrompt = this.config.systemPrompt;
    const userPrompt = this.config.userPromptTranslate
      .replace('{text}', text)
      .replace('{targetLanguage}', targetLanguage);

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      return response.choices[0]?.message?.content ?? text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Translation failed: ${error.message}`);
      }
      throw new Error('Translation failed: Unknown error');
    }
  }

  async polish(text: string): Promise<string> {
    if (!this.client) {
      throw new Error('LLM client not available. Check API key configuration.');
    }

    const systemPrompt = this.config.systemPrompt;
    const userPrompt = this.config.userPromptPolish.replace('{text}', text);

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return response.choices[0]?.message?.content ?? text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Polish failed: ${error.message}`);
      }
      throw new Error('Polish failed: Unknown error');
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
