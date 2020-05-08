import * as Faker from 'faker';
import { define } from 'typeorm-seeding';

import { Match } from '../../api/models/Match';

define(Match, (faker: typeof Faker, settings: { game: string }) => {
    const match = new Match();
    match.gameName = settings.game;
    return match;
});
