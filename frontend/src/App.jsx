import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
  Stack,
  Chip,
  Box,
} from '@mui/material';

const API_URL = 'http://localhost:5256/api/Projects';

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('Pending');

  const fetchProjects = () => {
    axios.get(API_URL)
      .then((response) => {
        setProjects(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newProject = {
      id: 0,
      name,
      description,
      startDate: startDate ? `${startDate}T00:00:00` : null,
      deadline: deadline ? `${deadline}T00:00:00` : null,
      status,
    };

    axios.post(API_URL, newProject)
      .then(() => {
        fetchProjects();
        setName('');
        setDescription('');
        setStartDate('');
        setDeadline('');
        setStatus('Pending');
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  const statusColor = (status) => {
    if (status === 'Completed') return 'success';
    if (status === 'In Progress') return 'warning';
    return 'default';
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading projects...</Typography>;

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Client Project Collaboration Portal
      </Typography>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Create New Project
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label="Deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            fullWidth
          >
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </TextField>
          <Button type="submit" variant="contained" size="large">
            Create Project
          </Button>
        </Stack>
      </Box>

      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
        Projects
      </Typography>

      {projects.length === 0 ? (
        <Typography color="text.secondary">No projects found.</Typography>
      ) : (
        <Stack spacing={2}>
          {projects.map((project) => (
            <Card key={project.id} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {project.name}
                  </Typography>
                  <Chip label={project.status} color={statusColor(project.status)} size="small" />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {project.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}

export default App;