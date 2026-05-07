# Spec: Dual Translation Targets and Direct Input Processing

**Date**: 2026-03-22
**Status**: Ready for Implementation
**Author**: Claude

## Overview

Extend the Tingly Polish extension with:
1. **Dual Translation Targets (T1, T2)**: Two independent translation configurations
2. **Direct Input Panel**: A new input mode in the popup for direct text processing

## Current State

- Single `targetLanguage` config for translate operation
- Popup requires text selection on page for operations
- Single translate trigger pattern

## Requirements

### 1. Dual Translation Configuration

**Functional Requirements**:
- Add `targetLanguageT1` and `targetLanguageT2` to Config
- Add `triggerTranslateT1` and `triggerTranslateT2` trigger patterns
- AIConfigPage should display two separate translation configuration sections
- Each translation config has:
  - Target language selector
  - Trigger key pattern
  - Independent operation

**Data Model Changes**:

```typescript
export interface Config {
  // ... existing fields
  targetLanguage: string;  // DEPRECATED: Keep for migration, remove in future

  // New dual translation config
  targetLanguageT1: string;
  targetLanguageT2: string;
  triggerTranslateT1: string;
  triggerTranslateT2: string;
}
```

**Migration**:
- On config load, if `targetLanguageT1` is empty, migrate from `targetLanguage`
- Set `triggerTranslateT1` from existing `triggerTranslate`
- Initialize T2 with defaults (e.g., Chinese)

### 2. Direct Input Panel

**Functional Requirements**:
- Add new tab in Settings page: "Quick Process"
- Panel contains:
  - Large text input area (multiline TextField)
  - Three action buttons: "Translate T1", "Translate T2", "Polish"
  - Result display area with copy button
- Operations run entirely in popup (no text selection needed)
- Show loading state during processing
- Save processed text to history

**UI Components**:

```typescript
// New component: src/popup/components/QuickProcessPage.tsx

interface QuickProcessState {
  inputText: string;
  outputText: string;
  processing: boolean;
  operation: 'translate-t1' | 'translate-t2' | 'polish' | null;
}
```

**User Flow**:
1. User clicks "Settings" in main popup
2. Settings page opens with tabs: [AI Config] [Quick Process] [Prompts] [History]
3. User navigates to "Quick Process" tab
4. Enters text and clicks action button
5. Result appears in output area with copy option

**Component Layout**:
```
┌─────────────────────────────────────┐
│ Settings                             │
├─────────────────────────────────────┤
│ [AI Config] [Quick Process] [History]│  ← tabs
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Enter text to process...    │   │  ← input area
│  │                             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [T1: English] [T2: Chinese] [Polish]│  ← action buttons
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Result:                     │   │  ← output area
│  │ [processed text here]       │   │
│  │                     [Copy]   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Domain Layer Updates
1. Update `Config` interface in `src/domain/types.ts`
2. Add migration logic in config repository
3. Update `DEFAULT_CONFIG` with new fields

### Phase 2: AIConfigPage Updates
1. Update `AIConfigPage.tsx` to show T1/T2 translation configs
2. Add two separate trigger configuration sections
3. Update save/load logic for new fields

### Phase 3: Content Script Updates
1. Update `InputHandler` to detect T1/T2 triggers
2. Pass target language context to background processing
3. Update trigger detection logic for dual patterns

### Phase 4: Quick Process Panel
1. Create `QuickProcessPage.tsx` component
2. Add message handler for direct processing in background
3. Wire up T1/T2/Polish buttons
4. Implement loading states and error handling

### Phase 5: Background Service
1. Add message handler for `PROCESS_DIRECT_TEXT`
2. Support target language parameter in processing
3. Update history tracking for T1/T2 operations

## API Changes

### New Message Types

```typescript
export type MessageType =
  | // ... existing
  | 'PROCESS_DIRECT_TEXT';

export type ProcessDirectTextPayload = {
  text: string;
  type: 'translate-t1' | 'translate-t2' | 'polish';
};
```

### Config Repository

```typescript
// Migration helper in ConfigRepository
private migrateConfig(config: Partial<Config>): Config {
  if (!config.targetLanguageT1 && config.targetLanguage) {
    config.targetLanguageT1 = config.targetLanguage;
  }
  if (!config.triggerTranslateT1 && config.triggerTranslate) {
    config.triggerTranslateT1 = config.triggerTranslate;
  }
  // Set defaults for T2
  if (!config.targetLanguageT2) {
    config.targetLanguageT2 = 'Chinese';
  }
  if (!config.triggerTranslateT2) {
    config.triggerTranslateT2 = '   '; // triple space
  }
  return { ...DEFAULT_CONFIG, ...config };
}
```

## UI Design Details

### QuickProcessPage Component

**Props**: None (uses API calls)

**State**:
```typescript
const [input, setInput] = useState('');
const [result, setResult] = useState('');
const [processing, setProcessing] = useState(false);
const [currentOp, setCurrentOp] = useState<ProcessType | null>(null);
const [config, setConfig] = useState<Config | null>(null);
```

**Actions**:
- `handleTranslateT1()`: Process text with T1 language
- `handleTranslateT2()`: Process text with T2 language
- `handlePolish()`: Polish text
- `handleCopy()`: Copy result to clipboard

**Styling**:
- Use existing MUI theme
- TextField with `multiline` prop, `minRows: 4`
- Action buttons with icons (TranslateIcon x2, PolishIcon)
- Result area with syntax highlighting placeholder

### AIConfigPage Changes

**New Section**: "Translation T1" and "Translation T2"

Each section contains:
- TriggerKeys component
- Language selector dropdown
- Helper text explaining the trigger

## Testing Strategy

### Unit Tests
1. Config migration logic
2. T1/T2 trigger detection
3. QuickProcessPage component state changes

### E2E Tests
1. Configure T1 and T2 languages
2. Test T1/T2 triggers in content inputs
3. Test QuickProcess panel operations
4. Verify history records T1/T2 correctly

## Migration Path

For existing users:
1. On extension update, run one-time migration
2. Old `targetLanguage` → `targetLanguageT1`
3. Old `triggerTranslate` → `triggerTranslateT1`
4. `targetLanguageT2` defaults to Chinese
5. `triggerTranslateT2` defaults to triple space

## Open Questions

1. **Should we deprecate single-target translate immediately?**
   - **Decision**: Yes, migrate automatically
2. **Default T2 language?**
   - **Decision**: Chinese (中文) - most common pairing with English
3. **Quick Process panel behavior** - auto-close on completion?
   - **Decision**: No, keep open for multiple operations
4. **Character limit for direct input?**
   - **Decision**: 5000 characters (same as typical input limits)
5. **UI Layout approach for Quick Process?**
   - **Decision**: Add as new tab in settings page, keep main popup simple

## Alternatives Considered

### Alternative 1: Single Translate with Language Selector
- More clicks for user (select language then translate)
- Rejected: Slower workflow

### Alternative 2: Three Separate Triggers
- Would require trigger pattern complexity
- Rejected: Hard to remember/use

### Alternative 3: Separate Extension Popup for Direct Input
- More complex architecture
- **Selected**: Tab-based approach in Settings page
