import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApplicationStatus } from "./applicationStatus.enum.js";
import { RiskStatus } from "../../risk-assesment/entities/riskStatus.enum.js";
import { User } from "../../users/entities/user.entity.js";
import { RiskAssessment } from "../../risk-assesment/entities/riskAssesment.entity.js";
import { AuditLog } from "../../audit/entities/audit.entity.js";
import type { Relation } from "typeorm";

@Entity('applications')
export class Application{
    @PrimaryGeneratedColumn()
    id:number;

    @Column()
    business_name: string;

    @Column()
    legal_business_name: string;

    @Column()
    business_type:string;

    @Column()
    contact_information:string;

    @Column()
    requested_processing_information:string;

    @Column({
        type: 'enum',
        enum: ApplicationStatus,
        default: ApplicationStatus.NOT_REVIEWD
    })
    status: ApplicationStatus;

    @Column({
        type: 'enum',
        enum: RiskStatus,
        default: RiskStatus.PENDING
    })
    risk_status: RiskStatus;

    @CreateDateColumn({ type: 'timestamp' })
    created_date:Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_date:Date;

    @ManyToOne(() => User, (user) => user.reviewedApplications,{
        nullable:true
    })
    @JoinColumn({name:'reviewer_id'})
    reviewer_id: Relation<User|null>;


    @ManyToOne(() => User, (user) => user.createdApplications, {nullable:false})
    @JoinColumn({name:'created_by'})
    created_by: Relation<User>;


    @OneToOne(()=>RiskAssessment, (risk)=>risk.application_id)
    riskAssessment: Relation<RiskAssessment>;

    @OneToMany(()=>AuditLog, (audit)=>audit.application)
    auditLogs:Relation<AuditLog[]>;


}