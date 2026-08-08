// This page acts as the Dashboard Module described in the proposal —
// it gives a quick summary view of the whole system, and for Admins,
// also shows pending user approvals right at the top.
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
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FlagIcon from '@mui/icons-material/Flag';
import WarningIcon from '@mui/icons-material/Warning';
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

function DashboardPage({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---- Admin-only: pending user approvals ----
  const [pendingUsers, setPendingUsers] = useState([]);

  const isAdmin = currentUser?.role === 'Admin';

  const fetchPendingUsers = () => {
    axios.get(`${AUTH_API_URL}/pending-users`)
      .then((response) => setPendingUsers(response.data))
      .catch(() => {
        // Silently ignore — this section only matters for Admins,
        // and non-admins will get a 403 which we don't need to show here.
      });
  };

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:5256/api/Projects'),
      axios.get('http://localhost:5256/api/Tasks'),
      axios.get('http://localhost:5256/api/Milestones'),
    ])
      .then(([projectsRes, tasksRes, milestonesRes]) => {
        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
        setMilestones(milestonesRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Only fetch pending users if the logged-in user is an Admin
    if (isAdmin) {
      fetchPendingUsers();
    }
  }, [isAdmin]);

  // Approves a user using the role they originally requested at registration
  const handleApprove = (userId) => {
    axios.put(`${AUTH_API_URL}/approve/${userId}`, null, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => fetchPendingUsers())
      .catch(() => {});
  };

  // Rejects a pending registration, removing it entirely
  const handleReject = (userId) => {
    axios.delete(`${AUTH_API_URL}/reject/${userId}`)
      .then(() => fetchPendingUsers())
      .catch(() => {});
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading dashboard...</Typography>;

  // ---- Calculate summary statistics from the fetched data ----

  const activeProjects = projects.filter((p) => p.status === 'In Progress').length;
  const completedProjects = projects.filter((p) => p.status === 'Completed').length;
  const pendingCount = projects.filter((p) => p.status === 'Pending').length;

  const overdueTasks = tasks.filter(
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
      {/* ---------- ADMIN-ONLY: PENDING USER APPROVALS ---------- */}
      {isAdmin && pendingUsers.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Pending User Approvals
          </Typography>
          <Stack spacing={2} sx={{ mb: 4 }}>
            {pendingUsers.map((user) => (
              <Card key={user.id} variant="outlined">
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={2}
                  >
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

      {/* ---------- OVERVIEW STATS ---------- */}
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
          <StatCard icon={<WarningIcon />} label="Overdue Tasks" value={overdueTasks} color="error" />
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

      {/* ---------- PROJECT STATUS CHART ---------- */}
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

      {/* ---------- TASK STATUS CHART ---------- */}
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