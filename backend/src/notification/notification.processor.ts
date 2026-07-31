import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto } from './dto/notification.dto';
import { ChatGateway } from 'src/chat/chat.gateway';

@Processor('notifications')
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing notification for user: ${job.data.userId}`);
    
    try {
        const notification = await this.prisma.notification.create({
        data: {
          userId: job.data.userId,
          actorId: job.data.actorId,
          type: job.data.type,
          way: job.data.way || 'APP',
          title: job.data.title,
          body: job.data.body,
          link: job.data.link,
          payload: job.data.payload || {},
          status: 'DELIVERED', 
          sentAt: new Date(),
        },
        include: { 
          actor: { select: { name: true, profileImage: true } } 
        }
      });

      this.chatGateway.emitToUser(
        notification.userId, 
        'new-notification', 
        notification
      );
      // 3. (TODO) Trigger email via SendGrid/Nodemailer if way === 'EMAIL'

      return { success: true, notificationId: notification.id };
    } catch (error: any) {
      this.logger.error(`Failed to process notification: ${error.message}`);
      throw error;
    }
  }
}