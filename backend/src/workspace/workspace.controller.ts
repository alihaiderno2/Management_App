import { Controller, Post, UseGuards,Req, Body,Get, Param, Delete} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';

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

    @UseGuards(JwtAuthGuard)
    @UseGuards(WorkspaceGuard)
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
}