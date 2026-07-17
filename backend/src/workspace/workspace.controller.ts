import { Controller, Post, UseGuards,Req, Body,Get, Param, Delete, Patch} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { WorkspaceOwnerGuard } from '../auth/guards/workspaceOwner.guard';
import { UpdateMemberRoleDto } from './dto/UpdateMemberRole.dto';
import { InviteBodyDto } from './dto/inviteBody.dto';

@Controller('workspace')
export class WorkspaceController {
    constructor(private readonly workspaceService: WorkspaceService) {
    }

    @UseGuards(JwtAuthGuard)
    @Post('create')
    async createWorkspace(@Req() req: { user: { userId: string, email: string } }, @Body() body: { name: string }) {
        return await this.workspaceService.createWorkspace(req.user.userId, body.name);
    }

    @UseGuards(JwtAuthGuard)
    @Get('all')
    async getAllUserWorkspaces(@Req() req: { user: { userId: string, email: string } }) {
        return await this.workspaceService.getAllUserWorkspaces(req.user.userId);
    }

    @UseGuards(JwtAuthGuard,WorkspaceGuard)
    @Get(':id')
    async getWorkspace(@Req() req: { user: { userId: string, email: string } }, @Param('id') id: string) {
        return await this.workspaceService.getWorkspace(req.user.userId, id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteWorkspace(@Req() req: {user : {userId: string, email: string}}, @Param('id') id: string) {
        return await this.workspaceService.deleteWorkspace(req.user.userId, id);
    }

    @UseGuards(JwtAuthGuard, WorkspaceGuard)
    @Get(':id/members')
    async getWorkspaceMembers(@Req() req: {user : {userId: string, email: string}}, @Param('id') id: string) {
        const memebers = await this.workspaceService.getWorkspaceMembers(req.user.userId, id);
        if(memebers instanceof Error){
            return {success: false, message: memebers.message};
        }
        return {success: true, members: memebers};
    }

    @UseGuards(JwtAuthGuard, WorkspaceGuard)
    @Delete(':id/disable')
    async disableWorkspaceForUser(@Req() req: {user : {userId: string, email: string}}, @Param('id') id: string) {
        return await this.workspaceService.disableWorkspaceForUser(req.user.userId, id);
    }

    @UseGuards(JwtAuthGuard, WorkspaceOwnerGuard)
    @Patch(':id/members/:userId')
    async updateMemberRole(@Req() req: {user : {userId:string, email: string}}, @Param('id') workspaceId: string, @Param('userId') userId: string, @Body() body: UpdateMemberRoleDto) {
        return await this.workspaceService.updateMemberRole(req.user.userId, workspaceId, userId, body.role);
    }

    @UseGuards(JwtAuthGuard, WorkspaceOwnerGuard)
    @Delete(':id/members/:userId')
    async removeMemberFromWorkspace(@Req() req: {user : {userId:string, email: string}}, @Param('id') workspaceId: string, @Param('userId') userId: string) {
        return await this.workspaceService.removeMemberFromWorkspace( workspaceId, userId);
    }

    @UseGuards(JwtAuthGuard, WorkspaceOwnerGuard)
    @Post(':id/invite')
    async inviteMemberToWorkspace(@Req() req: {user : {userId:string, email: string}}, @Param('id') workspaceId: string, @Body() body: InviteBodyDto) {
        return await this.workspaceService.inviteMemberToWorkspace(req.user.userId, workspaceId, body.email, body.role);
    }

    @UseGuards(JwtAuthGuard, WorkspaceOwnerGuard)
    @Get(':id/invites')
    async getWorkspaceInvites(@Req() req: {user : {userId:string, email: string}}, @Param('id') workspaceId: string) {
        return await this.workspaceService.getWorkspaceInvites(workspaceId);
    }

    @UseGuards(JwtAuthGuard, WorkspaceOwnerGuard)
    @Delete(':id/invites/:inviteId')
    async deleteWorkspaceInvite(@Req() req: {user : {userId:string, email: string}}, @Param('id') workspaceId: string, @Param('inviteId') inviteId: string) {
        return await this.workspaceService.deleteWorkspaceInvite(workspaceId, inviteId);
    }
}