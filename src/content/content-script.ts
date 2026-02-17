import { triggerDetector } from '../domain/services/TriggerDetector.js';
import type { InputElementInfo } from '../domain/types.js';
import { TextSelectionHandler } from './TextSelectionHandler.js';

/**
 * Handles input element monitoring and text replacement
 * Only supports standard input and textarea elements
 */
export class InputHandler {
  private monitoredElements: WeakSet<Element> = new WeakSet();
  private config: {
    triggerTranslate: string;
    triggerPolish: string;
  } = {
    triggerTranslate: '   ',
    triggerPolish: '   ',
  };

  /** Standard input selectors only */
  private static readonly SELECTORS = [
    'input[type="text"]',
    'input[type="search"]',
    'input:not([type])',
    'textarea',
  ];

  constructor() {
    this.loadConfig();
    this.observePage();
    this.setupConfigListener();
  }

  private async loadConfig(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CONFIG',
        payload: {},
      });

      if (response?.data) {
        this.config = {
          triggerTranslate: response.data.triggerTranslate,
          triggerPolish: response.data.triggerPolish,
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
            triggerTranslate: newConfig.triggerTranslate,
            triggerPolish: newConfig.triggerPolish,
          };
        }
      }
    });
  }

  /**
   * Observe page for new input elements
   */
  private observePage(): void {
    this.monitorExistingElements();

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            this.monitorElement(node);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Monitor all existing input elements on the page
   */
  private monitorExistingElements(): void {
    const inputs = document.querySelectorAll(InputHandler.SELECTORS.join(', '));
    inputs.forEach(element => this.monitorElement(element));
  }

  /**
   * Monitor a single element for input
   */
  private monitorElement(element: Element): void {
    if (this.monitoredElements.has(element)) {
      return;
    }

    // Only handle standard inputs
    if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
      return;
    }

    this.monitoredElements.add(element);

    element.addEventListener('input', (e) => {
      this.handleInput(e as InputEvent);
    });

    element.addEventListener('paste', () => {
      setTimeout(() => {
        const info = this.getElementInfo(element);
        if (info) {
          this.checkForTrigger(info);
        }
      }, 0);
    });
  }

  /**
   * Handle input event
   */
  private handleInput(event: InputEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const info = this.getElementInfo(target);
    if (!info) {
      return;
    }

    this.checkForTrigger(info);
  }

  /**
   * Check if trigger pattern is detected
   */
  private checkForTrigger(info: InputElementInfo): void {
    triggerDetector.debounce(info.element, async () => {
      await this.processTrigger(info);
    });
  }

  /**
   * Process trigger detection
   */
  private async processTrigger(info: InputElementInfo): Promise<void> {
    const { value } = info;

    // Check for translate trigger
    const translateResult = triggerDetector.detect(
      value,
      this.config.triggerTranslate,
      'translate'
    );

    if (translateResult.detected && translateResult.remainingText !== undefined) {
      await this.handleTrigger('translate', translateResult.remainingText, info);
      return;
    }

    // Check for polish trigger
    const polishResult = triggerDetector.detect(
      value,
      this.config.triggerPolish,
      'polish'
    );

    if (polishResult.detected && polishResult.remainingText !== undefined) {
      await this.handleTrigger('polish', polishResult.remainingText, info);
    }
  }

  /**
   * Handle detected trigger
   */
  private async handleTrigger(
    type: 'translate' | 'polish',
    text: string,
    info: InputElementInfo
  ): Promise<void> {
    if (!text.trim()) {
      return;
    }

    try {
      this.showLoadingIndicator(info.element);

      const handler = TextSelectionHandler.getInstance();

      const onReplace = (result: string) => {
        this.replaceText(info.element, result);
      };

      const onCleanup = () => {
        this.hideLoadingIndicator();
      };

      await handler.processTextWithCallback(type, text, onReplace, onCleanup);
    } catch (error) {
      console.error('Tingly Polish: Failed to process text', error);
      this.hideLoadingIndicator();
    }
  }

  /**
   * Replace text in element (standard inputs only)
   */
  private replaceText(element: HTMLElement, text: string): void {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const start = element.selectionStart ?? 0;
      element.value = text;
      element.selectionStart = element.selectionEnd = start;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /**
   * Get element info for standard inputs
   */
  private getElementInfo(element: Element): InputElementInfo | null {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return {
        element,
        type: element instanceof HTMLTextAreaElement ? 'textarea' : 'input',
        value: element.value,
        selectionStart: element.selectionStart ?? undefined,
        selectionEnd: element.selectionEnd ?? undefined,
      };
    }
    return null;
  }

  /**
   * Show loading indicator near the input element
   */
  private showLoadingIndicator(element: HTMLElement): void {
    this.hideLoadingIndicator();

    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const indicator = document.createElement('div');
    indicator.id = 'tingly-polish-loading';
    indicator.innerHTML = `
      <div class="tingly-loading-indicator">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: tingly-spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"/>
        </svg>
        <span>Processing</span>
      </div>
    `;

    const left = rect.left + scrollX;
    const top = rect.bottom + scrollY + 8;

    indicator.style.cssText = `
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      color: #e2e8f0;
      padding: 8px 16px;
      border-radius: 8px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.3);
      pointer-events: none;
    `;

    this.ensureStyles();
    document.body.appendChild(indicator);
  }

  private ensureStyles(): void {
    if (document.getElementById('tingly-polish-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'tingly-polish-styles';
    style.textContent = `
      @keyframes tingly-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .tingly-loading-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Hide loading indicator
   */
  private hideLoadingIndicator(): void {
    const existing = document.getElementById('tingly-polish-loading');
    if (existing) {
      existing.remove();
    }
  }
}

// Initialize when DOM is ready
let inputHandlerInstance: InputHandler | null = null;

function initializeHandlers() {
  // Clean up existing instances
  TextSelectionHandler.destroy();

  // Initialize selection handler first
  TextSelectionHandler.getInstance();

  // Create input handler
  inputHandlerInstance = new InputHandler();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeHandlers);
} else {
  initializeHandlers();
}

// Re-initialize on page navigation (for SPAs)
let lastUrl = window.location.href;
let navigationDebounce: number | null = null;

new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    if (navigationDebounce) {
      clearTimeout(navigationDebounce);
    }
    navigationDebounce = window.setTimeout(() => {
      initializeHandlers();
    }, 100);
  }
}).observe(document.body, { childList: true, subtree: true });

// Handle messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_SELECTED_TEXT') {
    const selection = window.getSelection();
    const selectedText = selection?.toString()?.trim();
    sendResponse({ data: { selectedText: selectedText || '' } });
    return true;
  }

  if (message.type === 'PROCESS_TEXT') {
    const { text, action } = message.payload;
    const handler = TextSelectionHandler.getInstance();

    if (action === 'translate' || action === 'polish') {
      handler.processText(action, text);
    }

    sendResponse({ success: true });
    return true;
  }

  return false;
});

export default InputHandler;
