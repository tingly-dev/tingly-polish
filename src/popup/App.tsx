import React from 'react';
import { ConfigPage } from './components/ConfigPage';
import { HistoryPage } from './components/HistoryPage';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Container,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import { Settings as SettingsIcon, History as HistoryIcon } from '@mui/icons-material';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ height: 440, overflowY: 'auto' }}>
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </Box>
  );
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f5f5f5',
        },
      },
    },
  },
});

export function App() {
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: 400, height: 500, bgcolor: 'background.paper' }}>
        {/* Header */}
        <AppBar position="static" elevation={0}>
          <Toolbar variant="dense">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1,
              }}
            >
              <Typography variant="body2" fontWeight="bold" color="white">
                TP
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontSize={16} fontWeight="bold">
                Tingly Polish
              </Typography>
              <Typography variant="caption" fontSize={10}>
                AI Translation & Polish
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab icon={<SettingsIcon />} label="Config" iconPosition="start" />
            <Tab icon={<HistoryIcon />} label="History" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Content */}
        <TabPanel value={activeTab} index={0}>
          <ConfigPage />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <HistoryPage />
        </TabPanel>

        {/* Footer */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            p: 1,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Type triple space in any input to trigger
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
