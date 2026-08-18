import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Box,
  Button,
  Chip,
  Checkbox,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FlagIcon from '@mui/icons-material/Flag';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const AUTH_API_URL = 'http://localhost:5256/api/Auth';
const TASKS_API_URL = 'http://localhost:5256/api/Tasks';

// Returns a greeting based on the current time of day
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function DashboardPage({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pendingUsers, setPendingUsers] = useState([]);

  const isAdmin = currentUser?.role === 'Admin';
  const isTeamMember = currentUser?.role === 'TeamMember';

  const fetchPendingUsers = () => {
    axios.get(`${AUTH_API_URL}/pending-users`)
      .then((response) => setPendingUsers(response.data))
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:5256/api/Projects'),
      axios.get(TASKS_API_URL),
      axios.get('http://localhost:5256/api/Milestones'),
    ])
      .then(([projectsRes, tasksRes, milestonesRes]) => {
        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
        setMilestones(milestonesRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    if (isAdmin) {
      fetchPendingUsers();
    }
  }, [isAdmin]);

  const handleApprove = (userId) => {
    axios.put(`${AUTH_API_URL}/approve/${userId}`, null, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => fetchPendingUsers())
      .catch(() => {});
  };

  const handleReject = (userId) => {
    axios.delete(`${AUTH_API_URL}/reject/${userId}`)
      .then(() => fetchPendingUsers())
      .catch(() => {});
  };

  // Quick status toggle used on the Team Member dashboard's "Today's Tasks" checklist
  const handleQuickComplete = (taskId) => {
    axios.patch(`${TASKS_API_URL}/${taskId}/status`, JSON.stringify('Completed'), {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: 'Completed', completionPercentage: 100 } : t))
        );
      })
      .catch(() => {});
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading dashboard...</Typography>;

  const statusColor = (status) => {
    if (status === 'Completed') return 'success';
    if (status === 'In Progress') return 'warning';
    return 'default';
  };

  // ============================================================
  // TEAM MEMBER DASHBOARD — a distinct, personalized view
  // ============================================================
  if (isTeamMember) {
    const myTasks = tasks.filter((t) => t.assignedUserId === currentUser?.id);
    const completedCount = myTasks.filter((t) => t.status === 'Completed').length;
    const inProgressCount = myTasks.filter((t) => t.status === 'In Progress').length;
    const notStartedCount = myTasks.filter((t) => t.status === 'Not Started').length;

    const now = new Date();
    const todayStr = now.toDateString();

    // Overdue: due date has passed and not completed
    const overdueTasks = myTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed'
    );

    // Today's tasks: not completed, and either due today or already in progress
    const todaysTasks = myTasks.filter(
      (t) =>
        t.status !== 'Completed' &&
        (
          (t.dueDate && new Date(t.dueDate).toDateString() === todayStr) ||
          t.status === 'In Progress'
        )
    );

    // Upcoming deadlines: due in the future, not completed, sorted soonest first
    const upcomingDeadlines = myTasks
      .filter((t) => t.dueDate && new Date(t.dueDate) >= now && t.status !== 'Completed')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    const daysLate = (dueDate) => {
      const diff = Math.floor((now - new Date(dueDate)) / (1000 * 60 * 60 * 24));
      return diff;
    };

    return (
      <>
        {/* ---------- GREETING ---------- */}
        <Typography variant="h5" sx={{ mt: 4, mb: 3 }}>
          {getGreeting()}, {currentUser.fullName.split(' ')[0]} 👋
        </Typography>

        {/* ---------- TASK SUMMARY STATS ---------- */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {myTasks.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  My Tasks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {completedCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {inProgressCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ---------- OVERDUE TASKS ---------- */}
        {overdueTasks.length > 0 && (
          <>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <WarningIcon color="error" fontSize="small" />
              <Typography variant="h6" color="error.main">
                Overdue Tasks
              </Typography>
            </Stack>
            <Stack spacing={1} sx={{ mb: 4 }}>
              {overdueTasks.map((task) => (
                <Card key={task.id} variant="outlined" sx={{ borderColor: 'error.main' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{task.title}</Typography>
                      <Chip
                        label={`${daysLate(task.dueDate)} day${daysLate(task.dueDate) === 1 ? '' : 's'} late`}
                        color="error"
                        size="small"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </>
        )}

        {/* ---------- TODAY'S TASKS ---------- */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <AssignmentIcon fontSize="small" />
          <Typography variant="h6">Today's Tasks</Typography>
        </Stack>
        {todaysTasks.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Nothing due today. 🎉
          </Typography>
        ) : (
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent>
              <Stack spacing={1}>
                {todaysTasks.map((task) => (
                  <Stack key={task.id} direction="row" alignItems="center" spacing={1}>
                    <Checkbox
                      checked={false}
                      onChange={() => handleQuickComplete(task.id)}
                    />
                    <Typography variant="body2">{task.title}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* ---------- UPCOMING DEADLINES ---------- */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <PendingActionsIcon fontSize="small" />
          <Typography variant="h6">Upcoming Deadlines</Typography>
        </Stack>
        {upcomingDeadlines.length === 0 ? (
          <Typography color="text.secondary">No upcoming deadlines.</Typography>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                {upcomingDeadlines.map((task) => (
                  <Stack key={task.id} direction="row" justifyContent="space-between">
                    <Typography variant="body2">{task.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  // ============================================================
  // ADMIN / PROJECT MANAGER / CLIENT DASHBOARD — general overview
  // ============================================================

  const activeProjects = projects.filter((p) => p.status === 'In Progress').length;
  const completedProjects = projects.filter((p) => p.status === 'Completed').length;
  const pendingCount = projects.filter((p) => p.status === 'Pending').length;

  const overdueTasksCount = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed'
  ).length;

  const pendingApprovals = milestones.filter(
    (m) => m.status === 'Completed' && !m.clientApproved
  ).length;

  const chartData = [
    { name: 'Pending', value: pendingCount },
    { name: 'In Progress', value: activeProjects },
    { name: 'Completed', value: completedProjects },
  ].filter((item) => item.value > 0);

  const COLORS = ['#9e9e9e', '#F5A623', '#2E7D32'];

  const taskStatusData = [
    { status: 'Not Started', count: tasks.filter((t) => t.status === 'Not Started').length },
    { status: 'In Progress', count: tasks.filter((t) => t.status === 'In Progress').length },
    { status: 'Completed', count: tasks.filter((t) => t.status === 'Completed').length },
  ];

  const StatCard = ({ icon, label, value, color }) => (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              color: `${color}.main`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <>
      {isAdmin && pendingUsers.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Pending User Approvals
          </Typography>
          <Stack spacing={2} sx={{ mb: 4 }}>
            {pendingUsers.map((user) => (
              <Card key={user.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {user.fullName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email} — requested role: {user.role}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                      <Button variant="contained" color="success" onClick={() => handleApprove(user.id)}>
                        Approve
                      </Button>
                      <Button variant="outlined" color="error" onClick={() => handleReject(user.id)}>
                        Reject
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </>
      )}

      <Typography variant="h6" sx={{ mt: 4, mb: 3 }}>
        Overview
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <StatCard icon={<FolderIcon />} label="Active Projects" value={activeProjects} color="primary" />
        </Grid>
        <Grid item xs={6}>
          <StatCard icon={<FolderIcon />} label="Completed Projects" value={completedProjects} color="success" />
        </Grid>
        <Grid item xs={6}>
          <StatCard icon={<WarningIcon />} label="Overdue Tasks" value={overdueTasksCount} color="error" />
        </Grid>
        <Grid item xs={6}>
          <StatCard icon={<FlagIcon />} label="Pending Approvals" value={pendingApprovals} color="warning" />
        </Grid>
        <Grid item xs={6}>
          <StatCard icon={<AssignmentIcon />} label="Total Tasks" value={tasks.length} color="secondary" />
        </Grid>
        <Grid item xs={6}>
          <StatCard icon={<FolderIcon />} label="Total Projects" value={projects.length} color="primary" />
        </Grid>
      </Grid>

      {chartData.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
            Project Status Breakdown
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {tasks.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
            Task Status Overview
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taskStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2E5EAA" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

export default DashboardPage;