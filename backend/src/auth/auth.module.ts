import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import {ConfigModule, ConfigService} from '@nestjs/config';

@Module({
  imports: [UserModule,PassportModule,ConfigModule,JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory:async (configService: ConfigService) => ({
      secret: configService.get<string>('JWT_SECRET'),
      signOptions: { expiresIn: '15m' },
    }),
  })],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy],
})
export class AuthModule {}
