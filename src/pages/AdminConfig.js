import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { startOfDay, endOfDay } from 'date-fns';
import { 
  Container,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Box,
  LinearProgress,
  InputAdornment,
  Chip,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Delete, 
  Link, 
  Save, 
  Refresh, 
  Lock, 
  Person,
  Logout,
  Check
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const AdminConfig = () => {
  // Dropdown Configuration State
  const [selectedDropdown, setSelectedDropdown] = useState('category');
  const [newField, setNewField] = useState('');
  const [existingFields, setExistingFields] = useState([]);

  // Group Management State
  const [groupManagement, setGroupManagement] = useState({
    platform: 'whatsapp',
    date: new Date(),
    groups: [],
    loading: false,
    error: null
  });

  // Credential Management State
  const [credentials, setCredentials] = useState([]);
  const [newCredential, setNewCredential] = useState({
    username: '',
    password: ''
  });

  // Approval Notification State
  const [approvalNotification, setApprovalNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Approval Status State
  const [approvedStatus, setApprovedStatus] = useState({});

  // Fetch dropdown options
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

  // Fetch credentials
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

  // Check approval status for groups (FIXED: Check both WA and TG collections)
  useEffect(() => {
    const checkApprovalStatus = async () => {
      const statusMap = {};
      
      // Check each group in parallel
      const promises = groupManagement.groups.map(async (group) => {
        // Check both WhatsApp and Telegram approval collections
        const qWA = query(
          collection(db, 'ApprovedWA'),
          where('link', '==', group.link)
        );
        
        const qTG = query(
          collection(db, 'ApprovedTG'),
          where('link', '==', group.link)
        );
        
        const [snapshotWA, snapshotTG] = await Promise.all([
          getDocs(qWA),
          getDocs(qTG)
        ]);
        
        return { id: group.id, approved: !snapshotWA.empty || !snapshotTG.empty };
      });
      
      const results = await Promise.all(promises);
      
      // Convert results to status map
      results.forEach(result => {
        statusMap[result.id] = result.approved;
      });
      
      setApprovedStatus(statusMap);
    };

    if (groupManagement.groups.length > 0) {
      checkApprovalStatus();
    }
  }, [groupManagement.groups]); // Removed platform dependency

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Fetch groups
  const fetchGroups = async () => {
    try {
      setGroupManagement(prev => ({ ...prev, loading: true, error: null }));
      
      const startDate = startOfDay(groupManagement.date);
      const endDate = endOfDay(groupManagement.date);
      
      const collectionName = groupManagement.platform === 'whatsapp' 
        ? 'whatsapp' 
        : 'telegramGroups';
      
      const q = query(
        collection(db, collectionName),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      
      const querySnapshot = await getDocs(q);
      const groupsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        iconUrl: doc.data().iconUrl || ''
      }));

      setGroupManagement(prev => ({ ...prev, groups: groupsData }));
    } catch (error) {
      setGroupManagement(prev => ({ ...prev, error: error.message }));
    } finally {
      setGroupManagement(prev => ({ ...prev, loading: false }));
    }
  };

  // Credential handlers
  const handleAddCredential = async () => {
    if (!newCredential.username || !newCredential.password) return;
    
    try {
      const docRef = doc(collection(db, 'credentials'), Date.now().toString());
      await setDoc(docRef, {
        username: newCredential.username,
        password: newCredential.password,
        createdAt: new Date()
      });
      
      setCredentials(prev => [...prev, {
        id: docRef.id,
        ...newCredential
      }]);
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

  // Enhanced group deletion handler
  const handleGroupAction = async (action, group) => {
    try {
      if (action === 'delete') {
        // Define all collections that might contain this group
        const allCollections = [
          'whatsapp',
          'telegramGroups',
          'ApprovedWA',
          'ApprovedTG'
        ];

        // Prepare all deletion promises
        const deletionPromises = allCollections.map(async (coll) => {
          // Query for documents with matching link
          const q = query(
            collection(db, coll),
            where('link', '==', group.link)
          );
          const snapshot = await getDocs(q);
          
          // Delete all matching documents
          return Promise.all(
            snapshot.docs.map(doc => deleteDoc(doc.ref))
          );
        });

        // Execute all deletions
        await Promise.all(deletionPromises);

        // Refresh groups list
        fetchGroups();
        
        // Show success notification
        setApprovalNotification({
          open: true,
          message: 'Group deleted from all collections',
          severity: 'success'
        });
      }
      
      if (action === 'save') {
        const collectionName = groupManagement.platform === 'whatsapp' 
          ? 'whatsapp' 
          : 'telegramGroups';
        await updateDoc(doc(db, collectionName, group.id), {
          iconUrl: group.iconUrl
        });
        
        // Show success notification
        setApprovalNotification({
          open: true,
          message: 'Group icon updated successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setApprovalNotification({
        open: true,
        message: `Action failed: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Handle group approval
  const handleApproveGroup = async (group) => {
    try {
      // Determine target collection based on platform
      const targetCollection = groupManagement.platform === 'whatsapp' 
        ? 'ApprovedWA' 
        : 'ApprovedTG';
      
      // Prepare approval data
      const approvalData = {
        ...group,
        approvedAt: new Date(),
        originalId: group.id
      };
      
      // Remove the id so Firestore generates a new one
      delete approvalData.id;
      
      // Add to approved collection
      const docRef = doc(collection(db, targetCollection));
      await setDoc(docRef, approvalData);
      
      // Update approval status
      setApprovedStatus(prev => ({ ...prev, [group.id]: true }));
      
      // Show success notification
      setApprovalNotification({
        open: true,
        message: `Group approved and added to ${targetCollection}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error approving group:', error);
      setApprovalNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const updateGroupIcon = (groupId, value) => {
    setGroupManagement(prev => ({
      ...prev,
      groups: prev.groups.map(group => 
        group.id === groupId ? { ...group, iconUrl: value } : group
      )
    }));
  };

  // Dropdown handlers
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
      
      // Show success notification
      setApprovalNotification({
        open: true,
        message: `Added new ${selectedDropdown.slice(0, -1)}: ${newField.trim()}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating document:', error);
      setApprovalNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleDeleteField = async (index) => {
    const fieldToDelete = existingFields[index];
    const updatedFields = existingFields.filter((_, i) => i !== index);
    const docRef = doc(db, 'dropdowns', selectedDropdown);

    try {
      await updateDoc(docRef, { options: updatedFields });
      setExistingFields(updatedFields);
      
      // Show success notification
      setApprovalNotification({
        open: true,
        message: `Deleted ${selectedDropdown.slice(0, -1)}: ${fieldToDelete}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting field:', error);
      setApprovalNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setApprovalNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Approval Notification */}
        <Snackbar
          open={approvalNotification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={approvalNotification.severity}
            sx={{ width: '100%' }}
          >
            {approvalNotification.message}
          </Alert>
        </Snackbar>

        {/* Logout Button */}
        <Box sx={{ 
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1000
        }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{
              boxShadow: 2,
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-1px)'
              }
            }}
          >
            Logout
          </Button>
        </Box>

        {/* Credential Management Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Credential Management
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              value={newCredential.username}
              onChange={(e) => setNewCredential(prev => ({
                ...prev,
                username: e.target.value
              }))}
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
              fullWidth
              value={newCredential.password}
              onChange={(e) => setNewCredential(prev => ({
                ...prev,
                password: e.target.value
              }))}
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
              sx={{ minWidth: 120 }}
            >
              Add Credential
            </Button>
          </Box>

          <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper' }}>
            {credentials.map((credential) => (
              <ListItem 
                key={credential.id}
                divider
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={() => handleDeleteCredential(credential.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                }
              >
                <ListItemText 
                  primary={credential.username}
                  secondary={`Password: ${'•'.repeat(credential.password.length)}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Dropdown Configuration Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Dropdown Configuration
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Select
              value={selectedDropdown}
              onChange={(e) => setSelectedDropdown(e.target.value)}
              fullWidth
            >
              <MenuItem value="category">Categories</MenuItem>
              <MenuItem value="countries">Countries</MenuItem>
              <MenuItem value="languages">Languages</MenuItem>
            </Select>

            <TextField
              label={`Add new ${selectedDropdown.slice(0, -1)}`}
              variant="outlined"
              fullWidth
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddField()}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddField}
              disabled={!newField.trim()}
              sx={{ minWidth: 120 }}
            >
              Add
            </Button>
          </Box>

          <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper' }}>
            {existingFields.map((field, index) => (
              <ListItem 
                key={index}
                divider
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={() => handleDeleteField(index)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                }
              >
                <ListItemText primary={field} />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Group Management Section */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Group Management
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Select
              value={groupManagement.platform}
              onChange={(e) => setGroupManagement(prev => ({
                ...prev,
                platform: e.target.value
              }))}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="whatsapp">WhatsApp Groups</MenuItem>
              <MenuItem value="telegram">Telegram Groups</MenuItem>
            </Select>

            <DatePicker
              label="Filter by Date"
              value={groupManagement.date}
              onChange={(newDate) => setGroupManagement(prev => ({
                ...prev,
                date: newDate
              }))}
              renderInput={(params) => <TextField {...params} />}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={fetchGroups}
              disabled={groupManagement.loading}
              startIcon={<Refresh />}
            >
              Load Groups
            </Button>
          </Box>

          {groupManagement.loading && <LinearProgress sx={{ mb: 2 }} />}
          {groupManagement.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {groupManagement.error}
            </Alert>
          )}

          <List sx={{ maxHeight: 500, overflow: 'auto' }}>
            {groupManagement.groups.map((group) => {
              const isApproved = approvedStatus[group.id] || false;
              
              return (
                <ListItem
                  key={group.id}
                  divider
                  sx={{ 
                    py: 2,
                    position: 'relative',
                    '&::before': !group.iconUrl ? {
                      content: '""',
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'error.main'
                    } : {}
                  }}
                >
                  <Box sx={{ flexGrow: 1, mr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6">
                        {group.name}
                        {isApproved && (
                          <Chip 
                            label="Approved" 
                            color="success" 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        )}
                        {!group.iconUrl && (
                          <Tooltip title="Missing group icon" arrow>
                            <Box 
                              component="span" 
                              sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                backgroundColor: 'error.main', 
                                ml: 1 
                              }} 
                            />
                          </Tooltip>
                        )}
                      </Typography>
                      <Chip label={group.category} size="small" />
                      <Chip label={group.country} size="small" />
                      <Chip label={group.language} size="small" />
                    </Box>
                    
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      label="Icon URL"
                      value={group.iconUrl}
                      error={!group.iconUrl}
                      onChange={(e) => updateGroupIcon(group.id, e.target.value)}
                      InputProps={{
                        startAdornment: group.iconUrl && (
                          <InputAdornment position="start">
                            <img 
                              src={group.iconUrl} 
                              alt="Group Icon" 
                              style={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%',
                                objectFit: 'cover' 
                              }}
                            />
                          </InputAdornment>
                        ),
                      }}
                      helperText={!group.iconUrl && "Icon URL is required"}
                      FormHelperTextProps={{
                        sx: { 
                          position: 'absolute',
                          bottom: -24,
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* Show Approve button only for unapproved groups */}
                    {!isApproved && (
                      <Tooltip title="Approve Group">
                        <IconButton
                          color="success"
                          onClick={() => handleApproveGroup(group)}
                        >
                          <Check />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {/* Always show these 3 buttons */}
                    <IconButton
                      color="primary"
                      onClick={() => handleGroupAction('save', group)}
                    >
                      <Save />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleGroupAction('delete', group)}
                    >
                      <Delete />
                    </IconButton>
                    <IconButton
                      color="success"
                      onClick={() => window.open(group.link, '_blank')}
                    >
                      <Link />
                    </IconButton>
                  </Box>
                </ListItem>
              );
            })}
          </List>

          {groupManagement.groups.length === 0 && !groupManagement.loading && (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
              No groups found for selected date
            </Typography>
          )}
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default AdminConfig;