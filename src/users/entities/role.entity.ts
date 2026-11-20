import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Permission } from "./permission.entity.js";
import { User } from "./user.entity.js";
import type { Relation } from "typeorm";

@Entity('roles')
export class Role{
    @PrimaryGeneratedColumn()
    id:number;

    @Column()
    role:string;

    @OneToMany(() => Permission, (permission) => permission.role)
    permission: Relation<Permission[]>;

    @OneToMany(() => User, (user)=>user.role)
    user: Relation<User[]>;
}