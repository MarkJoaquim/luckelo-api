import {MigrationInterface, QueryRunner} from 'typeorm';

/* tslint:disable max-line-length */
export class CreateRoomMatchPlayerTables1588860487305 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('CREATE TABLE `match` (`id` int NOT NULL AUTO_INCREMENT, `created` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `gameName` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB');
        await queryRunner.query('CREATE TABLE `dice_player` (`matchId` int NOT NULL, `username` varchar(255) NOT NULL, `initialElo` int NOT NULL, `roll` int NULL, `outcome` varchar(255) NULL, `finalElo` int NULL, `rematchRequested` tinyint NULL, PRIMARY KEY (`matchId`, `username`)) ENGINE=InnoDB');
        await queryRunner.query('CREATE TABLE `room` (`room` varchar(255) NOT NULL, `matchId` int NOT NULL, UNIQUE INDEX `REL_b43aac6f570c8847e3a2af29af` (`matchId`), PRIMARY KEY (`room`)) ENGINE=InnoDB');
        await queryRunner.query('ALTER TABLE `match` ADD CONSTRAINT `FK_198e93f90812093282adc5fe71b` FOREIGN KEY (`gameName`) REFERENCES `game`(`name`)');
        await queryRunner.query('ALTER TABLE `dice_player` ADD CONSTRAINT `FK_5e3285302fc51bd4fdb8d560276` FOREIGN KEY (`username`) REFERENCES `user`(`username`)');
        await queryRunner.query('ALTER TABLE `dice_player` ADD CONSTRAINT `FK_4d22dc07e886652d9dc6e038199` FOREIGN KEY (`matchId`) REFERENCES `match`(`id`)');
        await queryRunner.query('ALTER TABLE `room` ADD CONSTRAINT `FK_b43aac6f570c8847e3a2af29aff` FOREIGN KEY (`matchId`) REFERENCES `match`(`id`)');
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `room` DROP FOREIGN KEY `FK_b43aac6f570c8847e3a2af29aff`');
        await queryRunner.query('ALTER TABLE `dice_player` DROP FOREIGN KEY `FK_4d22dc07e886652d9dc6e038199`');
        await queryRunner.query('ALTER TABLE `dice_player` DROP FOREIGN KEY `FK_5e3285302fc51bd4fdb8d560276`');
        await queryRunner.query('ALTER TABLE `match` DROP FOREIGN KEY `FK_198e93f90812093282adc5fe71b`');
        await queryRunner.query('DROP INDEX `REL_b43aac6f570c8847e3a2af29af` ON `room`');
        await queryRunner.query('DROP TABLE `room`');
        await queryRunner.query('DROP TABLE `dice_player`');
        await queryRunner.query('DROP TABLE `match`');
    }

}
