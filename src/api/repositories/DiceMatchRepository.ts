import { EntityRepository, Repository } from 'typeorm';

import { DiceMatch } from '../models/DiceMatch';

@EntityRepository(DiceMatch)
export class DiceMatchRepository extends Repository<DiceMatch>  {

}
