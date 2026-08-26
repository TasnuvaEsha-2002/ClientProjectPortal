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
  LinearProgress,
} from '@mui/material';

import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FlagIcon from '@mui/icons-material/Flag';
import WarningIcon from '@mui/icons-material/Warning';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

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
const PROJECTS_API_URL = 'http://localhost:5256/api/Projects';

// ============================================================
// ADMIN USERS API
// ============================================================
const ADMIN_USERS_API = 'http://localhost:5256/api/Auth/all-users';

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';

  return 'Good Evening';
}

// ============================================================
// REUSABLE STAT CARD
// ============================================================
function StatCard({ icon, label, value, color }) {
  return (
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
}

// ============================================================
// DASHBOARD PAGE
// ============================================================
function DashboardPage({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin-related states
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsersForAdmin, setAllUsersForAdmin] = useState([]);

  // Project Manager AI risk data
  const [riskByProject, setRiskByProject] = useState({});

  const isAdmin = currentUser?.role === 'Admin';
  const isTeamMember = currentUser?.role === 'TeamMember';
  const isProjectManager = currentUser?.role === 'ProjectManager';

  // ============================================================
  // FETCH PENDING USERS
  // ============================================================
  const fetchPendingUsers = () => {
    axios
      .get(`${AUTH_API_URL}/pending-users`)
      .then((response) => setPendingUsers(response.data))
      .catch(() => {});
  };

  // ============================================================
  // FETCH DASHBOARD DATA
  // ============================================================
  useEffect(() => {
    Promise.all([
      axios.get(PROJECTS_API_URL),
      axios.get(TASKS_API_URL),
      axios.get('http://localhost:5256/api/Milestones'),
    ])
      .then(([projectsRes, tasksRes, milestonesRes]) => {
        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
        setMilestones(milestonesRes.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // ==========================================================
    // ADMIN DATA
    // ==========================================================
    if (isAdmin) {
      fetchPendingUsers();

      axios
        .get(ADMIN_USERS_API)
        .then((response) => {
          setAllUsersForAdmin(response.data);
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  // ============================================================
  // PROJECT MANAGER — FETCH AI RISK ANALYSIS
  // ============================================================
  useEffect(() => {
    if (isProjectManager && projects.length > 0) {
      projects.forEach((project) => {
        axios
          .get(`${PROJECTS_API_URL}/${project.id}/risk-analysis`)
          .then((response) => {
            setRiskByProject((prev) => ({
              ...prev,
              [project.id]: response.data,
            }));
          })
          .catch(() => {});
      });
    }
  }, [isProjectManager, projects]);

  // ============================================================
  // ADMIN — APPROVE USER
  // ============================================================
  const handleApprove = (userId) => {
    axios
      .put(`${AUTH_API_URL}/approve/${userId}`, null, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(() => {
        fetchPendingUsers();

        // Refresh all users after approval
        axios
          .get(ADMIN_USERS_API)
          .then((response) => {
            setAllUsersForAdmin(response.data);
          })
          .catch(() => {});
      })
      .catch(() => {});
  };

  // ============================================================
  // ADMIN — REJECT USER
  // ============================================================
  const handleReject = (userId) => {
    axios
      .delete(`${AUTH_API_URL}/reject/${userId}`)
      .then(() => {
        fetchPendingUsers();

        // Refresh all users after rejection
        axios
          .get(ADMIN_USERS_API)
          .then((response) => {
            setAllUsersForAdmin(response.data);
          })
          .catch(() => {});
      })
      .catch(() => {});
  };

  // ============================================================
  // TEAM MEMBER — QUICK COMPLETE TASK
  // ============================================================
  const handleQuickComplete = (taskId) => {
    axios
      .patch(`${TASKS_API_URL}/${taskId}/status`, JSON.stringify('Completed'), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(() => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'Completed',
                  completionPercentage: 100,
                }
              : t
          )
        );
      })
      .catch(() => {});
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <Typography sx={{ p: 4 }}>
        Loading dashboard...
      </Typography>
    );
  }

  // ============================================================
  // RISK COLOR HELPER
  // ============================================================
  const riskColor = (level) => {
    if (level === 'High') return 'error';
    if (level === 'Medium') return 'warning';

    return 'success';
  };

  // ============================================================
  // ADMIN DASHBOARD
  // System-wide overview
  // ============================================================
  if (isAdmin) {
    const totalUsers = allUsersForAdmin.length;

    const pmCount = allUsersForAdmin.filter(
      (u) => u.role === 'ProjectManager'
    ).length;

    const tmCount = allUsersForAdmin.filter(
      (u) => u.role === 'TeamMember'
    ).length;

    const clientCount = allUsersForAdmin.filter(
      (u) => u.role === 'Client'
    ).length;

    const activeProjectsCount = projects.filter(
      (p) => p.status === 'In Progress'
    ).length;

    // Most recently registered users
    // Highest ID = most recent
    const recentRegistrations = [...allUsersForAdmin]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, 5);

    return (
      <>
        {/* ======================================================
            GREETING
        ====================================================== */}
        <Typography variant="h5" sx={{ mt: 4, mb: 3 }}>
          {getGreeting()}, {currentUser.fullName.split(' ')[0]} 👋
        </Typography>

        {/* ======================================================
            PENDING USER APPROVALS
        ====================================================== */}
        {pendingUsers.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
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
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                        >
                          {user.fullName}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {user.email} — requested role: {user.role}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleApprove(user.id)}
                        >
                          Approve
                        </Button>

                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleReject(user.id)}
                        >
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

        {/* ======================================================
            SYSTEM OVERVIEW
        ====================================================== */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          System Overview
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {/* Total Users */}
          <Grid item xs={6} sm={4}>
            <StatCard
              icon={<AssignmentIcon />}
              label="Total Users"
              value={totalUsers}
              color="primary"
            />
          </Grid>

          {/* Total Projects */}
          <Grid item xs={6} sm={4}>
            <StatCard
              icon={<FolderIcon />}
              label="Total Projects"
              value={projects.length}
              color="secondary"
            />
          </Grid>

          {/* Active Projects */}
          <Grid item xs={6} sm={4}>
            <StatCard
              icon={<TrendingUpIcon />}
              label="Active Projects"
              value={activeProjectsCount}
              color="info"
            />
          </Grid>

          {/* Project Managers */}
          <Grid item xs={6} sm={4}>
            <StatCard
              icon={<FolderIcon />}
              label="Project Managers"
              value={pmCount}
              color="primary"
            />
          </Grid>

          {/* Team Members */}
          <Grid item xs={6} sm={4}>
            <StatCard
              icon={<AssignmentIcon />}
              label="Team Members"
              value={tmCount}
              color="success"
            />
          </Grid>

          {/* Clients */}
          <Grid item xs={6} sm={4}>
            <StatCard
              icon={<FlagIcon />}
              label="Clients"
              value={clientCount}
              color="warning"
            />
          </Grid>

          {/* Pending Registrations */}
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={<WarningIcon />}
              label="Pending Registrations"
              value={pendingUsers.length}
              color="error"
            />
          </Grid>
        </Grid>

        {/* ======================================================
            RECENT REGISTRATIONS
        ====================================================== */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Registrations
        </Typography>

        {recentRegistrations.length === 0 ? (
          <Typography color="text.secondary">
            No registrations yet.
          </Typography>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                {recentRegistrations.map((user) => (
                  <Stack
                    key={user.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                      >
                        {user.fullName}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {user.email}
                      </Typography>
                    </Box>

                    <Chip
                      label={user.role}
                      size="small"
                    />
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
  // TEAM MEMBER DASHBOARD
  // ============================================================
  if (isTeamMember) {
    const myTasks = tasks.filter(
      (t) => t.assignedUserId === currentUser?.id
    );

    const completedCount = myTasks.filter(
      (t) => t.status === 'Completed'
    ).length;

    const inProgressCount = myTasks.filter(
      (t) => t.status === 'In Progress'
    ).length;

    const now = new Date();
    const todayStr = now.toDateString();

    const overdueTasks = myTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < now &&
        t.status !== 'Completed'
    );

    const todaysTasks = myTasks.filter(
      (t) =>
        t.status !== 'Completed' &&
        ((t.dueDate &&
          new Date(t.dueDate).toDateString() === todayStr) ||
          t.status === 'In Progress')
    );

    const upcomingDeadlines = myTasks
      .filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) >= now &&
          t.status !== 'Completed'
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate) - new Date(b.dueDate)
      )
      .slice(0, 5);

    const daysLate = (dueDate) =>
      Math.floor(
        (now - new Date(dueDate)) /
          (1000 * 60 * 60 * 24)
      );

    return (
      <>
        <Typography variant="h5" sx={{ mt: 4, mb: 3 }}>
          {getGreeting()}, {currentUser.fullName.split(' ')[0]} 👋
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={4}>
            <StatCard
              icon={<AssignmentIcon />}
              label="My Tasks"
              value={myTasks.length}
              color="primary"
            />
          </Grid>

          <Grid item xs={4}>
            <StatCard
              icon={<CheckCircleIcon />}
              label="Completed"
              value={completedCount}
              color="success"
            />
          </Grid>

          <Grid item xs={4}>
            <StatCard
              icon={<TrendingUpIcon />}
              label="In Progress"
              value={inProgressCount}
              color="warning"
            />
          </Grid>
        </Grid>

        {overdueTasks.length > 0 && (
          <>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <WarningIcon
                color="error"
                fontSize="small"
              />

              <Typography
                variant="h6"
                color="error.main"
              >
                Overdue Tasks
              </Typography>
            </Stack>

            <Stack spacing={1} sx={{ mb: 4 }}>
              {overdueTasks.map((task) => (
                <Card
                  key={task.id}
                  variant="outlined"
                  sx={{
                    borderColor: 'error.main',
                    borderWidth: 2,
                  }}
                >
                  <CardContent
                    sx={{
                      py: 1.5,
                      '&:last-child': {
                        pb: 1.5,
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        variant="body2"
                        fontWeight={500}
                      >
                        {task.title}
                      </Typography>

                      <Chip
                        label={`${daysLate(task.dueDate)} day${
                          daysLate(task.dueDate) === 1
                            ? ''
                            : 's'
                        } late`}
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

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <AssignmentIcon fontSize="small" />

          <Typography variant="h6">
            Today's Tasks
          </Typography>
        </Stack>

        {todaysTasks.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Nothing due today. 🎉
          </Typography>
        ) : (
          <Card
            variant="outlined"
            sx={{ mb: 4 }}
          >
            <CardContent>
              <Stack spacing={1}>
                {todaysTasks.map((task) => (
                  <Stack
                    key={task.id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Checkbox
                      checked={false}
                      onChange={() =>
                        handleQuickComplete(task.id)
                      }
                    />

                    <Typography variant="body2">
                      {task.title}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        <Typography variant="h6" sx={{ mb: 1 }}>
          Upcoming Deadlines
        </Typography>

        {upcomingDeadlines.length === 0 ? (
          <Typography color="text.secondary">
            No upcoming deadlines.
          </Typography>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                {upcomingDeadlines.map((task) => (
                  <Stack
                    key={task.id}
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2">
                      {task.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {new Date(
                        task.dueDate
                      ).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
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
  // PROJECT MANAGER DASHBOARD
  // ============================================================
  if (isProjectManager) {
    const activeCount = projects.filter(
      (p) => p.status === 'In Progress'
    ).length;

    const completedCount = projects.filter(
      (p) => p.status === 'Completed'
    ).length;

    const atRiskProjects = projects.filter((project) => {
      const risk = riskByProject[project.id];

      return (
        risk &&
        (risk.riskLevel === 'High' ||
          risk.riskLevel === 'Medium')
      );
    });

    const openBlockers = tasks.filter(
      (t) => t.isBlocked
    );

    const pendingCount = projects.filter(
      (p) => p.status === 'Pending'
    ).length;

    const statusChartData = [
      {
        name: 'Pending',
        value: pendingCount,
      },
      {
        name: 'In Progress',
        value: activeCount,
      },
      {
        name: 'Completed',
        value: completedCount,
      },
    ].filter((item) => item.value > 0);

    const STATUS_COLORS = [
      '#9e9e9e',
      '#F5A623',
      '#2E7D32',
    ];

    return (
      <>
        <Typography variant="h5" sx={{ mt: 4, mb: 3 }}>
          {getGreeting()}, {currentUser.fullName.split(' ')[0]} 👋
        </Typography>

        {/* STAT CARDS */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4}>
            <StatCard
              icon={<FolderIcon />}
              label="My Projects"
              value={projects.length}
              color="primary"
            />
          </Grid>

          <Grid item xs={6} sm={4}>
            <StatCard
              icon={<WarningIcon />}
              label="At Risk"
              value={atRiskProjects.length}
              color="error"
            />
          </Grid>

          <Grid item xs={6} sm={4}>
            <StatCard
              icon={<ReportProblemIcon />}
              label="Blockers"
              value={openBlockers.length}
              color="warning"
            />
          </Grid>

          <Grid item xs={6} sm={6}>
            <StatCard
              icon={<CheckCircleIcon />}
              label="Completed"
              value={completedCount}
              color="success"
            />
          </Grid>

          <Grid item xs={6} sm={6}>
            <StatCard
              icon={<TrendingUpIcon />}
              label="In Progress"
              value={activeCount}
              color="info"
            />
          </Grid>
        </Grid>

        {/* PROJECTS REQUIRING ATTENTION */}
        {atRiskProjects.length > 0 && (
          <>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <WarningIcon
                color="error"
                fontSize="small"
              />

              <Typography
                variant="h6"
                color="error.main"
              >
                Projects Requiring Attention
              </Typography>
            </Stack>

            <Stack spacing={1} sx={{ mb: 4 }}>
              {atRiskProjects.map((project) => (
                <Card
                  key={project.id}
                  variant="outlined"
                  sx={{
                    borderColor: 'error.main',
                    borderWidth: 2,
                  }}
                >
                  <CardContent
                    sx={{
                      py: 1.5,
                      '&:last-child': {
                        pb: 1.5,
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        variant="body2"
                        fontWeight={500}
                      >
                        {project.name}
                      </Typography>

                      <Chip
                        label={`${riskByProject[project.id]?.riskLevel} Risk`}
                        color={riskColor(
                          riskByProject[project.id]
                            ?.riskLevel
                        )}
                        size="small"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </>
        )}

        {/* RECENT BLOCKERS */}
        {openBlockers.length > 0 && (
          <>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <ReportProblemIcon
                color="warning"
                fontSize="small"
              />

              <Typography variant="h6">
                Recent Blockers
              </Typography>
            </Stack>

            <Card
              variant="outlined"
              sx={{
                mb: 4,
                borderLeft: '4px solid',
                borderLeftColor: 'warning.main',
              }}
            >
              <CardContent>
                <Stack spacing={1.5}>
                  {openBlockers.map((task) => (
                    <Box key={task.id}>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                      >
                        {task.title}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {task.blockerReason}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </>
        )}

        {/* PROJECT STATUS CHART */}
        {statusChartData.length > 0 && (
          <>
            <Typography
              variant="h6"
              sx={{ mb: 2 }}
            >
              Project Status Breakdown
            </Typography>

            <Card
              variant="outlined"
              sx={{ mb: 4 }}
            >
              <CardContent>
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {statusChartData.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              STATUS_COLORS[
                                index %
                                  STATUS_COLORS.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* PROJECT OVERVIEW */}
        <Typography
          variant="h6"
          sx={{ mb: 1 }}
        >
          Project Overview
        </Typography>

        {projects.length === 0 ? (
          <Typography color="text.secondary">
            No projects yet.
          </Typography>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2.5}>
                {projects.map((project) => {
                  const projectTasks =
                    tasks.filter(
                      (t) =>
                        t.projectId === project.id
                    );

                  const progress =
                    projectTasks.length === 0
                      ? 0
                      : Math.round(
                          (projectTasks.filter(
                            (t) =>
                              t.status ===
                              'Completed'
                          ).length /
                            projectTasks.length) *
                            100
                        );

                  const barColor =
                    progress >= 75
                      ? 'success'
                      : progress >= 40
                      ? 'warning'
                      : 'error';

                  return (
                    <Box key={project.id}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                      >
                        <Typography
                          variant="body2"
                          fontWeight={500}
                        >
                          {project.name}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight="bold"
                        >
                          {progress}%
                        </Typography>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        color={barColor}
                        sx={{
                          borderRadius: 1,
                          height: 8,
                          mt: 0.5,
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  // ============================================================
  // CLIENT DASHBOARD
  // ============================================================

  const activeProjects = projects.filter(
    (p) => p.status === 'In Progress'
  ).length;

  const completedProjects = projects.filter(
    (p) => p.status === 'Completed'
  ).length;

  const pendingCount = projects.filter(
    (p) => p.status === 'Pending'
  ).length;

  const overdueTasksCount = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < new Date() &&
      t.status !== 'Completed'
  ).length;

  const pendingApprovals = milestones.filter(
    (m) =>
      m.status === 'Completed' &&
      !m.clientApproved
  ).length;

  const chartData = [
    {
      name: 'Pending',
      value: pendingCount,
    },
    {
      name: 'In Progress',
      value: activeProjects,
    },
    {
      name: 'Completed',
      value: completedProjects,
    },
  ].filter((item) => item.value > 0);

  const COLORS = [
    '#9e9e9e',
    '#F5A623',
    '#2E7D32',
  ];

  const taskStatusData = [
    {
      status: 'Not Started',
      count: tasks.filter(
        (t) => t.status === 'Not Started'
      ).length,
    },
    {
      status: 'In Progress',
      count: tasks.filter(
        (t) => t.status === 'In Progress'
      ).length,
    },
    {
      status: 'Completed',
      count: tasks.filter(
        (t) => t.status === 'Completed'
      ).length,
    },
  ];

  return (
    <>
      <Typography
        variant="h6"
        sx={{ mt: 4, mb: 3 }}
      >
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
            value={overdueTasksCount}
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

      {/* PROJECT STATUS CHART */}
      {chartData.length > 0 && (
        <>
          <Typography
            variant="h6"
            sx={{ mt: 5, mb: 2 }}
          >
            Project Status Breakdown
          </Typography>

          <Card variant="outlined">
            <CardContent>
              <ResponsiveContainer
                width="100%"
                height={300}
              >
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
                    {chartData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[
                              index % COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* TASK STATUS CHART */}
      {tasks.length > 0 && (
        <>
          <Typography
            variant="h6"
            sx={{ mt: 5, mb: 2 }}
          >
            Task Status Overview
          </Typography>

          <Card variant="outlined">
            <CardContent>
              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <BarChart data={taskStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="status" />

                  <YAxis allowDecimals={false} />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#2E5EAA"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />
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