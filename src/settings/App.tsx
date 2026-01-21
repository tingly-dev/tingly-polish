import * as React from 'react';
import {
  Box,
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Keyboard as KeyboardIcon,
  Psychology as PsychologyIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { SettingsLayout } from './components/SettingsLayout';
import { NavItem } from './components/NavItem';
import { SaveIndicator } from './components/SaveIndicator';
import { ApiConfigSection } from './components/ApiConfigSection';
import { TriggersSection } from './components/TriggersSection';
import { PromptsSection } from './components/PromptsSection';
import { HistorySection } from './components/HistorySection';
import { SettingsProvider, useSettingsContext } from './contexts/SettingsContext';
import { theme } from '../popup/theme';

type Section = 'api' | 'triggers' | 'prompts' | 'history';

interface SectionConfig {
  id: Section;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const sections: SectionConfig[] = [
  {
    id: 'api',
    label: 'API Configuration',
    icon: <CloudIcon />,
    component: <ApiConfigSection />,
  },
  {
    id: 'triggers',
    label: 'Triggers',
    icon: <KeyboardIcon />,
    component: <TriggersSection />,
  },
  {
    id: 'prompts',
    label: 'Prompts',
    icon: <PsychologyIcon />,
    component: <PromptsSection />,
  },
  {
    id: 'history',
    label: 'History',
    icon: <HistoryIcon />,
    component: <HistorySection />,
  },
];

function SettingsAppContent() {
  const [activeSection, setActiveSection] = React.useState<Section>('api');
  const [previousSection, setPreviousSection] = React.useState<Section | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const { saveCurrentSection, getCurrentSectionState } = useSettingsContext();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSectionChange = async (newSection: Section) => {
    if (newSection === activeSection) return;

    // Save current section before switching
    if (previousSection !== null) {
      await saveCurrentSection(activeSection);
    }

    setPreviousSection(activeSection);
    setActiveSection(newSection);
  };

  React.useEffect(() => {
    // Initialize previousSection after mount
    if (mounted && previousSection === null) {
      setPreviousSection(activeSection);
    }
  }, [mounted, activeSection, previousSection]);

  if (!mounted) return null;

  const currentSection = sections.find(s => s.id === activeSection);
  const sectionState = getCurrentSectionState(activeSection);

  return (
    <SettingsLayout
      sidebar={
        <>
          {sections.map((section) => {
            const state = getCurrentSectionState(section.id);
            return (
              <NavItem
                key={section.id}
                icon={section.icon}
                label={section.label}
                active={activeSection === section.id}
                hasPendingChanges={state?.hasPendingChanges}
                onClick={() => handleSectionChange(section.id)}
              />
            );
          })}
        </>
      }
    >
      {currentSection?.component}
    </SettingsLayout>
  );
}

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SettingsProvider>
        <SettingsAppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
