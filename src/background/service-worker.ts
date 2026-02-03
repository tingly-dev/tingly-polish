import { ChromeConfigRepository, ChromeHistoryRepository } from '../infrastructure/storage/ChromeStorageAdapter.js';
import { LLMClientFactory } from '../infrastructure/llm/LLMClients.js';
import { ChromeMessageBus, MessageTopics } from '../infrastructure/messaging/MessageBus.js';
import type { Config, HistoryEntry, ProcessTextPayload, SerializableElementInfo } from '../domain/types.js';
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

    // Streaming processing handler
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'PROCESS_TEXT_STREAM') {
        // Get tab ID from sender (content scripts have a tab property)
        const tabId = sender.tab?.id;

        if (!tabId) {
          sendResponse({
            success: false,
            error: 'Could not determine tab ID',
          });
          return false;
        }

        this.processTextStream(message.payload, tabId)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch(error => {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
        return true; // Keep channel open for async response
      }

      if (message.type === 'OPEN_SETTINGS') {
        // Open settings page in a new tab
        chrome.tabs.create({
          url: chrome.runtime.getURL('src/settings/index.html'),
        }).then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to open settings',
          });
        });
        return true; // Keep channel open for async response
      }

      return false;
    });
  }

  /**
   * Process text for translation or polish
   */
  private async processText(payload: ProcessTextPayload): Promise<{ result: string }> {
    const { text, type, elementInfoSerializable } = payload;

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
        metadata: elementInfoSerializable ? {
          url: elementInfoSerializable.url,
          elementSelector: elementInfoSerializable.elementSelector,
        } : undefined,
      };

      await this.historyRepository.addEntry(historyEntry);

      return { result };
    } catch (error) {
      console.error('Tingly Polish: Processing failed', error);
      throw error;
    }
  }

  /**
   * Process text for translation or polish with streaming
   */
  private async processTextStream(
    payload: ProcessTextPayload,
    tabId: number
  ): Promise<void> {
    const { text, type } = payload;

    console.log('Tingly Polish: Starting stream processing', { text, type, tabId });

    if (!this.currentConfig || !this.llmClient) {
      const error = 'Extension not properly configured';
      console.error('Tingly Polish:', error);
      throw new Error(error);
    }

    try {
      let stream: AsyncIterable<string>;

      if (type === 'translate') {
        console.log('Tingly Polish: Starting translate stream');
        stream = this.llmClient.translateStream(
          text,
          this.currentConfig.targetLanguage
        );
      } else {
        console.log('Tingly Polish: Starting polish stream');
        stream = this.llmClient.polishStream(text);
      }

      let accumulatedResult = '';
      let chunkCount = 0;

      // Stream chunks to content script
      for await (const chunk of stream) {
        chunkCount++;
        accumulatedResult += chunk;

        if (chunkCount % 10 === 0) {
          console.log(`Tingly Polish: Sent ${chunkCount} chunks, accumulated length: ${accumulatedResult.length}`);
        }

        try {
          await chrome.tabs.sendMessage(tabId, {
            type: 'STREAM_CHUNK',
            payload: {
              delta: chunk,
              accumulated: accumulatedResult,
              done: false,
            },
          });
        } catch (sendError) {
          // Tab might be closed, ignore error
          console.warn('Tingly Polish: Failed to send chunk to tab', sendError);
          break;
        }
      }

      console.log(`Tingly Polish: Stream completed with ${chunkCount} chunks`);

      // Send completion signal
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: 'STREAM_CHUNK',
          payload: {
            delta: '',
            accumulated: accumulatedResult,
            done: true,
          },
        });
      } catch (sendError) {
        console.warn('Tingly Polish: Failed to send completion signal', sendError);
      }

      // Save to history after completion
      const historyEntry: HistoryEntry = {
        id: textProcessor.generateId(text),
        original: text,
        processed: accumulatedResult,
        type,
        timestamp: Date.now(),
      };

      await this.historyRepository.addEntry(historyEntry);
      console.log('Tingly Polish: History entry saved');
    } catch (error) {
      console.error('Tingly Polish: Streaming processing failed', error);

      // Send error to content script
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: 'STREAM_ERROR',
          payload: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } catch (sendError) {
        console.warn('Tingly Polish: Failed to send error to tab', sendError);
      }

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
    // Open settings page on install
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/settings/index.html'),
    });
  } else if (details.reason === 'update') {
    console.log('Tingly Polish: Extension updated');
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Tingly Polish: Extension started');
});

export default ServiceWorker;
