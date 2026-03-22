# Spec: Fix Trigger Pattern Detection - End-Only Matching

**Date**: 2026-01-21
**Issue**: Trigger patterns should only match at the END of text, not anywhere in content

## Problem Statement

The current trigger detection logic uses `lastIndexOf()` to find trigger patterns anywhere in the text, not just at the end. This causes false positives when the trigger pattern appears in the middle of content.

### Current Behavior (Bug)
```typescript
// In TriggerDetector.detect()
const index = text.lastIndexOf(triggerPattern); // Finds pattern anywhere
```

**Example False Positives:**
- Input: `"hello   world"` with trigger `'   '` → **Triggers** (wrong!)
- Input: `"test   more text"` with trigger `'///'` → **Triggers** if `///` appears anywhere

### Expected Behavior (Fix)
Trigger patterns should ONLY match when they appear at the END of the text.

**Correct Examples:**
- Input: `"hello world   "` with trigger `'   '` → ✅ Triggers
- Input: `"hello   world"` with trigger `'   '` → ❌ Does NOT trigger
- Input: `"text///"` with trigger `'///'` → ✅ Triggers
- Input: `"///text"` with trigger `'///'` → ❌ Does NOT trigger

## Design

### Modified Detection Logic

**File**: `src/domain/services/TriggerDetector.ts`

```typescript
detect(text: string, triggerPattern: string, type: ProcessType): TriggerResult {
  if (!text || !triggerPattern) {
    return { detected: false };
  }

  // Check if text ENDS WITH the trigger pattern
  if (!text.endsWith(triggerPattern)) {
    return { detected: false };
  }

  // Remove trigger pattern from end
  const remainingText = text.substring(0, text.length - triggerPattern.length);

  return {
    detected: true,
    type,
    matchedText: triggerPattern,
    remainingText: remainingText,
  };
}
```

### Changes Summary

1. **Replace** `lastIndexOf()` with `endsWith()` check
2. **Simplify** removal logic - just remove from end using `substring()`
3. **Remove** unnecessary `beforeTrigger`/`afterTrigger` concatenation

## Test Cases

### Unit Tests Required

```typescript
describe('TriggerDetector - End-Only Matching', () => {
  const detector = new TriggerDetector();
  const trigger = '   ';

  it('should trigger when pattern is at end', () => {
    const result = detector.detect('hello world   ', trigger, 'translate');
    expect(result.detected).toBe(true);
    expect(result.remainingText).toBe('hello world');
  });

  it('should NOT trigger when pattern is in middle', () => {
    const result = detector.detect('hello   world', trigger, 'translate');
    expect(result.detected).toBe(false);
  });

  it('should NOT trigger when pattern is at start', () => {
    const result = detector.detect('   hello world', trigger, 'translate');
    expect(result.detected).toBe(false);
  });

  it('should NOT trigger when pattern appears multiple times but not at end', () => {
    const result = detector.detect('hello   world   test', trigger, 'translate');
    expect(result.detected).toBe(false);
  });

  it('should trigger when pattern is only content', () => {
    const result = detector.detect('   ', trigger, 'translate');
    expect(result.detected).toBe(true);
    expect(result.remainingText).toBe('');
  });

  it('should handle polish trigger pattern', () => {
    const result = detector.detect('text to polish///', '///', 'polish');
    expect(result.detected).toBe(true);
    expect(result.remainingText).toBe('text to polish');
  });
});
```

## Edge Cases

| Input | Trigger | Expected | Reason |
|-------|---------|----------|--------|
| `'   '` | `'   '` | ✅ Trigger | Pattern is entire content |
| `'a   '` | `'   '` | ✅ Trigger | Pattern at end |
| `'   a'` | `'   '` | ❌ No trigger | Pattern at start |
| `'a   b'` | `'   '` | ❌ No trigger | Pattern in middle |
| `'a   b   '` | `'   '` | ✅ Trigger | Pattern at end (even if also in middle) |
| `'a///b'` | `'///'` | ❌ No trigger | Pattern in middle |
| `''` | `'   '` | ❌ No trigger | Empty input |
| `'test'` | `'   '` | ❌ No trigger | No pattern |

## Files to Modify

1. **Domain Service** (Core fix):
   - `src/domain/services/TriggerDetector.ts`

2. **Tests** (Add/Update):
   - `tests/unit/domain/TriggerDetector.test.ts` (if exists, otherwise create)

## Implementation Checklist

- [ ] Update `TriggerDetector.detect()` to use `endsWith()` check
- [ ] Update unit tests with new end-only matching behavior
- [ ] Run `pnpm test` to verify all tests pass
- [ ] Manual test in browser:
  - Type "hello   " in input → should trigger
  - Type "hello   world" in input → should NOT trigger
  - Type "world///" in input → should trigger polish
  - Type "///world" in input → should NOT trigger polish

## Backward Compatibility

This is a **breaking change** in behavior, but it fixes incorrect behavior. Users who have been relying on the buggy behavior (triggering from middle of text) will need to adjust their typing habits to add triggers at the end.

## Documentation Updates

Update any user-facing documentation to clarify:
> "Trigger patterns must be typed at the END of your text to activate translation/polish."
