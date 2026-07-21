import { Injectable, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
            where:{userId
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
        return workspaces.map(wm => wm.workspace);
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
    
    async getMembership(userId: string, workspaceId: string){
        const workspaceMembership = await this.prisma.workspaceMember.findFirst({
            where :{
                userId : userId,
                workspaceId : workspaceId
            }
        });
        if(!workspaceMembership){
            throw new NotFoundException('Workspace membership not found');
        }
        return workspaceMembership;
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
            throw new NotFoundException('Workspace not found');
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
        return users.map(user => ({ id: user.id, name: user.name, email: user.email, role : workspace.members.find(member => member.userId === user.id)?.role }));
    }

    async updateMemberRole(userId: string, workspaceId: string, memberId: string, role: Role){

        if(userId === memberId){
            throw new UnauthorizedException('You cannot change your own role');
        }

        if(role === 'OWNER'){
            throw new UnauthorizedException('You cannot assign the OWNER role to another member');
        }

        const userRole = await this.prisma.workspaceMember.findFirst({
            where: {
                userId,
                workspaceId,
            }
        });

        if(userRole?.role !== 'OWNER' && role === 'ADMIN'){
            throw new UnauthorizedException('Invalid role');
        }

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
        if(!workspaceMembership){
            throw new NotFoundException('Workspace membership not found');
        }


        return workspaceMembership;
    }

    async removeMemberFromWorkspace(userId : string, workspaceId: string, memberId: string){

        if(userId === memberId){
            throw new UnauthorizedException('You cannot remove yourself from the workspace');
        }

        const userRole = await this.prisma.workspaceMember.findFirst({
            where: {
                userId,
                workspaceId,
            }
        });
        const memberRole = await this.prisma.workspaceMember.findFirst({
            where: {
                userId: memberId,
                workspaceId,
            }
        });

        if(userRole?.role === 'ADMIN' && memberRole?.role === 'OWNER'){
            throw new UnauthorizedException('You cannot remove the owner of the workspace');
        }
        if(memberRole?.role === 'ADMIN' && userRole?.role !== 'ADMIN'){
            throw new UnauthorizedException('You cannot remove an admin from the workspace');
        }
        const workspaceMembership = await this.prisma.workspaceMember.update({
            where:{
                workspaceId_userId: {
                    workspaceId,
                    userId: memberId,
                }
            },
            data: {
                disabled: true,
                diabledBy: memberId,
            }
            });
        return workspaceMembership;
    }

    async inviteMemberToWorkspace(userId: string, workspaceId: string, email: string, role: Role) {
        const sender = await this.prisma.workspaceMember.findFirst({
             where: { userId, workspaceId
             }
            });
        if (role === 'ADMIN' && sender?.role !== 'OWNER') {
            throw new UnauthorizedException('Only the workspace owner can invite someone as an admin');
        }

        const alreadyInvited = await this.prisma.workspaceInvite.findFirst({
            where:{
                workspaceId,
                email,
            }
        });
        if(!!alreadyInvited){
            throw new UnprocessableEntityException('Invite to this user has already been sent.');
        }
 
        const token = await this.jwtService.signAsync({ userId, type: 'workspace_invite' });
 
        const result = await this.emailService.sendEmail({
            recipients: [email],
            subject: 'You are invited to join a workspace',
            text: `You have been invited to join the workspace as a ${role}.`,
            html: `<p>You have been invited to join a workspace as a ${role}.</p><a href="http://localhost:3000/invite-accept?workspaceId=${workspaceId}&token=${token}">Accept Invitation</a>`,
        });
        console.log(`"http://localhost:3000/invite-accept?workspaceId=${workspaceId}&token=${token}`);
        // if (!result.success) {
        //     throw new UnprocessableEntityException('Failed to send email');        
        // }
 
        const workspace = await this.prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                invites: {
                    create: {
                        email,
                        role,
                        token,
                        invitedById: userId,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    }
                }
            }
        });
 
        return { message: 'Invitation sent successfully', workspace };
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

    async acceptWorkspaceInvite(invitedUserId: string, email: string, workspaceId: string, token: string) {
        const invite = await this.prisma.workspaceInvite.findFirst({
            where: { token, acceptedAt: null },
        });
        
        if (!invite) throw new NotFoundException('Invite not found or already accepted');

        if (invite.email !== email) {
            throw new UnauthorizedException('You must accept this invite using the email address it was sent to.');
        }

        const decodedToken = await this.jwtService.verifyAsync(token);
        if (decodedToken.type !== 'workspace_invite') {
            throw new UnauthorizedException('Invalid token type');
        }
        
        const existingMember = await this.prisma.workspaceMember.findFirst({
            where: { userId: invitedUserId, workspaceId }
        });
        
        if (existingMember) {
            throw new UnprocessableEntityException('You are already a member of this workspace.');
        }

        const workspaceMembership = await this.prisma.workspaceMember.create({
            data: { userId: invitedUserId, workspaceId, role: invite.role }
        });

        await this.prisma.workspaceInvite.update({
            where: { id: invite.id },
            data: { acceptedAt: new Date() },
        });

        return { message: 'Invite accepted successfully', workspaceMembership };
    }

    async getInviteDetailsByToken(token: string) {
        let decoded: { userId: string; type: string };
        try {
            decoded = await this.jwtService.verifyAsync(token);
        } catch {
            throw new UnauthorizedException('This invite link is invalid or has expired');
        }
        if (decoded.type !== 'workspace_invite') {
            throw new UnauthorizedException('This invite link is invalid');
        }
 
        const invite = await this.prisma.workspaceInvite.findFirst({
            where: { token, acceptedAt: null },
            include: { workspace: { select: { name: true, id: true } } },
        });
        if (!invite) {
            throw new NotFoundException('This invite was not found or has already been used');
        }
        if (invite.expiresAt < new Date()) {
            throw new UnauthorizedException('This invite has expired');
        }
 
        return {
            email: invite.email,
            role: invite.role,
            workspaceId: invite.workspace.id,
            workspaceName: invite.workspace.name,
        };
    }

    async pendingInvites(email :string){
        const invites = await this.prisma.workspaceInvite.findMany({
            where: { email, acceptedAt: null },
            include: { workspace: { select: { name: true, id: true } } },
        });
        return invites.map(invite => ({
            email: invite.email,
            role: invite.role,
            workspaceId: invite.workspace.id,
            workspaceName: invite.workspace.name,
            token: invite.token,
        }));
    }
}