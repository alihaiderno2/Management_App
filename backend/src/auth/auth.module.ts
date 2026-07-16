import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService} from '@nestjs/config';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { TwoFactorModule } from '../two-factor/two-factor.module';
import { EmailModule } from '../email/email.module';
import { RedisModule } from '../redis/redis.module';
import { BullModule } from '@nestjs/bullmq';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule,
    RedisModule,EmailModule,UserModule,PassportModule.register({
    defaultStrategy: 'jwt',
  })
    ,ConfigModule,JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory:async (configService: ConfigService) => ({
      secret: configService.get<string>('JWT_SECRET'),
      signOptions: { expiresIn: '15m' },
    }),
  }),TwoFactorModule
],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy,GoogleStrategy,GithubStrategy],
  exports: [AuthService,JwtStrategy,GoogleStrategy,GithubStrategy],
})
export class AuthModule {}
