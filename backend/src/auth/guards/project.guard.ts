import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { ProjectService } from "../../project/project.service";

@Injectable()
export class ProjectMemberGuard implements CanActivate {
    constructor(private readonly projectService: ProjectService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const userId = req.user.userId;

        const projectId = req.params.projectId; 

        if (!projectId) return false;

        const membership = await this.projectService.getMembership(projectId, userId);
        return !!membership;
    }
}

@Injectable()
export class ProjectManagerGuard implements CanActivate {
    constructor(private readonly projectService: ProjectService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const userId = req.user.userId;
        const projectId = req.params.projectId; 

        if (!projectId) return false;

        const membership = await this.projectService.getMembership(projectId, userId);
        if (!membership) return false;

        return membership.role === 'MANAGER';
    }
}