import { EntityRepository, Repository } from 'typeorm';

import { PokerMatch } from '../models/PokerMatch';

@EntityRepository(PokerMatch)
export class PokerMatchRepository extends Repository<PokerMatch>  {

}
