# Tingly Polish - Chrome Extension

AI-powered translation and text polishing Chrome extension.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Library**: MUI (Material-UI)
- **Styling**: Emotion (MUI's styling engine)
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Testing**: Vitest (unit), Playwright (E2E)
- **LLM Integration**: OpenAI SDK (with compatible services)

## Development Commands

```bash
# Install dependencies
pnpm install

# Development watch mode
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test              # Unit tests
pnpm test:ui           # Vitest UI
pnpm test:coverage     # Coverage report
pnpm test:e2e          # E2E tests

# Linting
pnpm lint              # ESLint check
pnpm lint:fix          # ESLint fix
pnpm type-check        # TypeScript check
```

## Project Structure

```
src/
├── domain/                    # Core business logic (no external deps)
│   ├── types.ts              # Shared types and interfaces
│   └── services/             # Domain services
│       ├── TriggerDetector   # Pattern detection
│       ├── PromptBuilder     # Prompt construction
│       └── TextProcessor     # Text utilities
├── infrastructure/           # External integrations
│   ├── llm/                 # LLM clients (OpenAI, Mock)
│   ├── storage/             # Chrome storage adapters
│   └── messaging/           # Message bus for context comms
├── background/              # Service worker
│   └── service-worker.ts   # Background coordination
├── content/                 # Content scripts
│   └── content-script.ts   # Input monitoring and trigger detection
└── popup/                   # React UI
    ├── components/          # React components (MUI based)
    ├── lib/                # Utilities and API helpers
    ├── App.tsx             # Main app with MUI tabs
    └── main.tsx            # Entry point
```

## Architecture Patterns

### Domain-Driven Design
- **Domain Layer**: Pure business logic, no framework dependencies
- **Infrastructure Layer**: Adapters for external services (Chrome API, LLM)
- **Presentation Layer**: React components using MUI

### Key Patterns
- **Repository Pattern**: Storage abstractions (IConfigRepository, IHistoryRepository)
- **Adapter Pattern**: LLM clients implement ILLMClient interface
- **Message Bus**: Chrome messaging via IMessageBus
- **Factory Pattern**: LLMClientFactory creates appropriate client

## Component Guidelines

### Using MUI Components
```tsx
import { Box, TextField, Button } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

// Use sx prop for styling
<Box sx={{ p: 2, mb: 1 }}>
  <TextField
    fullWidth
    size="small"
    label="Field Label"
    value={value}
    onChange={(e) => setValue(e.target.value)}
  />
  <Button variant="contained" startIcon={<SaveIcon />}>
    Save
  </Button>
</Box>
```

### State Management
- Use React hooks for local state
- Use Chrome storage for persistent state
- Communication via chrome.runtime.sendMessage

### API Calls
```tsx
import { getConfig, updateConfig } from '../lib/api';

const config = await getConfig();
await updateConfig({ apiKey: 'new-key' });
```

## Adding New Features

1. **Domain Logic**: Add to `src/domain/services/`
2. **Types**: Update `src/domain/types.ts`
3. **Storage**: Extend repository interfaces
4. **UI**: Create MUI components in `src/popup/components/`
5. **Tests**: Add unit tests in `tests/unit/`

## LLM Client Integration

```tsx
import { LLMClientFactory } from '../infrastructure/llm/LLMClients';

// Factory creates appropriate client based on config
const llmClient = LLMClientFactory.create(config);

// Use the client
const translated = await llmClient.translate(text, 'Chinese');
const polished = await llmClient.polish(text);
```

## Testing

### Unit Tests
```tsx
import { describe, it, expect } from 'vitest';

describe('MyService', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

### E2E Tests
```tsx
import { test, expect } from '../fixtures';

test('popup loads', async ({ context }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
  await expect(page.locator('h1')).toContainText('Tingly Polish');
});
```

## Important Notes

- Use `pnpm` as package manager (configured in package.json)
- All Chrome API calls use chrome.storage.local and chrome.runtime messaging
- Content script monitors inputs for triple-space trigger pattern
- Mock LLM client available for development without API keys
- History limited to 100 entries, stored locally
