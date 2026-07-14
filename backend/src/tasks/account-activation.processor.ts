import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Processor('account-activation')
@Injectable()
export class AccountActivationProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ userId: string }>): Promise<any> {
    const { userId } = job.data;
    console.log(`Now activating user: ${userId}`);

    await this.prisma.user.update({
      where: { id: userId },
      data: {isDeactivated: false},
    });

    return { success: true };
  }
}