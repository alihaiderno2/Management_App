import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';
import { SprintStatus } from '@prisma/client';

export class CreateSprintDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsDateString()
  @IsNotEmpty()
  startDate: string = '';

  @IsDateString()
  @IsNotEmpty()
  endDate: string = '';
}

export class UpdateSprintDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  status?: SprintStatus;
}