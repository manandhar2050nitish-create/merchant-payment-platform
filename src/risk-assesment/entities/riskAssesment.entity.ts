import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RiskStatus } from "./riskStatus.enum.js";
import { Application } from "../../applications/entities/application.entity.js";
import type { Relation } from "typeorm";

@Entity('risk_assessment')
export class RiskAssessment{
    @PrimaryGeneratedColumn()
    id:number;

    @Column({
        type: 'enum',
        enum: RiskStatus,
        default:RiskStatus.PENDING
    })
    status: RiskStatus;
    
    @Column()
    description:string;

    @OneToOne(() => Application, (application) => application.riskAssessment, {nullable: false})
    @JoinColumn({ name: 'application_id' })
    application_id: Relation<Application>;

    @Column({name:'retry_count', default: 0})
    retry_count:number;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updated_at:Date;
}