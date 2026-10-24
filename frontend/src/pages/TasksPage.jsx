// Task Management page.
// - Admin/ProjectManager: can create tasks and see ALL tasks
// - ProjectManager only: can delete tasks
// - Team Member/Client: only see tasks belonging to projects they're a member of
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
  LinearProgress,
  Collapse,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import CommentIcon from '@mui/icons-material/Comment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import DeleteIcon from '@mui/icons-material/Delete';

const API_URL = 'http://localhost:5256/api/Tasks';
const PROJECTS_API_URL = 'http://localhost:5256/api/Projects';
const TEAM_MEMBERS_API_URL = 'http://localhost:5256/api/Auth/team-members';
const USERS_BRIEF_API_URL = 'http://localhost:5256/api/Auth/users-brief';
const COMMENTS_API_URL = 'http://localhost:5256/api/TaskComments';
const MEMBERS_API_URL = 'http://localhost:5256/api/ProjectMembers';

// Returns today's date in the browser's local timezone as YYYY-MM-DD.
// Used as the HTML date input's "min" so a Due Date can never be
// set in the past, from either the calendar picker or manual typing.
function getTodayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function TasksPage({ currentUser }) {
  // ---- Core data loaded from the backend ----
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  // Project IDs the current (non-PM/Admin) user is actually a member of —
  // used to filter which tasks they're allowed to see
  const [myProjectIds, setMyProjectIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- "Create New Task" form fields ----
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Not Started');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');

  // ---- Comments UI state ----
  // Which task's comment section is currently expanded (only one at a time)
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  // Cached comments per task, keyed by task ID, so we don't refetch every toggle
  const [commentsByTask, setCommentsByTask] = useState({});
  // The text currently being typed into each task's "new comment" box
  const [newCommentText, setNewCommentText] = useState({});
  // The text currently being typed into each task's "report a blocker" box
  const [blockerText, setBlockerText] = useState({});

  // Success toast — used for both create AND delete confirmations
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Proper MUI confirmation dialog for deleting a task,
  // replacing the plain browser window.confirm() popup
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Admin and PM can both create/manage tasks and see the full task list
  const canManageTasks =
    currentUser?.role === 'Admin' || currentUser?.role === 'ProjectManager';

  // Only a Project Manager (not Admin) may delete a task —
  // Admin has view/oversight access only, per the role-separation design
  const canDeleteTasks = currentUser?.role === 'ProjectManager';

  // Fetches (or refreshes) the full task list from the backend
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

  // Runs once on mount (and again if canManageTasks changes, e.g. after login):
  // loads tasks, the project list, and user lists needed for dropdowns/labels
  useEffect(() => {
    fetchTasks();

    axios.get(PROJECTS_API_URL)
      .then((response) => setProjects(response.data))
      .catch((err) => setError(err.message));

    axios.get(USERS_BRIEF_API_URL)
      .then((response) => setAllUsers(response.data))
      .catch(() => {});

    if (canManageTasks) {
      // Admin/PM need the team member list to populate the "Assign To" dropdown
      axios.get(TEAM_MEMBERS_API_URL)
        .then((response) => setTeamMembers(response.data))
        .catch(() => {});
    } else {
      // Team Members/Clients need to know which projects they belong to,
      // so we only show tasks from those projects (enforced again below
      // when building visibleTasks, not just here)
      axios.get(`${MEMBERS_API_URL}/my-projects`)
        .then((response) => setMyProjectIds(response.data))
        .catch(() => {});
    }
  }, [canManageTasks]);

  // Handles submission of the "Create New Task" form
  const handleSubmit = (e) => {
    e.preventDefault();

    const today = getTodayDateInputValue();

    // Extra safety net beyond the calendar's min attribute (which can be
    // bypassed by typing a date manually) — do not allow a task to be
    // created with a past due date.
    if (dueDate && dueDate < today) {
      setError('Due Date cannot be earlier than today.');
      return;
    }

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

        // Show the success toast, naming the task that was created
        setSuccessMessage(`Task "${title}" was created successfully.`);
        setSuccessOpen(true);

        // Reset the form back to its defaults for the next task
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setStatus('Not Started');
        setDueDate('');
        setProjectId('');
        setAssignedUserId('');
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  // Opens the confirmation dialog instead of deleting immediately —
  // stores which task is being considered for deletion
  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  // Runs only after the user confirms inside the dialog
  const handleConfirmDelete = () => {
    if (!taskToDelete) return;

    axios.delete(`${API_URL}/${taskToDelete.id}`)
      .then(() => {
        fetchTasks();
        setDeleteDialogOpen(false);

        setSuccessMessage(`Task "${taskToDelete.title}" was deleted successfully.`);
        setSuccessOpen(true);
        setTaskToDelete(null);
      })
      .catch((err) => {
        setDeleteDialogOpen(false);
        setTaskToDelete(null);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("You don't have permission to delete tasks.");
        } else {
          setError(err.message);
        }
      });
  };

  // Keeps Status and Progress synchronized whenever the Status dropdown changes.
  //
  // Progress:
  // 0%            -> Not Started
  // 25/50/75%     -> In Progress
  // 100%          -> Completed
  //
  // Status:
  // Not Started   -> forces progress to 0%
  // In Progress   -> keeps the current 25/50/75% progress;
  //                  if current progress is 0 or 100, resets it to 25%
  // Completed     -> forces progress to 100%
  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let newProgress = Number(task.completionPercentage ?? 0);

    if (newStatus === 'Not Started') {
      newProgress = 0;
    } else if (newStatus === 'Completed') {
      newProgress = 100;
    } else if (newStatus === 'In Progress') {
      // An In Progress task should have a progress value between 25% and 75%.
      if (newProgress === 0 || newProgress === 100) {
        newProgress = 25;
      }
    }

    // Update both fields together via Promise.all so the UI never shows
    // a temporarily inconsistent state (e.g. "Completed" at 0%)
    Promise.all([
      axios.patch(`${API_URL}/${taskId}/status`, JSON.stringify(newStatus), {
        headers: { 'Content-Type': 'application/json' },
      }),
      axios.patch(`${API_URL}/${taskId}/progress`, JSON.stringify(newProgress), {
        headers: { 'Content-Type': 'application/json' },
      }),
    ])
      .then(() => {
        fetchTasks();
      })
      .catch((err) => setError(err.message));
  };

  // Keeps Status and Progress synchronized in the other direction —
  // called when the assignee clicks one of the quick-progress buttons (0/25/50/75/100%)
  const handleProgressChange = (taskId, newProgress) => {
    const progress = Number(newProgress);

    let newStatus = 'In Progress';

    if (progress === 0) {
      newStatus = 'Not Started';
    } else if (progress === 100) {
      newStatus = 'Completed';
    }

    Promise.all([
      axios.patch(`${API_URL}/${taskId}/progress`, JSON.stringify(progress), {
        headers: { 'Content-Type': 'application/json' },
      }),
      axios.patch(`${API_URL}/${taskId}/status`, JSON.stringify(newStatus), {
        headers: { 'Content-Type': 'application/json' },
      }),
    ])
      .then(() => {
        fetchTasks();
      })
      .catch((err) => setError(err.message));
  };

  // Called when the assignee (Team Member) reports a blocker on their own task
  const handleReportBlocker = (taskId) => {
    const reason = blockerText[taskId];
    if (!reason || !reason.trim()) return;

    axios.patch(`${API_URL}/${taskId}/blocker`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => {
        fetchTasks();
        // Clear just this task's blocker input box after a successful report
        setBlockerText((prev) => ({ ...prev, [taskId]: '' }));
      })
      .catch((err) => setError(err.message));
  };

  // Clears a blocker — called either by the assignee ("Mark as Unblocked")
  // or by Admin/PM resolving someone else's blocker ("Mark as Resolved").
  // Passing an empty string as the reason is how the backend knows to clear it.
  const handleClearBlocker = (taskId) => {
    axios.patch(`${API_URL}/${taskId}/blocker`, JSON.stringify(''), {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => fetchTasks())
      .catch((err) => setError(err.message));
  };

  // Expands/collapses a task's comment section, fetching comments
  // from the backend the first time it's opened
  const toggleComments = (taskId) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
      return;
    }

    setExpandedTaskId(taskId);
    axios.get(`${COMMENTS_API_URL}?taskId=${taskId}`)
      .then((response) => {
        setCommentsByTask((prev) => ({ ...prev, [taskId]: response.data }));
      })
      .catch(() => {});
  };

  // Posts a new comment on a task, then refreshes just that task's comment list
  const handleAddComment = (taskId) => {
    const text = newCommentText[taskId];
    if (!text || !text.trim()) return;

    axios.post(COMMENTS_API_URL, { taskId, text })
      .then(() => {
        axios.get(`${COMMENTS_API_URL}?taskId=${taskId}`)
          .then((response) => {
            setCommentsByTask((prev) => ({ ...prev, [taskId]: response.data }));
          });
        setNewCommentText((prev) => ({ ...prev, [taskId]: '' }));
      })
      .catch((err) => setError(err.message));
  };

  // Looks up a user's display name by ID from the cached allUsers list —
  // used to show "Assigned to: <name>" instead of just a raw user ID
  const getUserName = (userId) => {
    const found = allUsers.find((u) => u.id === userId);
    return found ? found.fullName : `User #${userId}`;
  };

  // Maps a task's Priority value to an MUI Chip color
  const priorityColor = (priority) => {
    if (priority === 'High') return 'error';
    if (priority === 'Medium') return 'warning';
    return 'default';
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading tasks...</Typography>;

  // Admin/PM see every task in the system; everyone else (Team Member,
  // Client) only sees tasks belonging to a project they're a member of
  const visibleTasks = canManageTasks
    ? tasks
    : tasks.filter((t) => myProjectIds.includes(t.projectId));

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
              <TextField label="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />

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
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  const today = getTodayDateInputValue();

                  // Guards against a manually-typed past date slipping through,
                  // since the "min" attribute alone only blocks the calendar UI
                  if (selectedDate && selectedDate < today) {
                    setError('Past dates cannot be selected as a Due Date.');
                    setDueDate('');
                    return;
                  }

                  setError(null);
                  setDueDate(selectedDate);
                }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: {
                    // Prevents the calendar picker itself from showing past dates
                    min: getTodayDateInputValue(),
                  },
                }}
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

      {visibleTasks.length === 0 ? (
        <Typography color="text.secondary">No tasks found.</Typography>
      ) : (
        <Stack spacing={2}>
          {visibleTasks.map((task) => {
            // Is the task assigned to the person currently viewing it?
            // Only the assignee can update status/progress/blocker for a task.
            const isMyTask = task.assignedUserId === currentUser?.id;
            const isExpanded = expandedTaskId === task.id;
            const comments = commentsByTask[task.id] || [];

            return (
              <Card
                key={task.id}
                variant="outlined"
                // Blocked tasks get a highlighted red border so they stand
                // out immediately in the list
                sx={task.isBlocked ? { borderColor: 'error.main', borderWidth: 2 } : {}}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {task.title}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={task.priority}
                        color={priorityColor(task.priority)}
                        size="small"
                      />

                      {/* The assignee gets an editable Status dropdown;
                          everyone else sees a read-only Chip */}
                      {isMyTask ? (
                        <Select
                          size="small"
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task.id, e.target.value)
                          }
                        >
                          <MenuItem value="Not Started">Not Started</MenuItem>
                          <MenuItem value="In Progress">In Progress</MenuItem>
                          <MenuItem value="Completed">Completed</MenuItem>
                        </Select>
                      ) : (
                        <Chip
                          label={task.status}
                          size="small"
                          variant="outlined"
                        />
                      )}

                      {/* Only a Project Manager sees the delete button
                          (not Admin — Admin has oversight-only access) */}
                      {canDeleteTasks && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(task)}
                          title="Delete Task"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>

                  {/* Red banner shown to EVERYONE when this task is blocked,
                      so a Project Manager scanning the list can spot it fast */}
                  {task.isBlocked && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ReportProblemIcon fontSize="small" color="error" />
                        <Typography variant="body2" color="error.dark">
                          Blocked: {task.blockerReason}
                        </Typography>
                      </Stack>
                    </Box>
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {task.description}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" display="block">
                    Project: {projects.find((p) => p.id === task.projectId)?.name || `#${task.projectId}`}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" display="block">
                    Assigned to:{' '}
                    {task.assignedUserId
                      ? (isMyTask ? 'You' : getUserName(task.assignedUserId))
                      : 'Unassigned'}
                  </Typography>

                  {/* ---------- PROGRESS BAR + QUICK-SET BUTTONS ---------- */}
                  <Box sx={{ mt: 2 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption">Progress</Typography>
                      <Typography variant="caption">
                        {task.completionPercentage}%
                      </Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={task.completionPercentage}
                      sx={{ borderRadius: 1, height: 6 }}
                    />

                    {/* Only the assignee gets the quick progress buttons */}
                    {isMyTask && (
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        {[0, 25, 50, 75, 100].map((val) => (
                          <Button
                            key={val}
                            size="small"
                            variant={
                              task.completionPercentage === val
                                ? 'contained'
                                : 'outlined'
                            }
                            onClick={() =>
                              handleProgressChange(task.id, val)
                            }
                          >
                            {val}%
                          </Button>
                        ))}
                      </Stack>
                    )}
                  </Box>

                  {/* ---------- BLOCKER REPORTING (assignee only) ---------- */}
                  {isMyTask && (
                    <Box sx={{ mt: 2 }}>
                      {task.isBlocked ? (
                        <Button
                          size="small"
                          color="success"
                          variant="outlined"
                          onClick={() => handleClearBlocker(task.id)}
                        >
                          Mark as Unblocked
                        </Button>
                      ) : (
                        <Stack direction="row" spacing={1}>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Describe what's blocking you..."
                            value={blockerText[task.id] || ''}
                            onChange={(e) =>
                              setBlockerText((prev) => ({
                                ...prev,
                                [task.id]: e.target.value,
                              }))
                            }
                          />

                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<ReportProblemIcon />}
                            onClick={() => handleReportBlocker(task.id)}
                          >
                            Report Blocker
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  )}

                  {/* ---------- BLOCKER RESOLUTION (Admin/PM, for someone else's task) ----------
                      Completes the blocker workflow: Team Member reports it,
                      Admin/PM reviews and resolves it. */}
                  {canManageTasks && !isMyTask && task.isBlocked && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        color="success"
                        variant="contained"
                        onClick={() => handleClearBlocker(task.id)}
                      >
                        ✓ Mark as Resolved
                      </Button>
                    </Box>
                  )}

                  {/* ---------- COMMENTS TOGGLE + THREAD ---------- */}
                  <Button
                    size="small"
                    startIcon={<CommentIcon />}
                    endIcon={
                      isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
                    }
                    onClick={() => toggleComments(task.id)}
                    sx={{ mt: 2 }}
                  >
                    Comments
                  </Button>

                  <Collapse in={isExpanded}>
                    <Box
                      sx={{
                        mt: 2,
                        pl: 1,
                        borderLeft: '2px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {comments.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No comments yet.
                        </Typography>
                      ) : (
                        <Stack spacing={1} sx={{ mb: 2 }}>
                          {comments.map((comment) => (
                            <Box key={comment.id}>
                              <Typography variant="body2">
                                <strong>{comment.userName}</strong>: {comment.text}
                              </Typography>

                              <Typography variant="caption" color="text.secondary">
                                {new Date(comment.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}

                      <Stack direction="row" spacing={1}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Write a comment..."
                          value={newCommentText[task.id] || ''}
                          onChange={(e) =>
                            setNewCommentText((prev) => ({
                              ...prev,
                              [task.id]: e.target.value,
                            }))
                          }
                        />

                        <Button
                          variant="contained"
                          onClick={() => handleAddComment(task.id)}
                        >
                          Send
                        </Button>
                      </Stack>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* ---------- DELETE CONFIRMATION DIALOG (replaces window.confirm()) ---------- */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Task?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{taskToDelete?.title}</strong>?
            This will also delete its comments. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- SUCCESS TOAST (used for both create and delete) ---------- */}
      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessOpen(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default TasksPage;