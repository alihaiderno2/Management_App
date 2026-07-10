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

@Module({
  imports: [PrismaModule, UserModule, AuthModule, TwoFactorModule],
  controllers: [AppController, UserController, TwoFactorController, WorkspaceController, ProjectController, TaskController, SprintController],
  providers: [AppService, PrismaService, TwoFactorService, WorkspaceService, ProjectService, TaskService, SprintService],
})
export class AppModule {}
