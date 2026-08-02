import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SprintService } from './sprint.service';
import { CreateSprintDto, UpdateSprintDto } from './dto/sprint.dto';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { ProjectMemberGuard, ProjectManagerGuard} from '../auth/guards/project.guard';

@UseGuards(JwtAuthGuard)
@Controller('project/:projectId/sprint')
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @UseGuards(ProjectManagerGuard)
  @Post()
  async create(@Param('projectId') projectId: string, @Body() dto: CreateSprintDto) {
    return await this.sprintService.create(projectId, dto);
  }

  @UseGuards(ProjectMemberGuard)
  @Get()
  async findAll(@Param('projectId') projectId: string) {
    return await this.sprintService.findAllByProject(projectId);
  }

  @UseGuards(ProjectMemberGuard)
  @Get(':sprintId')
  async findOne(@Param('projectId') projectId: string, @Param('sprintId') sprintId: string) {
    return await this.sprintService.findOne(projectId, sprintId);
  }

  @UseGuards(ProjectManagerGuard)
  @Patch(':sprintId')
  async update(
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return await this.sprintService.update(projectId, sprintId, dto); 
  }

  @UseGuards(ProjectManagerGuard)
  @Delete(':sprintId')
  async remove(@Param('projectId') projectId: string, @Param('sprintId') sprintId: string) {
    return await this.sprintService.remove(projectId, sprintId); 
  }
}