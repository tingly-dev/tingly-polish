# Refactor Content Script and UI Interaction

**Date**: 2026-02-17
**Status**: Draft

## Problem Statement

Current Chrome extension has several issues:

1. **Input capture is overly complex**: Tries to monitor all kinds of inputs (`contenteditable`, `trix-editor`, custom selectors), which leads to bugs and maintenance burden
2. **Processing dialog positioning**: Streaming preview is fixed at right side of screen, not near the selected text
3. **Multiple dialogs**: Can create duplicate processing dialogs due to improper singleton management
4. **Extension tray button**: When clicked, should process selected text but interaction is unclear

## Requirements

### 1. Simplified Input Monitoring

**Only support standard inputs:**
- `<input type="text">`
- `<input type="search">`
- `<input>` (no type attribute)
- `<textarea>`

**Remove support for:**
- `contenteditable` elements
- `trix-editor`
- Custom site-specific selectors

### 2. Text Selection with Floating T/P Buttons

When user selects text anywhere on page:
- Show floating button group with **T** (Translate) and **P** (Polish)
- Position: Above the selection, centered horizontally
- Auto-hide when selection is cleared or user clicks elsewhere

### 3. Extension Tray Button Support

When user clicks extension icon:
- Get selected text from current tab
- If text is selected, show popup with action options
- Process text based on user selection (T or P)

### 4. Processing Dialog Improvements

- **Position**: Near the selected text position, not fixed at screen edge
- **Singleton**: Only one processing dialog at a time
- **Cleanup**: Properly remove on completion, cancellation, or error

## Architecture Changes

### File Changes

```
src/content/
├── content-script.ts      # Simplified InputHandler + initialization
├── TextSelectionHandler.ts # Refactored with proper positioning
└── FloatingUI.ts          # NEW: Manages floating buttons and preview positioning
```

### Key Modules

#### 1. InputHandler (Simplified)

```typescript
class InputHandler {
  private selectors = [
    'input[type="text"]',
    'input[type="search"]',
    'input:not([type])',
    'textarea'
  ];

  // Monitor only standard inputs
  // Handle trigger patterns (triple space)
  // Delegate processing to TextSelectionHandler
}
```

#### 2. TextSelectionHandler (Refactored)

```typescript
class TextSelectionHandler {
  private static instance: TextSelectionHandler | null = null;

  // Singleton with proper cleanup
  static getInstance(): TextSelectionHandler;
  static destroy(): void;

  // Selection handling
  private handleSelection(): void;
  private showFloatingButtons(selectionRect: DOMRect): void;

  // Processing
  processText(type: 'translate' | 'polish', text: string): void;
  processTextWithCallback(type, text, onReplace, onCleanup): void;

  // Preview positioning - NEW
  private positionPreviewNearSelection(selectionRect: DOMRect): void;
}
```

#### 3. FloatingUI (NEW)

```typescript
class FloatingUI {
  // Create T/P button container
  createFloatingButtons(): HTMLElement;

  // Position element near selection
  positionNearSelection(
    element: HTMLElement,
    selectionRect: DOMRect,
    options?: { position: 'above' | 'below' }
  ): void;

  // Position processing preview
  positionPreview(
    preview: HTMLElement,
    selectionRect: DOMRect
  ): void;

  // Calculate safe position within viewport
  constrainToViewport(
    left: number,
    top: number,
    width: number,
    height: number
  ): { left: number; top: number };
}
```

## Implementation Plan

### Phase 1: Simplify InputHandler

1. Remove `SiteMappingService` integration from content script
2. Use only standard selectors
3. Remove `contenteditable` and `trix-editor` handling
4. Simplify `replaceText` to only handle standard inputs

### Phase 2: Refactor TextSelectionHandler

1. Extract positioning logic to `FloatingUI`
2. Implement singleton with proper cleanup
3. Position preview near selection instead of fixed right side
4. Ensure only one preview instance exists

### Phase 3: Extension Tray Integration

1. Service worker sends message to get selected text
2. Content script returns selected text
3. Popup shows selected text and action buttons
4. Process via existing message flow

## UI Specifications

### Floating T/P Buttons

```
┌─────────────────────┐
│  ┌───┐  ┌───┐       │
│  │ T │  │ P │       │  ← Above selection
│  └───┘  └───┘       │
│                     │
│  Selected text...   │  ← User selection
│                     │
└─────────────────────┘
```

### Processing Preview (Near Selection)

```
┌─────────────────────────────────────────┐
│  Selected text here...                  │
│         ┌─────────────────────────────┐ │
│         │ ● Processing...      [×]    │ │  ← Preview near selection
│         │                             │ │
│         │ Result text streaming...    │ │
│         │                             │ │
│         │ [Copy] [Replace]            │ │
│         └─────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Test Cases

1. **Standard input trigger**: Type triple-space in `<input>` and `<textarea>`
2. **Text selection**: Select text on page, verify T/P buttons appear above
3. **Preview positioning**: Verify preview appears near selection, not fixed position
4. **Singleton**: Rapid selections should not create multiple previews
5. **Cleanup**: Closing preview should properly clean up DOM and state
6. **Extension tray**: Click icon with selected text should process correctly

## Migration Notes

- `SiteMappingService` can remain in codebase for future use, just not used in content script
- `contenteditable` support removed to reduce complexity
- Existing `triggerTranslate` and `triggerPolish` patterns still work for standard inputs
