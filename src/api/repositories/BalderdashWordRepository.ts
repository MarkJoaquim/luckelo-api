import { EntityRepository, Repository } from 'typeorm';

import { BalderdashWord } from '../models/BalderdashWord';

@EntityRepository(BalderdashWord)
export class BalderdashWordRepository extends Repository<BalderdashWord>  {

    public async getRandom(): Promise<BalderdashWord> {
        return await this.createQueryBuilder('word')
            .orderBy('RANDOM()')
            .limit(1)
            .getOne();
    }
}
