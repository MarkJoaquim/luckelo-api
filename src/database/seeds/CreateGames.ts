import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';

import { Game } from '../../../src/api/models/Game';

export class CreateGames implements Seeder {

    public async run(factory: Factory, connection: Connection): Promise<void> {
        await factory(Game)().seed();
    }

}
