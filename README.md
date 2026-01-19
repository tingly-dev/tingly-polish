# Tingly Polish

A Chrome extension that provides AI-powered translation and text polishing for web page input fields. Simply type a trigger pattern (default: triple space) in any input field to automatically translate or polish your text.

## Features

- **Translation**: Translate text to your target language
- **Polish**: Improve and refine text for better clarity
- **In-place Replacement**: Automatically replaces original text with processed result
- **History Tracking**: Keeps backup of your original inputs (with option to delete all)
- **Configurable Prompts**: Customize system and user prompts
- **Multiple LLM Support**: Works with OpenAI-compatible APIs or mock service for testing
- **Trigger Customization**: Define your own trigger patterns

## Installation

### Development Setup

```bash
# Install dependencies (requires pnpm)
pnpm install

# Build the extension
pnpm build

# Load in Chrome
1. Go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder
```

### Development Mode

```bash
# Watch mode for development
pnpm dev
```

## Usage

1. **Configure the Extension**
   - Click the extension icon in Chrome toolbar
   - Go to "Config" tab
   - Enter your API key, base URL, and model
   - Or enable "Use Mock API" for testing without an API key

2. **Set Target Language**
   - Select your target language in the config

3. **Use the Extension**
   - Type text in any input field on a webpage
   - Type three spaces (`   `) at the end
   - The text will be automatically translated or polished
   - Original text is saved to history

4. **View History**
   - Click extension icon
   - Go to "History" tab
   - View all processed text with original versions
   - Copy results or clear all history

## Configuration

### API Settings
- **API Key**: Your LLM provider API key
- **Base URL**: API endpoint (default: https://api.openai.com/v1)
- **Model**: Model name (default: gpt-4o-mini)
- **Use Mock**: Enable for testing without API

### Prompt Settings
- **System Prompt**: Base instructions for the AI
- **Translation Prompt**: Template for translation requests
- **Polish Prompt**: Template for polish requests

Placeholders:
- `{text}` - The input text to process
- `{targetLanguage}` - Target language for translation

### Trigger Settings
- **Translation Trigger**: Pattern to trigger translation (default: `   `)
- **Polish Trigger**: Pattern to trigger polish (default: `   `)
- **Target Language**: Default translation target

## Architecture

```
src/
├── domain/           # Core business logic
│   ├── types.ts      # Shared types and interfaces
│   └── services/     # Domain services
├── infrastructure/   # External integrations
│   ├── llm/         # LLM clients
│   ├── storage/     # Chrome storage adapters
│   └── messaging/   # Message bus
├── background/      # Service worker
├── content/         # Content scripts
└── popup/           # React UI
```

## Testing

```bash
# Run unit tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

## Default Prompts

### System Prompt
```
You are a professional language assistant. Provide accurate translations
and natural, polished text improvements. Maintain the original meaning
while enhancing clarity and flow.
```

### Translation Prompt
```
Translate the following text to {targetLanguage}:

{text}

Only return the translated text, no explanations.
```

### Polish Prompt
```
Improve and polish the following text for better clarity and flow:

{text}

Only return the improved text, no explanations.
```

## Development

### Tech Stack
- React 18 + TypeScript
- Vite for building
- MUI (Material-UI) for UI components
- Vitest for unit testing
- Playwright for E2E testing
- OpenAI SDK for LLM integration
- pnpm as package manager

### Build Commands
```bash
pnpm build            # Production build
pnpm dev              # Development watch mode
```

### Code Quality
```bash
pnpm lint            # Lint code
pnpm type-check      # TypeScript type checking
```

## Privacy

- All configuration and history stored locally in Chrome
- API calls made directly to your configured endpoint
- No telemetry or data collection
- Mock mode available for offline testing

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Support

For issues and feature requests, please open an issue on GitHub.
