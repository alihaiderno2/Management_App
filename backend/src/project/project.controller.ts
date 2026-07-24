import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto, AddProjectMemberDto, UpdateProjectMemberRoleDto } from './dto/project.dto';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { WorkspaceMemberGuard } from '../auth/guards/workspace.guard';
import { WorkspaceAdminGuard } from '../auth/guards/workspaceAdmin.guard';
import { ProjectManagerGuard, ProjectMemberGuard } from 'src/auth/guards/project.guard';

@UseGuards(JwtAuthGuard)
@Controller('workspace/:id/project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @UseGuards(WorkspaceAdminGuard)
  @Post()
  async create(
    @Req() req: { user: { userId: string } },
    @Param('id') workspaceId: string,
    @Body() dto: CreateProjectDto
  ) {
    return await this.projectService.create(req.user.userId, workspaceId, dto);
  }

  @UseGuards(WorkspaceMemberGuard)
  @Get()
  async findAll(
    @Req() req: { user: { userId: string } }, 
    @Param('id') workspaceId: string
  ) {
    return await this.projectService.findAllByWorkspace(workspaceId, req.user.userId);
  }

  @UseGuards(ProjectMemberGuard)
  @Get(':projectId')
  async findOne(
    @Req() req: { user: { userId: string } }, 
    @Param('projectId') projectId: string
  ) {
    return await this.projectService.findOne(projectId, req.user.userId);
  }

  @UseGuards(ProjectManagerGuard)
  @Patch(':projectId')
  async update(
    @Req() req: { user: { userId: string } }, 
    @Param('projectId') projectId: string, 
    @Body() dto: UpdateProjectDto
  ) {
    return await this.projectService.update(projectId, req.user.userId, dto);
  }

  @UseGuards(WorkspaceAdminGuard)
  @Delete(':projectId')
  async remove(
    @Req() req: { user: { userId: string } }, 
    @Param('projectId') projectId: string
  ) {
    return await this.projectService.remove(projectId, req.user.userId);
  }


  @UseGuards(ProjectMemberGuard)
  @Get(':projectId/members')
  async getMembers(
    @Req() req: { user: { userId: string } }, 
    @Param('projectId') projectId: string
  ) {
    return await this.projectService.getMembers(projectId, req.user.userId);
  }

  @UseGuards(ProjectManagerGuard)
  @Post(':projectId/members')
  async addMember(
    @Req() req: { user: { userId: string } }, 
    @Param('projectId') projectId: string, 
    @Body() dto: AddProjectMemberDto
  ) {
    return await this.projectService.addMember(projectId, req.user.userId, dto);
  }

  @UseGuards(ProjectManagerGuard)
  @Patch(':projectId/members/:targetUserId')
  async updateMemberRole(
    @Req() req: { user: { userId: string } },
    @Param('projectId') projectId: string,
    @Param('targetUserId') targetUserId: string,
    @Body() dto: UpdateProjectMemberRoleDto,
  ) {
    return await this.projectService.updateMemberRole(projectId, req.user.userId, targetUserId, dto);
  }

  @UseGuards(ProjectManagerGuard)
  @Delete(':projectId/members/:targetUserId')
  async removeMember(
    @Req() req: { user: { userId: string } },
    @Param('projectId') projectId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return await this.projectService.removeMember(projectId, req.user.userId, targetUserId);
  }
}