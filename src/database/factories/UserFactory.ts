import * as Faker from 'faker';
import { define } from 'typeorm-seeding';

import { User } from '../../../src/api/models/User';

define(User, (faker: typeof Faker, settings: {}) => {
    const gender = faker.random.number(1);
    const firstName = faker.name.firstName(gender);
    const lastName = faker.name.lastName(gender);
    const username = faker.internet.userName(firstName, lastName);

    const user = new User();
    user.username = username;
    user.password = '123456';
    return user;
});
