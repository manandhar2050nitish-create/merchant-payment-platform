import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskAssessment } from '../../risk-assesment/entities/riskAssesment.entity.js';
import { RiskStatus } from '../../risk-assesment/entities/riskStatus.enum.js';
import { Application } from '../entities/application.entity.js';
import { AuditService } from '../../audit/audit.service.js';
import { AuditStatus } from '../../audit/entities/auditStatus.enum.js';


@Processor('risk-assessment')
export class RiskAssessmentProcessor extends WorkerHost {

    constructor(
        @InjectRepository(RiskAssessment)
        private riskAssessmentRepo: Repository<RiskAssessment>,


        @InjectRepository(Application)
        private applicationRepo: Repository<Application>,
    ) {
        super();
    }

    async process(job: Job<{ applicationId: number }>): Promise<void> {

        const { applicationId } = job.data;

        const assessment = await this.riskAssessmentRepo
            .createQueryBuilder('risk')
            .leftJoinAndSelect('risk.application_id', 'application')
            .where('application.id = :applicationId', { applicationId })
            .getOne();

        if (!assessment) {
            throw new Error(`Risk assessment not found for application ${applicationId}`);
        }

        // Avoid processing an already completed assessment.
        if (assessment.status === RiskStatus.COMPLETED) {
            return;
        }

        assessment.status = RiskStatus.PROCESSING;
        assessment.retry_count += 1;
        await this.riskAssessmentRepo.save(assessment);

        //update the application risk status as well
        const updatedApp = await this.applicationRepo.update(
            applicationId,
            { risk_status: RiskStatus.PROCESSING }
        );

        // Simulate KYB verification.
        await new Promise(resolve => setTimeout(resolve, 2000));

        assessment.status = RiskStatus.COMPLETED;
        assessment.description = 'KYB verification completed successfully';


        await this.riskAssessmentRepo.save(assessment);


        await this.applicationRepo.update(
            applicationId,
            { risk_status: RiskStatus.COMPLETED }
        );
    }


    // Executes whenever a job attempt fails
    @OnWorkerEvent('failed')
    async onFailed(
        job: Job<{ applicationId: number }> | undefined,
        error: Error
    ): Promise<void> {
        // Mark both records FAILED after all attempts are exhausted
         if (!job) return;

        // Only mark FAILED after all attempts are exhausted
        const maxAttempts = job.opts.attempts ?? 1;

        if (job.attemptsMade < maxAttempts) {
            return;
        }

        const { applicationId } = job.data;

        const assessment = await this.riskAssessmentRepo
            .createQueryBuilder('risk')
            .leftJoin('risk.application_id', 'application')
            .where('application.id = :applicationId', { applicationId })
            .getOne();

        if (!assessment) return;

        assessment.status = RiskStatus.FAILED;
        assessment.description = 'KYB verification failed after maximum retry attempts';


        await this.riskAssessmentRepo.save(assessment);

        await this.applicationRepo.update(
            applicationId,
            { risk_status: RiskStatus.FAILED }
        );
    }
}