import { Connection } from 'typeorm';
import { Factory, Seed, times } from 'typeorm-seeding';

import { Elo } from '../../../src/api/models/Elo';
import { User } from '../../../src/api/models/User';
import { Game } from '../../../src/api/models/Game';

export class CreateElos implements Seed {

    public async seed(factory: Factory, connection: Connection): Promise<any> {
        const game = await factory(Game)().seed();

        await times(10, async (n) => {
            const user = await factory(User)().seed();
            return await factory(Elo)({username: user.username, game: game.name}).seed();
        });
    }

}
