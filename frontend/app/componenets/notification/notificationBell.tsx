"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  ListItemButton
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNotificationStore, AppNotification } from "@/store/notification-store";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotificationStore();
  const { accessToken } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return { borderLeft: '4px solid #2563EB', badgeBg: '#DBEAFE', badgeColor: '#1D4ED8', label: 'Task' };
      case 'MENTION':
        return { borderLeft: '4px solid #9333EA', badgeBg: '#F3E8FF', badgeColor: '#7E22CE', label: 'Mention' };
      case 'PROJECT_INVITE':
        return { borderLeft: '4px solid #16A34A', badgeBg: '#DCFCE7', badgeColor: '#15803D', label: 'Invite' };
      default:
        return { borderLeft: '4px solid #6B7280', badgeBg: '#F3F4F6', badgeColor: '#374151', label: 'Alert' };
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
      try {
        await apiClient.patch(
          `/notifications/${notif.id}/read`, 
          {}, 
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
      } catch (error) {
        console.error("Failed to mark notification as read in DB", error);
      }
    }

    handleClose();
    if (notif.link) {
      router.replace(notif.link);
    }
  };

  return (
    <>
      <IconButton onClick={handleClick} sx={{ color: "#1B1D1F" }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxHeight: 480,
              borderRadius: 2,
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              border: "1px solid #E4E4E1",
            }
          }
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            borderBottom: "1px solid #E4E4E1",
            bgcolor: "#F9FAFB"
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#14161A" }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Typography variant="caption" sx={{ bgcolor: "", color: "#0F7B6C", px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
              {unreadCount} new
            </Typography>
          )}
        </Box>

        <List sx={{ p: 0, maxHeight: 380, overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "#9A9CA3" }}>
                No notifications yet
              </Typography>
            </Box>
          ) : (
            notifications.map((notif, index) => {
              const style = getNotificationStyle(notif.type);

              return (
                <Box key={notif.id || index}>
                  <ListItemButton
                    onClick={() => handleNotificationClick(notif)}
                    sx={{
                      alignItems: "flex-start",
                      borderLeft: style.borderLeft,
                      bgcolor: notif.isRead ? "transparent" : "#F0F7FF",
                      transition: "background-color 0.2s",
                      "&:hover": { bgcolor: "#F5F5F4" },
                      py: 1.5,
                      px: 2,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={notif.actor?.profileImage || undefined}
                        sx={{ bgcolor: "#14161A", width: 36, height: 36, fontSize: 14 }}
                      >
                        {notif.actor?.name?.charAt(0) || "S"}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: notif.isRead ? 500 : 700, 
                              color: "#14161A",
                              lineHeight: 1.3
                            }}
                          >
                            {notif.title}
                          </Typography>
                          <span style={{ backgroundColor: style.badgeBg, color: style.badgeColor }} className="text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {style.label}
                          </span>
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: "block", mt: 0.5 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: "#6B6F76", 
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {notif.body}
                          </Typography>
                        </Box>
                      }
                    />

                    {!notif.isRead && (
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: "50%", 
                          bgcolor: "#2563EB", 
                          ml: 1, 
                          mt: 1, 
                          flexShrink: 0 
                        }} 
                      />
                    )}
                  </ListItemButton>
                  {index < notifications.length - 1 && <Divider component="li" />}
                </Box>
              );
            })
          )}
        </List>
      </Popover>
    </>
  );
}