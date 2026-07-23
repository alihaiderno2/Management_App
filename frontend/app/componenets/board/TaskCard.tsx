import { Card, CardActionArea, CardContent, Typography, Avatar, Box, Chip } from '@mui/material';

export interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assigneeName?: string;
}

interface TaskCardProps {
  task: Task;
  onClick: (taskId: string) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: '1px solid #E4E4E1', 
        borderRadius: 2,
        mb: 2,
        '&:hover': { borderColor: '#0F7B6C', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } 
      }}
    >
      <CardActionArea onClick={() => onClick(task.id)} sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: '#1B1D1F', fontWeight: 600, mb: 2, lineHeight: 1.4 }}>
          {task.title}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip 
            label={task.status.replace('_', ' ')} 
            size="small" 
            sx={{ 
              fontSize: '10px', 
              fontWeight: 700, 
              bgcolor: task.status === 'DONE' ? '#E1F5EE' : '#F5F5F4',
              color: task.status === 'DONE' ? '#0F7B6C' : '#6B6F76'
            }} 
          />
          {task.assigneeName && (
            <Avatar 
              sx={{ width: 24, height: 24, fontSize: '11px', bgcolor: '#0F7B6C' }}
            >
              {task.assigneeName.charAt(0).toUpperCase()}
            </Avatar>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}