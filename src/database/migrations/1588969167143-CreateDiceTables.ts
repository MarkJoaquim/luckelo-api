/* tslint:disable max-line-length */
/* tslint:disable quotemark */

import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateDiceTables1588969167143 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "match" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "gameName" character varying NOT NULL, CONSTRAINT "PK_92b6c3a6631dd5b24a67c69f69d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "dice_player" ("matchId" integer NOT NULL, "username" character varying NOT NULL, "initialElo" integer NOT NULL, "roll" integer NULL, "outcome" character varying NULL, "finalElo" integer NULL, "rematchRequested" boolean NULL, CONSTRAINT "PK_ef0e34c08916ad1e9e25b809a9e" PRIMARY KEY ("matchId", "username"))`);
        await queryRunner.query(`CREATE TABLE "room" ("room" character varying NOT NULL, "matchId" integer NOT NULL, CONSTRAINT "REL_b43aac6f570c8847e3a2af29af" UNIQUE ("matchId"), CONSTRAINT "PK_6bf798c01a47a7a47d7bf97f4c3" PRIMARY KEY ("room"))`);
        await queryRunner.query(`ALTER TABLE "match" ADD CONSTRAINT "FK_198e93f90812093282adc5fe71b" FOREIGN KEY ("gameName") REFERENCES "game"("name")`);
        await queryRunner.query(`ALTER TABLE "dice_player" ADD CONSTRAINT "FK_5e3285302fc51bd4fdb8d560276" FOREIGN KEY ("username") REFERENCES "user"("username")`);
        await queryRunner.query(`ALTER TABLE "dice_player" ADD CONSTRAINT "FK_4d22dc07e886652d9dc6e038199" FOREIGN KEY ("matchId") REFERENCES "match"("id")`);
        await queryRunner.query(`ALTER TABLE "room" ADD CONSTRAINT "FK_b43aac6f570c8847e3a2af29aff" FOREIGN KEY ("matchId") REFERENCES "match"("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "room" DROP CONSTRAINT "FK_b43aac6f570c8847e3a2af29aff"`);
        await queryRunner.query(`ALTER TABLE "dice_player" DROP CONSTRAINT "FK_4d22dc07e886652d9dc6e038199"`);
        await queryRunner.query(`ALTER TABLE "dice_player" DROP CONSTRAINT "FK_5e3285302fc51bd4fdb8d560276"`);
        await queryRunner.query(`ALTER TABLE "match" DROP CONSTRAINT "FK_198e93f90812093282adc5fe71b"`);
        await queryRunner.query(`DROP TABLE "room"`);
        await queryRunner.query(`DROP TABLE "dice_player"`);
        await queryRunner.query(`DROP TABLE "match"`);
    }

}
