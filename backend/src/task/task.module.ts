import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { ProjectModule } from '../project/project.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
    imports: [ProjectModule, NotificationModule],
  controllers: [TaskController], 
  providers: [TaskService],
})
export class TaskModule {}
