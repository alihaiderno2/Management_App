import { Controller, Post, UseGuards,Req, Body } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';

@Controller('workspace')
export class WorkspaceController {
    constructor(private readonly workspaceService: WorkspaceService) {
    }

    @UseGuards(JwtAuthGuard)
    @Post('create')
    async createWorkspace(@Req() req: { user: { userId: string, email: string } }, @Body() body: { name: string }) {
        return await this.workspaceService.createWorkspace(req.user.userId, body.name);
    }
}
