import { positionNearSelection, getSelectionRect, getInputSelectionRect, FLOATING_STYLES } from './FloatingUI.js';

/**
 * Handles text selection and floating action buttons
 * Singleton pattern ensures only one instance and one preview at a time
 */
export class TextSelectionHandler {
  private static instance: TextSelectionHandler | null = null;

  // UI elements
  private buttonsContainer: HTMLElement | null = null;
  private translateT1Button: HTMLButtonElement | null = null;
  private translateT2Button: HTMLButtonElement | null = null;
  private polishButton: HTMLButtonElement | null = null;
  private streamingPreview: HTMLElement | null = null;

  // State
  private hideTimeout: number | null = null;
  private config = { targetLanguageT1: 'English', targetLanguageT2: 'Chinese' };
  private currentInputElement: HTMLInputElement | HTMLTextAreaElement | null = null;
  private selectionRange: { start: number; end: number } | null = null;
  private currentSelectionRect: DOMRect | null = null;
  private streamingInProgress = false;
  private customReplaceHandler: ((result: string) => void) | null = null;
  private cleanupCallback: (() => void) | null = null;
  private currentStreamId = '';
  private abortController: AbortController | null = null;
  private currentTargetLanguage: string | undefined = undefined;

  private constructor() {
    this.loadConfig();
    this.setupSelectionListener();
    this.setupConfigListener();
    this.setupStreamListener();
    this.ensureStyles();
  }

  static getInstance(): TextSelectionHandler {
    if (!TextSelectionHandler.instance) {
      TextSelectionHandler.instance = new TextSelectionHandler();
    }
    return TextSelectionHandler.instance;
  }

  static destroy(): void {
    if (TextSelectionHandler.instance) {
      const instance = TextSelectionHandler.instance;
      instance.cleanup();
      TextSelectionHandler.instance = null;
    }
  }

  private cleanup(): void {
    if (this.buttonsContainer) {
      this.buttonsContainer.remove();
      this.buttonsContainer = null;
    }
    if (this.streamingPreview) {
      this.streamingPreview.remove();
      this.streamingPreview = null;
    }
    this.translateT1Button = null;
    this.translateT2Button = null;
    this.polishButton = null;
    this.streamingInProgress = false;
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CONFIG',
        payload: {},
      });
      if (response?.data) {
        this.config.targetLanguageT1 = response.data.targetLanguageT1 || 'English';
        this.config.targetLanguageT2 = response.data.targetLanguageT2 || 'Chinese';
      }
    } catch {
      // Use defaults
    }
  }

  private setupConfigListener(): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes['tingly-polish-config']) {
        const newConfig = changes['tingly-polish-config'].newValue;
        if (newConfig) {
          this.config.targetLanguageT1 = newConfig.targetLanguageT1 || 'English';
          this.config.targetLanguageT2 = newConfig.targetLanguageT2 || 'Chinese';
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
    // Mouse up for regular text selection
    document.addEventListener('mouseup', () => {
      this.handleSelection();
    });

    // Selection change event
    document.addEventListener('selectionchange', () => {
      this.handleSelection();
    });

    // Select event on input/textarea
    document.addEventListener('select', (e) => {
      const target = e.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        this.handleSelection();
      }
    }, true);

    // Keyboard selection in input/textarea
    document.addEventListener('keyup', (e) => {
      const target = e.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        if (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
          this.handleSelection();
        }
      }
    }, true);
  }

  private handleSelection(): void {
    // Don't interfere with streaming
    if (this.streamingInProgress) {
      return;
    }

    const activeElement = document.activeElement;

    // Check for input/textarea selection
    if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
      const start = activeElement.selectionStart ?? 0;
      const end = activeElement.selectionEnd ?? 0;

      if (start !== end) {
        const selectedText = activeElement.value.substring(start, end).trim();
        if (selectedText.length >= 2) {
          this.currentInputElement = activeElement;
          this.selectionRange = { start, end };
          this.currentSelectionRect = getInputSelectionRect(activeElement);
          this.showFloatingButtons(selectedText);
          return;
        }
      }

      this.clearInputSelection();
      this.scheduleHide();
      return;
    }

    // Handle regular text selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString().trim();
      if (selectedText.length >= 2) {
        const rect = getSelectionRect();
        if (rect) {
          this.currentSelectionRect = rect;
          this.currentInputElement = null;
          this.selectionRange = null;
          this.showFloatingButtons(selectedText);
          return;
        }
      }
    }

    this.scheduleHide();
  }

  private clearInputSelection(): void {
    this.currentInputElement = null;
    this.selectionRange = null;
  }

  private showFloatingButtons(text: string): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (!this.buttonsContainer) {
      this.createFloatingButtons();
    }

    this.positionButtons();
    this.buttonsContainer!.style.display = 'flex';

    if (this.translateT1Button) {
      this.translateT1Button.dataset.selectedText = text;
    }
    if (this.translateT2Button) {
      this.translateT2Button.dataset.selectedText = text;
    }
    if (this.polishButton) {
      this.polishButton.dataset.selectedText = text;
    }
  }

  private createFloatingButtons(): void {
    const existing = document.getElementById('tingly-polish-buttons');
    if (existing) {
      existing.remove();
    }

    const container = document.createElement('div');
    container.id = 'tingly-polish-buttons';
    container.innerHTML = `
      <button class="tingly-btn tingly-btn-t1" title="Translate T1">
        <span>T1</span>
      </button>
      <button class="tingly-btn tingly-btn-t2" title="Translate T2">
        <span>T2</span>
      </button>
      <button class="tingly-btn tingly-btn-polish" title="Polish">
        <span>P</span>
      </button>
    `;

    container.style.cssText = FLOATING_STYLES.container + FLOATING_STYLES.buttons;

    document.body.appendChild(container);

    const t1Btn = container.querySelector('.tingly-btn-t1') as HTMLButtonElement;
    const t2Btn = container.querySelector('.tingly-btn-t2') as HTMLButtonElement;
    const polishBtn = container.querySelector('.tingly-btn-polish') as HTMLButtonElement;

    t1Btn.style.cssText = FLOATING_STYLES.button + FLOATING_STYLES.translateButton;
    t2Btn.style.cssText = FLOATING_STYLES.button + FLOATING_STYLES.translateButton.replace('#6366f1', '#8b5cf6').replace('#4f46e5', '#7c3aed');
    polishBtn.style.cssText = FLOATING_STYLES.button + FLOATING_STYLES.polishButton;

    t1Btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleActionWithLanguage('translate', this.config.targetLanguageT1);
    });

    t2Btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleActionWithLanguage('translate', this.config.targetLanguageT2);
    });

    polishBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleAction('polish');
    });

    this.buttonsContainer = container;
    this.translateT1Button = t1Btn;
    this.translateT2Button = t2Btn;
    this.polishButton = polishBtn;
  }

  private positionButtons(): void {
    if (!this.buttonsContainer || !this.currentSelectionRect) {
      return;
    }

    const pos = positionNearSelection(this.buttonsContainer, this.currentSelectionRect, {
      position: 'above',
      gap: 8,
    });

    this.buttonsContainer.style.left = `${pos.left}px`;
    this.buttonsContainer.style.top = `${pos.top}px`;
  }

  private scheduleHide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.hideTimeout = window.setTimeout(() => {
      this.hideFloatingButtons();
    }, 200);
  }

  private hideFloatingButtons(): void {
    if (this.buttonsContainer) {
      this.buttonsContainer.style.display = 'none';
    }
  }

  private async handleAction(type: 'translate' | 'polish', text?: string): Promise<void> {
    const selectedText = text ||
      this.translateT1Button?.dataset.selectedText ||
      this.translateT2Button?.dataset.selectedText ||
      this.polishButton?.dataset.selectedText;

    if (!selectedText) return;

    try {
      this.showLoading();
      this.streamingInProgress = true;
      this.showStreamingPreview();

      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_TEXT_STREAM',
        payload: {
          text: selectedText,
          type,
          streamId: this.currentStreamId,
          targetLanguage: this.currentTargetLanguage,
        },
      });

      if (response && response.success === false) {
        await this.handleNonStreamingRequest(selectedText, type);
      }
    } catch (error) {
      console.error('Tingly Polish: Failed to process text', error);
      try {
        await this.handleNonStreamingRequest(selectedText, type);
      } catch {
        this.cleanupStreaming();
      }
    }
  }

  private async handleActionWithLanguage(type: 'translate' | 'polish', targetLanguage: string, text?: string): Promise<void> {
    const selectedText = text ||
      this.translateT1Button?.dataset.selectedText ||
      this.translateT2Button?.dataset.selectedText ||
      this.polishButton?.dataset.selectedText;

    if (!selectedText) return;

    // Set the target language for this request
    this.currentTargetLanguage = targetLanguage;

    try {
      this.showLoading();
      this.streamingInProgress = true;
      this.showStreamingPreview();

      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_TEXT_STREAM',
        payload: {
          text: selectedText,
          type,
          streamId: this.currentStreamId,
          targetLanguage: targetLanguage,
        },
      });

      if (response && response.success === false) {
        await this.handleNonStreamingRequest(selectedText, type);
      }
    } catch (error) {
      console.error('Tingly Polish: Failed to process text', error);
      try {
        await this.handleNonStreamingRequest(selectedText, type);
      } catch {
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
          targetLanguage: this.currentTargetLanguage,
        },
      });

      if (response?.data?.result) {
        this.replaceSelectedText(response.data.result);
        this.hideFloatingButtons();
      }
    } finally {
      this.cleanupStreaming();
    }
  }

  private handleStreamChunk(payload: { delta: string; accumulated: string; done: boolean }): void {
    if (!this.streamingInProgress) return;

    const { accumulated, done } = payload;
    this.updateStreamingPreview(accumulated);

    if (done) {
      this.showStreamingCompleted(accumulated);
      this.streamingInProgress = false;
      this.hideLoading();
    }
  }

  private handleStreamError(payload: { error: string }): void {
    console.error('Tingly Polish: Stream error', payload);
    this.cleanupStreaming();
  }

  private showStreamingPreview(): void {
    // Remove existing preview - ensure singleton
    if (this.streamingPreview) {
      this.streamingPreview.remove();
      this.streamingPreview = null;
    }

    this.currentStreamId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.abortController = new AbortController();

    const preview = document.createElement('div');
    preview.id = 'tingly-polish-preview';
    preview.className = 'tingly-polish-preview';
    preview.style.cssText = FLOATING_STYLES.preview;

    preview.innerHTML = `
      <div class="tingly-preview-header">
        <div class="tingly-preview-title">
          <div class="tingly-preview-indicator"></div>
          <span class="tingly-preview-status">Processing...</span>
        </div>
        <div class="tingly-preview-actions">
          <button class="tingly-btn-cancel" title="Cancel">Cancel</button>
          <button class="tingly-btn-close" title="Close">&times;</button>
        </div>
      </div>
      <div class="tingly-preview-content tingly-streaming"></div>
    `;

    // Position near selection
    if (this.currentSelectionRect) {
      const pos = positionNearSelection(preview, this.currentSelectionRect, {
        position: 'below',
        gap: 12,
      });
      preview.style.left = `${pos.left}px`;
      preview.style.top = `${pos.top}px`;
    }

    // Event handlers
    const cancelBtn = preview.querySelector('.tingly-btn-cancel');
    const closeBtn = preview.querySelector('.tingly-btn-close');

    cancelBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.cancelStreaming();
    });

    closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.cancelStreaming();
    });

    document.body.appendChild(preview);
    this.streamingPreview = preview;
  }

  private updateStreamingPreview(text: string): void {
    if (!this.streamingPreview) return;

    const content = this.streamingPreview.querySelector('.tingly-preview-content');
    if (content) {
      content.textContent = text;
      content.scrollTop = content.scrollHeight;
    }
  }

  private showStreamingCompleted(result: string): void {
    if (!this.streamingPreview) return;

    const statusText = this.streamingPreview.querySelector('.tingly-preview-status');
    const indicator = this.streamingPreview.querySelector('.tingly-preview-indicator');
    const content = this.streamingPreview.querySelector('.tingly-preview-content');
    const actionsContainer = this.streamingPreview.querySelector('.tingly-preview-actions');

    if (statusText) statusText.textContent = 'Completed';
    if (indicator) indicator.classList.add('tingly-completed');
    if (content) content.classList.remove('tingly-streaming');

    if (actionsContainer) {
      actionsContainer.innerHTML = `
        <button class="tingly-btn-copy" title="Copy">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button class="tingly-btn-replace">Replace</button>
        <button class="tingly-btn-close" title="Close">&times;</button>
      `;

      const copyBtn = actionsContainer.querySelector('.tingly-btn-copy');
      const replaceBtn = actionsContainer.querySelector('.tingly-btn-replace');
      const closeBtn = actionsContainer.querySelector('.tingly-btn-close');

      copyBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.copyResultToClipboard(result);
      });

      replaceBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.customReplaceHandler) {
          this.customReplaceHandler(result);
          this.customReplaceHandler = null;
        } else {
          this.replaceSelectedText(result);
          this.hideFloatingButtons();
        }
        this.cleanupStreaming();
      });

      closeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.cleanupStreaming();
      });
    }
  }

  private async copyResultToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      const copyBtn = this.streamingPreview?.querySelector('.tingly-btn-copy');
      if (copyBtn) {
        copyBtn.classList.add('copied');
        setTimeout(() => copyBtn.classList.remove('copied'), 1500);
      }
    } catch (error) {
      console.error('Tingly Polish: Failed to copy', error);
    }
  }

  private cleanupStreaming(): void {
    this.streamingInProgress = false;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.currentStreamId = '';

    if (this.cleanupCallback) {
      this.cleanupCallback();
      this.cleanupCallback = null;
    }

    this.customReplaceHandler = null;
    this.currentTargetLanguage = undefined;

    if (this.streamingPreview) {
      this.streamingPreview.remove();
      this.streamingPreview = null;
    }

    this.hideLoading();
  }

  private async cancelStreaming(): Promise<void> {
    if (this.currentStreamId) {
      try {
        await chrome.runtime.sendMessage({
          type: 'CANCEL_STREAM',
          payload: { streamId: this.currentStreamId },
        });
      } catch (error) {
        console.error('Tingly Polish: Failed to cancel stream', error);
      }
    }
    this.cleanupStreaming();
  }

  private replaceSelectedText(text: string): void {
    // Handle input/textarea
    if (this.currentInputElement && this.selectionRange) {
      const element = this.currentInputElement;
      const { start, end } = this.selectionRange;
      const currentValue = element.value;

      element.value = currentValue.substring(0, start) + text + currentValue.substring(end);
      element.selectionStart = element.selectionEnd = start + text.length;
      element.dispatchEvent(new Event('input', { bubbles: true }));

      this.currentInputElement = null;
      this.selectionRange = null;
      return;
    }

    // Handle regular text selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode(text);

      range.deleteContents();
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  private showLoading(): void {
    if (this.translateT1Button) {
      this.translateT1Button.style.opacity = '0.6';
      this.translateT1Button.style.pointerEvents = 'none';
    }
    if (this.translateT2Button) {
      this.translateT2Button.style.opacity = '0.6';
      this.translateT2Button.style.pointerEvents = 'none';
    }
    if (this.polishButton) {
      this.polishButton.style.opacity = '0.6';
      this.polishButton.style.pointerEvents = 'none';
    }
  }

  private hideLoading(): void {
    if (this.translateT1Button) {
      this.translateT1Button.style.opacity = '1';
      this.translateT1Button.style.pointerEvents = 'auto';
    }
    if (this.translateT2Button) {
      this.translateT2Button.style.opacity = '1';
      this.translateT2Button.style.pointerEvents = 'auto';
    }
    if (this.polishButton) {
      this.polishButton.style.opacity = '1';
      this.polishButton.style.pointerEvents = 'auto';
    }
  }

  /**
   * Public method to process text from popup
   */
  public processText(type: 'translate' | 'polish', text: string): void {
    // Store text and get a fake selection rect near center of viewport
    this.currentSelectionRect = new DOMRect(
      window.innerWidth / 2 - 100,
      window.innerHeight / 2 - 50,
      200,
      50
    );

    if (this.translateT1Button) {
      this.translateT1Button.dataset.selectedText = text;
    }
    if (this.translateT2Button) {
      this.translateT2Button.dataset.selectedText = text;
    }
    if (this.polishButton) {
      this.polishButton.dataset.selectedText = text;
    }

    this.handleAction(type, text);
  }

  /**
   * Public method to process text with custom replace handler
   */
  public async processTextWithCallback(
    type: 'translate' | 'polish',
    text: string,
    onReplace: (result: string) => void,
    onCleanup?: () => void,
    targetLanguage?: string
  ): Promise<void> {
    this.customReplaceHandler = onReplace;
    this.cleanupCallback = onCleanup || null;
    this.currentTargetLanguage = targetLanguage;

    // Use element rect if we have an input element
    if (this.currentInputElement) {
      this.currentSelectionRect = this.currentInputElement.getBoundingClientRect();
    } else {
      this.currentSelectionRect = new DOMRect(
        window.innerWidth / 2 - 100,
        window.innerHeight / 2 - 50,
        200,
        50
      );
    }

    if (this.translateT1Button) {
      this.translateT1Button.dataset.selectedText = text;
    }
    if (this.translateT2Button) {
      this.translateT2Button.dataset.selectedText = text;
    }
    if (this.polishButton) {
      this.polishButton.dataset.selectedText = text;
    }

    this.handleAction(type, text);
  }

  private ensureStyles(): void {
    if (document.getElementById('tingly-polish-preview-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'tingly-polish-preview-styles';
    style.textContent = `
      .tingly-polish-preview {
        display: flex;
        flex-direction: column;
      }

      .tingly-preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #334155;
      }

      .tingly-preview-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #94a3b8;
      }

      .tingly-preview-indicator {
        width: 8px;
        height: 8px;
        background: #22c55e;
        border-radius: 50%;
        animation: tingly-pulse 1.5s ease-in-out infinite;
      }

      .tingly-preview-indicator.tingly-completed {
        animation: none;
      }

      .tingly-preview-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tingly-btn-cancel,
      .tingly-btn-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 13px;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.15s ease;
      }

      .tingly-btn-cancel {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }

      .tingly-btn-cancel:hover {
        background: rgba(239, 68, 68, 0.25);
      }

      .tingly-btn-close:hover {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }

      .tingly-preview-content {
        padding: 16px;
        font-size: 14px;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
        overflow-y: auto;
        max-height: 300px;
      }

      .tingly-preview-content.tingly-streaming::after {
        content: '|';
        animation: tingly-blink 1s step-end infinite;
        color: #6366f1;
      }

      .tingly-btn-copy {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
        border: 1px solid #475569;
        border-radius: 6px;
        cursor: pointer;
        color: #e2e8f0;
        transition: all 0.15s ease;
      }

      .tingly-btn-copy:hover {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        border-color: #6366f1;
      }

      .tingly-btn-copy.copied {
        background: #22c55e;
        border-color: #22c55e;
      }

      .tingly-btn-replace {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        border: 1px solid #14b8a6;
        border-radius: 6px;
        cursor: pointer;
        color: #ffffff;
        padding: 6px 12px;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.15s ease;
      }

      .tingly-btn-replace:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
      }

      @keyframes tingly-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      @keyframes tingly-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}
