import React, { useState, useRef } from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box, Chip, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Delete, Link as LinkIcon, Check, CloudUpload } from '@mui/icons-material';

const GroupCard = ({ group, isApproved, onAction }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const uploadToCloudinary = async (file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'groupshare');

      const response = await fetch('https://api.cloudinary.com/v1_1/davjh8sjg/image/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.secure_url) {
        onAction('updateIcon', group, data.secure_url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      alert('Failed to upload image to Cloudinary.');
    } finally {
      setIsUploading(false);
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadToCloudinary(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadToCloudinary(e.target.files[0]);
    }
  };

  const avatarUrl = group.iconUrl || group.avatar || '';

  return (
    <Card 
      sx={{ 
        display: 'flex', flexDirection: 'column', height: '100%', 
        borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
      }}
    >
      <Box 
        sx={{ 
          position: 'relative', height: 160, backgroundColor: '#f1f5f9', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid #e2e8f0', overflow: 'hidden',
          border: isDragging ? '2px dashed #4f46e5' : 'none',
          cursor: 'pointer'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        
        {isUploading ? (
          <CircularProgress size={32} />
        ) : avatarUrl ? (
          <img src={avatarUrl} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ textAlign: 'center', color: '#64748b', p: 2 }}>
            <CloudUpload sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2" fontWeight="600">Drag & Drop DP</Typography>
            <Typography variant="caption">or click to browse</Typography>
          </Box>
        )}
        
        {/* Overlay on hover or drag */}
        {(isDragging || avatarUrl) && !isUploading && (
          <Box 
            sx={{ 
              position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', 
              display: isDragging ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center',
              color: 'white', '.MuiBox-root:hover > &': { display: 'flex' }, transition: 'opacity 0.2s'
            }}
          >
            <Typography variant="button" fontWeight="700">Change DP</Typography>
          </Box>
        )}
        
        {/* Platform Badge */}
        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
          <Chip 
            label={group.platform || (group.link?.includes('whatsapp') ? (group.link?.includes('/channel/') ? 'WA Channel' : 'WA Group') : 'Telegram')} 
            size="small" 
            sx={{ 
              bgcolor: group.link?.includes('whatsapp') ? '#25D366' : '#0088cc', 
              color: '#fff', fontWeight: 'bold' 
            }} 
          />
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
          {group.name}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
          <Chip label={group.category} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
          <Chip label={group.country} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
        </Box>

        <Typography variant="caption" color="text.secondary" display="block">
          Added: {group.createdAt?.toDate ? group.createdAt.toDate().toLocaleDateString() : group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Unknown'}
        </Typography>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'flex-start' }}>
        <Tooltip title="View Link">
          <IconButton size="small" color="primary" onClick={() => window.open(group.link, '_blank')}>
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Delete Group">
          <IconButton size="small" color="error" onClick={() => onAction('delete', group)}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
        
        {!isApproved && (
          <Button 
            variant="contained" 
            color="success" 
            size="small" 
            startIcon={<Check fontSize="small" />}
            onClick={() => onAction('approve', group)}
            sx={{ ml: 'auto', borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Approve
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default GroupCard;
