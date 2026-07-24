'use client';

import { useEffect, useState } from 'react';
import { Drawer, Box, Typography, IconButton, CircularProgress, Divider } from '@mui/material';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import  {useUiStore}  from '@/store/ui-store';
import { Avatar } from '../ui/Avatar';

export function UserProfileDrawer() {
  const { accessToken } = useAuthStore();
  const { selectedProfileId, closeProfile } = useUiStore();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedProfileId && accessToken) {
      fetchUserProfile(selectedProfileId);
    } else {
      setUserProfile(null);
    }
  }, [selectedProfileId, accessToken]);

  const fetchUserProfile = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/user/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUserProfile(res.data);
    } catch (error) {
      console.error('Failed to fetch user profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={!!selectedProfileId}
      onClose={closeProfile}
      slotProps={{
        paper: { sx: { width: { xs: '100%', sm: 400 }, bgcolor: '#FAFAFA' } }
      }}
    >
      {isLoading || !userProfile ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress sx={{ color: '#0F7B6C' }} />
        </Box>
      ) : (
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <IconButton onClick={closeProfile} sx={{ color: '#6B6F76' }}>
              <Typography variant="h6">✕</Typography>
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 4 }}>
            <Avatar name={userProfile.name} size="lg" />
            <Typography variant="h5" sx={{ color: '#1B1D1F', fontWeight: 600, mt: 2 }}>
              {userProfile.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B6F76', mt: 0.5 }}>
              {userProfile.email}
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

        </Box>
      )}
    </Drawer>
  );
}