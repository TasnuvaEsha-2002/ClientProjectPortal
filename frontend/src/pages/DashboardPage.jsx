// This page acts as the Dashboard Module described in the proposal —
// it gives a Project Manager a quick summary view of the whole system
// without needing to open each individual page.
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Grid, Card, CardContent, Stack, Box } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FlagIcon from '@mui/icons-material/Flag';
import WarningIcon from '@mui/icons-material/Warning';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all three resources at the same time
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
  }, []);

  if (loading) return <Typography sx={{ p: 4 }}>Loading dashboard...</Typography>;

  // ---- Calculate summary statistics from the fetched data ----

  const activeProjects = projects.filter((p) => p.status === 'In Progress').length;
  const completedProjects = projects.filter((p) => p.status === 'Completed').length;
  const pendingCount = projects.filter((p) => p.status === 'Pending').length;

  // A task is "overdue" if its due date has passed and it's not marked Completed
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed'
  ).length;

  // Milestones that are completed but still waiting for client sign-off
  const pendingApprovals = milestones.filter(
    (m) => m.status === 'Completed' && !m.clientApproved
  ).length;

  // Prepare data for the project status pie chart
  const chartData = [
    { name: 'Pending', value: pendingCount },
    { name: 'In Progress', value: activeProjects },
    { name: 'Completed', value: completedProjects },
  ].filter((item) => item.value > 0); // hide empty slices

  // Colors for each pie slice, matching our theme
  const COLORS = ['#9e9e9e', '#F5A623', '#2E7D32'];

  // A small reusable card component for each stat
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
      <Typography variant="h6" sx={{ mt: 4, mb: 3 }}>
        Overview
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <StatCard
            icon={<FolderIcon />}
            label="Active Projects"
            value={activeProjects}
            color="primary"
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            icon={<FolderIcon />}
            label="Completed Projects"
            value={completedProjects}
            color="success"
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            icon={<WarningIcon />}
            label="Overdue Tasks"
            value={overdueTasks}
            color="error"
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            icon={<FlagIcon />}
            label="Pending Approvals"
            value={pendingApprovals}
            color="warning"
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            icon={<AssignmentIcon />}
            label="Total Tasks"
            value={tasks.length}
            color="secondary"
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            icon={<FolderIcon />}
            label="Total Projects"
            value={projects.length}
            color="primary"
          />
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
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
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
    </>
  );
}

export default DashboardPage;