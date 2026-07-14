import { Module } from '@nestjs/common';
import { AccountActivationProcessor } from './account-activation.processor';
import {BullModule} from '@nestjs/bullmq';

@Module({
  imports: [BullModule.registerQueue({
      name: 'account-activation',
    }),],
  providers: [AccountActivationProcessor],
  exports: [BullModule],
})
export class TasksModule {}
