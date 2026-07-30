'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams, useRouter } from 'next/navigation';
import {
  Drawer, Box, Typography, List, ListItemButton, ListItemText, ListItemIcon,
  Divider, IconButton, Menu, MenuItem,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import WorkspacesIcon from '@mui/icons-material/BusinessOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVertOutlined';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useChatStore } from '@/store/chat-store';
import { Avatar } from '@/app/componenets/ui/Avatar';

const DRAWER_WIDTH = 240;

interface Project {
  id: string;
  name: string;
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

interface Chat{
  id: string;
  name : string;
  chatType: 'DIRECT' | 'TEAM' | 'PROJECT';
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { user, accessToken, clearSession } = useAuthStore();

  const workspaceId = pathname.startsWith('/workspace/') ? (params.id as string) : null;

  const [workspaceName, setWorkspaceName] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const { rooms, fetchRooms, onlineUsers } = useChatStore();

  useEffect(() => {
    if (mobileOpen) {
      onClose();
    }
  }, [pathname]);

  useEffect(() => {
    if (!workspaceId || !accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };

    apiClient.get(`/workspace/${workspaceId}`, { headers }).then((res) => {
      setWorkspaceName(res.data.name);
    });

    apiClient.get(`/workspace/${workspaceId}/project`, { headers })
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]));
  }, [workspaceId, accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchRooms();
    }
  }, [accessToken, fetchRooms]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${accessToken}` } });
    } catch {
    }
    clearSession();
    router.push('/login');
  };
  
  const groupRooms = rooms.filter(r => r.type === 'PROJECT');
  const directRooms = rooms.filter(r => r.type === 'DIRECT');

  const renderDirectMessages = () => (
    <>
      <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: '#6B6F76', textTransform: 'uppercase', px: 1, mb: 1 }}>
          Direct Messages
        </Typography>
        <List sx={{ p: 0 }}>
          {directRooms.map((dm) => {
            const otherParticipant = dm.participants?.find((p: any) => p.userId !== user?.id);
            const chatName = otherParticipant?.user?.name || dm.name || 'Unknown User';
            const otherUserId = otherParticipant?.user?.id;

            const isOnline = onlineUsers.includes(otherUserId);

            return (
              <ListItemButton 
                key={dm.id} 
                onClick={() => router.push(`/chat/${dm.id}`)}
                selected={pathname === `/chat/${dm.id}`} 
                sx={{ borderRadius: 1.5, mb: 0.5, '&.Mui-selected': { bgcolor: 'rgba(15,123,108,0.2)' } }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar name={chatName} size="sm" userId={otherUserId} />
                    <Box 
                    sx={{
                      width: 10, height: 10, borderRadius: '50%', 
                      bgcolor: isOnline ? '#4ade80' : 'transparent',
                      border: isOnline ? '2px solid #14161A' : '1px solid #9A9CA3',
                      position: 'absolute', bottom: -2, right: -2,
                      transition: 'all 0.3s ease'
                    }} 
                  />
                </Box>
                </ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontSize: 13, color: '#F5F4F0' }}>{chatName}</Typography>} />
              </ListItemButton>
            );
          })}
        </List>
    </>
  );

  const drawerContent = (
    <>
      <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
        {!workspaceId ? (
          <>
            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', color: '#F5F4F0', textTransform: 'uppercase', px: 1, mb: 3 }}>
              Team Collaboration
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItemButton onClick={() => router.push('/dashboard')} selected={pathname === '/dashboard'} sx={{ borderRadius: 1.5, mb: 0.5, '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
                <ListItemIcon sx={{ color: '#9A9CA3', minWidth: 36 }}><DashboardIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontSize: 14, color: '#F5F4F0' }}>Dashboard</Typography>} />
              </ListItemButton>
              <ListItemButton onClick={() => router.push('/workspace')} selected={pathname === '/workspace'} sx={{ borderRadius: 1.5, mb: 0.5, '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
                <ListItemIcon sx={{ color: '#9A9CA3', minWidth: 36 }}><WorkspacesIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontSize: 14, color: '#F5F4F0' }}>Workspaces</Typography>} />
              </ListItemButton>
              <ListItemButton onClick={() => router.push('/settings')} selected={pathname.startsWith('/settings')} sx={{ borderRadius: 1.5, '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
                <ListItemIcon sx={{ color: '#9A9CA3', minWidth: 36 }}><SettingsIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontSize: 14, color: '#F5F4F0' }}>Settings</Typography>} />
              </ListItemButton>
            </List>

            {/* CHAT SECTION */}
            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: '#6B6F76', textTransform: 'uppercase', px: 1, mt: 4, mb: 1 }}>
              Projects
            </Typography>
            <List sx={{ p: 0, mb: 2 }}>
              {groupRooms.map((room) => (
                <ListItemButton
                  key={room.id}
                  onClick={() => router.push(`/chat/${room.id}`)}
                  selected={pathname === `/chat/${room.id}`}
                  sx={{ borderRadius: 1.5, mb: 0.5, '&.Mui-selected': { bgcolor: 'rgba(15,123,108,0.2)' } }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: '#9A9CA3' }}>
                    <span className="text-lg font-light">#</span>
                  </ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: 13, color: '#F5F4F0' }}>{room.name}</Typography>} />
                </ListItemButton>
              ))}
            </List>

            {renderDirectMessages()}
          </>
        ) : (
          <>
            <ListItemButton onClick={() => router.push('/workspace')} sx={{ borderRadius: 1.5, mb: 2, px: 1 }}>
              <ListItemIcon sx={{ color: '#9A9CA3', minWidth: 32 }}><ArrowBackIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary={<Typography sx={{ fontSize: 13, color: '#9A9CA3' }}>All workspaces</Typography>} />
            </ListItemButton>

            <ListItemButton onClick={() => router.push(`/workspace/${workspaceId}`)} sx={{ fontSize: 25, fontWeight: 600, color: '#F5F4F0', px: 1, mb: 2 }}>
              {workspaceName || '…'}
            </ListItemButton>

            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: '#6B6F76', textTransform: 'uppercase', px: 1, mb: 1 }}>
              Projects
            </Typography>
            <List sx={{ p: 0 }}>
              {projects.map((project) => (
                <ListItemButton key={project.id} onClick={() => router.push(`/workspace/${workspaceId}/project/${project.id}`)} selected={pathname.includes(`/project/${project.id}`)} sx={{ borderRadius: 1.5, mb: 0.5, pl: 3, '&.Mui-selected': { bgcolor: 'rgba(15,123,108,0.2)' } }}>
                  <ListItemIcon sx={{ color: '#0F7B6C', minWidth: 28 }}><FolderIcon sx={{ fontSize: 16 }} /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: 13, color: '#F5F4F0' }}>{project.name}</Typography>} />
                </ListItemButton>
              ))}
              {projects.length === 0 && (
                <Typography sx={{ fontSize: 12, color: '#6B6F76', px: 1, py: 1 }}>No projects yet</Typography>
              )}
            </List>

            {/* RENDER DMs HERE AS WELL! */}
            {renderDirectMessages()}
          </>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar name={user?.name || 'unknown'} size="sm" userId={user?.id} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, color: '#F5F4F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </Typography>
        </Box>
        <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ color: '#9A9CA3' }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={() => { setMenuAnchor(null); router.push('/settings'); }}>Settings</MenuItem>
          <MenuItem onClick={handleLogout}>Log out</MenuItem>
        </Menu>
      </Box>
    </>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: '#14161A', color: '#F5F4F0', borderRight: 'none', display: 'flex', flexDirection: 'column' },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: '#14161A', color: '#F5F4F0', borderRight: 'none', display: 'flex', flexDirection: 'column' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}