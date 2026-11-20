import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Role } from "./role.entity.js";
import type { Relation } from "typeorm";

@Unique(['role', 'permission'])
@Entity('permissions')
export class Permission{
    @PrimaryGeneratedColumn()
    id:number;

    @ManyToOne(() => Role, (role) => role.permission, {nullable: false})
    @JoinColumn({name:'role_id'})
    role: Relation<Role>;

    @Column()
    permission: string;
}