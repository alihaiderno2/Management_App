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
}
