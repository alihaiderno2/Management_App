import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSprintDto, UpdateSprintDto } from './dto/sprint.dto';

@Injectable()
export class SprintService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, dto: CreateSprintDto) {
    return await this.prisma.sprint.create({
      data: {
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        projectId: projectId,
      },
    });
  }

  async findAllByProject(projectId: string) {
    return await this.prisma.sprint.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async findOne(projectId: string, sprintId: string) {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, projectId: projectId },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: { assignee: { select: { id: true, name: true, profileImage: true } } },
        },
      },
    });

    if (!sprint) throw new NotFoundException('Sprint not found in this project');
    return sprint;
  }

  async update(projectId: string, sprintId: string, dto: UpdateSprintDto) {
    const existingSprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, projectId: projectId },
    });
    if (!existingSprint) throw new NotFoundException('Sprint not found in this project');

    if (dto.status === 'ACTIVE' && existingSprint.status !== 'ACTIVE') {
      const activeSprint = await this.prisma.sprint.findFirst({
        where: { projectId, status: 'ACTIVE' },
      });
      
      if (activeSprint) {
        throw new BadRequestException('Another sprint is already active. Complete it before starting a new one.');
      }
    }

    const dataToUpdate: any = {};
    if (dto.name) dataToUpdate.name = dto.name;
    if (dto.startDate) dataToUpdate.startDate = new Date(dto.startDate);
    if (dto.endDate) dataToUpdate.endDate = new Date(dto.endDate);
    if (dto.status) dataToUpdate.status = dto.status;

    return await this.prisma.sprint.update({
      where: { id: sprintId },
      data: dataToUpdate,
    });
  }

  async remove(projectId: string, sprintId: string) {
    // Verify existence and ownership before deleting
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, projectId: projectId },
    });
    if (!sprint) throw new NotFoundException('Sprint not found in this project');

    return await this.prisma.$transaction(async (prisma) => {
      await prisma.task.updateMany({
        where: { sprintId },
        data: { sprintId: null },
      });

      return await prisma.sprint.delete({
        where: { id: sprintId },
      });
    });
  }
}