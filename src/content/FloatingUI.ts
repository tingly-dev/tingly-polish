/**
 * FloatingUI - Manages positioning of floating elements (buttons, previews)
 * near text selections within viewport constraints
 */

export interface ViewportPosition {
  left: number;
  top: number;
}

export interface PositionOptions {
  /** Where to place element relative to selection */
  position: 'above' | 'below' | 'auto';
  /** Padding from viewport edges */
  viewportPadding: number;
  /** Gap between element and selection */
  gap: number;
}

const DEFAULT_OPTIONS: PositionOptions = {
  position: 'auto',
  viewportPadding: 16,
  gap: 8,
};

/**
 * Calculate position for floating element near a selection
 */
export function positionNearSelection(
  element: HTMLElement,
  selectionRect: DOMRect,
  options: Partial<PositionOptions> = {}
): ViewportPosition {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const elementRect = element.getBoundingClientRect();
  const elementWidth = elementRect.width || element.offsetWidth || 100;
  const elementHeight = elementRect.height || element.offsetHeight || 50;

  // Calculate scroll offsets
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  // Default: center above selection
  let left = selectionRect.left + scrollX + (selectionRect.width / 2) - (elementWidth / 2);
  let top = selectionRect.top + scrollY - elementHeight - opts.gap;

  // Determine if should be below instead
  const spaceAbove = selectionRect.top;
  const spaceBelow = window.innerHeight - selectionRect.bottom;
  const preferBelow = opts.position === 'below' ||
    (opts.position === 'auto' && spaceAbove < elementHeight + opts.gap && spaceBelow > spaceAbove);

  if (preferBelow) {
    top = selectionRect.bottom + scrollY + opts.gap;
  }

  // Constrain to viewport
  const result = constrainToViewport(
    left - scrollX,
    top - scrollY,
    elementWidth,
    elementHeight,
    opts.viewportPadding
  );

  return {
    left: result.left + scrollX,
    top: result.top + scrollY,
  };
}

/**
 * Constrain position within viewport boundaries
 */
export function constrainToViewport(
  left: number,
  top: number,
  width: number,
  height: number,
  padding: number = 16
): ViewportPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Horizontal constraint
  let constrainedLeft = left;
  if (constrainedLeft < padding) {
    constrainedLeft = padding;
  } else if (constrainedLeft + width > viewportWidth - padding) {
    constrainedLeft = viewportWidth - width - padding;
  }

  // Vertical constraint
  let constrainedTop = top;
  if (constrainedTop < padding) {
    constrainedTop = padding;
  } else if (constrainedTop + height > viewportHeight - padding) {
    constrainedTop = viewportHeight - height - padding;
  }

  return { left: constrainedLeft, top: constrainedTop };
}

/**
 * Get selection rectangle from current selection
 */
export function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (range.collapsed) {
    return null;
  }

  return range.getBoundingClientRect();
}

/**
 * Get selection rectangle from input/textarea element
 */
export function getInputSelectionRect(element: HTMLInputElement | HTMLTextAreaElement): DOMRect | null {
  // For input/textarea, we can only get the element's rect
  // Selection position within input is not directly available via DOMRect
  return element.getBoundingClientRect();
}

/**
 * CSS styles for floating elements (shared)
 */
export const FLOATING_STYLES = {
  container: `
    position: absolute;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    pointer-events: auto;
  `,
  buttons: `
    display: flex;
    gap: 6px;
    padding: 6px;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid #334155;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.3);
  `,
  button: `
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    color: #ffffff;
    padding: 0;
    font-size: 13px;
    font-weight: 600;
    border: 1px solid transparent;
  `,
  translateButton: `
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border-color: #6366f1;
  `,
  polishButton: `
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    border-color: #14b8a6;
  `,
  preview: `
    position: absolute;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid #334155;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.3);
    color: #e2e8f0;
    min-width: 280px;
    max-width: 400px;
    max-height: 400px;
    display: flex;
    flex-direction: column;
  `,
};
