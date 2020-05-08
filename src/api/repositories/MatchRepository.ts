import { EntityRepository, Repository } from 'typeorm';

import { Match } from '../models/Match';

@EntityRepository(Match)
export class MatchRepository extends Repository<Match>  {

}
