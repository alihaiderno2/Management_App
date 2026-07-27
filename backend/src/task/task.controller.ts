import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, TaskFilterDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { ProjectManagerGuard, ProjectMemberGuard, ProjectContributorGuard } from '../auth/guards/project.guard';

@UseGuards(JwtAuthGuard)
@Controller('project/:projectId/task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @UseGuards(ProjectContributorGuard)
  @Post()
  async create(
    @Req() req: { user: { userId: string } },
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return await this.taskService.create(projectId, req.user.userId, dto);
  }

  @UseGuards(ProjectMemberGuard)
  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @Query() filters: TaskFilterDto,
  ) {
    return await this.taskService.findAll(projectId, filters);
  }

  @UseGuards(ProjectMemberGuard)
  @Get(':taskId') 
  async findOne(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string
  ) {
    return await this.taskService.findOne(projectId, taskId);
  }

  @UseGuards(ProjectContributorGuard)
  @Patch(':taskId')
  async update(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return await this.taskService.update(projectId, taskId, dto);
  }

  @UseGuards(ProjectMemberGuard)
  @Patch(':taskId/move')
  async move(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskDto,
  ) {
    return await this.taskService.move(projectId, taskId, dto);
  }

  @UseGuards(ProjectManagerGuard)
  @Delete(':taskId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string
  ) {
    return await this.taskService.remove(projectId, taskId);
  }
}