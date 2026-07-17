import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Typography, TextField, Button, Stack, Box } from '@mui/material';

const API_URL = 'http://localhost:5256/api/Auth/login';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    axios.post(API_URL, { email, password })
      .then((response) => {
        onLogin(response.data.token, response.data.user);
        navigate('/');
      })
      .catch((err) => {
        setError(err.response?.data || 'Login failed. Please try again.');
      });
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Login
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {typeof error === 'string' ? error : 'Login failed.'}
        </Typography>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
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
          <Button type="submit" variant="contained" size="large">
            Login
          </Button>
        </Stack>
      </Box>

      <Typography sx={{ mt: 2 }} align="center">
        Don't have an account? <Link to="/register">Register</Link>
      </Typography>
    </Box>
  );
}

export default LoginPage;