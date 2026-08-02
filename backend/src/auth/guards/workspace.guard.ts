import { Injectable } from "@nestjs/common";
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { WorkspaceService } from "../../workspace/workspace.service";

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {

    constructor(private readonly workspaceService: WorkspaceService) {}
    async canActivate(context: ExecutionContext) : Promise<boolean> {
        const req = context.switchToHttp().getRequest();

        const userId = req.user.userId;
        const workspaceId = req.params.id;

        const membership = await this.workspaceService.getMembership(userId, workspaceId);

        if(!membership){
            return false;
        }
        if(membership.disabled){
            return false;
        }
        return true;
    }
}