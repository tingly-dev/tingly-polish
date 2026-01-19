import type { TriggerResult, ProcessType } from '../types.js';
import { TRIGGER_DEBOUNCE_MS } from '../types.js';

/**
 * Service for detecting trigger patterns in input text
 */
export class TriggerDetector {
  private debounceTimers: Map<HTMLElement, NodeJS.Timeout> = new Map();

  /**
   * Detect if trigger pattern is present in text
   * @param text - Input text to check
   * @param triggerPattern - Pattern to detect (e.g., '   ' for triple space)
   * @param type - Type of trigger (translate or polish)
   * @returns Trigger detection result
   */
  detect(text: string, triggerPattern: string, type: ProcessType): TriggerResult {
    if (!text || !triggerPattern) {
      return { detected: false };
    }

    const index = text.lastIndexOf(triggerPattern);

    if (index === -1) {
      return { detected: false };
    }

    const beforeTrigger = text.substring(0, index);
    const afterTrigger = text.substring(index + triggerPattern.length);

    return {
      detected: true,
      type,
      matchedText: triggerPattern,
      remainingText: beforeTrigger + afterTrigger,
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
