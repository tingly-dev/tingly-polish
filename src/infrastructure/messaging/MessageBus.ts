import type { IMessageBus, MessageType, MessageHandler } from '../../domain/types.js';

/**
 * Chrome Message Bus Adapter
 * Handles communication between different extension contexts
 */
export class ChromeMessageBus implements IMessageBus {
  private handlers: Map<MessageType, Set<MessageHandler>> = new Map();

  constructor() {
    this.setupMessageListener();
  }

  /**
   * Send a message and wait for response
   */
  async send<T, R>(type: MessageType, payload: T): Promise<R> {
    try {
      const response = await chrome.runtime.sendMessage({
        type,
        payload,
        id: this.generateId(),
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      return response.data as R;
    } catch (error) {
      // Handle case when extension context is invalid (e.g., popup closed)
      if (error instanceof Error && error.message.includes('Extension context')) {
        throw new Error('Extension context unavailable. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Register a handler for a specific message type
   * Returns unsubscribe function
   */
  onMessage<T, R>(type: MessageType, handler: MessageHandler<T, R>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type)!.add(handler);

    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Broadcast a message to all listeners
   */
  async broadcast<T>(type: MessageType, payload: T): Promise<void> {
    const handlers = this.handlers.get(type);
    if (handlers) {
      await Promise.all(
        Array.from(handlers).map(handler => handler(payload as unknown))
      );
    }
  }

  /**
   * Setup Chrome runtime message listener
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const { type, payload } = message;

      const handlers = this.handlers.get(type as MessageType);
      if (handlers && handlers.size > 0) {
        // Get the first handler (for request/response pattern)
        const handler = Array.from(handlers)[0];

        handler(payload)
          .then(data => {
            sendResponse({ data, error: null });
          })
          .catch(error => {
            sendResponse({
              data: null,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });

        return true; // Keep message channel open for async response
      }

      sendResponse({
        data: null,
        error: `No handler registered for message type: ${type}`,
      });

      return false;
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Message types for type-safe messaging
 */
export const MessageTopics = {
  // Config messages
  GET_CONFIG: 'GET_CONFIG' as MessageType,
  UPDATE_CONFIG: 'UPDATE_CONFIG' as MessageType,
  RESET_CONFIG: 'RESET_CONFIG' as MessageType,

  // History messages
  GET_HISTORY: 'GET_HISTORY' as MessageType,
  ADD_HISTORY: 'ADD_HISTORY' as MessageType,
  CLEAR_HISTORY: 'CLEAR_HISTORY' as MessageType,

  // Processing messages
  PROCESS_TEXT: 'PROCESS_TEXT' as MessageType,
  PROCESS_TEXT_STREAM: 'PROCESS_TEXT_STREAM' as MessageType,
  PROCESS_DIRECT_TEXT: 'PROCESS_DIRECT_TEXT' as MessageType,
  REPLACE_TEXT: 'REPLACE_TEXT' as MessageType,
} as const;
