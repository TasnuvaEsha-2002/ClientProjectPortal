import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Typography, TextField, Button, MenuItem, Stack, Box } from '@mui/material';

const API_URL = 'http://localhost:5256/api/Auth/register';

function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TeamMember');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    axios.post(API_URL, { fullName, email, password, role })
      .then(() => {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 1000);
      })
      .catch((err) => {
        setError(err.response?.data || 'Registration failed. Please try again.');
      });
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Register
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {typeof error === 'string' ? error : 'Registration failed.'}
        </Typography>
      )}
      {success && (
        <Typography color="success.main" sx={{ mb: 2 }}>
          Registered successfully! Redirecting to login...
        </Typography>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <TextField
            select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            fullWidth
          >
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="ProjectManager">Project Manager</MenuItem>
            <MenuItem value="TeamMember">Team Member</MenuItem>
            <MenuItem value="Client">Client</MenuItem>
          </TextField>
          <Button type="submit" variant="contained" size="large">
            Register
          </Button>
        </Stack>
      </Box>

      <Typography sx={{ mt: 2 }} align="center">
        Already have an account? <Link to="/login">Login</Link>
      </Typography>
    </Box>
  );
}

export default RegisterPage;