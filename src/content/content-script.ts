import type { InputElementInfo } from '../domain/types.js';
import { triggerDetector } from '../domain/services/TriggerDetector.js';

/**
 * Handles input element monitoring and text replacement
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
    const inputs = document.querySelectorAll(
      'input[type="text"], input[type="search"], input:not([type]), textarea, [contenteditable="true"]'
    );

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

      // Send to background for processing
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_TEXT',
        payload: {
          text,
          type,
          elementInfo: this.serializableElementInfo(info),
        },
      });

      if (response?.data?.result) {
        // Replace text in element
        this.replaceText(info.element, response.data.result);

        // Hide loading indicator
        this.hideLoadingIndicator();
      }
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

    if (element.isContentEditable) {
      return {
        element,
        type: 'contenteditable',
        value: element.textContent ?? '',
      };
    }

    return null;
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
      const classes = element.className.split(' ').filter(c => c).join('.');
      if (classes) {
        return `${element.tagName.toLowerCase()}.${classes}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Show loading indicator
   */
  private showLoadingIndicator(element: HTMLElement): void {
    // Remove existing indicator
    this.hideLoadingIndicator();

    // Create new indicator
    const indicator = document.createElement('div');
    indicator.id = 'tingly-polish-loading';
    indicator.textContent = 'Processing...';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #000;
      color: #fff;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

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
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new InputHandler();
  });
} else {
  new InputHandler();
}

// Re-initialize on page navigation (for SPAs)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    // Re-initialize for new page
    setTimeout(() => {
      new InputHandler();
    }, 100);
  }
}).observe(document.body, { childList: true, subtree: true });

export default InputHandler;
