import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, TaskFilterDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { ProjectManagerGuard, ProjectMemberGuard, ProjectContributorGuard} from '../auth/guards/project.guard';

@UseGuards(JwtAuthGuard)
@Controller()
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

  @UseGuards(ProjectMemberGuard)
  @Get('project/:projectId/task/:taskId') 
  async findOne(@Param('taskId') taskId: string) {
    return await this.taskService.findOne(taskId);
  }

  @UseGuards(ProjectContributorGuard)
  @Patch('project/:projectId/task/:taskId')
  async update(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return await this.taskService.update(taskId, dto);
  }

  @UseGuards(ProjectContributorGuard)
  @Patch('project/:projectId/task/:taskId/move')
  async move(
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskDto,
  ) {
    return await this.taskService.move(taskId, dto);
  }

  @UseGuards(ProjectManagerGuard)
  @Delete('project/:projectId/task/:taskId')
  async remove(@Param('taskId') taskId: string) {
    return await this.taskService.remove(taskId);
  }
}