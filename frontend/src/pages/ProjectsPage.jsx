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
import PsychologyIcon from '@mui/icons-material/Psychology';

const API_URL = 'http://localhost:5256/api/Projects';
const MEMBERS_API_URL = 'http://localhost:5256/api/ProjectMembers';
const USERS_BRIEF_API_URL = 'http://localhost:5256/api/Auth/users-brief';

function ProjectsPage({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [myProjectIds, setMyProjectIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('Pending');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const [riskData, setRiskData] = useState(null);
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);

  const [impactProjectId, setImpactProjectId] = useState('');
  const [requirementText, setRequirementText] = useState('');
  const [impactData, setImpactData] = useState(null);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);

  const canManageProjects = currentUser?.role === 'Admin' || currentUser?.role === 'ProjectManager';
  const isTeamMemberOrClient = currentUser?.role === 'TeamMember' || currentUser?.role === 'Client';

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
    axios.get(USERS_BRIEF_API_URL)
      .then((response) => setAllUsers(response.data))
      .catch(() => {});

    // Team Members/Clients need to know which projects they belong to,
    // so we can filter the list to only show relevant projects
    if (isTeamMemberOrClient) {
      axios.get(`${MEMBERS_API_URL}/my-projects`)
        .then((response) => setMyProjectIds(response.data))
        .catch(() => {});
    }
  }, [isTeamMemberOrClient]);

  // Creates the project, then adds each selected member to it
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
      .then((response) => {
        const createdProjectId = response.data.id;

        const addMemberPromises = selectedMemberIds.map((userId) =>
          axios.post(MEMBERS_API_URL, { projectId: createdProjectId, userId })
        );

        return Promise.all(addMemberPromises);
      })
      .then(() => {
        fetchProjects();
        setName('');
        setDescription('');
        setStartDate('');
        setDeadline('');
        setStatus('Pending');
        setSelectedMemberIds([]);
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

  const handleAnalyzeImpact = (e) => {
    e.preventDefault();

    axios.post(`${API_URL}/impact-analysis`, {
      projectId: Number(impactProjectId),
      requirementText,
    })
      .then((response) => {
        setImpactData(response.data);
        setImpactDialogOpen(true);
      })
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("You don't have permission to run impact analysis.");
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

  const riskColor = (level) => {
    if (level === 'High') return 'error';
    if (level === 'Medium') return 'warning';
    return 'success';
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading projects...</Typography>;

  // Filter the visible project list: Admin/PM see everything,
  // Team Members/Clients only see projects they're a member of
  const visibleProjects = isTeamMemberOrClient
    ? projects.filter((p) => myProjectIds.includes(p.id))
    : projects;

  return (
    <>
      {/* ---------- CREATE PROJECT FORM (Admin/ProjectManager only) ---------- */}
      {canManageProjects && (
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
              <TextField label="Project Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
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
              <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} fullWidth>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </TextField>
              <TextField
                select
                label="Assign Team Members / Client"
                value={selectedMemberIds}
                onChange={(e) =>
                  setSelectedMemberIds(
                    typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
                  )
                }
                slotProps={{ select: { multiple: true } }}
                fullWidth
                helperText="Select everyone who should have access to this project"
              >
                {allUsers
                  .filter((u) => u.role === 'TeamMember' || u.role === 'Client')
                  .map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </MenuItem>
                  ))}
              </TextField>
              <Button type="submit" variant="contained" size="large">
                Create Project
              </Button>
            </Stack>
          </Box>

          {/* ---------- REQUIREMENT CHANGE IMPACT ANALYSIS FORM ---------- */}
          <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
            Analyze Requirement Change (AI-Assisted)
          </Typography>

          <Box component="form" onSubmit={handleAnalyzeImpact}>
            <Stack spacing={2}>
              <TextField
                select
                label="Project"
                value={impactProjectId}
                onChange={(e) => setImpactProjectId(e.target.value)}
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
                label="Describe the new/changed requirement"
                value={requirementText}
                onChange={(e) => setRequirementText(e.target.value)}
                multiline
                rows={2}
                required
                fullWidth
                placeholder="e.g. We want to add two-factor authentication to the login system"
              />
              <Button type="submit" variant="outlined" size="large" startIcon={<PsychologyIcon />}>
                Analyze Impact
              </Button>
            </Stack>
          </Box>
        </>
      )}

      {!canManageProjects && error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* ---------- PROJECT LIST ---------- */}
      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
        Projects
      </Typography>

      {visibleProjects.length === 0 ? (
        <Typography color="text.secondary">
          {isTeamMemberOrClient ? 'You are not assigned to any projects yet.' : 'No projects found.'}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {visibleProjects.map((project) => (
            <Card key={project.id} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {project.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={project.status} color={statusColor(project.status)} size="small" />
                    <IconButton size="small" onClick={() => handleCheckRisk(project.id)} color="primary" title="Check Deadline Risk">
                      <AssessmentIcon fontSize="small" />
                    </IconButton>
                    {canManageProjects && (
                      <IconButton size="small" onClick={() => handleDelete(project.id)} color="error" title="Delete Project">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
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
      <Dialog open={riskDialogOpen} onClose={() => setRiskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deadline Risk Analysis {riskData && `- ${riskData.projectName}`}</DialogTitle>
        <DialogContent>
          {riskData && (
            <>
              <Typography variant="h6" sx={{ mt: 1 }}>
                Risk Score: {riskData.riskScore}%
              </Typography>
              <Chip label={riskData.riskLevel} color={riskColor(riskData.riskLevel)} sx={{ mt: 1, mb: 2 }} />

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

      {/* ---------- IMPACT ANALYSIS POPUP DIALOG ---------- */}
      <Dialog open={impactDialogOpen} onClose={() => setImpactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Requirement Change Impact Analysis</DialogTitle>
        <DialogContent>
          {impactData && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                "{impactData.requirementText}"
              </Typography>

              <Typography variant="subtitle2">Affected Areas:</Typography>
              <List dense>
                {impactData.affectedAreas.map((area, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`• ${area}`} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="body2" sx={{ mt: 1 }}>
                Estimated New Tasks: <strong>{impactData.estimatedNewTasks}</strong>
              </Typography>
              <Typography variant="body2">
                Estimated Delay: <strong>{impactData.estimatedDelayDays} day(s)</strong>
              </Typography>

              <Typography variant="body2" sx={{ mt: 1 }}>
                Risk Level: <Chip label={impactData.riskLevel} color={riskColor(impactData.riskLevel)} size="small" />
              </Typography>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Recommendation:
              </Typography>
              <Typography variant="body2">{impactData.recommendation}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImpactDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ProjectsPage;