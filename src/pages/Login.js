import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { Lock, Person } from '@mui/icons-material';
import Alert from '@mui/material/Alert';

function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOpenSnackbar(false);

    try {
      // Query Firestore credentials collection
      const q = query(
        collection(db, 'credentials'),
        where('username', '==', credentials.username),
        where('password', '==', credentials.password)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid username or password');
      }

      // Store authentication state
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/admin-config');
    } catch (err) {
      setError(err.message);
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Admin Login
        </Typography>

        <form onSubmit={handleLogin}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              InputProps={{
                startAdornment: (
                  <Person sx={{ color: 'action.active', mr: 1 }} />
                )
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              InputProps={{
                startAdornment: (
                  <Lock sx={{ color: 'action.active', mr: 1 }} />
                )
              }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          variant="filled" 
          onClose={handleCloseSnackbar}
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Login;