import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SprintService } from './sprint.service';
import { CreateSprintDto, UpdateSprintDto } from './dto/sprint.dto';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { ProjectMemberGuard, ProjectManagerGuard} from '../auth/guards/project.guard'; 

@UseGuards(JwtAuthGuard)
@Controller()
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @UseGuards(ProjectManagerGuard)
  @Post('project/:projectId/sprint')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSprintDto,
  ) {
    return await this.sprintService.create(projectId, dto);
  }

  @UseGuards(ProjectMemberGuard)
  @Get('project/:projectId/sprint')
  async findAll(@Param('projectId') projectId: string) {
    return await this.sprintService.findAllByProject(projectId);
  }


  @Get('sprint/:sprintId')
  async findOne(@Param('sprintId') sprintId: string) {
    return await this.sprintService.findOne(sprintId);
  }

  @Patch('sprint/:sprintId')
  async update(
    @Param('sprintId') sprintId: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return await this.sprintService.update(sprintId, dto);
  }

  @Delete('sprint/:sprintId')
  async remove(@Param('sprintId') sprintId: string) {
    return await this.sprintService.remove(sprintId);
  }
}