import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ApplicationDTO } from '../dto/ApplicationDTO.js';
import { DeepPartial, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Application } from './entities/application.entity.js';
import { ApplicationNotFound } from './applications.notFoundException.js';
import { AvailableRoles } from '../auth/role.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { ApplicationStatus } from './entities/applicationStatus.enum.js';
import { RiskAssessment } from '../risk-assesment/entities/riskAssesment.entity.js';
import { RiskStatus } from '../risk-assesment/entities/riskStatus.enum.js';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuditService } from '../audit/audit.service.js';
import { AuditStatus } from '../audit/entities/auditStatus.enum.js';

@Injectable()
export class ApplicationsService {
    constructor(
        @InjectRepository(Application) private applicationRepo: Repository<Application>,
        @InjectRepository(RiskAssessment) private riskAssessmentRepo: Repository<RiskAssessment>,
        private auditService: AuditService
    ){}

    @InjectQueue('risk-assessment')
    private riskQueue: Queue;
    
    async createApplication(applicationDTO: ApplicationDTO, userId: number): Promise<DeepPartial<Application>>{
        
        //map the dto to the application entity
        const application: DeepPartial<Application> = {
            business_name: applicationDTO.business_name,
            legal_business_name: applicationDTO.legal_business_name, 
            business_type: applicationDTO.business_type,
            contact_information:applicationDTO.contact_information,
            requested_processing_information: applicationDTO.requested_processing_information,
            created_by: { id: userId}
        };

        const savedApp = await this.applicationRepo.save(application);
        

        await this.auditService.log(
            savedApp.id,
            userId,
            AuditStatus.CREATED,
            'Application created'
        );

        return savedApp;
    }

    async getApplication(applicationId: number, userId:number, userRole:AvailableRoles): Promise<Application>{
        //force owner verification in db itself -- only assigned reviwer or sales owner can view it plus the admin
        let app = null;
        if(userRole === AvailableRoles.SALES){
            app = await this.applicationRepo.createQueryBuilder('applications')
                .where("applications.id = :applicationId and applications.created_by= :userId",
                     {applicationId, userId}).getOne();
        } else if(userRole === AvailableRoles.REVIEWER){
             app = await this.applicationRepo.createQueryBuilder('applications')
                .where("applications.id = :applicationId and applications.reviewer_id= :userId",
                     {applicationId, userId}).getOne();
        } else if(userRole  === AvailableRoles.ADMIN){
            app = await this.applicationRepo.createQueryBuilder('applications').where('applications.id = :applicationId', {applicationId}).getOne();
        }
        if(app === null){
            throw new ApplicationNotFound();
        }
        return app;
    }

    async assignReviewer(applicationId: number, reviewerId: number, adminId: number){
        //get the application
         const app = await this.applicationRepo.createQueryBuilder('applications')
                .where("applications.id = :applicationId",{applicationId}).getOne();
         if (!app) {
            throw new ApplicationNotFound();
        }
        
        app.reviewer_id = { id: reviewerId } as User;
        const savedApp = await this.applicationRepo.save(app);
        this.auditService.log(
            savedApp.id,
            adminId,
            AuditStatus.ASSIGNED,
            `Reviewer with ID ${reviewerId} assigned to application ${savedApp.id}`
        )

        return await this.applicationRepo.save(app);
    }

    async updateApplication(
        applicationId: number,
        userId: number,
        userRole: AvailableRoles,
        body: Partial<ApplicationDTO>) 
    {
        const query = this.applicationRepo.createQueryBuilder('applications')
            .where('applications.id = :applicationId', { applicationId });

        // SALES can only update their own applications
        if (userRole === AvailableRoles.SALES) {
            query.andWhere('applications.created_by = :userId', { userId });
        }

        // REVIEWER cannot edit applications
        else if (userRole !== AvailableRoles.ADMIN) {
            throw new ForbiddenException();
        }

        const app = await query.getOne();

        if (!app) {
            throw new ApplicationNotFound();
        }

        // Don't allow editing applications that have reached a final state
        if (
            String(app.status) === 'ACCEPTED' ||
            String(app.status) === 'REJECTED'
        ) {
            throw new BadRequestException('Application cannot be edited');
        }

        // Only update fields that the client is allowed to change
        if (body.business_name !== undefined)
            app.business_name = body.business_name;

        if (body.legal_business_name !== undefined)
            app.legal_business_name = body.legal_business_name;

        if (body.business_type !== undefined)
            app.business_type = body.business_type;

        if (body.contact_information !== undefined)
            app.contact_information = body.contact_information;

        if (body.requested_processing_information !== undefined)
            app.requested_processing_information = body.requested_processing_information;

        return await this.applicationRepo.save(app);
    }   


    async getApplications(
        userId: number,
        userRole: AvailableRoles,
        page = 1,
        limit = 10,
        status?: string
    ) {
        const query = this.applicationRepo.createQueryBuilder('applications')
         .leftJoinAndSelect('applications.created_by', 'created_by');;

        // Enforce object-level access in the database query
        if (userRole === AvailableRoles.SALES) {
            query.where('applications.created_by = :userId', { userId });
        }
        else if (userRole === AvailableRoles.REVIEWER) {
            query.where('applications.reviewer_id = :userId', { userId });
        }
        else if (userRole !== AvailableRoles.ADMIN) {
            throw new ForbiddenException();
        }

        if (status) {
            query.andWhere('applications.status = :status', { status });
        }

        const [applications, total] = await query
            .orderBy('applications.id', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data: applications,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async submitApplication(
        applicationId: number,
        userId: number,
        userRole: AvailableRoles
    ) {
        let app = null;

        if (userRole === AvailableRoles.ADMIN) {
            app = await this.applicationRepo.createQueryBuilder('applications')
                .where('applications.id = :applicationId', { applicationId })
                .getOne();
        } else {
            app = await this.applicationRepo.createQueryBuilder('applications')
                .where('applications.id = :applicationId', { applicationId })
                .andWhere('applications.created_by = :userId', { userId })
                .getOne();
        }

        if (!app) {
            throw new ApplicationNotFound();
        }

        if (
            app.status !== ApplicationStatus.NOT_REVIEWD &&
            app.status !== ApplicationStatus.INFO_REQUIRED
        ) {
            throw new BadRequestException(
                'Application cannot be submitted in its current state'
            );
        }

        // Find existing risk assessment
        let assessment = await this.riskAssessmentRepo.createQueryBuilder('risk_assessment')
            .leftJoin('risk_assessment.application_id', 'application')
            .where('application.id = :applicationId', { applicationId })
            .getOne();

        if (!assessment) {
            assessment = this.riskAssessmentRepo.create({
                status: RiskStatus.PENDING,
                description: 'Risk assessment queued',
                application_id: app,
                retry_count: 0
            });
        } else {
            assessment.status = RiskStatus.PENDING;
            assessment.description = 'Risk assessment queued';
        }

        await this.riskAssessmentRepo.save(assessment);

        // Update application statuses
        app.risk_status = RiskStatus.PENDING;
        app.status = ApplicationStatus.REVIEW_IN_PROGRESS;

        await this.applicationRepo.save(app);

        //update log before queueing the job
        await this.auditService.log(
            applicationId,
            userId, // Admin who performed the assignment
            AuditStatus.SUBMITTED,
            `application with id ${applicationId} submitted for KYC`
        );

        // Enqueue KYB job
        await this.riskQueue.add(
            'perform-kyb',
            { applicationId },
            {
                jobId: `risk-${applicationId}`,
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                },
                removeOnComplete: true
            }
        );

        return app;
    }


    async approveApplication(applicationId: number, reviewerId: number, userRole:AvailableRoles) {
        let app = null;
        if(userRole === AvailableRoles.ADMIN){
            app = await this.applicationRepo.createQueryBuilder('applications')
            .where('applications.id = :applicationId', { applicationId })
            .getOne();
        } else{
             app = await this.applicationRepo.createQueryBuilder('applications')
            .where('applications.id = :applicationId', { applicationId })
            .andWhere('applications.reviewer_id = :reviewerId', { reviewerId })
            .getOne();
        }
        if (!app) {
            throw new ApplicationNotFound();
        }

        if (app.status !== 'REVIEW_IN_PROGRESS') {
            throw new BadRequestException('Application is not awaiting review');
        }

        
        this.auditService.log(
            applicationId,
            reviewerId,
            AuditStatus.ACCEPTED,
            `Application with id ${applicationId} approved`
        )

        app.status = ApplicationStatus.ACCEPTED;

        return await this.applicationRepo.save(app);
    }


    async rejectApplication(applicationId: number, reviewerId: number, userRole: AvailableRoles) {
        let app = null;
        if(userRole === AvailableRoles.ADMIN){
            app = await this.applicationRepo.createQueryBuilder('applications')
            .where('applications.id = :applicationId', { applicationId })
            .getOne();
        } else{
            app = await this.applicationRepo.createQueryBuilder('applications')
            .where('applications.id = :applicationId', { applicationId })
            .andWhere('applications.reviewer_id = :reviewerId', { reviewerId })
            .getOne();
        }    
        if (!app) {
            throw new ApplicationNotFound();
        }

        if (app.status !== 'REVIEW_IN_PROGRESS') {
            throw new BadRequestException('Application is not awaiting review');
        }

        app.status = ApplicationStatus.REJECTED;

          
        this.auditService.log(
            applicationId,
            reviewerId,
            AuditStatus.REJECTED,
            `Application with id ${applicationId} rejected`
        )

        return await this.applicationRepo.save(app);
    }


    async requestInformation(applicationId: number, reviewerId: number, userRole:AvailableRoles) {
        let app = null;
        if(userRole === AvailableRoles.ADMIN){
             app = await this.applicationRepo.createQueryBuilder('applications')
            .where('applications.id = :applicationId', { applicationId })
            .getOne();
        } else{
            app = await this.applicationRepo.createQueryBuilder('applications')
            .where('applications.id = :applicationId', { applicationId })
            .andWhere('applications.reviewer_id = :reviewerId', { reviewerId })
            .getOne();
        }   
        if (!app) {
            throw new ApplicationNotFound();
        }

        if (app.status !== 'REVIEW_IN_PROGRESS') {
            throw new BadRequestException('Application is not awaiting review');
        }

         //update log before queueing the job
        await this.auditService.log(
            applicationId,
            reviewerId, // Admin who performed the assignment
            AuditStatus.REQUESTED_INFO,
            `reviewr requested more info for application with id ${applicationId}`
        );



        app.status = ApplicationStatus.INFO_REQUIRED;

        return await this.applicationRepo.save(app);
    }
}
