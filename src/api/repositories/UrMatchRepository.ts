import { EntityRepository, Repository } from 'typeorm';

import { UrMatch } from '../models/UrMatch';

@EntityRepository(UrMatch)
export class UrMatchRepository extends Repository<UrMatch>  {

}
