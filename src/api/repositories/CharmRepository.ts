import { EntityRepository, Repository } from 'typeorm';

import { Charm } from '../models/Charm';

@EntityRepository(Charm)
export class CharmRepository extends Repository<Charm>  {

}
