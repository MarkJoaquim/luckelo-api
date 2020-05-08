import { EntityRepository, Repository } from 'typeorm';

import { DicePlayer } from '../models/DicePlayer';

@EntityRepository(DicePlayer)
export class DicePlayerRepository extends Repository<DicePlayer>  {

}
