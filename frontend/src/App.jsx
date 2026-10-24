import axios from 'axios';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Stack,
  Chip,
  ThemeProvider,
  CssBaseline,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Card,
  CardActionArea,
  Grid,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FlagIcon from '@mui/icons-material/Flag';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';

import { createAppTheme } from './theme.js';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import MilestonesPage from './pages/MilestonesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DocumentsPage from './pages/DocumentsPage';
import ProfilePage from './pages/ProfilePage';
import UserManagementPage from './pages/UserManagementPage';

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ============================================================
// ADMIN LAYOUT — permanent left sidebar
// ============================================================
function AdminLayout({ user, onLogout, children }) {
  const location = useLocation();
  const items = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Projects', path: '/projects', icon: <FolderIcon /> },
    { label: 'Users', path: '/users', icon: <PeopleIcon /> },
    { label: 'My Profile', path: '/profile', icon: <PersonIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 220,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: 220, boxSizing: 'border-box', bgcolor: 'primary.main', color: 'white' },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight="bold">Admin Panel</Typography>
          <Chip label={user.fullName} size="small" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
        </Box>
        <List>
          {items.map((item) => (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                color: 'white',
                '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.15)' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<LogoutIcon />}
            onClick={onLogout}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Client Project Collaboration Portal
        </Typography>
        {children}
      </Box>
    </Box>
  );
}

// ============================================================
// PROJECT MANAGER LAYOUT — horizontal top tabs (full control)
// ============================================================
function PMLayout({ user, onLogout, children }) {
  const location = useLocation();
  const items = [
    { label: 'Dashboard', path: '/' },
    { label: 'Projects', path: '/projects' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Milestones', path: '/milestones' },
    { label: 'Documents', path: '/documents' },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
        Client Project Collaboration Portal
      </Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3, borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }} flexWrap="wrap">
        <Stack direction="row" spacing={3}>
          {items.map((item) => (
            <Typography
              key={item.path}
              component={Link}
              to={item.path}
              variant="subtitle1"
              fontWeight={location.pathname === item.path ? 700 : 400}
              sx={{
                textDecoration: 'none',
                color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                borderBottom: location.pathname === item.path ? '3px solid' : 'none',
                borderColor: 'primary.main',
                pb: 1,
              }}
            >
              {item.label}
            </Typography>
          ))}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" component={Link} to="/profile" sx={{ textDecoration: 'none' }}>
          <Chip label={`${user.fullName} — ${user.role}`} color="primary" />
          <Button size="small" onClick={onLogout}>Logout</Button>
        </Stack>
      </Stack>
      {children}
    </Container>
  );
}

// ============================================================
// TEAM MEMBER LAYOUT — bottom navigation bar (mobile-app style)
// ============================================================
function TeamMemberLayout({ user, onLogout, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const items = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Projects', path: '/projects', icon: <FolderIcon /> },
    { label: 'Tasks', path: '/tasks', icon: <AssignmentIcon /> },
    { label: 'Milestones', path: '/milestones', icon: <FlagIcon /> },
    { label: 'Documents', path: '/documents', icon: <DescriptionIcon /> },
  ];

  return (
    <Container maxWidth="sm" sx={{ py: 4, pb: 10 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Client Project Collaboration Portal</Typography>
        <Stack direction="row" spacing={1} alignItems="center" component={Link} to="/profile" sx={{ textDecoration: 'none' }}>
          <Chip label={user.fullName} color="primary" size="small" />
          <Button size="small" onClick={onLogout}>Logout</Button>
        </Stack>
      </Stack>
      {children}

      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={8}>
        <BottomNavigation
          showLabels
          value={location.pathname}
          onChange={(e, newValue) => navigate(newValue)}
        >
          {items.map((item) => (
            <BottomNavigationAction key={item.path} label={item.label} value={item.path} icon={item.icon} />
          ))}
        </BottomNavigation>
      </Paper>
    </Container>
  );
}

// ============================================================
// CLIENT LAYOUT — large card-style navigation (minimal)
// ============================================================
function ClientLayout({ user, onLogout, children }) {
  const location = useLocation();
  const items = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon fontSize="large" /> },
    { label: 'Projects', path: '/projects', icon: <FolderIcon fontSize="large" /> },
    { label: 'Milestones', path: '/milestones', icon: <FlagIcon fontSize="large" /> },
    { label: 'Tasks', path: '/tasks', icon: <AssignmentIcon fontSize="large" /> },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Client Project Collaboration Portal</Typography>
        <Stack direction="row" spacing={1} alignItems="center" component={Link} to="/profile" sx={{ textDecoration: 'none' }}>
          <Chip label={user.fullName} color="primary" />
          <Button size="small" onClick={onLogout}>Logout</Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {items.map((item) => (
          <Grid item xs={6} sm={3} key={item.path}>
            <Card
              variant={location.pathname === item.path ? 'elevation' : 'outlined'}
              elevation={location.pathname === item.path ? 4 : 0}
              sx={{
                borderColor: location.pathname === item.path ? 'primary.main' : 'divider',
                borderWidth: location.pathname === item.path ? 2 : 1,
              }}
            >
              <CardActionArea component={Link} to={item.path} sx={{ p: 2, textAlign: 'center' }}>
                <Box sx={{ color: location.pathname === item.path ? 'primary.main' : 'text.secondary', mb: 1 }}>
                  {item.icon}
                </Box>
                <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {children}
    </Container>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const activeTheme = createAppTheme(user?.role);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleProfileUpdate = (newFullName) => {
    const updatedUser = { ...user, fullName: newFullName };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Picks the correct structural layout component based on the user's role
  const getLayout = () => {
    if (!user) return null;
    if (user.role === 'Admin') return AdminLayout;
    if (user.role === 'ProjectManager') return PMLayout;
    if (user.role === 'TeamMember') return TeamMemberLayout;
    if (user.role === 'Client') return ClientLayout;
    return PMLayout;
  };
  const Layout = getLayout();

  const routes = (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute user={user}><DashboardPage currentUser={user} /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute user={user}><ProjectsPage currentUser={user} /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute user={user}><TasksPage currentUser={user} /></ProtectedRoute>} />
      <Route path="/milestones" element={<ProtectedRoute user={user}><MilestonesPage currentUser={user} /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute user={user}><DocumentsPage currentUser={user} /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute user={user}><UserManagementPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute user={user}><ProfilePage currentUser={user} onProfileUpdate={handleProfileUpdate} /></ProtectedRoute>} />
    </Routes>
  );

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <BrowserRouter>
        {!user ? (
          <Container maxWidth="md" sx={{ py: 5 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
              Client Project Collaboration Portal
            </Typography>
            {routes}
          </Container>
        ) : (
          <Layout user={user} onLogout={handleLogout}>
            {routes}
          </Layout>
        )}
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;