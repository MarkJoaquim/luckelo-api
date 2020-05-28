import { EntityRepository, Repository } from 'typeorm';

import { BalderdashMatch } from '../models/BalderdashMatch';

@EntityRepository(BalderdashMatch)
export class BalderdashMatchRepository extends Repository<BalderdashMatch>  {

}
