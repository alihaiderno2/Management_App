import { Injectable, NotFoundException } from '@nestjs/common';
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
      include: {
        _count: {
          select: { tasks: true }, 
        },
      },
    });
  }

  async findOne(sprintId: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            assignee: { select: { id: true, name: true, profileImage: true } },
          },
        },
      },
    });

    if (!sprint) throw new NotFoundException('Sprint not found');
    return sprint;
  }

  async update(sprintId: string, dto: UpdateSprintDto) {
    const dataToUpdate: any = {};
    if (dto.name) dataToUpdate.name = dto.name;
    if (dto.startDate) dataToUpdate.startDate = new Date(dto.startDate);
    if (dto.endDate) dataToUpdate.endDate = new Date(dto.endDate);

    return await this.prisma.sprint.update({
      where: { id: sprintId },
      data: dataToUpdate,
    });
  }

  async remove(sprintId: string) {
    // Run in a transaction to ensure tasks are safely moved to the backlog before the sprint is deleted
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Detach all tasks from this sprint (moves them to the backlog/null sprint)
      await prisma.task.updateMany({
        where: { sprintId },
        data: { sprintId: null },
      });

      // 2. Delete the actual sprint
      return await prisma.sprint.delete({
        where: { id: sprintId },
      });
    });
  }
}