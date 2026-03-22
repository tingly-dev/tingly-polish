import * as React from 'react';
import {
  Box,
  ThemeProvider,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Keyboard as KeyboardIcon,
  Psychology as PsychologyIcon,
  History as HistoryIcon,
  Webhook as WebIcon,
  Warning as WarningIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';
import { SettingsLayout } from './components/SettingsLayout';
import { NavItem } from './components/NavItem';
import { SaveIndicator } from './components/SaveIndicator';
import { ApiConfigSection } from './components/ApiConfigSection';
import { TriggersSection } from './components/TriggersSection';
import { PromptsSection } from './components/PromptsSection';
import { HistorySection } from './components/HistorySection';
import { SiteMappingsSection } from './components/SiteMappingsSection';
import { QuickProcessPage } from '../popup/components/QuickProcessPage';
import { SettingsProvider, useSettingsContext } from './contexts/SettingsContext';
import { theme } from '../popup/theme';

type Section = 'api' | 'triggers' | 'prompts' | 'history' | 'sitemappings' | 'quickprocess';

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
    id: 'sitemappings',
    label: 'Site Mappings',
    icon: <WebIcon />,
    component: <SiteMappingsSection />,
  },
  {
    id: 'quickprocess',
    label: 'Quick Process',
    icon: <BoltIcon />,
    component: <QuickProcessPage />,
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
  const [pendingSection, setPendingSection] = React.useState<Section | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const { getSectionState } = useSettingsContext();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSectionChange = (newSection: Section) => {
    if (newSection === activeSection) return;

    // Check if current section has pending changes
    const currentSectionState = getSectionState(activeSection);

    if (currentSectionState?.hasPendingChanges) {
      // Show confirmation dialog
      setPendingSection(newSection);
    } else {
      // No pending changes, just switch
      setActiveSection(newSection);
    }
  };

  const handleConfirmSwitch = async () => {
    // Save current section
    const currentSectionState = getSectionState(activeSection);
    if (currentSectionState?.hasPendingChanges) {
      try {
        await currentSectionState.save();
      } catch {
        // If save fails, don't switch
        setPendingSection(null);
        return;
      }
    }

    // Switch to new section
    if (pendingSection) {
      setActiveSection(pendingSection);
      setPendingSection(null);
    }
  };

  const handleDiscardAndSwitch = () => {
    // Discard changes and switch
    const currentSectionState = getSectionState(activeSection);
    if (currentSectionState?.hasPendingChanges && currentSectionState.discardChanges) {
      currentSectionState.discardChanges();
    }

    if (pendingSection) {
      setActiveSection(pendingSection);
      setPendingSection(null);
    }
  };

  const handleCancelSwitch = () => {
    setPendingSection(null);
  };

  if (!mounted) return null;

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <>
      <SettingsLayout
        sidebar={
          <>
            {sections.map((section) => {
              const state = getSectionState(section.id);
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

      {/* Unsaved Changes Dialog */}
      <Dialog open={!!pendingSection} onClose={handleCancelSwitch} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            <Typography variant="h6">Unsaved Changes</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            You have unsaved changes. Do you want to save them before switching to another section?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDiscardAndSwitch} color="error">
            Discard Changes
          </Button>
          <Button onClick={handleCancelSwitch}>
            Cancel
          </Button>
          <Button onClick={handleConfirmSwitch} variant="contained" autoFocus>
            Save and Switch
          </Button>
        </DialogActions>
      </Dialog>
    </>
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
