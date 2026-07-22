import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, AddProjectMemberDto, UpdateProjectMemberRoleDto } from './dto/project.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, workspaceId: string, dto: CreateProjectDto) {
    const Project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspaceId: workspaceId,
        createdById: userId,
        projectMemberShips: {
          create: {
            userId,
            role: 'MANAGER',
          },
        },
      },
      include: {
        projectMemberShips: true,
      },
    });
    return Project;
  }

  async findAllByWorkspace(workspaceId: string, userId: string) {
    return await this.prisma.project.findMany({
      where: {
        workspaceId,
        projectMemberShips: {
          some: { userId },
        },
      },
    });
  }

  async findOne(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        projectMemberShips: {
          some: { userId },
        },
      },
      include: {
        projectMemberShips: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!project)
        {
            throw new NotFoundException('Project not found or access denied.');
        }
        console.log('Project found:', project);
    return project;
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    await this.verifyProjectManager(projectId, userId);

    return await this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async remove(projectId: string, userId: string) {
    await this.verifyProjectManager(projectId, userId);

    return await this.prisma.project.delete({
      where: { id: projectId },
    });
  }


  async getMembers(projectId: string, userId: string) {
    await this.findOne(projectId, userId);

    return await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true, profileImage: true } },
      },
    });
  }

  async addMember(projectId: string, managerId: string, dto: AddProjectMemberDto) {
    await this.verifyProjectManager(projectId, managerId);

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if(!project) {
      throw new NotFoundException('Project not found.');
    }

    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: project.workspaceId, userId: dto.userId },
      },
    });

    if (!workspaceMember) {
      throw new ForbiddenException('User must be a member of the workspace to join the project.');
    }

    return await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role || 'VIEWER',
      },
    });
  }

  async updateMemberRole(projectId: string, managerId: string, targetUserId: string, dto: UpdateProjectMemberRoleDto) {
    await this.verifyProjectManager(projectId, managerId);

    if (managerId === targetUserId) {
      throw new ForbiddenException('You cannot change your own role.');
    }

    return await this.prisma.projectMember.update({
      where: {
        projectId_userId: { projectId, userId: targetUserId },
      },
      data: { role: dto.role },
    });
  }

  async removeMember(projectId: string, managerId: string, targetUserId: string) {
    await this.verifyProjectManager(projectId, managerId);

    if (managerId === targetUserId) {
      throw new ForbiddenException('You cannot remove yourself from the project.');
    }

    return await this.prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId: targetUserId },
      },
    });
  }


  async findAllForOwner(userId: string) {
    const projects = await this.prisma.project.findMany({
        where: {workspace: {ownerId: userId}},
        include: {
            projectMemberShips: {
                include: { user: { select: { id: true, name: true, email: true } } },
            },
        },
    });
    return projects;
  }
  private async verifyProjectManager(projectId: string, userId: string) {
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!membership || membership.role !== 'MANAGER') {
      throw new UnauthorizedException('Only project managers can perform this action.');
    }
    return membership;
  }
  
  async getMembership(projectId: string, userId: string) {
    return await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
  }
}