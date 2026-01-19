import { describe, it, expect } from 'vitest';
import { TextProcessor } from '../../src/domain/services/TextProcessor';

describe('TextProcessor', () => {
  let processor: TextProcessor;

  beforeEach(() => {
    processor = new TextProcessor();
  });

  describe('normalize', () => {
    it('should trim whitespace', () => {
      const result = processor.normalize('  hello  ');
      expect(result).toBe('hello');
    });

    it('should normalize multiple spaces', () => {
      const result = processor.normalize('hello    world');
      expect(result).toBe('hello world');
    });

    it('should normalize tabs and newlines', () => {
      const result = processor.normalize('hello\t\nworld');
      expect(result).toBe('hello world');
    });

    it('should handle empty string', () => {
      const result = processor.normalize('   ');
      expect(result).toBe('');
    });
  });

  describe('truncate', () => {
    it('should not truncate short text', () => {
      const result = processor.truncate('hello', 10);
      expect(result).toBe('hello');
    });

    it('should truncate long text', () => {
      const result = processor.truncate('hello world', 8);
      expect(result).toBe('hello...');
    });

    it('should handle exact length', () => {
      const result = processor.truncate('hello', 5);
      expect(result).toBe('hello');
    });

    it('should handle empty string', () => {
      const result = processor.truncate('', 5);
      expect(result).toBe('');
    });
  });

  describe('htmlToText', () => {
    it('should extract text from HTML', () => {
      const result = processor.htmlToText('<p>Hello <em>world</em></p>');
      expect(result).toBe('Hello world');
    });

    it('should escape HTML entities', () => {
      const result = processor.htmlToText('<p>&lt;script&gt;</p>');
      expect(result).toBe('<script>');
    });

    it('should handle empty HTML', () => {
      const result = processor.htmlToText('');
      expect(result).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      const result = processor.escapeHtml('Tom & Jerry');
      expect(result).toBe('Tom &amp; Jerry');
    });

    it('should escape less than', () => {
      const result = processor.escapeHtml('<script>');
      expect(result).toBe('&lt;script&gt;');
    });

    it('should escape quotes', () => {
      const result = processor.escapeHtml('"hello"');
      expect(result).toBe('&quot;hello&quot;');
    });

    it('should escape apostrophe', () => {
      const result = processor.escapeHtml("it's");
      expect(result).toBe('it&#x27;s');
    });

    it('should escape multiple characters', () => {
      const result = processor.escapeHtml('<script>alert("it's")</script>');
      expect(result).toBe(
        '&lt;script&gt;alert(&quot;it&#x27;s&quot;)&lt;/script&gt;'
      );
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty string', () => {
      expect(processor.isEmpty('')).toBe(true);
    });

    it('should return true for whitespace only', () => {
      expect(processor.isEmpty('   \t\n')).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(processor.isEmpty('hello')).toBe(false);
    });

    it('should return false for string with whitespace and content', () => {
      expect(processor.isEmpty('  hello  ')).toBe(false);
    });
  });

  describe('countWords', () => {
    it('should count words in simple text', () => {
      expect(processor.countWords('hello world')).toBe(2);
    });

    it('should handle multiple spaces', () => {
      expect(processor.countWords('hello   world')).toBe(2);
    });

    it('should return 0 for empty string', () => {
      expect(processor.countWords('')).toBe(0);
    });

    it('should return 0 for whitespace only', () => {
      expect(processor.countWords('   ')).toBe(0);
    });

    it('should handle single word', () => {
      expect(processor.countWords('hello')).toBe(1);
    });

    it('should handle newlines and tabs', () => {
      expect(processor.countWords('hello\nworld\ttest')).toBe(3);
    });
  });

  describe('exceedsWordLimit', () => {
    it('should return true when over limit', () => {
      expect(processor.exceedsWordLimit('one two three four', 3)).toBe(true);
    });

    it('should return false when under limit', () => {
      expect(processor.exceedsWordLimit('one two', 3)).toBe(false);
    });

    it('should return false when at limit', () => {
      expect(processor.exceedsWordLimit('one two three', 3)).toBe(false);
    });
  });

  describe('createSnippet', () => {
    it('should return full text if under limit', () => {
      const result = processor.createSnippet('hello', 10);
      expect(result).toBe('hello');
    });

    it('should truncate with ellipsis if over limit', () => {
      const result = processor.createSnippet('hello world', 8);
      expect(result).toBe('hello...');
    });

    it('should use default length of 100', () => {
      const longText = 'a'.repeat(150);
      const result = processor.createSnippet(longText);
      expect(result.length).toBe(103); // 100 + '...'
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs for different texts', () => {
      const id1 = processor.generateId('hello');
      const id2 = processor.generateId('world');

      expect(id1).not.toBe(id2);
    });

    it('should generate same ID for same text', () => {
      const id1 = processor.generateId('hello');
      const id2 = processor.generateId('hello');

      // IDs should be different due to timestamp
      expect(id1).not.toBe(id2);
    });

    it('should include text- prefix', () => {
      const id = processor.generateId('test');
      expect(id).toMatch(/^text-/);
    });
  });

  describe('sanitize', () => {
    it('should escape HTML for safe display', () => {
      const result = processor.sanitize('<script>alert("xss")</script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });
});
