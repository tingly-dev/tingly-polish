# Spec: Settings Page Redesign - Waterfall Sidebar Layout

## Overview

Redesign the extension's configuration UI from a tab-based popup to a standalone settings page with a classic waterfall-style left sidebar navigation.

## User Intent

The user wants a cleaner, more traditional settings experience. Instead of a small popup with tabs, clicking the extension icon should open a full settings page with a persistent left sidebar for navigation.

## Current State

```
┌─────────────────────────────────────┐
│  Tingly Polish          [TP]        │
│  ┌─────────────────────────────┐   │
│  │ [AI Config] [Prompts] [History] │
│  ├─────────────────────────────┤   │
│  │                             │   │
│  │  Tab Content (scrollable)    │   │
│  │                             │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Files:**
- `src/popup/App.tsx` - Tab-based layout with 3 tabs
- `src/popup/components/AIConfigPage.tsx` - API & Trigger config
- `src/popup/components/PromptsPage.tsx` - Prompt configuration
- `src/popup/components/HistoryPage.tsx` - History viewing

## Target Design

**Full Browser Tab Settings Page**

```
┌─────────────────────────────────────────────────────────────────┐
│  Tingly Polish                                           [TP]   │
├────────────┬────────────────────────────────────────────────────┤
│            │  ┌──────────────────────────────────────────────┐ │
│            │  │ API Configuration                            │ │
│  ┌──────┐  │  ├──────────────────────────────────────────────┤ │
│  │ API  │  │  │                                              │ │
│  │      │  │  │ Configuration fields (auto-save)             │ │
│  ├──────┤  │  │                                              │ │
│  │      │  │  │                                              │ │
│  │Trigger│  │  │                                              │ │
│  │      │  │  │                                              │ │
│  ├──────┤  │  │                                              │ │
│  │      │  │  │                                              │ │
│  │Prompt│  │  │                                              │ │
│  │      │  │  │                                              │ │
│  ├──────┤  │  │                                              │ │
│  │      │  │  │                                              │ │
│  │History│  │  │                                              │ │
│  │      │  │  │                                              │ │
│  └──────┘  │  └──────────────────────────────────────────────┘ │
│  Sidebar   │                   Main Content                    │
└────────────┴────────────────────────────────────────────────────┘
```

**Key Changes:**
- Opens as `chrome.tabs.create()` to a full page
- No save buttons - auto-save on field change
- 4 separate sections in sidebar

## Module Design

### 1. Settings Page (New Entry Point)
**File:** `src/settings/index.html`, `src/settings/App.tsx`

**Purpose:** Full browser tab settings page (not popup)

```typescript
// Opens via chrome.tabs.create() on extension icon click
// URL: chrome-extension://<id>/src/settings/index.html
```

### 2. Settings Layout Component
**File:** `src/settings/components/SettingsLayout.tsx`

```typescript
interface SettingsLayoutProps {
  children: React.ReactNode;
}

// Left sidebar with navigation items
// Main content area with scroll support
// Full viewport height layout
```

**Responsibilities:**
- Render left sidebar navigation
- Handle active section state
- Provide consistent layout wrapper

### 3. Navigation Item Component
**File:** `src/settings/components/NavItem.tsx`

```typescript
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}
```

**Styling:**
- Active state: highlighted background + accent border
- Hover effects
- Icon + label layout
- MUI styled components

### 4. Auto-Save Hook
**File:** `src/settings/hooks/useAutoSave.ts`

```typescript
interface UseAutoSaveOptions {
  debounceMs?: number;
  onSave?: () => void;
}

function useAutoSave<T extends object>(
  config: T,
  saveFn: (config: T) => Promise<void>,
  options?: UseAutoSaveOptions
): {
  updateConfig: (updates: Partial<T>) => void;
  isSaving: boolean;
  lastSaved: Date | null;
}
```

**Behavior:**
- Debounced auto-save (default 500ms)
- Visual indicator when saving
- Success indicator when saved

### 5. Section Pages
**Files:**
- `src/settings/components/ApiConfigSection.tsx` - API keys, base URL, model, mock mode
- `src/settings/components/TriggersSection.tsx` - Trigger keys, target language
- `src/settings/components/PromptsSection.tsx` - System/translate/polish prompts
- `src/settings/components/HistorySection.tsx` - View and manage history

**Changes:**
- Remove save/reset buttons (auto-save)
- Use `useAutoSave` hook
- Adjust layout for full page width
- Clean, focused content

## Implementation Plan

### Phase 1: Settings Page Foundation
1. Create `src/settings/` directory structure
2. Create `src/settings/index.html` entry point
3. Create `src/settings/main.tsx` React entry
4. Update `vite.config.ts` for multi-page build

### Phase 2: Layout & Components
5. Create `SettingsLayout.tsx` with sidebar structure
6. Create `NavItem.tsx` component
7. Create `useAutoSave.ts` hook

### Phase 3: Section Pages
8. Create `ApiConfigSection.tsx` (API config only)
9. Create `TriggersSection.tsx` (triggers only)
10. Create `PromptsSection.tsx`
11. Create `HistorySection.tsx`

### Phase 4: Integration
12. Update `src/settings/App.tsx` with navigation
13. Update manifest.json for settings page
14. Update background service worker to open settings on click

### Phase 5: Polish
15. Add transitions/animations
16. Update theme for sidebar styling
17. E2E testing

## Styling Guidelines

### Sidebar
```typescript
const sidebarStyles = {
  width: 200,
  bgcolor: 'background.paper',
  borderRight: '1px solid',
  borderColor: 'divider',
};
```

### Nav Items
```typescript
const navItemStyles = {
  px: 3,
  py: 2.5,
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  // Active state
  '&.active': {
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
  },
};
```

### Main Content
```typescript
const contentStyles = {
  flex: 1,
  overflowY: 'auto',
  p: 4,
  maxWidth: 900,
};
```

## Navigation Structure

**Primary Sections (Sidebar - 4 items):**
1. **API Configuration** - API keys, base URL, model, mock mode
2. **Triggers** - Trigger keys, target language
3. **Prompts** - System/translate/polish prompts
4. **History** - View and manage history

**Auto-Save Behavior:**
- Debounced auto-save (500ms) after field changes
- Visual indicator (dot) when changes are saving
- Success indicator when saved

## Testing

### Unit Tests
- `SettingsLayout` rendering
- `NavItem` state changes
- Navigation state management

### E2E Tests
- Click icon → settings page opens
- Sidebar navigation switches sections
- Form submissions work correctly

## Migration Notes

- **New Entry Point:** Settings page opens as full browser tab via `chrome.tabs.create()`
- **No API Changes:** All existing `api.ts` functions remain
- **Storage:** No changes to storage schema
- **Content Script:** No changes needed
- **Popup:** Can be removed or kept for quick status view

## Files to Create

```
src/settings/
├── index.html                 # NEW - Settings page entry
├── main.tsx                   # NEW - React entry point
├── App.tsx                    # NEW - Settings app with sidebar
├── components/
│   ├── SettingsLayout.tsx     # NEW - Sidebar layout
│   ├── NavItem.tsx            # NEW - Navigation item
│   ├── ApiConfigSection.tsx   # NEW - API configuration
│   ├── TriggersSection.tsx    # NEW - Trigger configuration
│   ├── PromptsSection.tsx     # NEW - Prompt configuration
│   ├── HistorySection.tsx     # NEW - History viewing
│   └── SaveIndicator.tsx      # NEW - Auto-save status indicator
└── hooks/
    └── useAutoSave.ts         # NEW - Debounced auto-save hook
```

## Files to Modify

```
manifest.json                  # Add options_page or handle in action
src/background/service-worker.ts  # Open settings tab on icon click
vite.config.ts                # Multi-page build setup
```

## Design Decisions (Resolved)

1. **Full browser tab** vs popup → Full browser tab
2. **4 separate sections** vs combined → Separate sections
3. **Auto-save** vs manual save → Auto-save on change

