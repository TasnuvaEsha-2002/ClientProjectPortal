// This file defines role-based visual themes.
// Each user role gets a distinct primary color, so the UI visibly
// signals which role is currently logged in — addressing the
// supervisor's feedback that every page looked identical regardless of user.
import { createTheme } from '@mui/material/styles';

// Color palette per role
const roleColors = {
  Admin: { primary: '#B23B3B', secondary: '#E57373' },        // Deep red — authority/system control
  ProjectManager: { primary: '#2E5EAA', secondary: '#00B8A9' }, // Blue — original theme, management
  TeamMember: { primary: '#2E7D32', secondary: '#81C784' },     // Green — active work/progress
  Client: { primary: '#7B4FA3', secondary: '#B39DDB' },         // Purple — external/review
};

// Falls back to the original blue theme if no role matches (e.g. login/register pages)
export function createAppTheme(role) {
  const colors = roleColors[role] || { primary: '#2E5EAA', secondary: '#00B8A9' };

  return createTheme({
    palette: {
      primary: { main: colors.primary },
      secondary: { main: colors.secondary },
      background: { default: '#F5F7FA' },
    },
    typography: {
      fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
        },
      },
    },
  });
}