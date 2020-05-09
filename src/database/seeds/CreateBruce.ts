import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';

import { User } from '../../../src/api/models/User';
import { Elo } from '../../../src/api/models/Elo';
import { Game } from '../../../src/api/models/Game';

export class CreateBruce implements Seeder {

    public async run(factory: Factory, connection: Connection): Promise<void> {
        const em = connection.createEntityManager();

        const user = new User();
        user.username = 'brucey';
        user.password = '123456';
        await em.save(user);

        const game = new Game();
        game.name = 'Ur';
        await em.save(game);

        const diceGame = new Game();
        diceGame.name = 'Dice';
        await em.save(diceGame);

        const elo = new Elo('brucey', 'Ur');
        elo.elo = 1200;
        user.elos = [elo];
        game.elos = [elo];
        await em.save(elo);
    }

}
