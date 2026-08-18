// Main application component — sets up routing, navigation,
// authentication state, and protects pages that require login
import axios from 'axios';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Container, Typography, Tabs, Tab, Box, Button, Stack } from '@mui/material';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import MilestonesPage from './pages/MilestonesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DocumentsPage from './pages/DocumentsPage';
import ProfilePage from './pages/ProfilePage';

// Top navigation bar shown only when a user is logged in.
// Displays tabs for each main section plus the logged-in user's info and a logout button.
function Navigation({ user, onLogout }) {
  const location = useLocation();

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
      <Tabs value={location.pathname}>
        <Tab label="Dashboard" value="/" component={Link} to="/" />
        <Tab label="Projects" value="/projects" component={Link} to="/projects" />
        <Tab label="Tasks" value="/tasks" component={Link} to="/tasks" />
        <Tab label="Milestones" value="/milestones" component={Link} to="/milestones" />
        <Tab label="Documents" value="/documents" component={Link} to="/documents" />
      </Tabs>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography
          variant="body2"
          component={Link}
          to="/profile"
          sx={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
        >
          {user.fullName} ({user.role})
        </Typography>
        <Button size="small" onClick={onLogout}>Logout</Button>
      </Stack>
    </Stack>
  );
}

// Wraps a page component and redirects to /login if no user is logged in
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  // Stores the JWT token and logged-in user's info,
  // initialized from localStorage so login persists across page refreshes
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Whenever the token changes, attach it to all future Axios requests
  // (or remove it if the user logs out)
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Called by LoginPage after a successful login
  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // Called when the user updates their profile — keeps navbar/session in sync
  const handleProfileUpdate = (newFullName) => {
    const updatedUser = { ...user, fullName: newFullName };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Clears the session and logs the user out
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Client Project Collaboration Portal
        </Typography>

        {/* Only show the navigation bar if someone is logged in */}
        {user && (
          <Box sx={{ mt: 2 }}>
            <Navigation user={user} onLogout={handleLogout} />
          </Box>
        )}

        <Routes>
          {/* Public routes — accessible without logging in */}
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — require login */}
          <Route
            path="/"
            element={
              <ProtectedRoute user={user}>
                <DashboardPage currentUser={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute user={user}>
                <ProjectsPage currentUser={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute user={user}>
                <TasksPage currentUser={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/milestones"
            element={
              <ProtectedRoute user={user}>
                <MilestonesPage currentUser={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute user={user}>
                <DocumentsPage currentUser={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user}>
                <ProfilePage currentUser={user} onProfileUpdate={handleProfileUpdate} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;