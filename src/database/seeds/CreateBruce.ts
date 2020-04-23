import { Connection } from 'typeorm';
import { Factory, Seed } from 'typeorm-seeding';

import { User } from '../../../src/api/models/User';
import { Elo } from '../../../src/api/models/Elo';
import { Game } from '../../../src/api/models/Game';

export class CreateBruce implements Seed {

    public async seed(factory: Factory, connection: Connection): Promise<User> {
        const em = connection.createEntityManager();

        const user = new User();
        user.username = 'bruce';
        user.password = '1234';
        await em.save(user);

        const game = new Game();
        game.name = 'Er';
        await em.save(game);

        const elo = new Elo();
        elo.username = 'bruce';
        elo.game = 'Er';
        elo.elo = 1200;
        user.elos = [elo];
        game.elos = [elo];
        await em.save(elo);
        return user;
    }

}
