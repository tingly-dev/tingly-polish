import * as React from 'react';

export interface UseAutoSaveOptions {
  debounceMs?: number;
  autoSave?: boolean; // If false, only manual save is allowed
  onSave?: () => void;
  onError?: (error: unknown) => void;
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasPendingChanges: boolean;
}

export function useAutoSave<T extends object>(
  config: T,
  saveFn: (config: T) => Promise<void>,
  options: UseAutoSaveOptions = {}
) {
  const { debounceMs = 500, autoSave = true, onSave, onError } = options;

  const [state, setState] = React.useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasPendingChanges: false,
  });

  const configRef = React.useRef(config);
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = React.useRef<Partial<T> | null>(null);

  // Update ref when config changes
  React.useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const performSave = React.useCallback(async () => {
    if (!pendingUpdatesRef.current || state.isSaving) {
      return;
    }

    setState(prev => ({ ...prev, isSaving: true, hasPendingChanges: false }));

    try {
      // Apply pending updates to current config
      const updatedConfig = { ...configRef.current, ...pendingUpdatesRef.current };
      await saveFn(updatedConfig);
      configRef.current = updatedConfig;
      pendingUpdatesRef.current = null;

      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
      }));

      onSave?.();
    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false, hasPendingChanges: true }));
      onError?.(error);
    }
  }, [saveFn, onSave, onError, state.isSaving]);

  const updateConfig = React.useCallback((updates: Partial<T>) => {
    // Apply updates immediately to local ref
    configRef.current = { ...configRef.current, ...updates };
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

    setState(prev => ({ ...prev, hasPendingChanges: true }));

    // If autoSave is disabled, don't schedule automatic save
    if (!autoSave) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);
  }, [autoSave, debounceMs, performSave]);

  // Force immediate save (manual save)
  const saveNow = React.useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await performSave();
  }, [performSave]);

  return {
    config: configRef.current,
    updateConfig,
    saveNow,
    ...state,
  };
}
