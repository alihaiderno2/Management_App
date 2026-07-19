import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundError } from 'rxjs';
import { Role } from '@prisma/client';
import {EmailService} from "../email/email.service";
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WorkspaceService {
    constructor(private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
        private readonly jwtService: JwtService
    ) {}
    
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
            where:{userId,
                disabled: false
            },
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
            throw new NotFoundException('Workspace not found');
        }
        return workspaceMembership.workspace;
    }

    // Owner getting the workspace
    async getWorkspaceOwnerForGuard(userId: string, workspaceId: string){
        const workspaceMembership = await this.prisma.workspaceMember.findFirst({
            where :{
                userId : userId,
                workspaceId : workspaceId
            }, include:{
                workspace: true,
            }
        });

        if(!workspaceMembership){
            return new NotFoundException('Workspace not found');
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

        const membersIds = workspace.members.map(member => member.userId );

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

    async removeMemberFromWorkspace(workspaceId: string, memberId: string){
        const workspaceMembership = await this.prisma.workspaceMember.update({
            where:{
                workspaceId_userId: {
                    workspaceId,
                    userId: memberId,
                }
            },
            data: {
                disabled: true,
            }
            });
        return workspaceMembership;
    }

    async inviteMemberToWorkspace(userId: string, workspaceId: string, email: string, role: Role){

        const token = await this.jwtService.signAsync(
        {userId , type : 'workspace_invite'
        });
        const result = await this.emailService.sendEmail({
            recipients: [email],
            subject: 'You are invited to join a workspace',
            text: `You have been invited to join the workspace with ID: ${workspaceId} as a ${role}. Please click the link below to accept the invitation.`,
            html: `<p>You have been invited to join the workspace with ID: ${workspaceId} as a ${role}. Please click the link below to accept the invitation.</p><a href="http://localhost:3000/workspace/${workspaceId}/invite/accept?email=${email}&role=${role}">Accept Invitation</a>`,
        })
        if(!result.success){
            return {message: 'Error sending invitation email', error: result.message};
        }
        const workspace = await this.prisma.workspace.update({
            where: { id: workspaceId },
            data:{
                invites:{
                    create:{
                        email,
                        role,
                        token,
                        invitedById: userId,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),// 7 days from now
                    }
                }
            }
        });

        return {message: 'Invitation sent successfully', emailResult: result, workspace};
    }

    async getWorkspaceInvites(workspaceId: string){
        const invites = await this.prisma.workspaceInvite.findMany({
            where: { workspaceId },
            select: {
                id: true,
                email: true,
                role: true,
                token: true,
                invitedById: true,
            }
        });
        if(!invites){
            throw new NotFoundException('No invites found for this workspace');
        }
        return invites;
    }

    async deleteWorkspaceInvite(workspaceId: string, inviteId: string){
        const invite = await this.prisma.workspaceInvite.findUnique({
            where: { id: inviteId },
        });
        if(!invite){
            throw new NotFoundException('Invite not found');
        }
        if(invite.acceptedAt){
            throw new UnauthorizedException('Invite has already been accepted');
        }
        const result = await this.prisma.workspaceInvite.delete({
            where: { id: inviteId },
        });
        return result;
    }

    async acceptWorkspaceInvite(email: string, workspaceId: string, token: string){
        const invite = await this.prisma.workspaceInvite.findFirst({
            where: { email, workspaceId, acceptedAt: null },
        });

        if(!invite){
            throw new NotFoundException('Invite not found or already accepted');
        }
        const decodedToken = await this.jwtService.verifyAsync(token);
        
        if(decodedToken.type !== 'workspace_invite'){
            throw new UnauthorizedException('Invalid token type');
        }

        if(decodedToken.userId !== invite.invitedById){
            throw new UnauthorizedException('Token does not match the invite');
        }

        const workspaceMembership = await this.prisma.workspaceMember.create({
            data: {
                userId: decodedToken.userId,
                workspaceId,
                role: invite.role,
            }
        });

        await this.prisma.workspaceInvite.update({
            where: { id: invite.id },
            data: { acceptedAt: new Date() },
        });

        return {message: 'Invite accepted successfully', workspaceMembership};
    }
}