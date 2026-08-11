// Task Management page.
// - Admin/ProjectManager: can create tasks and assign them to a Team Member
// - Team Member: sees all tasks (read-only, except their own task's status)
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
  Select,
} from '@mui/material';

const API_URL = 'http://localhost:5256/api/Tasks';
const PROJECTS_API_URL = 'http://localhost:5256/api/Projects';
const TEAM_MEMBERS_API_URL = 'http://localhost:5256/api/Auth/team-members';
const USERS_BRIEF_API_URL = 'http://localhost:5256/api/Auth/users-brief';

function TasksPage({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Not Started');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');

  // Only Admin/ProjectManager can create tasks and assign them
  const canManageTasks = currentUser?.role === 'Admin' || currentUser?.role === 'ProjectManager';

  const fetchTasks = () => {
    axios.get(API_URL)
      .then((response) => {
        setTasks(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
    axios.get(PROJECTS_API_URL)
      .then((response) => setProjects(response.data))
      .catch((err) => setError(err.message));

    // Everyone needs the full user list to display assigned names properly
    axios.get(USERS_BRIEF_API_URL)
      .then((response) => setAllUsers(response.data))
      .catch(() => {});

    // Only Admin/ProjectManager need the dropdown-ready team member list
    if (canManageTasks) {
      axios.get(TEAM_MEMBERS_API_URL)
        .then((response) => setTeamMembers(response.data))
        .catch(() => {});
    }
  }, [canManageTasks]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newTask = {
      id: 0,
      title,
      description,
      priority,
      status,
      dueDate: dueDate ? `${dueDate}T00:00:00` : null,
      completionPercentage: 0,
      projectId: Number(projectId),
      assignedUserId: assignedUserId ? Number(assignedUserId) : null,
    };

    axios.post(API_URL, newTask)
      .then(() => {
        fetchTasks();
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setStatus('Not Started');
        setDueDate('');
        setProjectId('');
        setAssignedUserId('');
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  // Lightweight status update — used by Team Members on their own assigned tasks
  const handleStatusChange = (taskId, newStatus) => {
    axios.patch(`${API_URL}/${taskId}/status`, JSON.stringify(newStatus), {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => fetchTasks())
      .catch((err) => setError(err.message));
  };

  // Looks up a user's display name from their ID
  const getUserName = (userId) => {
    const found = allUsers.find((u) => u.id === userId);
    return found ? found.fullName : `User #${userId}`;
  };

  const priorityColor = (priority) => {
    if (priority === 'High') return 'error';
    if (priority === 'Medium') return 'warning';
    return 'default';
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading tasks...</Typography>;

  return (
    <>
      {/* ---------- CREATE TASK FORM (Admin/ProjectManager only) ---------- */}
      {canManageTasks && (
        <>
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Create New Task
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Task Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                select
                label="Assign To"
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                fullWidth
                helperText="Optional — leave unassigned if not decided yet"
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {teamMembers.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.fullName} ({member.email})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                fullWidth
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </TextField>
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                fullWidth
              >
                <MenuItem value="Not Started">Not Started</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </TextField>
              <TextField
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <Button type="submit" variant="contained" size="large">
                Create Task
              </Button>
            </Stack>
          </Box>
        </>
      )}

      {/* ---------- TASK LIST ---------- */}
      <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
        Tasks
      </Typography>

      {tasks.length === 0 ? (
        <Typography color="text.secondary">No tasks found.</Typography>
      ) : (
        <Stack spacing={2}>
          {tasks.map((task) => {
            const isMyTask = task.assignedUserId === currentUser?.id;

            return (
              <Card key={task.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {task.title}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={task.priority} color={priorityColor(task.priority)} size="small" />

                      {/* Only the assigned Team Member can change status from the task list */}
                      {isMyTask ? (
                        <Select
                          size="small"
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        >
                          <MenuItem value="Not Started">Not Started</MenuItem>
                          <MenuItem value="In Progress">In Progress</MenuItem>
                          <MenuItem value="Completed">Completed</MenuItem>
                        </Select>
                      ) : (
                        <Chip label={task.status} size="small" variant="outlined" />
                      )}
                    </Stack>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {task.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Project: {projects.find((p) => p.id === task.projectId)?.name || `#${task.projectId}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Assigned to: {task.assignedUserId ? (isMyTask ? 'You' : getUserName(task.assignedUserId)) : 'Unassigned'}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </>
  );
}

export default TasksPage;