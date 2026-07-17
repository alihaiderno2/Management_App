import { IsEnum, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class InviteBodyDto {
  @IsString()
    email: string = "";
  @IsEnum(Role)
  role: Role = 'ADMIN';
}