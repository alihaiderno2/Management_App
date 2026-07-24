import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string = "";

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  sprintId?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  sprintId?: string | null;
}

export class MoveTaskDto {
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status: TaskStatus = TaskStatus.TODO;

  @IsNumber()
  @IsNotEmpty()
  order: number = 0;

  @IsString()
  @IsOptional()
  sprintId?: string | null;
}

export class TaskFilterDto {
  @IsString()
  @IsOptional()
  sprintId?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}