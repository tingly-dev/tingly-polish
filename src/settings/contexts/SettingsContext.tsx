import * as React from 'react';

export interface SectionSaver {
  hasPendingChanges: boolean;
  save: () => Promise<void>;
  discardChanges?: () => void;
}

interface SettingsContextValue {
  registerSection: (id: string, saver: SectionSaver) => void;
  unregisterSection: (id: string) => void;
  getSectionState: (id: string) => SectionSaver | null;
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

  const getSectionState = React.useCallback((id: string) => {
    return sectionsRef.current.get(id) || null;
  }, []);

  return (
    <SettingsContext.Provider value={{ registerSection, unregisterSection, getSectionState }}>
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
