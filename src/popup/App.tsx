import React, { useState } from 'react';
import { AIConfigPage } from './components/AIConfigPage';
import { PromptsPage } from './components/PromptsPage';
import { HistoryPage } from './components/HistoryPage';
import { Box, ThemeProvider, CssBaseline, Tabs, Tab } from '@mui/material';
import { theme, injectFonts } from './theme';
import { Settings as SettingsIcon, AutoFixHigh as AutoFixHighIcon, History as HistoryIcon } from '@mui/icons-material';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{
        height: 510,
        overflowY: 'hidden',
        opacity: value === index ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      {value === index && children}
    </Box>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    const cleanup = injectFonts();
    setMounted(true);
    return cleanup;
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!mounted) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          width: 480,
          height: 600,
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Logo */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              <Box
                sx={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: '#ffffff',
                  letterSpacing: '0.05em',
                }}
              >
                TP
              </Box>
            </Box>

            {/* Title */}
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  letterSpacing: '-0.01em',
                }}
              >
                Tingly Polish
              </Box>
              <Box
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  mt: 0.2,
                }}
              >
                AI Translation & Polish
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ px: 3, pt: 2, pb: 0 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              minHeight: 'auto',
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: 'linear-gradient(90deg, #6366f1 0%, #14b8a6 100%)',
              },
              '& .MuiTab-root': {
                minHeight: 44,
                textTransform: 'none',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'text.secondary',
                letterSpacing: '0.01em',
                px: 2,
                '&.Mui-selected': {
                  color: 'primary.main',
                },
              },
            }}
          >
            <Tab icon={<SettingsIcon sx={{ fontSize: '1.1rem' }} />} label="AI Config" iconPosition="start" />
            <Tab icon={<AutoFixHighIcon sx={{ fontSize: '1.1rem' }} />} label="Prompts" iconPosition="start" />
            <Tab icon={<HistoryIcon sx={{ fontSize: '1.1rem' }} />} label="History" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Content */}
        <TabPanel value={activeTab} index={0}>
          <AIConfigPage />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <PromptsPage />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <HistoryPage />
        </TabPanel>

        {/* Footer */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              color: 'text.secondary',
            }}
          >
            Type triple space to trigger
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
              }}
            />
            <Box
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.7rem',
                color: 'text.secondary',
                fontWeight: 500,
              }}
            >
              Active
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
