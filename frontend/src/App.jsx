import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Container, Typography, Tabs, Tab, Box } from '@mui/material';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import MilestonesPage from './pages/MilestonesPage';

function Navigation() {
  const location = useLocation();

  return (
    <Tabs value={location.pathname} sx={{ mb: 2 }}>
  <Tab label="Projects" value="/" component={Link} to="/" />
  <Tab label="Tasks" value="/tasks" component={Link} to="/tasks" />
  <Tab label="Milestones" value="/milestones" component={Link} to="/milestones" />
</Tabs>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Container maxWidth="sm" sx={{ py: 5 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Client Project Collaboration Portal
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Navigation />
        </Box>

        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/milestones" element={<MilestonesPage />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;