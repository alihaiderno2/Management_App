import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, TaskFilterDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { ProjectManagerGuard, ProjectMemberGuard, ProjectContributorGuard } from '../auth/guards/project.guard';

@UseGuards(JwtAuthGuard)
@Controller('')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @UseGuards(ProjectContributorGuard)
  @Post('project/:projectId/task')
  async create(
    @Req() req: { user: { userId: string } },
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return await this.taskService.create(projectId, req.user.userId, dto);
  }

  @UseGuards(ProjectMemberGuard)
  @Get('project/:projectId/task')
  async findAll(
    @Param('projectId') projectId: string,
    @Query() filters: TaskFilterDto,
  ) {
    return await this.taskService.findAll(projectId, filters);
  }

  @UseGuards(JwtAuthGuard)
  @Get('task/my-tasks')
  async getMyActiveTasks(@Req() req: { user: { userId: string } }) {
    const tasks =  await this.taskService.getMyActiveTasks(req.user.userId);
    if(!tasks) {
      return { success: false, message: 'No active tasks found.' };
    }
    return tasks;
  }

  @UseGuards(ProjectMemberGuard)
  @Get('project/:projectId/task/:taskId') 
  async findOne(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string
  ) {
    return await this.taskService.findOne(projectId, taskId);
  }

  @UseGuards(ProjectContributorGuard)
  @Patch('project/:projectId/task/:taskId')
  async update(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return await this.taskService.update(projectId, taskId, dto);
  }

  @UseGuards(ProjectMemberGuard)
  @Patch('project/:projectId/task/:taskId/move')
  async move(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskDto,
  ) {
    return await this.taskService.move(projectId, taskId, dto);
  }

  @UseGuards(ProjectManagerGuard)
  @Delete('project/:projectId/task/:taskId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string
  ) {
    return await this.taskService.remove(projectId, taskId);
  }
}