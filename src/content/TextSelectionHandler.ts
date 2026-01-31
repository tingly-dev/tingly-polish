/**
 * Handles text selection and floating action button
 */
export class TextSelectionHandler {
  private static instance: TextSelectionHandler | null = null;
  private floatingButton: HTMLElement | null = null;
  private hideTimeout: number | null = null;
  private config: {
    targetLanguage: string;
  } = {
    targetLanguage: 'English',
  };
  private currentInputElement: HTMLInputElement | HTMLTextAreaElement | null = null;
  private selectionRange: { start: number; end: number } | null = null;
  private streamingInProgress: boolean = false;
  private streamingPreview: HTMLElement | null = null;

  constructor() {
    // Prevent multiple instances
    if (TextSelectionHandler.instance) {
      console.warn('Tingly Polish: TextSelectionHandler already exists, reusing existing instance');
      return;
    }

    this.loadConfig();
    this.setupSelectionListener();
    this.setupConfigListener();
    this.setupStreamListener();
    TextSelectionHandler.instance = this;
    console.log('Tingly Polish: TextSelectionHandler initialized');
  }

  /**
   * Get or create the singleton instance
   */
  static getInstance(): TextSelectionHandler {
    if (!TextSelectionHandler.instance) {
      TextSelectionHandler.instance = new TextSelectionHandler();
    }
    return TextSelectionHandler.instance;
  }

  /**
   * Clean up the instance
   */
  static destroy(): void {
    if (TextSelectionHandler.instance) {
      const instance = TextSelectionHandler.instance;
      if (instance.floatingButton) {
        instance.floatingButton.remove();
        instance.floatingButton = null;
      }
      if (instance.streamingPreview) {
        instance.streamingPreview.remove();
        instance.streamingPreview = null;
      }
      instance.streamingInProgress = false;
      TextSelectionHandler.instance = null;
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CONFIG',
        payload: {},
      });

      if (response?.data) {
        this.config = {
          targetLanguage: response.data.targetLanguage,
        };
      }
    } catch {
      // Use defaults if config not available
    }
  }

  private setupConfigListener(): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes['tingly-polish-config']) {
        const newConfig = changes['tingly-polish-config'].newValue;
        if (newConfig) {
          this.config = {
            targetLanguage: newConfig.targetLanguage,
          };
        }
      }
    });
  }

  private setupStreamListener(): void {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'STREAM_CHUNK') {
        this.handleStreamChunk(message.payload);
      } else if (message.type === 'STREAM_ERROR') {
        this.handleStreamError(message.payload);
      }
    });
  }

  private setupSelectionListener(): void {
    document.addEventListener('mouseup', () => {
      this.handleSelection();
    });

    document.addEventListener('selectionchange', () => {
      this.handleSelection();
    });

    // Also listen for select event on input/textarea elements
    document.addEventListener('select', (e) => {
      const target = e.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        console.log('Tingly Polish: Select event on input', { tagName: target.tagName });
        this.handleSelection();
      }
    }, true); // Use capture phase

    // Listen for keyup events that might change selection in input/textarea
    document.addEventListener('keyup', (e) => {
      const target = e.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        // Only handle shift + arrow keys which create selections
        if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                          e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
                          e.key === 'Home' || e.key === 'End')) {
          console.log('Tingly Polish: Keyup selection on input', { key: e.key });
          this.handleSelection();
        }
      }
    }, true);
  }

  private handleSelection(): void {
    // First check if we have selection in input/textarea
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
      const start = activeElement.selectionStart ?? 0;
      const end = activeElement.selectionEnd ?? 0;

      if (start !== end) {
        const selectedText = activeElement.value.substring(start, end).trim();
        if (selectedText.length >= 2) {
          // Save reference to the input element and selection range
          this.currentInputElement = activeElement;
          this.selectionRange = { start, end };
          this.showFloatingButton(selectedText);
          return;
        }
      }

      // Clear references if no valid selection
      this.currentInputElement = null;
      this.selectionRange = null;
      this.scheduleHide();
      return;
    }

    // For regular text, don't show the button
    this.scheduleHide();
  }

  private showFloatingButton(text: string): void {
    // Clear any pending hide
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Create or update floating button
    if (!this.floatingButton) {
      this.createFloatingButton();
    }

    this.positionFloatingButton();
    this.floatingButton.style.display = 'flex';
    this.floatingButton.dataset.selectedText = text;
  }

  private createFloatingButton(): void {
    // Remove existing button if present to prevent duplicates
    const existingButton = document.getElementById('tingly-polish-floating-button');
    if (existingButton) {
      existingButton.remove();
    }

    const button = document.createElement('div');
    button.id = 'tingly-polish-floating-button';
    button.innerHTML = `
      <button class="tingly-action-btn tingly-translate-btn" title="Translate">T</button>
      <button class="tingly-action-btn tingly-polish-btn" title="Polish">P</button>
      <button class="tingly-close-btn" title="Close">×</button>
    `;

    // Add styles
    const existingStyle = document.getElementById('tingly-polish-floating-button-style');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'tingly-polish-floating-button-style';
      style.textContent = `
      #tingly-polish-floating-button {
        position: absolute;
        display: none;
        gap: 4px;
        padding: 6px;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid #334155;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.3);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        pointer-events: auto;
      }

      #tingly-polish-floating-button .tingly-action-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
        border: 1px solid #475569;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
        color: #e2e8f0;
        padding: 0;
        font-size: 16px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      #tingly-polish-floating-button .tingly-action-btn:hover {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        border-color: #6366f1;
        color: #ffffff;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      }

      #tingly-polish-floating-button .tingly-polish-btn:hover {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        border-color: #14b8a6;
        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
      }

      #tingly-polish-floating-button .tingly-close-btn {
        width: 28px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
        color: #94a3b8;
        font-size: 18px;
        font-weight: 300;
        padding: 0;
        line-height: 1;
      }

      #tingly-polish-floating-button .tingly-close-btn:hover {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }
    `;

      document.head.appendChild(style);
    }

    document.body.appendChild(button);

    // Event listeners - store references for cleanup
    const translateBtn = button.querySelector('.tingly-translate-btn') as HTMLButtonElement;
    const polishBtn = button.querySelector('.tingly-polish-btn') as HTMLButtonElement;
    const closeBtn = button.querySelector('.tingly-close-btn') as HTMLButtonElement;

    if (translateBtn) {
      translateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleAction('translate');
      });
    }

    if (polishBtn) {
      polishBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleAction('polish');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hideFloatingButton();
      });
    }

    this.floatingButton = button;
    console.log('Tingly Polish: Floating button created and event listeners attached');
  }

  private positionFloatingButton(): void {
    if (!this.floatingButton) return;

    // Check if we're positioning for an input/textarea element
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
      const rect = activeElement.getBoundingClientRect();
      const buttonWidth = 140;
      const buttonHeight = 48;

      // Position button above the input element
      let left = rect.left + rect.width / 2 - buttonWidth / 2;
      let top = rect.top - buttonHeight - 8;

      // Keep button within viewport bounds
      const padding = 16;
      left = Math.max(padding, Math.min(left, window.innerWidth - buttonWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - buttonHeight - padding));

      this.floatingButton.style.left = `${left + window.scrollX}px`;
      this.floatingButton.style.top = `${top + window.scrollY}px`;
      return;
    }

    // Handle regular text selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position button above the selection
    const buttonWidth = 140;
    const buttonHeight = 48;

    let left = rect.left + rect.width / 2 - buttonWidth / 2;
    let top = rect.top - buttonHeight - 8;

    // Keep button within viewport bounds
    const padding = 16;
    left = Math.max(padding, Math.min(left, window.innerWidth - buttonWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - buttonHeight - padding));

    this.floatingButton.style.left = `${left + window.scrollX}px`;
    this.floatingButton.style.top = `${top + window.scrollY}px`;
  }

  private scheduleHide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.hideTimeout = window.setTimeout(() => {
      this.hideFloatingButton();
    }, 200);
  }

  private hideFloatingButton(): void {
    if (this.floatingButton) {
      this.floatingButton.style.display = 'none';
    }
  }

  private async handleAction(type: 'translate' | 'polish'): Promise<void> {
    if (!this.floatingButton) return;

    const selectedText = this.floatingButton.dataset.selectedText;
    if (!selectedText) return;

    console.log('Tingly Polish: Processing selected text', { type, selectedText });

    try {
      // Show loading state on the button
      this.showLoading();
      this.streamingInProgress = true;

      // Create streaming preview
      this.showStreamingPreview();

      // Send to background for streaming processing
      console.log('Tingly Polish: Sending PROCESS_TEXT_STREAM message');
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_TEXT_STREAM',
        payload: {
          text: selectedText,
          type,
        },
      });

      // Check if the streaming request was initiated successfully
      if (response && response.success === false) {
        console.error('Tingly Polish: Stream request failed', response.error);
        // Fallback to non-streaming
        await this.handleNonStreamingRequest(selectedText, type);
      }
      // If success is true or undefined, streaming is in progress
    } catch (error) {
      console.error('Tingly Polish: Failed to send stream request', error);
      // Fallback to non-streaming
      try {
        await this.handleNonStreamingRequest(selectedText, type);
      } catch (fallbackError) {
        console.error('Tingly Polish: Fallback also failed', fallbackError);
        alert('Failed to process text. Please try again.');
        this.cleanupStreaming();
      }
    }
  }

  private async handleNonStreamingRequest(
    selectedText: string,
    type: 'translate' | 'polish'
  ): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_TEXT',
        payload: {
          text: selectedText,
          type,
        },
      });

      console.log('Tingly Polish: Received response', response);

      if (response?.data?.result) {
        // Replace the selected text
        this.replaceSelectedText(response.data.result);
        // Hide button after successful replacement
        this.hideFloatingButton();
      } else {
        console.error('Tingly Polish: No result in response', response);
      }
    } catch (error) {
      console.error('Tingly Polish: Failed to process selected text', error);
      alert('Failed to process text. Please try again.');
    } finally {
      this.cleanupStreaming();
    }
  }

  private handleStreamChunk(payload: { delta: string; accumulated: string; done: boolean }): void {
    if (!this.streamingInProgress) return;

    const { delta, accumulated, done } = payload;

    // Update preview
    this.updateStreamingPreview(accumulated);

    if (done) {
      console.log('Tingly Polish: Stream completed');
      // Replace the selected text with final result
      this.replaceSelectedText(accumulated);
      this.cleanupStreaming();
      this.hideFloatingButton();
    }
  }

  private handleStreamError(payload: { error: string }): void {
    console.error('Tingly Polish: Stream error', payload);
    alert(`Processing failed: ${payload.error}`);
    this.cleanupStreaming();
  }

  private showStreamingPreview(): void {
    // Remove existing preview
    if (this.streamingPreview) {
      this.streamingPreview.remove();
    }

    const preview = document.createElement('div');
    preview.id = 'tingly-polish-streaming-preview';
    preview.className = 'tingly-polish-streaming-preview';

    // Add preview styles
    const existingStyle = document.getElementById('tingly-polish-streaming-preview-style');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'tingly-polish-streaming-preview-style';
      style.textContent = `
        .tingly-polish-streaming-preview {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid #334155;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.3);
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #e2e8f0;
          padding: 16px;
          min-width: 300px;
          max-width: 500px;
          max-height: 300px;
          overflow-y: auto;
        }

        .tingly-polish-streaming-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #334155;
        }

        .tingly-polish-streaming-preview-title {
          font-size: 14px;
          font-weight: 600;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tingly-polish-streaming-preview-indicator {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .tingly-polish-streaming-preview-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
          line-height: 1;
          border-radius: 4px;
          transition: all 0.15s ease;
        }

        .tingly-polish-streaming-preview-close:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .tingly-polish-streaming-preview-content {
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .tingly-polish-streaming-preview-content::after {
          content: '|';
          animation: blink 1s step-end infinite;
          color: #6366f1;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    preview.innerHTML = `
      <div class="tingly-polish-streaming-preview-header">
        <div class="tingly-polish-streaming-preview-title">
          <div class="tingly-polish-streaming-preview-indicator"></div>
          Processing...
        </div>
        <button class="tingly-polish-streaming-preview-close">×</button>
      </div>
      <div class="tingly-polish-streaming-preview-content"></div>
    `;

    // Add close button handler
    const closeBtn = preview.querySelector('.tingly-polish-streaming-preview-close') as HTMLButtonElement;
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.cleanupStreaming();
      });
    }

    document.body.appendChild(preview);
    this.streamingPreview = preview;
  }

  private updateStreamingPreview(text: string): void {
    if (this.streamingPreview) {
      const content = this.streamingPreview.querySelector('.tingly-polish-streaming-preview-content');
      if (content) {
        content.textContent = text;
        // Auto-scroll to bottom
        content.scrollTop = content.scrollHeight;
      }
    }
  }

  private cleanupStreaming(): void {
    this.streamingInProgress = false;
    if (this.streamingPreview) {
      this.streamingPreview.remove();
      this.streamingPreview = null;
    }
    this.hideLoading();
  }

  private replaceSelectedText(text: string): void {
    // Use the saved input element reference
    const inputElement = this.currentInputElement;
    const range = this.selectionRange;

    // Handle input and textarea elements
    if (inputElement && range) {
      const currentValue = inputElement.value;

      // Replace selected text with new text
      inputElement.value = currentValue.substring(0, range.start) + text + currentValue.substring(range.end);

      // Update cursor position
      const newPosition = range.start + text.length;
      inputElement.selectionStart = inputElement.selectionEnd = newPosition;

      // Trigger input event
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));

      // Clear references
      this.currentInputElement = null;
      this.selectionRange = null;
      return;
    }

    // Fallback: try to use active element
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
      const start = activeElement.selectionStart ?? 0;
      const end = activeElement.selectionEnd ?? 0;
      const currentValue = activeElement.value;

      // Replace selected text with new text
      activeElement.value = currentValue.substring(0, start) + text + currentValue.substring(end);

      // Update cursor position
      activeElement.selectionStart = activeElement.selectionEnd = start + text.length;

      // Trigger input event
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
  }

  private showLoading(): void {
    // Show loading indicator on the floating button
    if (this.floatingButton) {
      this.floatingButton.style.opacity = '0.6';
      this.floatingButton.style.pointerEvents = 'none';
    }
  }

  private hideLoading(): void {
    if (this.floatingButton) {
      this.floatingButton.style.opacity = '1';
      this.floatingButton.style.pointerEvents = 'auto';
    }
  }
}
