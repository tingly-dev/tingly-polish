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

export function App() {
  const [activeSection, setActiveSection] = React.useState<Section>('api');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SettingsLayout
        sidebar={
          <>
            {sections.map((section) => (
              <NavItem
                key={section.id}
                icon={section.icon}
                label={section.label}
                active={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
              />
            ))}
          </>
        }
      >
        {currentSection?.component}
      </SettingsLayout>
    </ThemeProvider>
  );
}

export default App;
