import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";
import { AvailableRoles, Roles } from "./role.decorator.js";

@Injectable()
export class RoleGuard implements CanActivate{
    private reflector:Reflector
    constructor(reflector: Reflector){
        this.reflector =reflector;
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        //check the method and class name for the roles guard
        const metadata = this.reflector.getAllAndOverride<AvailableRoles[]>('roles', [context.getHandler(), context.getClass()]);
        if(!metadata){
            return true;
        }

        const request = context.switchToHttp().getRequest();

        //if user is admin directly bypass
        if(request.user.role === AvailableRoles.ADMIN){
            return true;
        }

        //if the metadata contains the role then only allow in
        return metadata.includes(request.user.role);
    }

}