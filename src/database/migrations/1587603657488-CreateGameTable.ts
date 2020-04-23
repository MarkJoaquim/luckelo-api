import {MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateGameTable1587603657488 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        const table = new Table({
            name: 'game',
            columns: [
                {
                    name: 'name',
                    type: 'varchar',
                    length: '255',
                    isPrimary: true,
                    isNullable: false,
                },
            ],
        });
        await queryRunner.createTable(table);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable('game');
    }

}
