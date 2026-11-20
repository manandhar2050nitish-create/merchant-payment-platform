import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubmittedAuditStatus1795110881523 implements MigrationInterface {
    name = 'AddSubmittedAuditStatus1795110881523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."audit_log_log_status_enum" ADD VALUE 'SUBMITTED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."audit_log_log_status_enum_old" AS ENUM('CREATED', 'ACCEPTED', 'REJECTED', 'ASSIGNED', 'REQUESTED_INFO')`);
        await queryRunner.query(`ALTER TABLE "audit_log" ALTER COLUMN "log_status" TYPE "public"."audit_log_log_status_enum_old" USING "log_status"::"text"::"public"."audit_log_log_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."audit_log_log_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."audit_log_log_status_enum_old" RENAME TO "audit_log_log_status_enum"`);
    }

}
