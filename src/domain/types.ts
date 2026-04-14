// ============================================================================
// Domain Entities
// ============================================================================

/**
 * Custom site input selector mapping
 */
export interface SiteMapping {
  id: string;
  name: string;
  urlPattern: string;  // URL pattern (supports wildcards, e.g., *.basecamp.com)
  inputSelectors: string[];  // CSS selectors for input elements
  enabled: boolean;
}

/**
 * Extension configuration stored in Chrome storage
 */
export interface Config {
  // API Configuration
  apiKey: string;
  baseUrl: string;
  model: string;

  // Prompts
  systemPrompt: string;
  userPromptTranslate: string;
  userPromptPolish: string;

  // Trigger patterns
  triggerTranslateT1: string;
  triggerTranslateT2: string;
  triggerPolish: string;

  // Target languages (dual translation support)
  targetLanguageT1: string;
  targetLanguageT2: string;

  // Legacy fields (deprecated, kept for migration)
  targetLanguage?: string;
  triggerTranslate?: string;

  // Settings
  useMock: boolean;

  // Custom site mappings
  siteMappings: SiteMapping[];
}

/**
 * Default site mappings - built-in configurations
 */
export const DEFAULT_SITE_MAPPINGS: SiteMapping[] = [
  {
    id: 'basecamp',
    name: 'Basecamp',
    urlPattern: '*.basecamp.com',
    inputSelectors: ['trix-editor', 'textarea.input--title', '[contenteditable]'],
    enabled: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    urlPattern: '*.notion.site',
    inputSelectors: ['[contenteditable="true"]'],
    enabled: false,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    urlPattern: 'mail.google.com',
    inputSelectors: ['[role="textbox"]', 'div[contenteditable="true"]'],
    enabled: false,
  },
];

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Config = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  systemPrompt: `You are a professional language assistant.
Provide accurate translations and natural, polished text improvements.
Maintain the original meaning while enhancing clarity and flow.

Keep format including space, newline, divider, list and so on.
Detect language in text and Keep original language even mixture.`,
  userPromptTranslate: `Translate the following text to {targetLanguage}:\n\n{text}\n\nOnly return the translated text, no explanations.`,
  userPromptPolish: `Improve and polish the following text for better clarity and flow:\n\n{text}\n\nOnly return the improved text, no explanations.`,
  triggerTranslateT1: '   ',  // Triple space (empty string to disable)
  triggerTranslateT2: '   ',  // Triple space (empty string to disable)
  triggerPolish: '   ',       // Triple space (empty string to disable)
  targetLanguageT1: 'English',
  targetLanguageT2: 'Chinese',
  useMock: true,
  siteMappings: [...DEFAULT_SITE_MAPPINGS],
};

/**
 * History entry tracking user's original inputs
 */
export interface HistoryEntry {
  id: string;
  original: string;
  processed: string;
  type: 'translate' | 'polish';
  timestamp: number;
  metadata?: {
    url?: string;
    elementSelector?: string;
  };
}

// ============================================================================
// Domain Services Interfaces
// ============================================================================

/**
 * Text processing type
 */
export type ProcessType = 'translate' | 'polish';

/**
 * Request to LLM service
 */
export interface LLMRequest {
  text: string;
  type: ProcessType;
  config: Config;
}

/**
 * Response from LLM service
 */
export interface LLMResponse {
  result: string;
  cached: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * Trigger detection result
 */
export interface TriggerResult {
  detected: boolean;
  type?: ProcessType;
  matchedText?: string;
  remainingText?: string;
}

/**
 * Input element metadata
 */
export interface InputElementInfo {
  element: HTMLElement;
  type: 'input' | 'textarea' | 'contenteditable';
  value: string;
  selectionStart?: number;
  selectionEnd?: number;
}

// ============================================================================
// Message Types (Chrome Messaging)
// ============================================================================

export type MessageType =
  | 'GET_CONFIG'
  | 'UPDATE_CONFIG'
  | 'RESET_CONFIG'
  | 'GET_HISTORY'
  | 'ADD_HISTORY'
  | 'CLEAR_HISTORY'
  | 'PROCESS_TEXT'
  | 'PROCESS_TEXT_STREAM'
  | 'CANCEL_STREAM'
  | 'STREAM_CHUNK'
  | 'STREAM_ERROR'
  | 'REPLACE_TEXT'
  | 'PROCESS_DIRECT_TEXT';

export type Message<T = unknown> = {
  type: MessageType;
  payload: T;
  id?: string;
};

export type ProcessTextPayload = {
  text: string;
  type: ProcessType;
  elementInfo?: InputElementInfo;
};

export type ProcessDirectTextPayload = {
  text: string;
  type: 'translate-t1' | 'translate-t2' | 'polish';
};

export type ProcessDirectTextResponse = {
  result: string;
  targetLanguage?: string;
};

export type ReplaceTextPayload = {
  result: string;
  elementInfo: InputElementInfo;
};

export type ProcessTextResponse = {
  result: string;
  historyEntry: HistoryEntry;
};

export type StreamChunk = {
  delta: string;
  done: boolean;
};

export type ProcessTextStreamPayload = {
  text: string;
  type: ProcessType;
  elementInfo?: InputElementInfo;
  tabId?: number;
  frameId?: number;
};

// ============================================================================
// Repository Interfaces
// ============================================================================

/**
 * Config repository interface
 */
export interface IConfigRepository {
  getConfig(): Promise<Config>;
  updateConfig(partial: Partial<Config>): Promise<Config>;
  resetConfig(): Promise<Config>;
  subscribe(callback: (config: Config) => void): () => void;
}

/**
 * History repository interface
 */
export interface IHistoryRepository {
  addEntry(entry: HistoryEntry): Promise<void>;
  getHistory(limit?: number): Promise<HistoryEntry[]>;
  clearHistory(): Promise<void>;
  subscribe(callback: (entries: HistoryEntry[]) => void): () => void;
}

// ============================================================================
// LLM Client Interface
// ============================================================================

/**
 * LLM client interface
 */
export interface ILLMClient {
  translate(text: string, targetLanguage: string): Promise<string>;
  polish(text: string): Promise<string>;
  translateStream(text: string, targetLanguage: string): AsyncIterable<string>;
  polishStream(text: string): AsyncIterable<string>;
  isAvailable(): boolean;
  getModel(): string;
}

/**
 * LLM client factory interface
 */
export interface ILLMClientFactory {
  create(config: Config): ILLMClient;
}

// ============================================================================
// Message Bus Interface
// ============================================================================

export type MessageHandler<T = unknown, R = unknown> = (payload: T) => Promise<R>;

export interface IMessageBus {
  send<T, R>(type: MessageType, payload: T): Promise<R>;
  onMessage<T, R>(type: MessageType, handler: MessageHandler<T, R>): () => void;
  broadcast<T>(type: MessageType, payload: T): Promise<void>;
}

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  CONFIG: 'tingly-polish-config',
  HISTORY: 'tingly-polish-history',
  CACHE: 'tingly-polish-cache',
} as const;

// ============================================================================
// Constants
// ============================================================================

export const TRIGGER_DEBOUNCE_MS = 300;
export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
export const MAX_HISTORY_ENTRIES = 100;
export const MAX_CACHE_SIZE = 50;

export const DEFAULT_TARGET_LANGUAGES = [
  'English',
  'Chinese',
  'Japanese',
  'Korean',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Arabic',
  'Hindi',
] as const;

/**
 * Check if a URL matches a pattern (supports wildcards)
 * @param url - The URL to check
 * @param pattern - The pattern to match against (e.g., *.basecamp.com, github.com/*)
 * @returns true if the URL matches the pattern
 */
export function matchesUrlPattern(url: string, pattern: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;

    // Convert pattern to regex
    let regexPattern = pattern
      .replace(/\./g, '\\.')  // Escape dots
      .replace(/\*/g, '.*');   // Convert wildcards to .*

    // If pattern contains a slash, include pathname matching
    if (pattern.includes('/')) {
      const [patternDomain, ...patternPathParts] = pattern.split('/');
      const patternPath = patternPathParts.join('/');

      const domainRegex = new RegExp(`^${patternDomain.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
      if (!domainRegex.test(hostname)) {
        return false;
      }

      const pathRegex = new RegExp(`^${patternPath.replace(/\*/g, '.*')}$`);
      return pathRegex.test(pathname);
    }

    // Domain-only matching
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(hostname);
  } catch {
    return false;
  }
}

/**
 * Get input selectors for the current URL based on site mappings
 * @param url - The current page URL
 * @param siteMappings - Array of site mappings
 * @returns Array of CSS selectors for input elements
 */
export function getInputSelectorsForUrl(url: string, siteMappings: SiteMapping[]): string[] {
  // Default selectors
  const defaultSelectors = [
    'input[type="text"]',
    'input[type="search"]',
    'input:not([type])',
    'textarea',
    '[contenteditable]',
    'trix-editor',
  ];

  // Find matching site mappings
  const matchingMappings = siteMappings.filter(
    mapping => mapping.enabled && matchesUrlPattern(url, mapping.urlPattern)
  );

  if (matchingMappings.length === 0) {
    return defaultSelectors;
  }

  // Merge selectors from all matching mappings (avoid duplicates)
  const customSelectors = matchingMappings.flatMap(m => m.inputSelectors);
  const uniqueSelectors = Array.from(new Set([...defaultSelectors, ...customSelectors]));

  return uniqueSelectors;
}
