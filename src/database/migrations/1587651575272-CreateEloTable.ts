import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateEloTable1587651575272 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        const table = new Table({
            name: 'elo',
            columns: [
                {
                    name: 'username',
                    type: 'varchar',
                    length: '255',
                    isPrimary: true,
                    isNullable: false,
                }, {
                    name: 'game',
                    type: 'varchar',
                    length: '255',
                    isPrimary: true,
                    isNullable: false,
                }, {
                    name: 'elo',
                    type: 'int',
                    isPrimary: false,
                    isNullable: false,
                },
            ],
        });
        await queryRunner.createTable(table);

        const foreignKeyUser = new TableForeignKey({
            columnNames: ['username'],
            referencedColumnNames: ['username'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
        });
        await queryRunner.createForeignKey('elo', foreignKeyUser);

        const foreignKeyGame = new TableForeignKey({
            columnNames: ['game'],
            referencedColumnNames: ['name'],
            referencedTableName: 'game',
            onDelete: 'CASCADE',
        });
        await queryRunner.createForeignKey('elo', foreignKeyGame);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable('elo');
    }

}
