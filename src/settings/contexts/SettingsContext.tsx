import * as React from 'react';

export interface SectionSaver {
  save: () => Promise<void>;
  hasPendingChanges: boolean;
}

interface SettingsContextValue {
  registerSection: (id: string, saver: SectionSaver) => void;
  unregisterSection: (id: string) => void;
  saveCurrentSection: (id: string) => Promise<void>;
  getCurrentSectionState: (id: string) => { hasPendingChanges: boolean } | null;
}

const SettingsContext = React.createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const sectionsRef = React.useRef<Map<string, SectionSaver>>(new Map());

  const registerSection = React.useCallback((id: string, saver: SectionSaver) => {
    sectionsRef.current.set(id, saver);
  }, []);

  const unregisterSection = React.useCallback((id: string) => {
    sectionsRef.current.delete(id);
  }, []);

  const saveCurrentSection = React.useCallback(async (id: string): Promise<void> => {
    const saver = sectionsRef.current.get(id);
    if (saver) {
      await saver.save();
    }
  }, []);

  const getCurrentSectionState = React.useCallback((id: string) => {
    const saver = sectionsRef.current.get(id);
    if (saver) {
      return { hasPendingChanges: saver.hasPendingChanges };
    }
    return null;
  }, []);

  return (
    <SettingsContext.Provider
      value={{ registerSection, unregisterSection, saveCurrentSection, getCurrentSectionState }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return context;
}
