import type { Config, LLMRequest } from '../types.js';

/**
 * Service for building prompts for LLM requests
 */
export class PromptBuilder {
  /**
   * Build prompt for translation
   * @param text - Text to translate
   * @param config - Configuration containing prompts
   * @returns Complete LLM request
   */
  buildTranslatePrompt(text: string, config: Config): LLMRequest {
    const userPrompt = this.interpolateVariables(
      config.userPromptTranslate,
      {
        text,
        targetLanguage: config.targetLanguage,
      }
    );

    return {
      text,
      type: 'translate',
      config: {
        ...config,
        userPromptTranslate: userPrompt,
      },
    };
  }

  /**
   * Build prompt for polish
   * @param text - Text to polish
   * @param config - Configuration containing prompts
   * @returns Complete LLM request
   */
  buildPolishPrompt(text: string, config: Config): LLMRequest {
    const userPrompt = this.interpolateVariables(
      config.userPromptPolish,
      { text }
    );

    return {
      text,
      type: 'polish',
      config: {
        ...config,
        userPromptPolish: userPrompt,
      },
    };
  }

  /**
   * Interpolate variables in prompt template
   * @param template - Prompt template with {variable} placeholders
   * @param variables - Object containing variable values
   * @returns Interpolated string
   */
  private interpolateVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] ?? match;
    });
  }

  /**
   * Escape special characters in text for prompt safety
   * @param text - Text to escape
   * @returns Escaped text
   */
  escapePromptText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  /**
   * Validate prompt template variables
   * @param template - Template to validate
   * @param requiredVars - Required variable names
   * @returns True if all required variables are present
   */
  validateTemplate(
    template: string,
    requiredVars: string[]
  ): { valid: boolean; missing: string[] } {
    const foundVars = template.match(/\{(\w+)\}/g) ?? [];
    const foundVarNames = foundVars.map(v => v.slice(1, -1));

    const missing = requiredVars.filter(v => !foundVarNames.includes(v));

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

/**
 * Singleton instance
 */
export const promptBuilder = new PromptBuilder();
