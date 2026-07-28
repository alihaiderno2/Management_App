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

  async findOne(projectId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
      include: {
        assignee: { select: { id: true, name: true, email: true, profileImage: true } },
        createdBy: { select: { id: true, name: true } },
        attachments: true,
      },
    });

    if (!task) throw new NotFoundException('Task not found in this project');
    return task;
  }

  async update(projectId: string, taskId: string, dto: UpdateTaskDto) {
    const existingTask = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
    });
    
    if (!existingTask) throw new NotFoundException('Task not found in this project');

    return await this.prisma.task.update({
      where: { id: taskId },
      data: dto, 
      include: {
        assignee: { select: { id: true, name: true, profileImage: true } },
      },
    });
  }

  async move(projectId: string, taskId: string, dto: MoveTaskDto) {
    const existingTask = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
    });
    
    if (!existingTask) throw new NotFoundException('Task not found in this project');

    return await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: dto.status,
        order: dto.order,
        sprintId: dto.sprintId !== undefined ? dto.sprintId : undefined,
      },
    });
  }

  async remove(projectId: string, taskId: string) {
    const existingTask = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
    });
    
    if (!existingTask) throw new NotFoundException('Task not found in this project');

    return await this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  async getMyActiveTasks(userId: string) {
        const tasks = await this.prisma.task.findMany({
            where: {
                assigneeId: userId,
                status: {
                    not: 'DONE'
                }
            },
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                project: {
                    select: { name: true }
                }
            }
        });

        return tasks;
    }
}