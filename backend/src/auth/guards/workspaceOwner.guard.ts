import { Injectable } from "@nestjs/common";
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { WorkspaceService } from "../../workspace/workspace.service";

@Injectable()
export class WorkspaceOwnerGuard implements CanActivate {

    constructor(private readonly workspaceService: WorkspaceService) {}
    async canActivate(context: ExecutionContext) : Promise<boolean> {
        const req = context.switchToHttp().getRequest();

        const userId = req.user.userId;
        const workspaceId = req.params.id;

        const workspace = await this.workspaceService.getWorkspaceOwnerForGuard(userId, workspaceId);
        console.log(`\n➡️ [WorkspaceOwnerGuard] Checking if user ${userId} is the owner of workspace ${workspaceId}`, workspace);

        if(!workspace){
            return false;
        }
        if(workspace instanceof Error){
            return false;
        }
        if(workspace.disabled){
            return false;
        }

        return true;
    }
}