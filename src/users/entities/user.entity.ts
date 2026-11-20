import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity.js";
import { Application } from "../../applications/entities/application.entity.js";
import { AuditLog } from "../../audit/entities/audit.entity.js";
import type { Relation } from "typeorm";

@Entity('users')
export class User{
    @PrimaryGeneratedColumn()
    id:number;

    @Column({ unique: true })
    username:string;

    @Column()
    password:string;

    @ManyToOne(() => Role, (role) => role.user,{ nullable: false })
    @JoinColumn({ name: 'role_id' })
    role:Relation<Role>;

    
    @OneToMany(() => Application, (application) => application.reviewer_id)
    reviewedApplications: Relation<Application[]>;

    @OneToMany(() => Application, (application) => application.created_by)
    createdApplications: Relation<Application[]>;


    @OneToMany(()=>AuditLog, (audit)=>audit.user)
    auditLogs: Relation<AuditLog[]>;
}