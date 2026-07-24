import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string = "";

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AddProjectMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string = "";

  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole;
}

export class UpdateProjectMemberRoleDto {
  @IsEnum(ProjectRole)
  @IsNotEmpty()
  role: ProjectRole = ProjectRole.VIEWER;
}