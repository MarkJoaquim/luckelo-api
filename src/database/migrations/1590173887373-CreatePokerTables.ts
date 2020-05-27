/* tslint:disable max-line-length */
/* tslint:disable quotemark */

import {MigrationInterface, QueryRunner} from "typeorm";

export class CreatePokerTables1590173887373 implements MigrationInterface {
    public name = 'CreatePokerTables1590173887373';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "poker_player" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "initialElo" integer NOT NULL, "turn" boolean NOT NULL, "hand" integer array NOT NULL, "stack" integer NOT NULL, "bigBlind" boolean NOT NULL, "bet" integer NULL, "outcome" character varying NULL, "finalElo" integer NULL, "rematchRequested" boolean NULL, CONSTRAINT "PK_057079c8296e4e7244748c15c1f" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "poker_match" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "room" character varying NOT NULL, "smallBlind" integer NOT NULL, "bigBlind" integer NOT NULL, "cards" integer array NOT NULL, "minRaise" integer NOT NULL, "boardState" integer array NOT NULL, "pot" integer NOT NULL, "handComplete" boolean NOT NULL, "handsPlayed" integer NOT NULL, "player1Id" integer, "player2Id" integer, CONSTRAINT "REL_4dcd3109bfffb5fb142e6ef39d" UNIQUE ("player1Id"), CONSTRAINT "REL_3e9741b99022b9b94452ec3f47" UNIQUE ("player2Id"), CONSTRAINT "PK_2e20538eb5937322a81d81563d5" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "poker_player" ADD CONSTRAINT "FK_fac3fdc3717c6b99c2d64003eb2" FOREIGN KEY ("username") REFERENCES "user"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "poker_match" ADD CONSTRAINT "FK_4dcd3109bfffb5fb142e6ef39d4" FOREIGN KEY ("player1Id") REFERENCES "poker_player"("id") ON DELETE CASCADE ON UPDATE CASCADE`, undefined);
        await queryRunner.query(`ALTER TABLE "poker_match" ADD CONSTRAINT "FK_3e9741b99022b9b94452ec3f479" FOREIGN KEY ("player2Id") REFERENCES "poker_player"("id") ON DELETE CASCADE ON UPDATE CASCADE`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "poker_match" DROP CONSTRAINT "FK_3e9741b99022b9b94452ec3f479"`, undefined);
        await queryRunner.query(`ALTER TABLE "poker_match" DROP CONSTRAINT "FK_4dcd3109bfffb5fb142e6ef39d4"`, undefined);
        await queryRunner.query(`ALTER TABLE "poker_player" DROP CONSTRAINT "FK_fac3fdc3717c6b99c2d64003eb2"`, undefined);
        await queryRunner.query(`DROP TABLE "poker_match"`, undefined);
        await queryRunner.query(`DROP TABLE "poker_player"`, undefined);
    }

}
