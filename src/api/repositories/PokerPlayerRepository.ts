import { EntityRepository, Repository } from 'typeorm';

import { PokerPlayer } from '../models/PokerPlayer';

@EntityRepository(PokerPlayer)
export class PokerPlayerRepository extends Repository<PokerPlayer>  {

}
