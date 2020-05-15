/* tslint:disable max-line-length */
/* tslint:disable quotemark */

import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateUrTables1589484705526 implements MigrationInterface {
    public name = 'CreateUrTables1589484705526';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ur_player" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "initialElo" integer NOT NULL, "turn" boolean NOT NULL, "piecesAtStart" integer NOT NULL, "piecesHome" integer NOT NULL, "roll" integer NULL, "outcome" character varying NULL, "finalElo" integer NULL, "rematchRequested" boolean NULL, CONSTRAINT "PK_2e99e7ef1932b5daa22a9862ca0" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "ur_match" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "room" character varying NOT NULL, "gameName" character varying NOT NULL, "boardState" character varying NOT NULL, "player1Id" integer, "player2Id" integer, CONSTRAINT "REL_b068a9d6944428d9ba30acb8f7" UNIQUE ("player1Id"), CONSTRAINT "REL_22b37730ca3c0854b5b30a01c4" UNIQUE ("player2Id"), CONSTRAINT "PK_f59bc95981c9321d77320f6d67e" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "ur_player" ADD CONSTRAINT "FK_626344e081529cf69b6dba04400" FOREIGN KEY ("username") REFERENCES "user"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "ur_match" ADD CONSTRAINT "FK_738bfd4807432fb8006e543cba5" FOREIGN KEY ("gameName") REFERENCES "game"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "ur_match" ADD CONSTRAINT "FK_b068a9d6944428d9ba30acb8f7a" FOREIGN KEY ("player1Id") REFERENCES "ur_player"("id") ON DELETE CASCADE ON UPDATE CASCADE`, undefined);
        await queryRunner.query(`ALTER TABLE "ur_match" ADD CONSTRAINT "FK_22b37730ca3c0854b5b30a01c42" FOREIGN KEY ("player2Id") REFERENCES "ur_player"("id") ON DELETE CASCADE ON UPDATE CASCADE`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ur_match" DROP CONSTRAINT "FK_22b37730ca3c0854b5b30a01c42"`, undefined);
        await queryRunner.query(`ALTER TABLE "ur_match" DROP CONSTRAINT "FK_b068a9d6944428d9ba30acb8f7a"`, undefined);
        await queryRunner.query(`ALTER TABLE "ur_match" DROP CONSTRAINT "FK_738bfd4807432fb8006e543cba5"`, undefined);
        await queryRunner.query(`ALTER TABLE "ur_player" DROP CONSTRAINT "FK_626344e081529cf69b6dba04400"`, undefined);
        await queryRunner.query(`DROP TABLE "ur_match"`, undefined);
        await queryRunner.query(`DROP TABLE "ur_player"`, undefined);
    }

}
