import * as Faker from 'faker';
import { define } from 'typeorm-seeding';

import { DiceMatch } from '../../api/models/DiceMatch';

define(DiceMatch, (faker: typeof Faker, settings: { game: string }) => {
    const match = new DiceMatch();
    match.gameName = settings.game;
    match.room = faker.name.firstName();
    return match;
});
