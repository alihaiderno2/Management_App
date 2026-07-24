import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import {EmailModule} from "../email/email.module";
import {PrismaModule} from "../prisma/prisma.module";
import { JwtModule } from '@nestjs/jwt';
import {WorkspaceController} from "./workspace.controller";
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [EmailModule, PrismaModule,JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),],
    controllers: [WorkspaceController],
    providers: [WorkspaceService],
    exports: [WorkspaceService],
})
export class WorkspaceModule {}
