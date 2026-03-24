import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit, startAfter, endBefore, limitToLast, deleteDoc, updateDoc, setDoc, doc } from 'firebase/firestore';
import { Box, Button, Typography, Select, MenuItem, TextField, Grid, LinearProgress, Alert } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { startOfDay, endOfDay } from 'date-fns';
import GroupCard from './GroupCard';

const GroupsList = ({ isApproved, setApprovalNotification }) => {
  const [state, setState] = useState({
    platform: 'whatsapp',
    date: null,
    groups: [],
    loading: false,
    error: null,
    firstVisible: null,
    lastVisible: null,
    page: 1
  });

  const fetchGroups = useCallback(async (direction = null) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      let collectionName = '';
      if (isApproved) {
        collectionName = state.platform === 'whatsapp' ? 'ApprovedWA' : 'ApprovedTG';
      } else {
        collectionName = state.platform === 'whatsapp' ? 'whatsapp' : 'telegramGroups';
      }

      let constraints = [orderBy('createdAt', 'desc')];

      if (state.date) {
        const startDate = startOfDay(state.date);
        const endDate = endOfDay(state.date);
        constraints.push(where('createdAt', '>=', startDate));
        constraints.push(where('createdAt', '<=', endDate));
      }

      if (direction === 'next' && state.lastVisible) {
        constraints.push(startAfter(state.lastVisible));
        constraints.push(limit(12));
      } else if (direction === 'prev' && state.firstVisible) {
        constraints.push(endBefore(state.firstVisible));
        constraints.push(limitToLast(12));
      } else {
        constraints.push(limit(12));
      }

      const q = query(collection(db, collectionName), ...constraints);
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const fetchedGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState(prev => ({
          ...prev,
          groups: fetchedGroups,
          firstVisible: snapshot.docs[0],
          lastVisible: snapshot.docs[snapshot.docs.length - 1],
          page: direction === 'next' ? prev.page + 1 : direction === 'prev' ? prev.page - 1 : 1
        }));
      } else if (direction === null) {
        setState(prev => ({ ...prev, groups: [], firstVisible: null, lastVisible: null, page: 1 }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: err.message }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.platform, state.date, state.firstVisible, state.lastVisible, isApproved]);

  useEffect(() => {
    fetchGroups(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.platform, state.date]);

  const handleAction = async (action, group, payload = null) => {
    try {
      let currentColl = isApproved 
        ? (state.platform === 'whatsapp' ? 'ApprovedWA' : 'ApprovedTG')
        : (state.platform === 'whatsapp' ? 'whatsapp' : 'telegramGroups');

      if (action === 'delete') {
        await deleteDoc(doc(db, currentColl, group.id));
        setApprovalNotification({ open: true, message: 'Group deleted successfully', severity: 'success' });
        fetchGroups(null);
      } 
      else if (action === 'updateIcon') {
        await updateDoc(doc(db, currentColl, group.id), { iconUrl: payload });
        setApprovalNotification({ open: true, message: 'Group Image updated!', severity: 'success' });
        setState(prev => ({
          ...prev,
          groups: prev.groups.map(g => g.id === group.id ? { ...g, iconUrl: payload } : g)
        }));
      }
      else if (action === 'approve' && !isApproved) {
        const targetColl = state.platform === 'whatsapp' ? 'ApprovedWA' : 'ApprovedTG';
        const approvalData = { ...group, approvedAt: new Date(), originalId: group.id };
        delete approvalData.id;
        
        await setDoc(doc(collection(db, targetColl)), approvalData);
        await deleteDoc(doc(db, currentColl, group.id));
        
        setApprovalNotification({ open: true, message: 'Group Approved & Moved!', severity: 'success' });
        fetchGroups(null);
      }
    } catch (err) {
      console.error(err);
      setApprovalNotification({ open: true, message: `Error: ${err.message}`, severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <Select
          value={state.platform}
          onChange={(e) => setState(prev => ({ ...prev, platform: e.target.value, date: null }))}
          sx={{ minWidth: 200, bgcolor: 'background.paper' }}
        >
          <MenuItem value="whatsapp">WhatsApp Groups</MenuItem>
          <MenuItem value="telegram">Telegram Groups</MenuItem>
        </Select>

        <DatePicker
          label="Filter by Add Date"
          value={state.date}
          onChange={(newDate) => setState(prev => ({ ...prev, date: newDate, page: 1, firstVisible: null, lastVisible: null }))}
          renderInput={(params) => <TextField {...params} sx={{ bgcolor: 'background.paper' }} />}
        />
        
        {state.date && (
          <Button variant="text" color="error" onClick={() => setState(prev => ({ ...prev, date: null, page: 1, firstVisible: null, lastVisible: null }))}>
            Clear Date
          </Button>
        )}
      </Box>

      {state.loading && <LinearProgress sx={{ mb: 2 }} />}
      {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

      <Grid container spacing={3}>
        {state.groups.map(group => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={group.id}>
            <GroupCard group={group} isApproved={isApproved} onAction={handleAction} />
          </Grid>
        ))}
      </Grid>

      {state.groups.length === 0 && !state.loading && (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
          No {isApproved ? 'approved' : 'unapproved'} groups found.
        </Typography>
      )}

      {state.groups.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #e2e8f0' }}>
          <Button 
            variant="outlined" 
            disabled={state.page === 1 || state.loading}
            onClick={() => fetchGroups('prev')}
          >
            Previous
          </Button>
          <Typography sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            Page {state.page}
          </Typography>
          <Button 
            variant="outlined" 
            disabled={state.groups.length < 12 || state.loading}
            onClick={() => fetchGroups('next')}
          >
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default GroupsList;
