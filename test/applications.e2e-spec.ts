
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity.js';

describe('Application (e2e)', () => {
    let salesToken: string;
    let reviewerToken: string;
    let adminToken: string;
    let sales2Token: string;
    let reviewer2Token: string;

    let salesUserId: number;
    let reviewerUserId: number;

    let app: INestApplication<App>;

    const applicationData = {
        business_name: 'Test Coffee Shop',
        legal_business_name: 'Test Coffee Shop Pvt Ltd',
        business_type: 'RETAIL',
        contact_information: 'test@example.com',
        requested_processing_information: 'Card payment processing',
    };

    async function createApplication(token: string): Promise<number> {
        const response = await request(app.getHttpServer())
            .post('/applications')
            .set('Authorization', `Bearer ${token}`)
            .send(applicationData)
            .expect(201);

        return response.body.id;
    }

    async function assignReviewer(applicationId: number) {
        await request(app.getHttpServer())
            .patch(`/applications/reviewer/${applicationId}/${reviewerUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
    }

    async function submitApplication(applicationId: number) {
        await request(app.getHttpServer())
            .post(`/applications/${applicationId}/submit`)
            .set('Authorization', `Bearer ${salesToken}`)
            .expect(201);
    }

    beforeAll(async () => {
        const moduleFixture: TestingModule =
            await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const login = async (username: string) => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username,
                    password: username,
                })
                .expect(200);

            return response.text;
        };

        salesToken = await login('test_sales_1');
        reviewerToken = await login('test_reviewer');
        adminToken = await login('test_admin');
        sales2Token = await login('test_sales_2');
        reviewer2Token = await login('test_reviewer_1');

        const userRepo = moduleFixture.get<Repository<User>>(
            getRepositoryToken(User),
        );

        salesUserId = (
            await userRepo.findOneByOrFail({
                username: 'test_sales_1',
            })
        ).id;

        reviewerUserId = (
            await userRepo.findOneByOrFail({
                username: 'test_reviewer',
            })
        ).id;
    });

    // CREATE APPLICATION

    it('should allow SALES to create an application', async () => {
        const response = await request(app.getHttpServer())
            .post('/applications')
            .set('Authorization', `Bearer ${salesToken}`)
            .send(applicationData)
            .expect(201);

        expect(response.body.business_name)
            .toBe(applicationData.business_name);
    });

    it('should not allow unauthenticated users to create an application', async () => {
        await request(app.getHttpServer())
            .post('/applications')
            .send(applicationData)
            .expect(401);
    });

    it('should not allow REVIEWER to create an application', async () => {
        await request(app.getHttpServer())
            .post('/applications')
            .set('Authorization', `Bearer ${reviewerToken}`)
            .send(applicationData)
            .expect(403);
    });

    it('should allow ADMIN to create an application', async () => {
        const response = await request(app.getHttpServer())
            .post('/applications')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(applicationData)
            .expect(201);

        expect(response.body.business_name)
            .toBe(applicationData.business_name);
    });

    // RETRIEVE APPLICATION

    it('should allow SALES owner to view an application', async () => {
        const id = await createApplication(salesToken);

        const response = await request(app.getHttpServer())
            .get(`/applications/${id}`)
            .set('Authorization', `Bearer ${salesToken}`)
            .expect(200);

        expect(response.body.id).toBe(id);
    });

    it('should not allow another SALES user to view an application', async () => {
        const id = await createApplication(salesToken);

        await request(app.getHttpServer())
            .get(`/applications/${id}`)
            .set('Authorization', `Bearer ${sales2Token}`)
            .expect(404);
    });

    it('should allow assigned REVIEWER to view an application', async () => {
        const id = await createApplication(salesToken);

        await assignReviewer(id);

        await request(app.getHttpServer())
            .get(`/applications/${id}`)
            .set('Authorization', `Bearer ${reviewerToken}`)
            .expect(200);
    });

    it('should not allow unassigned REVIEWER to view an application', async () => {
        const id = await createApplication(salesToken);

        await assignReviewer(id);

        await request(app.getHttpServer())
            .get(`/applications/${id}`)
            .set('Authorization', `Bearer ${reviewer2Token}`)
            .expect(404);
    });

    it('should allow ADMIN to view an application', async () => {
        const id = await createApplication(salesToken);

        await request(app.getHttpServer())
            .get(`/applications/${id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
    });

    it('should not allow unauthenticated users to retrieve an application', async () => {
        const id = await createApplication(salesToken);

        await request(app.getHttpServer())
            .get(`/applications/${id}`)
            .expect(401);
    });

    // UPDATE APPLICATION

    it('should allow SALES to update their own application', async () => {
        const id = await createApplication(salesToken);

        const response = await request(app.getHttpServer())
            .patch(`/applications/${id}`)
            .set('Authorization', `Bearer ${salesToken}`)
            .send({
                business_name: 'Updated Coffee Shop',
            })
            .expect(200);

        expect(response.body.business_name)
            .toBe('Updated Coffee Shop');
    });

    it('should not allow SALES to update another user application', async () => {
        const id = await createApplication(salesToken);

        await request(app.getHttpServer())
            .patch(`/applications/${id}`)
            .set('Authorization', `Bearer ${sales2Token}`)
            .send({
                business_name: 'Unauthorized Update',
            })
            .expect(404);
    });

    it('should not allow REVIEWER to update an application', async () => {
        const id = await createApplication(salesToken);

        await request(app.getHttpServer())
            .patch(`/applications/${id}`)
            .set('Authorization', `Bearer ${reviewerToken}`)
            .send({
                business_name: 'Unauthorized Update',
            })
            .expect(403);
    });

    // LIST APPLICATIONS

    it('should allow SALES to list their own applications', async () => {
        await createApplication(salesToken);

        const response = await request(app.getHttpServer())
            .get('/applications')
            .set('Authorization', `Bearer ${salesToken}`)
            .expect(200);

        expect(response.body.data).toBeDefined();
        expect(response.body.data.length).toBeGreaterThan(0);

        expect(
            response.body.data.every(
                (application: any) =>
                    application.created_by.id === salesUserId,
            ),
        ).toBe(true);
    });

    it('should allow ADMIN to list all applications', async () => {
        const response = await request(app.getHttpServer())
            .get('/applications')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.data).toBeDefined();
        expect(response.body.pagination).toBeDefined();
    });

    // ASSIGN REVIEWER

    it('should not allow SALES to assign a reviewer', async () => {
        const id = await createApplication(salesToken);

        await request(app.getHttpServer())
            .patch(`/applications/reviewer/${id}/${reviewerUserId}`)
            .set('Authorization', `Bearer ${salesToken}`)
            .expect(403);
    });

    // SUBMIT APPLICATION

    it('should allow SALES to submit an application', async () => {
        const id = await createApplication(salesToken);

        const response = await request(app.getHttpServer())
            .post(`/applications/${id}/submit`)
            .set('Authorization', `Bearer ${salesToken}`)
            .expect(201);

        expect(response.body.status).toBe('REVIEW_IN_PROGRESS');
        expect(response.body.risk_status).toBe('PENDING');
    });

    // REQUEST INFORMATION AND RESUBMIT

    it('should allow REVIEWER to request additional information', async () => {
        const id = await createApplication(salesToken);

        await assignReviewer(id);
        await submitApplication(id);

        const response = await request(app.getHttpServer())
            .patch(`/applications/${id}/request-info`)
            .set('Authorization', `Bearer ${reviewerToken}`)
            .expect(200);

        expect(response.body.status).toBe('INFO_REQUIRED');
    });

    it('should allow SALES to resubmit an application after providing information', async () => {
        const id = await createApplication(salesToken);

        await assignReviewer(id);
        await submitApplication(id);

        await request(app.getHttpServer())
            .patch(`/applications/${id}/request-info`)
            .set('Authorization', `Bearer ${reviewerToken}`)
            .expect(200);

        await request(app.getHttpServer())
            .patch(`/applications/${id}`)
            .set('Authorization', `Bearer ${salesToken}`)
            .send({
                requested_processing_information:
                    'Updated processing information',
            })
            .expect(200);

        const response = await request(app.getHttpServer())
            .post(`/applications/${id}/submit`)
            .set('Authorization', `Bearer ${salesToken}`)
            .expect(201);

        expect(response.body.status).toBe('REVIEW_IN_PROGRESS');
    });

    // APPROVE AND REJECT

    it('should allow REVIEWER to approve an application', async () => {
        const id = await createApplication(salesToken);

        await assignReviewer(id);
        await submitApplication(id);

        const response = await request(app.getHttpServer())
            .patch(`/applications/${id}/approve`)
            .set('Authorization', `Bearer ${reviewerToken}`)
            .expect(200);

        expect(response.body.status).toBe('ACCEPTED');
    });

    it('should allow REVIEWER to reject an application', async () => {
        const id = await createApplication(salesToken);

        await assignReviewer(id);
        await submitApplication(id);

        const response = await request(app.getHttpServer())
            .patch(`/applications/${id}/reject`)
            .set('Authorization', `Bearer ${reviewerToken}`)
            .expect(200);

        expect(response.body.status).toBe('REJECTED');
    });

    it('should not allow editing an accepted application', async () => {
        const id = await createApplication(salesToken);

        await assignReviewer(id);
        await submitApplication(id);

        await request(app.getHttpServer())
            .patch(`/applications/${id}/approve`)
            .set('Authorization', `Bearer ${reviewerToken}`)
            .expect(200);

        await request(app.getHttpServer())
            .patch(`/applications/${id}`)
            .set('Authorization', `Bearer ${salesToken}`)
            .send({
                business_name: 'Changed After Acceptance',
            })
            .expect(400);
    });

    afterAll(async () => {
        await app.close();
    });
});
