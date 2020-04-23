import * as Faker from 'faker';
import { define } from 'typeorm-seeding';

import { Elo } from '../../../src/api/models/Elo';

define(Elo, (faker: typeof Faker, settings: { username: string, game: string }) => {
    const rating = 900 + faker.random.number(200);

    const elo = new Elo();
    elo.username = settings.username;
    elo.game = settings.game;
    elo.elo = rating;
    return elo;
});
