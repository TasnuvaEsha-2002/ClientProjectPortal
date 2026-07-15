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
  Checkbox,
  FormControlLabel,
} from '@mui/material';

const API_URL = 'http://localhost:5256/api/Milestones';
const PROJECTS_API_URL = 'http://localhost:5256/api/Projects';

function MilestonesPage() {
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [clientApproved, setClientApproved] = useState(false);
  const [projectId, setProjectId] = useState('');

  const fetchMilestones = () => {
    axios.get(API_URL)
      .then((response) => {
        setMilestones(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMilestones();
    axios.get(PROJECTS_API_URL)
      .then((response) => setProjects(response.data))
      .catch((err) => setError(err.message));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newMilestone = {
      id: 0,
      title,
      dueDate: dueDate ? `${dueDate}T00:00:00` : null,
      status,
      clientApproved,
      projectId: Number(projectId),
    };

    axios.post(API_URL, newMilestone)
      .then(() => {
        fetchMilestones();
        setTitle('');
        setDueDate('');
        setStatus('Pending');
        setClientApproved(false);
        setProjectId('');
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

  if (loading) return <Typography sx={{ p: 4 }}>Loading milestones...</Typography>;

  return (
    <>
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Create New Milestone
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Milestone Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
          />
          <TextField
            select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            fullWidth
          >
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
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
          <FormControlLabel
            control={
              <Checkbox
                checked={clientApproved}
                onChange={(e) => setClientApproved(e.target.checked)}
              />
            }
            label="Client Approved"
          />
          <Button type="submit" variant="contained" size="large">
            Create Milestone
          </Button>
        </Stack>
      </Box>

      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
        Milestones
      </Typography>

      {milestones.length === 0 ? (
        <Typography color="text.secondary">No milestones found.</Typography>
      ) : (
        <Stack spacing={2}>
          {milestones.map((milestone) => (
            <Card key={milestone.id} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {milestone.title}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip label={milestone.status} color={statusColor(milestone.status)} size="small" />
                    {milestone.clientApproved && (
                      <Chip label="Client Approved" color="info" size="small" />
                    )}
                  </Stack>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Due: {new Date(milestone.dueDate).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Project: {projects.find((p) => p.id === milestone.projectId)?.name || `#${milestone.projectId}`}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
}

export default MilestonesPage;