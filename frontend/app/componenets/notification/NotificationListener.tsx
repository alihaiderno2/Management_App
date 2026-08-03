"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/chat-store";
import { useNotificationStore } from "@/store/notification-store";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";

export function NotificationListener() {
  const { socket } = useChatStore();
  const { addNotification, setNotifications } = useNotificationStore();
  const { accessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: any) => {
      addNotification(notification);

      toast.info(notification.title, {
        description: notification.body,
        action: notification.link
          ? {
              label: "View",
              onClick: () => {
                router.replace(notification.link);
              },
            }
          : undefined,
      });
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, addNotification]);
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await apiClient.get('/notifications',
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        setNotifications(data);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchHistory();
  }, [setNotifications]);

  return null;
}
