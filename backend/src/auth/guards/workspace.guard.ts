import { Injectable } from "@nestjs/common";
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { WorkspaceService } from "../../workspace/workspace.service";

@Injectable()
export class WorkspaceGuard implements CanActivate {

    constructor(private readonly workspaceService: WorkspaceService) {}
    async canActivate(context: ExecutionContext) : Promise<boolean> {
        const req = context.switchToHttp().getRequest();

        const userId = req.user.userId;
        const workspaceId = req.params.id;

        const workspace = await this.workspaceService.getWorkspace(userId, workspaceId);

        if(!workspace){
            return false;
        }
        if(workspace instanceof Error){
            return false;
        }
        if(workspace.disabled){
            return false;
        }

        if(workspace.ownerId !== userId && !workspace.members.some(member => member.id === userId)){
            return false;
        }

        return true;
    }
}