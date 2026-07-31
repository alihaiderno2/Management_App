"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useChatStore } from "@/store/chat-store";
import { useNotificationStore } from "@/store/notification-store";

export function NotificationListener() {
  const { socket } = useChatStore();
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: any) => {
      addNotification(notification);

      toast.info(notification.title, {
        description: notification.body,
        action: notification.link
          ? {
              label: "View",
              onClick: () => (window.location.href = notification.link),
            }
          : undefined,
      });
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, addNotification]);

  return null;
}
