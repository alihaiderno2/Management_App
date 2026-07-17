import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundError } from 'rxjs';
import { Role } from '@prisma/client';

@Injectable()
export class WorkspaceService {
    constructor(private readonly prisma: PrismaService) {}
    
    async createWorkspace(userId: string, name: string) {
        const workspace = await this.prisma.workspace.create({
            data :{
                name,
                ownerId: userId,
                members: {
                    create: {
                        userId,
                        role: 'OWNER',
                    }
                }
            },
            include: {
                members: true,
                projects: true,
            }
        });
        return workspace;
    }

    async getAllUserWorkspaces(userId: string) {
        const workspaces = await this.prisma.workspaceMember.findMany({
            where:{userId},
            include:{
                workspace: {
                    include: {
                        members: true,
                        projects: true,
                    }
                }
            }
        });
        return workspaces;
    }

    // Returning the data of the workspace
    async getWorkspace(userId: string, workspaceId: string){
        const workspaceMembership = await this.prisma.workspaceMember.findFirst({
            where :{
                userId : userId,
                workspaceId : workspaceId
            },
            include: {
                workspace: {
                }
            }
        });

        if(!workspaceMembership){
            return new Error('Workspace not found');
        }
        return workspaceMembership.workspace.ownerId === userId ? workspaceMembership.workspace : null;
    }

    async deleteWorkspace(userId: string, workspaceId: string){
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if(!workspace){
            throw new NotFoundException('Workspace not found');
        }
        if(workspace.ownerId !== userId){
            throw new UnauthorizedException('You are not the owner of this workspace');
        }

        await this.prisma.workspace.delete({
            where: { id: workspaceId },
        });
        return {message: 'Workspace deleted successfully'};
    }

    // Disabling the workspace for the user
    async disableWorkspaceForUser(userId: string, workspaceId: string){
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if(!workspace){
            throw new UnauthorizedException('Workspace not found');
        }

        if(workspace.ownerId !== userId){
            throw new UnauthorizedException('You are not the owner of this workspace');
        }
        await this.prisma.workspace.update({
            where: { id: workspaceId },
            data: { disabled: true },
        });

        return {message: 'Workspace disabled successfully'};
    }

    async getWorkspaceMembers(userId: string, workspaceId: string){
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true },
        });
        if(!workspace){
            throw new NotFoundException('Workspace not found');
        }

        const membersIds = workspace.members.map(member => member.userId);

        const users = await this.prisma.user.findMany({
            where: { id: { in: membersIds } },
        });
        return users.map(user => ({ id: user.id, name: user.name, email: user.email }));
    }

    async updateMemberRole(userId: string, workspaceId: string, memberId: string, role: Role){
        const workspaceMembership = await this.prisma.workspaceMember.update({
        where: {
            workspaceId_userId: {
            workspaceId,
            userId: memberId,
            },
        },
        data: {
            role,
        },
        });
        return workspaceMembership;
    }
}

