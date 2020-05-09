import { Connection } from 'typeorm';
import { Factory, Seeder, times } from 'typeorm-seeding';

import { Elo } from '../../../src/api/models/Elo';
import { User } from '../../../src/api/models/User';
import { Game } from '../../../src/api/models/Game';
// import { Match } from '../../api/models/Match';
// import { DicePlayer } from '../../api/models/DicePlayer';

export class CreateElos implements Seeder {

    public async run(factory: Factory, connection: Connection): Promise<void> {
        const game = await factory(Game)().seed();
        const users: User[] = [];
        await times(10, async (n) => {
            const user = await factory(User)().seed();
            users.push(user);
            await factory(Elo)({username: user.username, game: game.name}).seed();
        });
    }

}
