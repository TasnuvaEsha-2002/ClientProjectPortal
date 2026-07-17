import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
  Stack,
  Chip,
  Box,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const API_URL = 'http://localhost:5256/api/Projects';

function ProjectsPage() {
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

  const handleDelete = (id) => {
    axios.delete(`${API_URL}/${id}`)
      .then(() => fetchProjects())
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("You don't have permission to delete projects.");
        } else {
          setError(err.message);
        }
      });
  };

  const statusColor = (status) => {
    if (status === 'Completed') return 'success';
    if (status === 'In Progress') return 'warning';
    return 'default';
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading projects...</Typography>;

  return (
    <>
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Create New Project
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
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
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={project.status} color={statusColor(project.status)} size="small" />
                    <IconButton size="small" onClick={() => handleDelete(project.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {project.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
}

export default ProjectsPage;