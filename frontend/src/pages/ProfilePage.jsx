// Lets any logged-in user edit their own name and change their password.
// Email and Role are shown but cannot be changed here.
import { useState } from 'react';
import axios from 'axios';
import { Typography, TextField, Button, Stack, Box, Card, CardContent } from '@mui/material';

const API_URL = 'http://localhost:5256/api/Auth';

function ProfilePage({ currentUser, onProfileUpdate }) {
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    const payload = {
      fullName,
      newPassword: newPassword || null,
    };

    axios.put(`${API_URL}/me`, payload)
      .then((response) => {
        setMessage('Profile updated successfully.');
        setNewPassword('');
        setConfirmPassword('');
        // Update the name shown in the navbar/session immediately
        if (onProfileUpdate) {
          onProfileUpdate(response.data.fullName);
        }
      })
      .catch((err) => {
        setError(err.response?.data || err.message);
      });
  };

  return (
    <Box sx={{ maxWidth: 500, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        My Profile
      </Typography>

      <Card variant="outlined">
        <CardContent>
          {message && (
            <Typography color="success.main" sx={{ mb: 2 }}>
              {message}
            </Typography>
          )}
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {typeof error === 'string' ? error : 'Update failed.'}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField label="Email" value={currentUser?.email || ''} disabled fullWidth />
              <TextField label="Role" value={currentUser?.role || ''} disabled fullWidth />
              <TextField
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                helperText="Leave blank to keep your current password"
              />
              <TextField
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
              />
              <Button type="submit" variant="contained" size="large">
                Save Changes
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ProfilePage;