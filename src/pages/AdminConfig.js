import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Snackbar, Alert, Button } from '@mui/material';
import { Logout, AppSettingsAlt, People, GroupAdd, VpnKey } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

import GroupsList from '../components/admin/GroupsList';
import DropdownConfig from '../components/admin/DropdownConfig';
import Credentials from '../components/admin/Credentials';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div 
      role="tabpanel" 
      hidden={value !== index} 
      id={`admin-tabpanel-${index}`} 
      aria-labelledby={`admin-tab-${index}`} 
      {...other} 
      style={{ width: '100%', flexGrow: 1, height: '100%' }}
    >
      {value === index && <Box sx={{ p: 4 }}>{children}</Box>}
    </div>
  );
};

const AdminConfig = () => {
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const handleTabChange = (event, newValue) => setTabValue(newValue);
  const handleCloseNotification = () => setNotification(prev => ({ ...prev, open: false }));

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth).catch(() => {});
      }
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f8fafc', overflow: 'hidden' }}>
        
        {/* Sidebar Tabs */}
        <Box sx={{ width: 280, flexShrink: 0, bgcolor: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AppSettingsAlt sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight="800" sx={{ color: '#1e293b' }}>Control Panel</Typography>
          </Box>
          
          <Tabs 
            orientation="vertical" 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ 
              borderRight: 1, borderColor: 'divider', flexGrow: 1, 
              '& .MuiTab-root': { alignItems: 'flex-start', textAlign: 'left', pl: 3, py: 2.5, textTransform: 'none', fontSize: 15, fontWeight: 600, minHeight: 64 },
              '& .Mui-selected': { bgcolor: '#f1f5f9', color: '#4f46e5' },
              '& .MuiTabs-indicator': { left: 0, right: 'auto', width: 4, borderRadius: '0 4px 4px 0', bgcolor: '#4f46e5' }
            }}
          >
            <Tab icon={<People sx={{ mr: 2, mb: '0 !important' }}/>} iconPosition="start" label="Approved Groups" />
            <Tab icon={<GroupAdd sx={{ mr: 2, mb: '0 !important' }}/>} iconPosition="start" label="Unapproved Groups" />
            <Tab icon={<AppSettingsAlt sx={{ mr: 2, mb: '0 !important' }}/>} iconPosition="start" label="Dropdown Config" />
            <Tab icon={<VpnKey sx={{ mr: 2, mb: '0 !important' }}/>} iconPosition="start" label="Credentials" />
          </Tabs>

          <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button fullWidth variant="outlined" color="error" startIcon={<Logout />} onClick={handleLogout} sx={{ borderRadius: 2, py: 1, fontWeight: 600 }}>
              Logout
            </Button>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <Box sx={{ px: 4, pt: 4, pb: 2, bgcolor: 'white', borderBottom: '1px solid #e2e8f0', zIndex: 5 }}>
            <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a' }}>
              {tabValue === 0 && 'Group Management (Approved)'}
              {tabValue === 1 && 'Pending Groups Queue'}
              {tabValue === 2 && 'Dropdown Configuration'}
              {tabValue === 3 && 'Credentials Management'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {tabValue === 0 && 'Manage live groups on the platform. Auto-loads based on your selected filters.'}
              {tabValue === 1 && 'Review and approve user-submitted groups. Drag & drop to quickly provide icons before approving.'}
              {tabValue === 2 && 'Manage categories, countries, and languages for the forms.'}
              {tabValue === 3 && 'Manage admin login credentials.'}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#f8fafc' }}>
            <TabPanel value={tabValue} index={0}>
              <GroupsList isApproved={true} setApprovalNotification={setNotification} />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <GroupsList isApproved={false} setApprovalNotification={setNotification} />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <DropdownConfig setApprovalNotification={setNotification} />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <Credentials />
            </TabPanel>
          </Box>
        </Box>

        {/* Global Notification */}
        <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%', boxShadow: 3, borderRadius: 2 }}>
            {notification.message}
          </Alert>
        </Snackbar>

      </Box>
    </LocalizationProvider>
  );
};

export default AdminConfig;