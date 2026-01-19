import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TriggerDetector } from '../../src/domain/services/TriggerDetector';

describe('TriggerDetector', () => {
  let detector: TriggerDetector;
  let mockElement: HTMLElement;

  beforeEach(() => {
    detector = new TriggerDetector();
    mockElement = document.createElement('input');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('detect', () => {
    it('should detect triple space trigger', () => {
      const result = detector.detect('hello   ', '   ', 'translate');

      expect(result.detected).toBe(true);
      expect(result.type).toBe('translate');
      expect(result.matchedText).toBe('   ');
      expect(result.remainingText).toBe('hello ');
    });

    it('should not detect trigger when pattern not present', () => {
      const result = detector.detect('hello  ', '   ', 'translate');

      expect(result.detected).toBe(false);
    });

    it('should handle empty text', () => {
      const result = detector.detect('', '   ', 'translate');

      expect(result.detected).toBe(false);
    });

    it('should detect trigger at the beginning', () => {
      const result = detector.detect('   hello', '   ', 'translate');

      expect(result.detected).toBe(true);
      expect(result.remainingText).toBe(' hello');
    });

    it('should detect trigger in the middle', () => {
      const result = detector.detect('hello   world', '   ', 'translate');

      expect(result.detected).toBe(true);
      expect(result.remainingText).toBe('hello world');
    });

    it('should only detect the last occurrence', () => {
      const result = detector.detect('hello   world   ', '   ', 'translate');

      expect(result.detected).toBe(true);
      expect(result.remainingText).toBe('hello   world ');
    });
  });

  describe('debounce', () => {
    it('should debounce callbacks', () => {
      const callback = vi.fn();
      const delay = 300;

      detector.debounce(mockElement, callback, delay);
      detector.debounce(mockElement, callback, delay);
      detector.debounce(mockElement, callback, delay);

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(delay);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should clear previous timer when debouncing again', () => {
      const callback = vi.fn();
      const delay = 300;

      detector.debounce(mockElement, callback, delay);
      vi.advanceTimersByTime(100);
      detector.debounce(mockElement, callback, delay);
      vi.advanceTimersByTime(200);

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple elements independently', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const element2 = document.createElement('input');
      const delay = 300;

      detector.debounce(mockElement, callback1, delay);
      detector.debounce(element2, callback2, delay);

      vi.advanceTimersByTime(delay);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearDebounce', () => {
    it('should clear debounce timer for element', () => {
      const callback = vi.fn();
      const delay = 300;

      detector.debounce(mockElement, callback, delay);
      detector.clearDebounce(mockElement);

      vi.advanceTimersByTime(delay);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('clearAllDebounces', () => {
    it('should clear all debounce timers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const element2 = document.createElement('input');
      const delay = 300;

      detector.debounce(mockElement, callback1, delay);
      detector.debounce(element2, callback2, delay);
      detector.clearAllDebounces();

      vi.advanceTimersByTime(delay);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});
