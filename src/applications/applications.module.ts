import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../users/entities/permission.entity.js';
import { Role } from '../users/entities/role.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Application } from './entities/application.entity.js';
import { RiskAssessment } from '../risk-assesment/entities/riskAssesment.entity.js';
import { AuditLog } from '../audit/entities/audit.entity.js';
import { ApplicationsService } from './applications.service.js';
import { ApplicationsController } from './applications.controller.js';
import { RiskAssessmentProcessor } from './processor/risk-assessment.processor.js';
import { BullModule } from '@nestjs/bullmq';
import { AuditModule } from '../audit/audit.module.js';

@Module({
    imports:[
        TypeOrmModule.forFeature([User, Role, Permission, Application,RiskAssessment,AuditLog]),
        BullModule.registerQueue({
            name: 'risk-assessment'
        }), AuditModule
    ],   
   
    controllers:[ApplicationsController],
    providers:[ApplicationsService, RiskAssessmentProcessor]
})
export class ApplicationsModule {
}
