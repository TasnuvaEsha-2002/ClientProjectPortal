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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment';

// Base URL for the Projects API
const API_URL = 'http://localhost:5256/api/Projects';

function ProjectsPage() {
  // Holds the list of all projects fetched from the backend
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form field states for creating a new project
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('Pending');

  // Stores the AI-assisted risk analysis result for the currently viewed project
  const [riskData, setRiskData] = useState(null);
  // Controls whether the risk analysis popup (dialog) is open or closed
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);

  // Fetches the list of projects from the backend
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

  // Runs once when the page first loads
  useEffect(() => {
    fetchProjects();
  }, []);

  // Handles the "Create Project" form submission
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
        fetchProjects(); // refresh the list after creating
        // reset form fields
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

  // Handles deleting a project (only Admin/ProjectManager allowed by backend)
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

  // Fetches AI-assisted risk analysis for a specific project
  // and opens a popup dialog to display the results
  const handleCheckRisk = (projectId) => {
    axios.get(`${API_URL}/${projectId}/risk-analysis`)
      .then((response) => {
        setRiskData(response.data);
        setRiskDialogOpen(true);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  // Returns a color for the status chip based on project status
  const statusColor = (status) => {
    if (status === 'Completed') return 'success';
    if (status === 'In Progress') return 'warning';
    return 'default';
  };

  // Returns a color for the risk level chip inside the popup
  const riskColor = (level) => {
    if (level === 'High') return 'error';
    if (level === 'Medium') return 'warning';
    return 'success';
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading projects...</Typography>;

  return (
    <>
      {/* ---------- CREATE PROJECT FORM ---------- */}
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

      {/* ---------- PROJECT LIST ---------- */}
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

                    {/* Button to trigger AI-assisted risk analysis */}
                    <IconButton
                      size="small"
                      onClick={() => handleCheckRisk(project.id)}
                      color="primary"
                      title="Check Deadline Risk"
                    >
                      <AssessmentIcon fontSize="small" />
                    </IconButton>

                    {/* Button to delete the project */}
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(project.id)}
                      color="error"
                      title="Delete Project"
                    >
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

      {/* ---------- RISK ANALYSIS POPUP DIALOG ---------- */}
      <Dialog
        open={riskDialogOpen}
        onClose={() => setRiskDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Deadline Risk Analysis {riskData && `- ${riskData.projectName}`}
        </DialogTitle>
        <DialogContent>
          {riskData && (
            <>
              <Typography variant="h6" sx={{ mt: 1 }}>
                Risk Score: {riskData.riskScore}%
              </Typography>
              <Chip
                label={riskData.riskLevel}
                color={riskColor(riskData.riskLevel)}
                sx={{ mt: 1, mb: 2 }}
              />

              <Typography variant="subtitle2">Reasons:</Typography>
              <List dense>
                {riskData.reasons.map((reason, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`• ${reason}`} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle2">Recommendations:</Typography>
              <List dense>
                {riskData.recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`• ${rec}`} />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRiskDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ProjectsPage;