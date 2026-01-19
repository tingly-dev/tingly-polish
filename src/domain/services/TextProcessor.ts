/**
 * Service for processing and sanitizing text
 */
export class TextProcessor {
  /**
   * Normalize text for processing (trim, normalize whitespace)
   * @param text - Text to normalize
   * @returns Normalized text
   */
  normalize(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFC');
  }

  /**
   * Truncate text to maximum length with ellipsis
   * @param text - Text to truncate
   * @param maxLength - Maximum length
   * @returns Truncated text
   */
  truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Extract text content from HTML safely
   * @param html - HTML string
   * @returns Plain text content
   */
  htmlToText(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.textContent ?? '';
  }

  /**
   * Escape HTML to prevent XSS
   * @param text - Text to escape
   * @returns Escaped HTML
   */
  escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, char => map[char]);
  }

  /**
   * Sanitize text for display in DOM
   * @param text - Text to sanitize
   * @returns Sanitized text
   */
  sanitize(text: string): string {
    return this.escapeHtml(text);
  }

  /**
   * Check if text contains only whitespace
   * @param text - Text to check
   * @returns True if text is empty or only whitespace
   */
  isEmpty(text: string): boolean {
    return text.trim().length === 0;
  }

  /**
   * Count words in text
   * @param text - Text to count words in
   * @returns Word count
   */
  countWords(text: string): number {
    const trimmed = text.trim();
    if (trimmed.length === 0) return 0;
    return trimmed.split(/\s+/).length;
  }

  /**
   * Check if text exceeds word count limit
   * @param text - Text to check
   * @param maxWords - Maximum word count
   * @returns True if exceeds limit
   */
  exceedsWordLimit(text: string, maxWords: number): boolean {
    return this.countWords(text) > maxWords;
  }

  /**
   * Create a snippet of text for preview
   * @param text - Full text
   * @param maxLength - Maximum length of snippet
   * @returns Text snippet
   */
  createSnippet(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Generate a unique ID for text (hash-based)
   * @param text - Text to hash
   * @returns Hash string
   */
  generateId(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `text-${Math.abs(hash)}-${Date.now()}`;
  }
}

/**
 * Singleton instance
 */
export const textProcessor = new TextProcessor();
