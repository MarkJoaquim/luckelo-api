/* tslint:disable max-line-length */
/* tslint:disable quotemark */

import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateDiceTables1589382734478 implements MigrationInterface {
    public name = 'CreateDiceTables1589382734478';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "dice_player" ("matchId" integer NOT NULL, "username" character varying NOT NULL, "initialElo" integer NOT NULL, "roll" integer NULL, "outcome" character varying NULL, "finalElo" integer NULL, "rematchRequested" boolean NULL, CONSTRAINT "PK_ef0e34c08916ad1e9e25b809a9e" PRIMARY KEY ("matchId", "username"))`, undefined);
        await queryRunner.query(`CREATE TABLE "dice_match" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "room" character varying NOT NULL, "gameName" character varying NOT NULL, CONSTRAINT "PK_0ab698ee9d7308e5e570a8183c4" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "dice_player" ADD CONSTRAINT "FK_5e3285302fc51bd4fdb8d560276" FOREIGN KEY ("username") REFERENCES "user"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "dice_player" ADD CONSTRAINT "FK_4d22dc07e886652d9dc6e038199" FOREIGN KEY ("matchId") REFERENCES "dice_match"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "dice_match" ADD CONSTRAINT "FK_517ff218343dd15894ed73f0909" FOREIGN KEY ("gameName") REFERENCES "game"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dice_match" DROP CONSTRAINT "FK_517ff218343dd15894ed73f0909"`, undefined);
        await queryRunner.query(`ALTER TABLE "dice_player" DROP CONSTRAINT "FK_4d22dc07e886652d9dc6e038199"`, undefined);
        await queryRunner.query(`ALTER TABLE "dice_player" DROP CONSTRAINT "FK_5e3285302fc51bd4fdb8d560276"`, undefined);
        await queryRunner.query(`DROP TABLE "dice_match"`, undefined);
        await queryRunner.query(`DROP TABLE "dice_player"`, undefined);
    }

}
