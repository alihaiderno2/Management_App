import { useState, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, Divider, CircularProgress, MenuItem, Select, TextField, Button } from '@mui/material';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

interface TaskDrawerProps {
  isOpen: boolean;
  taskId: string | null;
  projectId: string;
  onClose: () => void;
  onTaskUpdated: (taskId: string, updates: any) => void;
}

export function TaskDrawer({ isOpen, taskId, projectId, onClose, onTaskUpdated }: TaskDrawerProps) {
  const { accessToken } = useAuthStore();
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [editDescription, setEditDescription] = useState('');
  const [isSavingDesc, setIsSavingDesc] = useState(false);

  useEffect(() => {
    if (isOpen && taskId && accessToken) {
      fetchTaskDetails();
    } else {
      setTaskDetails(null);
      setEditDescription('');
    }
  }, [isOpen, taskId, accessToken]);

  const fetchTaskDetails = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/project/${projectId}/task/${taskId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setTaskDetails(res.data);
      setEditDescription(res.data.description || '');
    } catch (error) {
      console.error('Failed to fetch task details', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const previousStatus = taskDetails.status;
    
    setTaskDetails({ ...taskDetails, status: newStatus });
    
    if (taskId) {
      onTaskUpdated(taskId, { status: newStatus });
    }
    
    try {
      await apiClient.patch(`/project/${projectId}/task/${taskId}/move`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch (error) {
      console.error('Failed to update status', error);
      setTaskDetails({ ...taskDetails, status: previousStatus });
      if (taskId) {
        onTaskUpdated(taskId, { status: previousStatus });
      }
    }
  };

  const handleUpdateDescription = async () => {
    setIsSavingDesc(true);
    try {
      await apiClient.patch(`/project/${projectId}/task/${taskId}`,
        { description: editDescription },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setTaskDetails({ ...taskDetails, description: editDescription });
      if (taskId) {
        onTaskUpdated(taskId, { description: editDescription });
      }
    } catch (error) {
      console.error('Failed to update description', error);
      setEditDescription(taskDetails.description || '');
    } finally {
      setIsSavingDesc(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { width: { xs: '100%', sm: 480 }, bgcolor: '#FAFAFA' }
        }
      }}
    >
      {isLoading || !taskDetails ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress sx={{ color: '#0F7B6C' }} />
        </Box>
      ) : (
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#1B1D1F', fontWeight: 600 }}>
              {taskDetails.title}
            </Typography>
            <IconButton onClick={onClose} sx={{ color: '#6B6F76' }}>
              <Typography variant="h6">✕</Typography>
            </IconButton>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="caption" sx={{ color: '#6B6F76', display: 'block', mb: 1, textTransform: 'uppercase' }}>
              Status
            </Typography>
            <Select
              size="small"
              value={taskDetails.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 2, minWidth: 150 }}
            >
              <MenuItem value="TODO">To Do</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="DONE">Done</MenuItem>
            </Select>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#6B6F76', display: 'block', mb: 1, textTransform: 'uppercase' }}>
              Description
            </Typography>
            <TextField
              multiline
              fullWidth
              minRows={6}
              variant="outlined"
              placeholder="Add a description..."
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }}
            />
            <Button 
              onClick={handleUpdateDescription} 
              disabled={isSavingDesc || editDescription === taskDetails.description}
              variant="contained" 
              sx={{ mt: 2, bgcolor: '#0F7B6C', '&:hover': { bgcolor: '#0B6356' } }}
            >
              {isSavingDesc ? 'Saving...' : 'Save Description'}
            </Button>
          </Box>

        </Box>
      )}
    </Drawer>
  );
}