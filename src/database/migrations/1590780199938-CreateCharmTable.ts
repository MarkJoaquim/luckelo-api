/* tslint:disable max-line-length */
/* tslint:disable quotemark */

import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateCharmTable1590780199938 implements MigrationInterface {
    public name = 'CreateCharmTable1590780199938';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "charm" ("id" SERIAL NOT NULL, "charm" integer array NOT NULL, "palette" character varying array NOT NULL, "name" character varying NULL, CONSTRAINT "PK_8e28cd1179b120facffc67af9de" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "user" ADD "currency" integer NOT NULL DEFAULT 0`, undefined);
        await queryRunner.query(`ALTER TABLE "user" ADD "charmId" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_ea201b214a9802558165f329ebf" UNIQUE ("charmId")`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_ea201b214a9802558165f329ebf"`, undefined);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "charmId"`, undefined);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "currency"`, undefined);
        await queryRunner.query(`DROP TABLE "charm"`, undefined);
    }

}
