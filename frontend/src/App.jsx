import axios from 'axios';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Container, Typography, Tabs, Tab, Box, Button, Stack } from '@mui/material';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import MilestonesPage from './pages/MilestonesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function Navigation({ user, onLogout }) {
  const location = useLocation();

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Tabs value={location.pathname}>
        <Tab label="Projects" value="/" component={Link} to="/" />
        <Tab label="Tasks" value="/tasks" component={Link} to="/tasks" />
        <Tab label="Milestones" value="/milestones" component={Link} to="/milestones" />
      </Tabs>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2">
          {user.fullName} ({user.role})
        </Typography>
        <Button size="small" onClick={onLogout}>Logout</Button>
      </Stack>
    </Stack>
  );
}

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Container maxWidth="sm" sx={{ py: 5 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Client Project Collaboration Portal
        </Typography>

        {user && (
          <Box sx={{ mt: 2 }}>
            <Navigation user={user} onLogout={handleLogout} />
          </Box>
        )}

        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute user={user}>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute user={user}>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/milestones"
            element={
              <ProtectedRoute user={user}>
                <MilestonesPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;