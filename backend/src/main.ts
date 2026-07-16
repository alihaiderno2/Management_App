import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import {VersioningType as versioning} from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });
  // Using helmet to set security related stuff
  app.use(helmet());

  // enabling versions
  app.enableVersioning({
    type: versioning.URI,
    defaultVersion: '1',
  })
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
