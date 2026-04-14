import type { TriggerResult, ProcessType } from '../types.js';
import { TRIGGER_DEBOUNCE_MS } from '../types.js';

/**
 * Service for detecting trigger patterns in input text
 */
export class TriggerDetector {
  private debounceTimers: Map<HTMLElement, NodeJS.Timeout> = new Map();

  /**
   * Detect if trigger pattern is present at the END of text
   * @param text - Input text to check
   * @param triggerPattern - Pattern to detect (e.g., '   ' for triple space). Empty pattern means trigger is disabled.
   * @param type - Type of trigger (translate or polish)
   * @returns Trigger detection result
   */
  detect(text: string, triggerPattern: string, type: ProcessType): TriggerResult {
    // Empty trigger pattern means this trigger is disabled
    // Note: We use === '' to check for explicitly empty, not trim(), because spaces are valid triggers
    if (triggerPattern === '') {
      return { detected: false };
    }

    if (!text) {
      return { detected: false };
    }

    // Only trigger if pattern is at the END of the text
    if (!text.endsWith(triggerPattern)) {
      return { detected: false };
    }

    // Remove trigger pattern from the end
    const remainingText = text.substring(0, text.length - triggerPattern.length);

    return {
      detected: true,
      type,
      matchedText: triggerPattern,
      remainingText,
    };
  }

  /**
   * Debounce trigger detection for an element
   * @param element - DOM element to debounce
   * @param callback - Function to call after debounce
   * @param delay - Debounce delay in ms
   */
  debounce(
    element: HTMLElement,
    callback: () => void,
    delay: number = TRIGGER_DEBOUNCE_MS
  ): void {
    const existingTimer = this.debounceTimers.get(element);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      callback();
      this.debounceTimers.delete(element);
    }, delay);

    this.debounceTimers.set(element, timer);
  }

  /**
   * Clear debounce timer for an element
   * @param element - DOM element
   */
  clearDebounce(element: HTMLElement): void {
    const timer = this.debounceTimers.get(element);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(element);
    }
  }

  /**
   * Clear all debounce timers
   */
  clearAllDebounces(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

/**
 * Singleton instance
 */
export const triggerDetector = new TriggerDetector();
