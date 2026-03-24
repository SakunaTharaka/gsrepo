import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDocs, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { Typography, TextField, Button, List, ListItem, ListItemText, IconButton, Paper, Box, InputAdornment } from '@mui/material';
import { Delete, Lock, Person } from '@mui/icons-material';

const Credentials = () => {
  const [credentials, setCredentials] = useState([]);
  const [newCredential, setNewCredential] = useState({ username: '', password: '' });

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'credentials'));
        const creds = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCredentials(creds);
      } catch (error) {
        console.error('Error fetching credentials:', error);
      }
    };
    fetchCredentials();
  }, []);

  const handleAddCredential = async () => {
    if (!newCredential.username || !newCredential.password) return;
    try {
      const docRef = doc(collection(db, 'credentials'), Date.now().toString());
      await setDoc(docRef, {
        username: newCredential.username,
        password: newCredential.password,
        createdAt: new Date()
      });
      setCredentials(prev => [...prev, { id: docRef.id, ...newCredential }]);
      setNewCredential({ username: '', password: '' });
    } catch (error) {
      console.error('Error adding credential:', error);
    }
  };

  const handleDeleteCredential = async (credentialId) => {
    try {
      await deleteDoc(doc(db, 'credentials', credentialId));
      setCredentials(prev => prev.filter(c => c.id !== credentialId));
    } catch (error) {
      console.error('Error deleting credential:', error);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
      <Typography variant="h5" fontWeight="700" gutterBottom>
        Credential Management
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, mt: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Username"
          variant="outlined"
          sx={{ flexGrow: 1 }}
          value={newCredential.username}
          onChange={(e) => setNewCredential(prev => ({ ...prev, username: e.target.value }))}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person />
              </InputAdornment>
            )
          }}
        />

        <TextField
          label="Password"
          type="password"
          variant="outlined"
          sx={{ flexGrow: 1 }}
          value={newCredential.password}
          onChange={(e) => setNewCredential(prev => ({ ...prev, password: e.target.value }))}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock />
              </InputAdornment>
            )
          }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleAddCredential}
          disabled={!newCredential.username || !newCredential.password}
          sx={{ px: 4 }}
        >
          Add Credential
        </Button>
      </Box>

      <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #eee' }}>
        {credentials.map((credential) => (
          <ListItem 
            key={credential.id}
            divider
            secondaryAction={
              <IconButton edge="end" onClick={() => handleDeleteCredential(credential.id)} color="error">
                <Delete />
              </IconButton>
            }
          >
            <ListItemText 
              primary={credential.username}
              secondary={`Password: ${'•'.repeat(credential.password.length)}`}
              sx={{ '& .MuiListItemText-primary': { fontWeight: 600 } }}
            />
          </ListItem>
        ))}
        {credentials.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            No credentials found.
          </Typography>
        )}
      </List>
    </Paper>
  );
};

export default Credentials;
