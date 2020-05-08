import { Connection } from 'typeorm';
import { Factory, Seed, times } from 'typeorm-seeding';

import { Elo } from '../../../src/api/models/Elo';
import { User } from '../../../src/api/models/User';
import { Game } from '../../../src/api/models/Game';
// import { Match } from '../../api/models/Match';
// import { DicePlayer } from '../../api/models/DicePlayer';

export class CreateElos implements Seed {

    public async seed(factory: Factory, connection: Connection): Promise<any> {
        const game = await factory(Game)().seed();
        const users: User[] = [];
        await times(10, async (n) => {
            const user = await factory(User)().seed();
            users.push(user);
            return await factory(Elo)({username: user.username, game: game.name}).seed();
        });
    }

}
