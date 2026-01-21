import * as React from 'react';

export interface UseAutoSaveOptions {
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
  const { onSave, onError } = options;

  const [state, setState] = React.useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasPendingChanges: false,
  });

  const pendingUpdatesRef = React.useRef<Partial<T>>({});

  const performSave = React.useCallback(async () => {
    if (state.isSaving) {
      return;
    }

    // Check if there are pending changes
    if (Object.keys(pendingUpdatesRef.current).length === 0) {
      return;
    }

    setState(prev => ({ ...prev, isSaving: true, hasPendingChanges: false }));

    try {
      // Apply pending updates to current config
      const updatedConfig = { ...config, ...pendingUpdatesRef.current };
      await saveFn(updatedConfig);
      pendingUpdatesRef.current = {};

      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasPendingChanges: false,
      }));

      onSave?.();
    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false, hasPendingChanges: true }));
      onError?.(error);
      throw error;
    }
  }, [saveFn, onSave, onError, config, state.isSaving]);

  const updateConfig = React.useCallback((updates: Partial<T>) => {
    // Store pending updates
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
    setState(prev => ({ ...prev, hasPendingChanges: true }));
  }, []);

  // Force immediate save
  const saveNow = React.useCallback(async () => {
    await performSave();
  }, [performSave]);

  // Discard pending changes
  const discardChanges = React.useCallback(() => {
    pendingUpdatesRef.current = {};
    setState(prev => ({ ...prev, hasPendingChanges: false }));
  }, []);

  return {
    updateConfig,
    saveNow,
    discardChanges,
    ...state,
  };
}
