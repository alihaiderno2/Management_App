import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationType, NotificationWays } from '@prisma/client';
import { SendNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(@InjectQueue('notifications') private notificationQueue: Queue) {}

  async dispatch(data: SendNotificationDto) {
    await this.notificationQueue.add('process-notification', data, {
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }
}