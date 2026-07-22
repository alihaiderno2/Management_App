'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Button, Drawer, Tabs, Tab } from '@mui/material';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const workspaceId = params.id as string;

  const [activeTab, setActiveTab] = useState('board');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* LAYER 1: Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#6B6F76' }}>
            Workspace {workspaceId} / Project
          </Typography>
          <Typography variant="h5" sx={{ color: '#14161A', fontWeight: 600 }}>
            Sprint Board
          </Typography>
        </Box>
        <Button variant="contained" sx={{ bgcolor: '#0F7B6C' }}>
          + New Task
        </Button>
      </Box>

      {/* LAYER 2: Control Bar */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Active Sprint" value="board" />
          <Tab label="Backlog" value="backlog" />
          <Tab label="Settings" value="settings" />
        </Tabs>
      </Box>

      {/* LAYER 3: Main Canvas */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'board' && (
          // <KanbanBoard projectId={projectId} onTaskClick={(taskId) => setSelectedTaskId(taskId)} />
          <Typography>Kanban Board Goes Here</Typography>
        )}
        {activeTab === 'backlog' && (
          <Typography>Backlog List Goes Here</Typography>
        )}
      </Box>

      {/* LAYER 4: The Task Overlay */}
      <Drawer
        anchor="right"
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        slotProps={{
            paper: {
            sx: { width: { xs: '100%', sm: 500 }, p: 3 }
            }
        }}
        >
        {selectedTaskId && (
          <Typography variant="h6">
            Editing Task: {selectedTaskId}
            {/* The TaskDetails component goes here, fetching data for this specific ID */}
          </Typography>
        )}
      </Drawer>

    </Box>
  );
}