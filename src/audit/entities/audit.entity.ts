import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AuditStatus } from "./auditStatus.enum.js";
import { Application } from "../../applications/entities/application.entity.js";
import { User } from "../../users/entities/user.entity.js";
import type { Relation } from "typeorm";

@Entity('audit_log')
export class AuditLog{
    @PrimaryGeneratedColumn()
    id:number;

    @Column()
    description:string;

    @Column({
        type: 'enum',
        enum: AuditStatus,
    })
    log_status:AuditStatus;

    @CreateDateColumn({type: 'timestamp'})
    added_at:Date;

    @ManyToOne(()=>Application, (app) => app.auditLogs, {nullable:false})
    @JoinColumn({ name: 'application_id' })
    application: Relation<Application>;


    @ManyToOne(()=>User, (user) => user.auditLogs, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: Relation<User>;
}