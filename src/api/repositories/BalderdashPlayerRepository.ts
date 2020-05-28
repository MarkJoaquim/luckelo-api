import { EntityRepository, Repository } from 'typeorm';

import { BalderdashPlayer } from '../models/BalderdashPlayer';

@EntityRepository(BalderdashPlayer)
export class BalderdashPlayerRepository extends Repository<BalderdashPlayer>  {

}
