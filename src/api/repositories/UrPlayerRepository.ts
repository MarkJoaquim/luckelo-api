import { EntityRepository, Repository } from 'typeorm';

import { UrPlayer } from '../models/UrPlayer';

@EntityRepository(UrPlayer)
export class UrPlayerRepository extends Repository<UrPlayer>  {

}
