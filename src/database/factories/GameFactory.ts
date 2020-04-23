import * as Faker from 'faker';
import { define } from 'typeorm-seeding';

import { Game } from '../../../src/api/models/Game';

define(Game, (faker: typeof Faker, settings: { }) => {
    const game = new Game();
    game.name = faker.name.firstName(1);
    return game;
});
