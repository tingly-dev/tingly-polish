import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '../../src/domain/services/PromptBuilder';
import { DEFAULT_CONFIG } from '../../src/domain/types';

describe('PromptBuilder', () => {
  let builder: PromptBuilder;
  let mockConfig: typeof DEFAULT_CONFIG;

  beforeEach(() => {
    builder = new PromptBuilder();
    mockConfig = { ...DEFAULT_CONFIG };
  });

  describe('buildTranslatePrompt', () => {
    it('should build translation prompt with variables replaced', () => {
      const result = builder.buildTranslatePrompt('Hello world', mockConfig);

      expect(result.type).toBe('translate');
      expect(result.text).toBe('Hello world');
      expect(result.config.userPromptTranslate).toContain('Hello world');
      expect(result.config.userPromptTranslate).toContain('English');
    });

    it('should use target language from config', () => {
      mockConfig.targetLanguage = 'Spanish';
      const result = builder.buildTranslatePrompt('Hola', mockConfig);

      expect(result.config.userPromptTranslate).toContain('Spanish');
    });

    it('should preserve system prompt', () => {
      const result = builder.buildTranslatePrompt('test', mockConfig);

      expect(result.config.systemPrompt).toBe(mockConfig.systemPrompt);
    });
  });

  describe('buildPolishPrompt', () => {
    it('should build polish prompt with text replaced', () => {
      const result = builder.buildPolishPrompt('this is a test', mockConfig);

      expect(result.type).toBe('polish');
      expect(result.text).toBe('this is a test');
      expect(result.config.userPromptPolish).toContain('this is a test');
    });

    it('should preserve system prompt', () => {
      const result = builder.buildPolishPrompt('test', mockConfig);

      expect(result.config.systemPrompt).toBe(mockConfig.systemPrompt);
    });
  });

  describe('interpolateVariables', () => {
    it('should replace single variable', () => {
      const template = 'Translate: {text}';
      const result = builder['interpolateVariables'](template, { text: 'hello' });

      expect(result).toBe('Translate: hello');
    });

    it('should replace multiple variables', () => {
      const template = 'From {text} to {targetLanguage}';
      const result = builder['interpolateVariables'](template, {
        text: 'hello',
        targetLanguage: 'Spanish',
      });

      expect(result).toBe('From hello to Spanish');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Translate: {text} to {targetLanguage}';
      const result = builder['interpolateVariables'](template, { text: 'hello' });

      expect(result).toBe('Translate: hello to {targetLanguage}');
    });

    it('should handle repeated variables', () => {
      const template = '{text} - {text} - {text}';
      const result = builder['interpolateVariables'](template, { text: 'test' });

      expect(result).toBe('test - test - test');
    });
  });

  describe('escapePromptText', () => {
    it('should escape backslashes', () => {
      const result = builder.escapePromptText('test\\text');
      expect(result).toBe('test\\\\text');
    });

    it('should escape quotes', () => {
      const result = builder.escapePromptText('test"text');
      expect(result).toBe('test\\"text');
    });

    it('should escape newlines', () => {
      const result = builder.escapePromptText('test\ntext');
      expect(result).toBe('test\\ntext');
    });

    it('should escape carriage returns', () => {
      const result = builder.escapePromptText('test\rtext');
      expect(result).toBe('test\\rtext');
    });
  });

  describe('validateTemplate', () => {
    it('should validate template with all required variables', () => {
      const template = 'Process {text} for {language}';
      const result = builder.validateTemplate(template, ['text', 'language']);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should detect missing required variables', () => {
      const template = 'Process {text}';
      const result = builder.validateTemplate(template, ['text', 'language']);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('language');
    });

    it('should handle no required variables', () => {
      const template = 'Simple template';
      const result = builder.validateTemplate(template, []);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should ignore extra variables in template', () => {
      const template = 'Process {text} with {extra}';
      const result = builder.validateTemplate(template, ['text']);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });
});
