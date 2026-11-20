import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditStatus } from './entities/auditStatus.enum.js';

@Injectable()
export class AuditService {
    constructor(@InjectRepository(AuditLog)
        private auditRepo: Repository<AuditLog>){}
     async log(
        applicationId: number,
        userId: number,
        status: AuditStatus,
        description: string
    ) {
        const audit = this.auditRepo.create({
            application: { id: applicationId },
            user: { id: userId },
            log_status: status,
            description
        });

        return await this.auditRepo.save(audit);
    }    
}
