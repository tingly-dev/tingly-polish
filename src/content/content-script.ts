import { triggerDetector } from '../domain/services/TriggerDetector.js';
import { SiteMappingService } from '../domain/services/SiteMappingService.js';
import type { InputElementInfo } from '../domain/types.js';
import { TextSelectionHandler } from './TextSelectionHandler.js';

/**
 * Handles input element monitoring and text replacement
 */
export class InputHandler {
  private monitoredElements: WeakSet<Element> = new WeakSet();
  private config: {
    triggerTranslate: string;
    triggerPolish: string;
    siteMappings: any[];
  } = {
    triggerTranslate: '   ',
    triggerPolish: '///',
    siteMappings: [],
  };

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
          siteMappings: response.data.siteMappings || [],
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
            siteMappings: newConfig.siteMappings || [],
          };
          // Re-monitor elements with new selectors
          this.monitorExistingElements();
        }
      }
    });
  }

  /**
   * Get input selectors based on current URL and config
   */
  private getInputSelectors(): string[] {
    try {
      return SiteMappingService.getSelectorsForCurrentUrl(this.config.siteMappings || []);
    } catch {
      // Fallback to default selectors
      return [
        'input[type="text"]',
        'input[type="search"]',
        'input:not([type])',
        'textarea',
        '[contenteditable]',
        'trix-editor',
      ];
    }
  }

  /**
   * Observe page for new input elements
   */
  private observePage(): void {
    // Monitor existing elements
    this.monitorExistingElements();

    // Observe DOM for new elements
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
    const selectors = this.getInputSelectors();
    const inputs = document.querySelectorAll(selectors.join(', '));

    inputs.forEach(element => this.monitorElement(element));
  }

  /**
   * Monitor a single element for input
   */
  private monitorElement(element: Element): void {
    if (this.monitoredElements.has(element)) {
      return;
    }

    this.monitoredElements.add(element);

    element.addEventListener('input', (e) => {
      this.handleInput(e as InputEvent);
    });

    // Also handle paste events
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
    // Debounce to avoid excessive checks
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
      // Show loading indicator
      this.showLoadingIndicator(info.element);

      // Send to background for streaming processing
      chrome.runtime.sendMessage({
        type: 'PROCESS_TEXT_STREAM',
        payload: {
          text,
          type,
          elementInfo: this.serializableElementInfo(info),
        },
      }).catch(async (error) => {
        console.error('Tingly Polish: Failed to send stream request', error);
        // Fallback to non-streaming
        const response = await chrome.runtime.sendMessage({
          type: 'PROCESS_TEXT',
          payload: {
            text,
            type,
            elementInfo: this.serializableElementInfo(info),
          },
        });

        if (response?.data?.result) {
          this.replaceText(info.element, response.data.result);
        }
        this.hideLoadingIndicator();
      });

      // Set up stream listener for this element
      const streamListener = (message: any) => {
        if (message.type === 'STREAM_CHUNK') {
          const { accumulated, done } = message.payload;
          if (done) {
            this.replaceText(info.element, accumulated);
            this.hideLoadingIndicator();
            chrome.runtime.onMessage.removeListener(streamListener);
          }
        } else if (message.type === 'STREAM_ERROR') {
          console.error('Tingly Polish: Stream error', message.payload);
          this.hideLoadingIndicator();
          chrome.runtime.onMessage.removeListener(streamListener);
        }
      };

      chrome.runtime.onMessage.addListener(streamListener);
    } catch (error) {
      console.error('Tingly Polish: Failed to process text', error);
      this.hideLoadingIndicator();
    }
  }

  /**
   * Replace text in element
   */
  private replaceText(element: HTMLElement, text: string): void {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const start = element.selectionStart ?? 0;
      element.value = text;
      element.selectionStart = element.selectionEnd = start;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (element.tagName === 'TRIX-EDITOR') {
      // For Trix editor, use the editor's document API
      const trixEditor = element as any;
      if (trixEditor.editor && trixEditor.editor.loadHTML) {
        // Convert text to HTML (preserve line breaks)
        const html = text.split('\n').map(line => `<div>${line}</div>`).join('');
        trixEditor.editor.loadHTML(html);
      } else {
        // Fallback: clear and insert text
        element.innerHTML = text.split('\n').map(line => `<div>${line}</div>`).join('');
      }
      // Trigger Trix change event
      element.dispatchEvent(new Event('trix-change', { bubbles: true }));
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (element.isContentEditable) {
      element.textContent = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /**
   * Get element info for tracking
   */
  private getElementInfo(element: Element): InputElementInfo | null {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return {
        element,
        type: 'input',
        value: element.value,
        selectionStart: element.selectionStart ?? undefined,
        selectionEnd: element.selectionEnd ?? undefined,
      };
    }

    const htmlElement = element as HTMLElement;
    if (htmlElement.isContentEditable || htmlElement.tagName === 'TRIX-EDITOR') {
      return {
        element: htmlElement,
        type: 'contenteditable',
        value: this.extractTextFromEditable(htmlElement),
      };
    }

    return null;
  }

  /**
   * Extract text from contenteditable elements, handling Trix editor specially
   */
  private extractTextFromEditable(element: HTMLElement): string {
    // For Trix editor, get text content properly (preserves line breaks better)
    if (element.tagName === 'TRIX-EDITOR') {
      // Get the inner div elements that contain the actual text
      const innerDivs = element.querySelectorAll('div');
      const textParts: string[] = [];
      innerDivs.forEach(div => {
        const text = div.textContent ?? '';
        if (text) {
          textParts.push(text.trim());
        }
      });
      return textParts.join('\n');
    }

    // For regular contenteditable elements
    return element.textContent ?? '';
  }

  /**
   * Create serializable version of element info
   */
  private serializableElementInfo(info: InputElementInfo) {
    return {
      type: info.type,
      value: info.value,
      selectionStart: info.selectionStart,
      selectionEnd: info.selectionEnd,
      // Use a selector to find element later instead of storing DOM reference
      elementSelector: this.getSelector(info.element),
      url: window.location.href,
    };
  }

  /**
   * Get CSS selector for element
   */
  private getSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = String(element.className).split(' ').filter(c => c).join('.');
      if (classes) {
        return `${element.tagName.toLowerCase()}.${classes}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Show loading indicator near the input element
   */
  private showLoadingIndicator(element: HTMLElement): void {
    // Remove existing indicator
    this.hideLoadingIndicator();

    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Create new indicator
    const indicator = document.createElement('div');
    indicator.id = 'tingly-polish-loading';
    indicator.innerHTML = `
      <div class="tingly-loading-indicator">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"/>
        </svg>
        <span>Streaming</span>
        <div class="tingly-loading-dot"></div>
        <div class="tingly-loading-dot"></div>
        <div class="tingly-loading-dot"></div>
      </div>
    `;

    // Position indicator below the input element
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

    // Add animation keyframes for spinner
    let style = document.getElementById('tingly-polish-loading-style') as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = 'tingly-polish-loading-style';
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .tingly-loading-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .tingly-loading-dot {
          width: 6px;
          height: 6px;
          background: #6366f1;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .tingly-loading-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .tingly-loading-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(indicator);
  }

  /**
   * Hide loading indicator
   */
  private hideLoadingIndicator(): void {
    const existing = document.getElementById('tingly-polish-loading');
    if (existing) {
      existing.remove();
    }
    const style = document.getElementById('tingly-polish-loading-style');
    if (style) {
      style.remove();
    }
  }
}

// Initialize when DOM is ready
let inputHandlerInstance: InputHandler | null = null;

function initializeHandlers() {
  // Clean up existing instances first
  if (inputHandlerInstance) {
    console.log('Tingly Polish: Cleaning up existing handlers');
  }

  // Use singleton pattern for TextSelectionHandler
  TextSelectionHandler.destroy();
  TextSelectionHandler.getInstance();

  // Create new InputHandler instance (it handles its own monitoring)
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

    // Debounce re-initialization to avoid multiple calls
    if (navigationDebounce) {
      clearTimeout(navigationDebounce);
    }

    navigationDebounce = window.setTimeout(() => {
      console.log('Tingly Polish: Page navigation detected, re-initializing');
      initializeHandlers();
    }, 100);
  }
}).observe(document.body, { childList: true, subtree: true });

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_SELECTED_TEXT') {
    const selection = window.getSelection();
    const selectedText = selection?.toString()?.trim();

    sendResponse({
      data: {
        selectedText: selectedText || '',
      },
    });
    return true;
  }

  if (message.type === 'PROCESS_TEXT') {
    const { text, action } = message.payload;
    const handler = TextSelectionHandler.getInstance();

    // Use the handler's public method to process the text
    if (action === 'translate') {
      handler.processText('translate', text);
    } else if (action === 'polish') {
      handler.processText('polish', text);
    }

    sendResponse({ success: true });
    return true;
  }

  return false;
});

export default InputHandler;
