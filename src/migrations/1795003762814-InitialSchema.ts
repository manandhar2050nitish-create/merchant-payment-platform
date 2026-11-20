import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1795003762814 implements MigrationInterface {
    name = 'InitialSchema1795003762814'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permissions" ("id" SERIAL NOT NULL, "permission" character varying NOT NULL, "role_id" integer NOT NULL, CONSTRAINT "UQ_e4b78f5f09391c81a61174517e3" UNIQUE ("role_id", "permission"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "role" character varying NOT NULL, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."audit_log_log_status_enum" AS ENUM('CREATED', 'ACCEPTED', 'REJECTED', 'ASSIGNED', 'REQUESTED_INFO')`);
        await queryRunner.query(`CREATE TABLE "audit_log" ("id" SERIAL NOT NULL, "description" character varying NOT NULL, "log_status" "public"."audit_log_log_status_enum" NOT NULL, "added_at" TIMESTAMP NOT NULL DEFAULT now(), "application_id" integer NOT NULL, "user_id" integer, CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, "role_id" integer NOT NULL, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."risk_assessment_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "risk_assessment" ("id" SERIAL NOT NULL, "status" "public"."risk_assessment_status_enum" NOT NULL DEFAULT 'PENDING', "description" character varying NOT NULL, "retry_count" integer NOT NULL DEFAULT '0', "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "application_id" integer NOT NULL, CONSTRAINT "REL_ab23b20462d5c7011eee92af9b" UNIQUE ("application_id"), CONSTRAINT "PK_864a35a16fcb683df546ac6134e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."applications_status_enum" AS ENUM('NOT_REVIEWED', 'REVIEW_IN_PROGRESS', 'INFO_REQUIRED', 'ACCEPTED', 'REJECTED')`);
        await queryRunner.query(`CREATE TYPE "public"."applications_risk_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "applications" ("id" SERIAL NOT NULL, "business_name" character varying NOT NULL, "legal_business_name" character varying NOT NULL, "business_type" character varying NOT NULL, "contact_information" character varying NOT NULL, "requested_processing_information" character varying NOT NULL, "status" "public"."applications_status_enum" NOT NULL DEFAULT 'NOT_REVIEWED', "risk_status" "public"."applications_risk_status_enum" NOT NULL DEFAULT 'PENDING', "created_date" TIMESTAMP NOT NULL DEFAULT now(), "updated_date" TIMESTAMP NOT NULL DEFAULT now(), "reviewer_id" integer, "created_by" integer NOT NULL, CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "FK_f10931e7bb05a3b434642ed2797" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_log" ADD CONSTRAINT "FK_b3827e5aab8242badf2b8884574" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_log" ADD CONSTRAINT "FK_cb11bd5b662431ea0ac455a27d7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "risk_assessment" ADD CONSTRAINT "FK_ab23b20462d5c7011eee92af9b9" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_ebc223cacf1285eb1e0acfdd5ab" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_049ad019832264e195e99e5bd4f" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_049ad019832264e195e99e5bd4f"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_ebc223cacf1285eb1e0acfdd5ab"`);
        await queryRunner.query(`ALTER TABLE "risk_assessment" DROP CONSTRAINT "FK_ab23b20462d5c7011eee92af9b9"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
        await queryRunner.query(`ALTER TABLE "audit_log" DROP CONSTRAINT "FK_cb11bd5b662431ea0ac455a27d7"`);
        await queryRunner.query(`ALTER TABLE "audit_log" DROP CONSTRAINT "FK_b3827e5aab8242badf2b8884574"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "FK_f10931e7bb05a3b434642ed2797"`);
        await queryRunner.query(`DROP TABLE "applications"`);
        await queryRunner.query(`DROP TYPE "public"."applications_risk_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."applications_status_enum"`);
        await queryRunner.query(`DROP TABLE "risk_assessment"`);
        await queryRunner.query(`DROP TYPE "public"."risk_assessment_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "audit_log"`);
        await queryRunner.query(`DROP TYPE "public"."audit_log_log_status_enum"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }

}
