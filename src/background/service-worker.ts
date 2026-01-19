import { ChromeConfigRepository, ChromeHistoryRepository } from '../infrastructure/storage/ChromeStorageAdapter.js';
import { LLMClientFactory } from '../infrastructure/llm/LLMClients.js';
import { ChromeMessageBus, MessageTopics } from '../infrastructure/messaging/MessageBus.js';
import type { Config, HistoryEntry, ProcessTextPayload } from '../domain/types.js';
import { textProcessor } from '../domain/services/TextProcessor.js';

/**
 * Background Service Worker
 * Coordinates between content scripts, popup, and LLM service
 */
class ServiceWorker {
  private configRepository: ChromeConfigRepository;
  private historyRepository: ChromeHistoryRepository;
  private messageBus: ChromeMessageBus;
  private llmClient: ReturnType<typeof LLMClientFactory.create> | null = null;
  private currentConfig: Config | null = null;

  constructor() {
    this.configRepository = new ChromeConfigRepository();
    this.historyRepository = new ChromeHistoryRepository();
    this.messageBus = new ChromeMessageBus();

    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load initial config
    this.currentConfig = await this.configRepository.getConfig();

    // Initialize LLM client
    this.updateLLMClient();

    // Setup message handlers
    this.setupMessageHandlers();

    // Subscribe to config changes
    this.configRepository.subscribe((config) => {
      this.currentConfig = config;
      this.updateLLMClient();
    });

    console.log('Tingly Polish: Service Worker initialized');
  }

  private updateLLMClient(): void {
    if (!this.currentConfig) {
      return;
    }

    this.llmClient = LLMClientFactory.create(this.currentConfig);
    console.log(
      'Tingly Polish: LLM Client updated',
      'model:',
      this.llmClient.getModel()
    );
  }

  private setupMessageHandlers(): void {
    // Config handlers
    this.messageBus.onMessage<unknown, Config>(
      MessageTopics.GET_CONFIG,
      async () => {
        return await this.configRepository.getConfig();
      }
    );

    this.messageBus.onMessage<Partial<Config>, Config>(
      MessageTopics.UPDATE_CONFIG,
      async (partial) => {
        return await this.configRepository.updateConfig(partial);
      }
    );

    this.messageBus.onMessage<unknown, Config>(
      MessageTopics.RESET_CONFIG,
      async () => {
        return await this.configRepository.resetConfig();
      }
    );

    // History handlers
    this.messageBus.onMessage<unknown, HistoryEntry[]>(
      MessageTopics.GET_HISTORY,
      async () => {
        return await this.historyRepository.getHistory();
      }
    );

    this.messageBus.onMessage<HistoryEntry, void>(
      MessageTopics.ADD_HISTORY,
      async (entry) => {
        await this.historyRepository.addEntry(entry);
      }
    );

    this.messageBus.onMessage<unknown, void>(
      MessageTopics.CLEAR_HISTORY,
      async () => {
        await this.historyRepository.clearHistory();
      }
    );

    // Processing handler
    this.messageBus.onMessage<ProcessTextPayload, { result: string }>(
      MessageTopics.PROCESS_TEXT,
      async (payload) => {
        return await this.processText(payload);
      }
    );
  }

  /**
   * Process text for translation or polish
   */
  private async processText(payload: ProcessTextPayload): Promise<{ result: string }> {
    const { text, type, elementInfo } = payload;

    if (!this.currentConfig || !this.llmClient) {
      throw new Error('Extension not properly configured');
    }

    try {
      let result: string;

      if (type === 'translate') {
        result = await this.llmClient.translate(
          text,
          this.currentConfig.targetLanguage
        );
      } else {
        result = await this.llmClient.polish(text);
      }

      // Save to history
      const historyEntry: HistoryEntry = {
        id: textProcessor.generateId(text),
        original: text,
        processed: result,
        type,
        timestamp: Date.now(),
        metadata: elementInfo ? {
          url: elementInfo.url,
          elementSelector: elementInfo.elementSelector,
        } : undefined,
      };

      await this.historyRepository.addEntry(historyEntry);

      return { result };
    } catch (error) {
      console.error('Tingly Polish: Processing failed', error);
      throw error;
    }
  }
}

// Initialize service worker
new ServiceWorker();

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Tingly Polish: Extension installed');
    // Open welcome page or show notification
  } else if (details.reason === 'update') {
    console.log('Tingly Polish: Extension updated');
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Tingly Polish: Extension started');
});

export default ServiceWorker;
