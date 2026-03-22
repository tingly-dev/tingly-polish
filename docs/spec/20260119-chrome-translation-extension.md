# Chrome Extension: Translation & Polish Tool

## Overview
A Chrome extension that provides AI-powered translation and text polishing for user input in web page input fields. When triggered, the extension replaces the original text with the processed result.

## Key Features

### 1. Core Functionality
- **Translation**: Translate text to target language
- **Polish**: Improve/rewrite text for better quality
- **In-place Replacement**: Replace original input with processed result
- **History Tracking**: Keep backup of user's original input (can delete all)

### 2. Popup Interface
Two-page navigation:

#### Config Page
- API Configuration
  - API Key input
  - Base URL input
  - Model selection
- Prompt Configuration
  - System prompt textarea (customizable)
  - User prompt textarea (customizable)
  - "Restore Default" button at bottom
- Trigger Settings
  - Triple space → Translation
  - Triple space → Polish

#### History Page
- List of historical inputs (before replacement)
- Delete all history button

### 3. Trigger Mechanism
- Detect triple space (three consecutive spaces) in input field
- Trigger translation/polish based on configuration

## Architecture

### Directory Structure
```
tingly-polish/
├── manifest.json
├── src/
│   ├── background/
│   │   └── service-worker.ts
│   ├── content/
│   │   ├── content-script.ts
│   │   └── input-handler.ts
│   ├── popup/
│   │   ├── pages/
│   │   │   ├── Config.tsx
│   │   │   └── History.tsx
│   │   ├── App.tsx
│   │   └── index.html
│   ├── api/
│   │   └── llm-client.ts
│   ├── storage/
│   │   └── storage-manager.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── unit/
│   └── e2e/
└── docs/
```

### Components

#### 1. Content Script (`src/content/`)
- **ContentScript**: Main entry, injects into web pages
- **InputHandler**: Monitors input fields, detects triple space

#### 2. Background Service (`src/background/`)
- **ServiceWorker**: Handles API calls, coordinates between content and popup

#### 3. LLM Client (`src/api/`)
- **LLMClient**: Wraps API calls to LLM service
  - Use mature library (e.g., OpenAI SDK compatible)

#### 4. Storage (`src/storage/`)
- **StorageManager**: Chrome storage API wrapper
  - Config: apiKey, baseUrl, model, prompts
  - History: Array of {id, original, processed, timestamp}

#### 5. Popup (`src/popup/`)
- React-based UI
- Tab navigation (Config | History)
- Form components for configuration

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Framework | React + TypeScript |
| Build Tool | Vite |
| Storage | Chrome Storage API |
| LLM Client | OpenAI SDK (compatible) |
| UI | TailwindCSS + shadcn/ui |

## Data Models

### Config Storage
```typescript
interface Config {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  triggerTranslate: string;  // "   " (triple space)
  triggerPolish: string;     // "   " (triple space)
}
```

### History Entry
```typescript
interface HistoryEntry {
  id: string;
  original: string;
  processed: string;
  type: 'translate' | 'polish';
  timestamp: number;
}
```

## API Mock (for Development)
Since LLM service is not provided, create a mock service:
```typescript
// Mock responses for testing
mockLLMResponse(prompt: string, type: 'translate' | 'polish'): string
```

## Key Design Decisions

1. **Triple Space Detection**: Listen to `input` event, detect "   " pattern
2. **Content Communication**: Use Chrome message passing
3. **State Management**: React Context for popup, Chrome storage for persistence
4. **Input Replacement**: Direct DOM manipulation on active element

## Testing Strategy

1. **Unit Tests**
   - LLM Client (with mock)
   - Storage Manager
   - Input detection logic

2. **E2E Tests**
   - Extension installation
   - Config save/load
   - Trigger detection
   - Text replacement

## Next Steps
1. Initialize project with React + TypeScript + Vite
2. Setup Chrome Extension manifest
3. Implement storage layer
4. Build content script with input monitoring
5. Create popup UI with tabs
6. Integrate LLM client with mock service
7. Add comprehensive tests
