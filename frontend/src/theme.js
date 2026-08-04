// This file defines our app's visual theme —
// custom colors, fonts, and spacing used throughout the app
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E5EAA', // a professional deep blue
    },
    secondary: {
      main: '#00B8A9', // a fresh teal accent
    },
    background: {
      default: '#F5F7FA', // soft light grey background instead of plain white
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10, // slightly rounded corners everywhere (cards, buttons, inputs)
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // buttons show normal text, not ALL CAPS
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', // soft shadow for cards
        },
      },
    },
  },
});

export default theme;