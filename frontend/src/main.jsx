import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme.js';
import App from './App.jsx';

// ThemeProvider applies our custom colors/fonts to every MUI component
// CssBaseline resets default browser styling for a consistent look
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);