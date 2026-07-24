import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, TaskFilterDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, createdByID: string, dto: CreateTaskDto) {
    const lastTask = await this.prisma.task.findFirst({
      where: { 
        projectId, 
        sprintId: dto.sprintId || null, 
        status: 'BACKLOG' 
      },
      orderBy: { order: 'desc' },
    });

    const newOrder = lastTask ? lastTask.order + 1 : 1;

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId,
        sprintId: dto.sprintId || null,
        createdByID,
        assigneeId: dto.assigneeId,
        order: newOrder,
      },
      include: {
        assignee: { select: { id: true, name: true, profileImage: true } },
      },
    });


    return task;
  }

  async findAll(projectId: string, filters: TaskFilterDto) {
    const whereClause: any = { projectId };

    if (filters.sprintId !== undefined) {
      whereClause.sprintId = filters.sprintId === 'null' ? null : filters.sprintId;
    }
    
    if (filters.assigneeId) whereClause.assigneeId = filters.assigneeId;
    if (filters.status) whereClause.status = filters.status;

    return await this.prisma.task.findMany({
      where: whereClause,
      orderBy: { order: 'asc' },
      include: {
        assignee: { select: { id: true, name: true, profileImage: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true, profileImage: true } },
        createdBy: { select: { id: true, name: true } },
        attachments: true,
      },
    });

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(taskId: string, dto: UpdateTaskDto) {
    if(dto.sprintId) {
      const task = await this.prisma.task.update({
        where: { id: taskId },
        data: { sprintId: dto.sprintId },
      });
      return task;
    }
    return await this.prisma.task.update({
      where: { id: taskId },
      data: dto,
      include: {
        assignee: { select: { id: true, name: true, profileImage: true } },
      },
    });
  }

  async move(taskId: string, dto: MoveTaskDto) {
    return await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: dto.status,
        order: dto.order,
        sprintId: dto.sprintId !== undefined ? dto.sprintId : undefined,
      },
    });
  }

  async remove(taskId: string) {
    return await this.prisma.task.delete({
      where: { id: taskId },
    });
  }
}