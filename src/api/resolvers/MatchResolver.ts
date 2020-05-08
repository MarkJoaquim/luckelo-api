import { Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { MatchService } from '../services/MatchService';
import { Match } from '../types/Match';

@Service()
@Resolver(of => Match)
export class MatchResolver {

    constructor(
        private matchService: MatchService
        ) {}

    @Query(returns => [Match])
    public Match(): Promise<any> {
      return this.matchService.find();
    }

}
