# Merchant Payment Platform

A backend application for merchant onboarding and payment processing applications. It supports application submission, role-based review workflows, reviewer assignment, asynchronous KYB risk assessment, and audit logging.

## Technology Stack

- **Backend:** NestJS, TypeScript, Node.js
- **Database:** PostgreSQL, TypeORM
- **Queue:** BullMQ
- **Cache / Queue Storage:** Redis
- **Authentication:** JWT, Passport
- **Authorization:** Role-based access control (RBAC)
- **API Documentation:** Swagger / OpenAPI
- **Testing:** Jest, Supertest
- **Infrastructure:** Docker Compose

## Features

### Authentication and Authorization
- JWT-based authentication.
- Role-based access for ADMIN, REVIEWER, and SALES.
- Object-level authorization to restrict access to applications.
- SALES users can access only their own applications.
- REVIEWER users can access only applications assigned to them.
- ADMIN users have unrestricted application access.

### Application Management
- Create, retrieve, update, and list applications.
- Pagination and application status filtering.
- Assign reviewers to applications.
- Restrict editing of accepted and rejected applications.

### Application Review Workflow

Applications follow this lifecycle:

1. SALES creates an application.
2. SALES submits the application for review.
3. An ADMIN assigns a reviewer.
4. The assigned REVIEWER can approve, reject, or request additional information.
5. SALES can update and resubmit applications when additional information is requested.

### Asynchronous Risk Assessment
- BullMQ processes KYB risk assessment jobs asynchronously.
- Simulated KYB verification.
- Automatic retries with exponential backoff.
- Risk assessment status and retry count persisted in PostgreSQL.
- Idempotency protection for completed assessments.

### Audit Logging
Audit events are recorded for:
- Application creation.
- Application submission.
- Reviewer assignment.
- Approval.
- Rejection.
- Additional information requests.

## Architecture

The application is organized into NestJS modules:

| Module | Responsibility |
|---|---|
| Auth | Authentication and JWT generation |
| Users | User management and user entities |
| Applications | Application management and lifecycle |
| Risk Assessment | Asynchronous KYB processing |
| Audit | Application activity logging |
| Roles / Permissions | Role and permission management |

PostgreSQL is the primary data store. Redis is used by BullMQ for asynchronous job processing.

## Prerequisites

- Node.js and npm
- Docker Desktop
- PostgreSQL (provided through Docker Compose)
- Redis (provided through Docker Compose)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/manandhar2050nitish-create/merchant-payment-platform
cd merchant-payment-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file using `.env.example` as a reference.

Configure the PostgreSQL connection, Redis connection, JWT secret, and application port.

Do not commit `.env` or production credentials to version control.

### 4. Start PostgreSQL and Redis

```bash
docker compose up -d
```

### 5. Run database migrations

The project uses TypeORM migrations to create and update the database schema. Automatic schema synchronization is disabled.

After configuring the database connection in .env and starting PostgreSQL, run:

npm run migration:run

This applies all pending migrations and creates the required database tables.

To generate a new migration after making entity changes:

npm run migration:generate -- src/migrations/MigrationName

To roll back the most recently applied migration:

npm run migration:revert

Note: Migrations must be applied before starting the application for the first time.

Ensure the required role, permission, and test-user seed data is available before using the application.

# Initial Data Seeding

The seed-tables.sql file contains the initial data for roles, permissions, and users.

Execute this SQL script against the application database after running the migrations.

The user password hashes are intentionally left empty. Before using the seeded users, generate bcrypt password hashes with a salt round of 10 and update the corresponding password fields in the users table.

Do not store plaintext passwords in the database.

### 6. Start the application

```bash
npm run start:dev
```

The API runs on the configured application port (3000 by default).

## API Documentation

Swagger documentation is available at:

```text
http://localhost:3000/api/docs
```

Authenticate using the `/auth/login` endpoint and use the returned JWT through Swagger's **Authorize** option to access protected endpoints.

## Testing

The project includes end-to-end tests using Jest and Supertest.

Tests run against a separate PostgreSQL test database to avoid affecting development data.

Before running the tests:

Configure the .env.test file with the test database and Redis connection details.

Ensure the test database is running.

Apply the database migrations:

npm run migration:run:test

Execute the E2E test suite:

npm run test:e2e

The test database must contain the required roles, permissions, and test users. The seed-tables.sql script can be used to populate the initial data.

Important: Ensure .env.test points to the test database, not the development database, before running the tests.

## Design Decisions and Trade-offs

- **PostgreSQL as the source of truth:** Application and risk assessment data are persisted in a relational database.
- **Asynchronous KYB processing:** BullMQ keeps risk assessment processing separate from the application submission request.
- **Role and object-level authorization:** Access is restricted both by role and by application ownership or reviewer assignment.
- **Audit logging:** Important application lifecycle actions are recorded for traceability.
- **Simulated KYB verification:** External KYB provider integration is outside the scope of this implementation.
- **No transactional outbox:** Database updates and queue publishing are not implemented through an outbox pattern in this MVP.

## Scope

This implementation focuses on merchant onboarding, application review, authorization, asynchronous risk assessment, and auditability. External KYB integration and production-scale deployment concerns are outside the scope of this take-home project.