// Admin-only page for managing all users in the system —
// change roles, activate/deactivate accounts.
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  Card,
  CardContent,
  Stack,
  Box,
  Chip,
  Select,
  MenuItem,
  Button,
  TextField,
} from '@mui/material';

const API_URL = 'http://localhost:5256/api/Auth';

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  const fetchUsers = () => {
    axios.get(`${API_URL}/all-users`)
      .then((response) => {
        setUsers(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data || err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = (userId, newRole) => {
    axios.put(`${API_URL}/change-role/${userId}`, JSON.stringify(newRole), {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => fetchUsers())
      .catch((err) => setError(err.response?.data || err.message));
  };

  const handleToggleActive = (userId) => {
    axios.put(`${API_URL}/toggle-active/${userId}`)
      .then(() => fetchUsers())
      .catch((err) => setError(err.response?.data || err.message));
  };

  if (loading) return <Typography sx={{ p: 4 }}>Loading users...</Typography>;

  // Simple client-side search by name or email
  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      u.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <>
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        User Management
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {typeof error === 'string' ? error : 'An error occurred.'}
        </Typography>
      )}

      <TextField
        label="Search by name or email"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />

      {filteredUsers.length === 0 ? (
        <Typography color="text.secondary">No users found.</Typography>
      ) : (
        <Stack spacing={2}>
          {filteredUsers.map((user) => (
            <Card key={user.id} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {user.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip
                        label={user.isApproved ? 'Approved' : 'Pending'}
                        color={user.isApproved ? 'success' : 'warning'}
                        size="small"
                      />
                      <Chip
                        label={user.isActive ? 'Active' : 'Deactivated'}
                        color={user.isActive ? 'info' : 'error'}
                        size="small"
                      />
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Select
                      size="small"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      <MenuItem value="Admin">Admin</MenuItem>
                      <MenuItem value="ProjectManager">Project Manager</MenuItem>
                      <MenuItem value="TeamMember">Team Member</MenuItem>
                      <MenuItem value="Client">Client</MenuItem>
                    </Select>
                    <Button
                      size="small"
                      variant="outlined"
                      color={user.isActive ? 'error' : 'success'}
                      onClick={() => handleToggleActive(user.id)}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
}

export default UserManagementPage;