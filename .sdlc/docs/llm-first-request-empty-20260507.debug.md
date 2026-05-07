# Debug: First Request Returns Empty Content

**Date**: 2026-05-07
**Status**: Root Cause Found
**Priority**: Critical

---

## Bug Description
On a new page, the first trigger of a model request always returns no content. After cancelling and retrying, it works correctly.

---

## Reproduction Steps
1. Open a new page or browser session
2. Trigger translation/polish for the first time
3. Observe: No content returned
4. Cancel and retry
5. Observe: Works correctly

**Expected**: Content should be returned on first request
**Actual**: First request returns empty, subsequent requests work

---

## Environment
- **Extension**: Tingly Polish Chrome Extension
- **Context**: New page/session (service worker cold start)
- **All users**: Affected

---

## Investigation

### Logs & Errors
Based on user report: "First request returns no content, then cancel retry works"

### Code Analysis

**File**: [service-worker.ts](src/background/service-worker.ts)
**Lines**: 27-44 (Service Worker initialization)

```typescript
private async initialize(): Promise<void> {
  // Load initial config
  this.currentConfig = await this.configRepository.getConfig();

  // Initialize LLM client
  this.updateLLMClient();

  // Setup message handlers
  this.setupMessageHandlers();

  // Subscribe to config changes
  this.configRepository.subscribe((config) => {
    this.currentConfig = config;
    this.updateLLMClient();
  });

  console.log('Tingly Polish: Service Worker initialized');
}
```

**Issue**: The `initialize()` method is async but not awaited. The service worker constructor calls it but doesn't wait for completion.

**File**: [service-worker.ts](src/background/service-worker.ts)
**Lines**: 393-394

```typescript
// Initialize service worker
new ServiceWorker();
```

**Issue**: No await on initialization. Message handlers may be called before config is loaded.

### Root Cause Analysis

1. **Service Worker Cold Start**: When a new page loads, the service worker starts fresh
2. **Race Condition**: The message handlers are set up synchronously, but config loading is async
3. **First Request**: Arrives before `initialize()` completes
4. **State Check**: In [processDirectText()](src/background/service-worker.ts:215-252):

```typescript
if (!this.currentConfig || !this.llmClient) {
  throw new Error('Extension not properly configured');
}
```

5. **Problem**: First request sees `currentConfig = null` or `llmClient = null`
6. **Second Request**: By the time the user retries, initialization has completed

---

## Root Cause

**Service Worker Initialization Race Condition**

The service worker's async initialization is not awaited, creating a window where message handlers can receive requests before the config and LLM client are ready.

Timeline of first request:
1. New page loads → Service worker starts
2. `new ServiceWorker()` called
3. Constructor calls `this.initialize()` (async, not awaited)
4. `setupMessageHandlers()` completes synchronously
5. User triggers action → Message sent
6. Handler executes before `initialize()` completes
7. `currentConfig` is still `null` → Error or empty response

Timeline of second request:
1. User retries after cancel
2. `initialize()` has completed by now
3. `currentConfig` and `llmClient` are ready
4. Request succeeds

---

## Proposed Fix

### Solution 1: Queue Requests During Initialization

Add a request queue that holds messages until initialization completes:

```typescript
class ServiceWorker {
  private initialized = false;
  private pendingMessages: Array<{type: any, payload: any, resolve: any, reject: any}> = [];

  private async initialize(): Promise<void> {
    // Load initial config
    this.currentConfig = await this.configRepository.getConfig();
    this.updateLLMClient();
    this.setupMessageHandlers();

    // Process any pending messages
    this.initialized = true;
    for (const msg of this.pendingMessages) {
      this.processMessage(msg.type, msg.payload).then(msg.resolve).catch(msg.reject);
    }
    this.pendingMessages = [];
  }

  private setupMessageHandlers(): void {
    this.messageBus.onMessage<MessageType, Response>(
      MessageTopics.PROCESS_DIRECT_TEXT,
      async (payload) => {
        if (!this.initialized) {
          return new Promise((resolve, reject) => {
            this.pendingMessages.push({type: 'PROCESS_DIRECT_TEXT', payload, resolve, reject});
          });
        }
        return await this.processDirectText(payload);
      }
    );
  }
}
```

### Solution 2: Make Initialization Synchronous for Critical State

Load config synchronously using cached defaults first:

```typescript
constructor() {
  this.configRepository = new ChromeConfigRepository();
  this.historyRepository = new ChromeHistoryRepository();
  this.messageBus = new ChromeMessageBus();

  // Set defaults immediately
  this.currentConfig = { ...DEFAULT_CONFIG };
  this.llmClient = LLMClientFactory.create(this.currentConfig);

  this.setupMessageHandlers();

  // Then load actual config async
  this.initializeAsync();
}
```

### Solution 3: Add Initialization Check in Handlers (RECOMMENDED)

Check initialization state and wait if needed:

```typescript
private initPromise: Promise<void> | null = null;

constructor() {
  this.configRepository = new ChromeConfigRepository();
  this.historyRepository = new ChromeHistoryRepository();
  this.messageBus = new ChromeMessageBus();

  this.initPromise = this.initialize();
  this.setupMessageHandlers();
}

private async processDirectText(payload: ProcessDirectTextPayload): Promise<ProcessDirectTextResponse> {
  // Wait for initialization
  await this.initPromise;

  if (!this.currentConfig || !this.llmClient) {
    throw new Error('Extension not properly configured');
  }
  // ... rest of method
}
```

---

## Testing Plan

- [ ] Test first request on new page (should work)
- [ ] Test rapid successive requests
- [ ] Test with service worker restart (chrome.runtime.reload)
- [ ] Test with invalid config (should show proper error)

---

## Status

- [x] Bug reproduced (theoretical)
- [x] Root cause identified
- [ ] Fix implemented
- [ ] Tests passing
- [ ] Ready for commit

---

## Related Files

- [src/background/service-worker.ts](src/background/service-worker.ts)
- [src/infrastructure/storage/ChromeStorageAdapter.ts](src/infrastructure/storage/ChromeStorageAdapter.ts)
- [src/popup/lib/api.ts](src/popup/lib/api.ts)
