import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';

import { User } from '../../../src/api/models/User';

export class CreateUsers implements Seeder {

    public async run(factory: Factory, connection: Connection): Promise<void> {
        await factory(User)().seedMany(10);
    }

}
