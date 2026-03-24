import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Typography, Select, MenuItem, TextField, Button, List, ListItem, ListItemText, IconButton, Paper, Box } from '@mui/material';
import { Delete } from '@mui/icons-material';

const DropdownConfig = ({ setApprovalNotification }) => {
  const [selectedDropdown, setSelectedDropdown] = useState('category');
  const [newField, setNewField] = useState('');
  const [existingFields, setExistingFields] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      const docRef = doc(db, 'dropdowns', selectedDropdown);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setExistingFields(docSnap.data().options || []);
      } else {
        setExistingFields([]);
      }
    };
    fetchOptions();
  }, [selectedDropdown]);

  const handleAddField = async () => {
    if (!newField.trim()) return;
    const docRef = doc(db, 'dropdowns', selectedDropdown);
    const docSnap = await getDoc(docRef);
    try {
      const newOptions = [...existingFields, newField.trim()];
      if (docSnap.exists()) {
        await updateDoc(docRef, { options: newOptions });
      } else {
        await setDoc(docRef, { options: newOptions });
      }
      setExistingFields(newOptions);
      setNewField('');
      setApprovalNotification({
        open: true,
        message: `Added new ${selectedDropdown.slice(0, -1)}: ${newField.trim()}`,
        severity: 'success'
      });
    } catch (error) {
      setApprovalNotification({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  const handleDeleteField = async (index) => {
    const fieldToDelete = existingFields[index];
    const updatedFields = existingFields.filter((_, i) => i !== index);
    const docRef = doc(db, 'dropdowns', selectedDropdown);
    try {
      await updateDoc(docRef, { options: updatedFields });
      setExistingFields(updatedFields);
      setApprovalNotification({
        open: true,
        message: `Deleted ${selectedDropdown.slice(0, -1)}: ${fieldToDelete}`,
        severity: 'success'
      });
    } catch (error) {
      setApprovalNotification({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
      <Typography variant="h5" fontWeight="700" gutterBottom>
        Dropdown Configuration
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Select
          value={selectedDropdown}
          onChange={(e) => setSelectedDropdown(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="category">Categories</MenuItem>
          <MenuItem value="countries">Countries</MenuItem>
          <MenuItem value="languages">Languages</MenuItem>
        </Select>

        <TextField
          label={`Add new ${selectedDropdown}`}
          variant="outlined"
          sx={{ flexGrow: 1 }}
          value={newField}
          onChange={(e) => setNewField(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddField}
          disabled={!newField.trim()}
          sx={{ px: 4 }}
        >
          Add
        </Button>
      </Box>

      <List sx={{ maxHeight: 400, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #eee' }}>
        {existingFields.map((field, index) => (
          <ListItem 
            key={index}
            divider
            secondaryAction={
              <IconButton edge="end" onClick={() => handleDeleteField(index)} color="error">
                <Delete />
              </IconButton>
            }
          >
            <ListItemText primary={field} sx={{ '& .MuiListItemText-primary': { fontWeight: 500 } }} />
          </ListItem>
        ))}
        {existingFields.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            No options found. Add some above.
          </Typography>
        )}
      </List>
    </Paper>
  );
};

export default DropdownConfig;
