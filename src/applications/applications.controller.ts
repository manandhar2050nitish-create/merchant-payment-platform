import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RoleGuard } from '../auth/roles.guard.js';
import { AvailableRoles, Roles } from '../auth/role.decorator.js';
import { ApplicationsService } from './applications.service.js';
import { ApplicationDTO } from '../dto/ApplicationDTO.js';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

export interface AuthenticatedRequest extends Request {
    user: {
        sub: number;
        username: string;
        role: AvailableRoles;
    };
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('applications')
export class ApplicationsController {
    constructor(private appService: ApplicationsService){
    }


    @ApiOperation({ summary: 'Create a merchant application' })
    @ApiBody({ type: ApplicationDTO })
    @ApiResponse({ status: 201, description: 'Application created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid application data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @Roles(AvailableRoles.SALES)
    @Post()
    createApplication(@Body() body: ApplicationDTO, @Req() request: AuthenticatedRequest){
        const userId = request.user.sub;
        return this.appService.createApplication(body, userId);
    }

    
    @ApiOperation({ summary: 'Retrieve an application by ID' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Application retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    @Roles(AvailableRoles.SALES, AvailableRoles.REVIEWER)
    @Get('/:id')
    getApplication(@Param('id', ParseIntPipe) applicationId: number, @Req() request: AuthenticatedRequest){
        const userId = request.user.sub;
        const userRole = request.user.role;
        return this.appService.getApplication(applicationId, userId,userRole);
    }


    @ApiOperation({ summary: 'Assign a reviewer to an application' })
    @ApiParam({ name: 'applicationId', type: Number })
    @ApiParam({ name: 'reviewerId', type: Number })
    @ApiResponse({ status: 200, description: 'Reviewer assigned successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Admin access required' })
    @ApiResponse({ status: 404, description: 'Application or reviewer not found' })
    @Roles(AvailableRoles.ADMIN)
    @Patch('/reviewer/:applicationId/:reviewerId')
    assignReviewer(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Param('reviewerId', ParseIntPipe) reviewerId: number,
    @Req() request: AuthenticatedRequest
    ) {
        const user = request.user.sub;
        return this.appService.assignReviewer(applicationId, reviewerId, user);
    }

    @ApiOperation({ summary: 'Update an existing application' })
    @ApiParam({ name: 'id', type: Number })
    @ApiBody({ type: ApplicationDTO })
    @ApiResponse({ status: 200, description: 'Application updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid update or application cannot be edited' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    @Roles(AvailableRoles.SALES, AvailableRoles.ADMIN)
    @Patch(':id')
    updateApplication(
        @Param('id', ParseIntPipe) applicationId: number,
        @Body() body: Partial<ApplicationDTO>,
        @Req() request: AuthenticatedRequest
    ) {
        return this.appService.updateApplication(
            applicationId,
            request.user.sub,
            request.user.role as AvailableRoles,
            body
        );
    }


    @ApiOperation({ summary: 'List applications with pagination and status filtering' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @Roles(AvailableRoles.SALES, AvailableRoles.REVIEWER, AvailableRoles.ADMIN)
    @Get()
    getApplications(
        @Req() request: AuthenticatedRequest,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string
    ) {
        return this.appService.getApplications(
            request.user.sub,
            request.user.role as AvailableRoles,
            Math.max(1, Number(page) || 1),
            Math.min(100, Math.max(1, Number(limit) || 10)),
            status
        );
    }

    @ApiOperation({ summary: 'Submit an application for review and risk assessment' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 201, description: 'Application submitted successfully' })
    @ApiResponse({ status: 400, description: 'Invalid application state for submission' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    @Roles(AvailableRoles.SALES)
    @Post(':id/submit')
    submitApplication(
        @Param('id', ParseIntPipe) applicationId: number,
        @Req() request: AuthenticatedRequest
    ) {
        return this.appService.submitApplication(
            applicationId,
            request.user.sub,
            request.user.role
        );
    }


    @ApiOperation({ summary: 'Approve an application' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Application approved successfully' })
    @ApiResponse({ status: 400, description: 'Invalid application state for approval' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    @Roles(AvailableRoles.REVIEWER)
    @Patch(':id/approve')
    approveApplication(
        @Param('id', ParseIntPipe) applicationId: number,
        @Req() request: AuthenticatedRequest
    ) {
        return this.appService.approveApplication(
            applicationId,
            request.user.sub,
            request.user.role
        );
    }


    @ApiOperation({ summary: 'Reject an application' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Application rejected successfully' })
    @ApiResponse({ status: 400, description: 'Invalid application state for rejection' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    @Roles(AvailableRoles.REVIEWER)
    @Patch(':id/reject')
    rejectApplication(
        @Param('id', ParseIntPipe) applicationId: number,
        @Req() request: AuthenticatedRequest
    ) {
        return this.appService.rejectApplication(
            applicationId,
            request.user.sub,
            request.user.role
        );
    }


    @ApiOperation({ summary: 'Request additional information for an application' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Additional information requested successfully' })
    @ApiResponse({ status: 400, description: 'Invalid application state' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    @Roles(AvailableRoles.REVIEWER)
    @Patch(':id/request-info')
    requestInformation(
        @Param('id', ParseIntPipe) applicationId: number,
        @Req() request: AuthenticatedRequest
    ) {
        return this.appService.requestInformation(
            applicationId,
            request.user.sub,
            request.user.role
        );
    }
}
