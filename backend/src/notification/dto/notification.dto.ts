import { NotificationType, NotificationWays } from '@prisma/client';

export interface SendNotificationDto {
  userId: string;
  actorId?: string;
  type: NotificationType;
  way?: NotificationWays;
  title: string;
  body: string;
  link?: string;
  payload?: any;
}