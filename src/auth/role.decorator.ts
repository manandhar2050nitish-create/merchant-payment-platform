import { SetMetadata } from "@nestjs/common";

export enum AvailableRoles {
    SALES = 'SALES',
    REVIEWER = 'REVIEWER',
    ADMIN = 'ADMIN'
}

export const Roles = (...roles: AvailableRoles[]) =>
    SetMetadata('roles', roles);