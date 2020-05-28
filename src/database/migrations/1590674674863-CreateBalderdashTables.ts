/* tslint:disable max-line-length */
/* tslint:disable quotemark */

import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateBalderdashTables1590674674863 implements MigrationInterface {
    public name = 'CreateBalderdashTables1590674674863';

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`CREATE TYPE "balderdash_match_state_enum" AS ENUM('0', '1', '2', '3')`, undefined);
        await queryRunner.query(`CREATE TABLE "balderdash_player" ("id" SERIAL NOT NULL, "matchId" integer NULL, "username" character varying NOT NULL, "initialElo" integer NOT NULL, "definition" character varying NULL, "voted" boolean NULL, "votedFor" integer NULL, "outcome" character varying NULL, "finalElo" integer NULL, "rematchRequested" boolean NULL, CONSTRAINT "PK_9492fd580167c4ce4fb5185253b" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "balderdash_word" ("id" SERIAL NOT NULL, "word" character varying NOT NULL, "definition" character varying NOT NULL, CONSTRAINT "PK_f07ab81aaee3547d368547cb758" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "balderdash_match" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "room" character varying NOT NULL, "state" "balderdash_match_state_enum" NOT NULL DEFAULT '0', "wordId" integer, CONSTRAINT "PK_6f6436ee787d54b7013dd159ddd" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "balderdash_player" ADD CONSTRAINT "FK_94ef853172ce8d22d354ae07faa" FOREIGN KEY ("username") REFERENCES "user"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "balderdash_player" ADD CONSTRAINT "FK_dd726f88a73fe56116bb7e45a86" FOREIGN KEY ("matchId") REFERENCES "balderdash_match"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "balderdash_player" ADD CONSTRAINT "FK_e0d44c4ad1e58ab299c978035be" FOREIGN KEY ("votedFor") REFERENCES "balderdash_player"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "balderdash_match" ADD CONSTRAINT "FK_088ef22da183399de321dd1a5c4" FOREIGN KEY ("wordId") REFERENCES "balderdash_word"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balderdash_player" DROP CONSTRAINT "FK_e0d44c4ad1e58ab299c978035be"`, undefined);
        await queryRunner.query(`ALTER TABLE "balderdash_player" DROP CONSTRAINT "FK_dd726f88a73fe56116bb7e45a86"`, undefined);
        await queryRunner.query(`ALTER TABLE "balderdash_player" DROP CONSTRAINT "FK_94ef853172ce8d22d354ae07faa"`, undefined);
        await queryRunner.query(`DROP TABLE "balderdash_match"`, undefined);
        await queryRunner.query(`DROP TABLE "balderdash_word"`, undefined);
        await queryRunner.query(`DROP TABLE "balderdash_player"`, undefined);
        await queryRunner.query(`DROP TYPE "balderdash_match_state_enum"`, undefined);
    }

}
