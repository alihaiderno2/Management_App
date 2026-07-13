import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspaceService {
    constructor(private readonly prisma: PrismaService) {}
    
    async createWorkspace(userId: string, name: string) {
        const workspace = await this.prisma.workspace.create({
            data :{
                name,
                ownerId: userId,
            }
        });
        return workspace;
    }

    async getAllUserWorkspaces(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { workspaceMemberships: true },
        })
        return user?.workspaceMemberships.map(membership => membership.id) || [];
    }

    // Returning the data of the workspace
    async getWorkspace(userId: string, workspaceId: string){
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true, projects: true },
        });

        if(!workspace){
            return new Error('Workspace not found');
        }

        return workspace;
    }

    async deleteWorkspace(userId: string, workspaceId: string){
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if(!workspace){
            return new Error('Workspace not found');
        }
        if(workspace.ownerId !== userId){
            return new Error('You are not the owner of this workspace');
        }

        await this.prisma.workspace.delete({
            where: { id: workspaceId },
        });
    }

    // Disabling the workspace for the user
    async disableWorkspaceForUser(userId: string, workspaceId: string){
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if(!workspace){
            return new Error('Workspace not found');
        }

        if(workspace.ownerId !== userId){
            return new Error('You are not the owner of this workspace');
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
            return new Error('Workspace not found');
        }

        const membersIds = workspace.members.map(member => member.id);

        const users = await this.prisma.user.findMany({
            where: { id: { in: membersIds } },
        });
        return users.map(user => ({ id: user.id, name: user.name, email: user.email }));
    }
}

