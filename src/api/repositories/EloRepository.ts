import { EntityRepository, Repository } from 'typeorm';

import { Elo } from '../models/Elo';

@EntityRepository(Elo)
export class EloRepository extends Repository<Elo>  {

}
