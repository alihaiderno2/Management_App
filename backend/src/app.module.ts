import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TwoFactorController } from './two-factor/two-factor.controller';
import { TwoFactorService } from './two-factor/two-factor.service';
import { TwoFactorModule } from './two-factor/two-factor.module';
import { WorkspaceController } from './workspace/workspace.controller';
import { WorkspaceService } from './workspace/workspace.service';
import { ProjectController } from './project/project.controller';
import { ProjectService } from './project/project.service';
import { TaskController } from './task/task.controller';
import { TaskService } from './task/task.service';
import { SprintController } from './sprint/sprint.controller';
import { SprintService } from './sprint/sprint.service';
import { EmailService } from './email/email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailModule } from './email/email.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TasksModule } from './tasks/tasks.module';
import { RedisModule } from './redis/redis.module';
import {BullModule} from '@nestjs/bullmq';
import { WorkspaceModule } from './workspace/workspace.module';
import { ChatService } from './chat/chat.service';
import { ChatModule } from './chat/chat.module';
import { TaskModule } from './task/task.module';
import { ProjectModule } from './project/project.module';

@Module({
  imports: [BullModule.forRoot({
    connection: {
      host: process.env.REDIS_HOST,
      port: 6379,
    },
  }),
    RedisModule,ThrottlerModule.forRoot([{
      ttl: 60000, 
      limit: 100,  
    }]),
    PrismaModule, UserModule, AuthModule, TwoFactorModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
    }),
    EmailModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TasksModule,
    RedisModule,
    WorkspaceModule,
    ChatModule,
    TaskModule,
    ProjectModule
  ],
  controllers: [AppController, UserController, TwoFactorController, WorkspaceController, ProjectController, TaskController, SprintController],
  providers: [AppService, PrismaService, TwoFactorService, ProjectService, TaskService, SprintService, EmailService,{
      provide: APP_GUARD,
      useClass: ThrottlerGuard, 
    }, ChatService],
})
export class AppModule {}
