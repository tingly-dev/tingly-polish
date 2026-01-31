// ============================================================================
// Domain Entities
// ============================================================================

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

  // Trigger patterns (default: triple space)
  triggerTranslate: string;
  triggerPolish: string;

  // Settings
  useMock: boolean;
  targetLanguage: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Config = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  systemPrompt: `You are a professional language assistant. Provide accurate translations and natural, polished text improvements. Maintain the original meaning while enhancing clarity and flow.`,
  userPromptTranslate: `Translate the following text to {targetLanguage}:\n\n{text}\n\nOnly return the translated text, no explanations.`,
  userPromptPolish: `Improve and polish the following text for better clarity and flow:\n\n{text}\n\nOnly return the improved text, no explanations.`,
  triggerTranslate: '   ',  // Triple space
  triggerPolish: '   ',     // Triple space (will be distinguished by key combo)
  useMock: true,
  targetLanguage: 'English',
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
  | 'REPLACE_TEXT';

export type Message<T = unknown> = {
  type: MessageType;
  payload: T;
  id?: string;
};

export type ProcessTextPayload = {
  text: string;
  type: ProcessType;
  elementInfo?: InputElementInfo;
  elementInfoSerializable?: SerializableElementInfo;
};

export type ReplaceTextPayload = {
  result: string;
  elementInfo: InputElementInfo;
};

export type SerializableElementInfo = {
  type: 'input' | 'textarea' | 'contenteditable';
  value: string;
  selectionStart?: number;
  selectionEnd?: number;
  elementSelector?: string;
  url?: string;
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
