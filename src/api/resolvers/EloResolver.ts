import { Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { EloService } from '../services/EloService';
import { Elo } from '../types/Elo';

@Service()
@Resolver(of => Elo)
export class EloResolver {

    constructor(
        private eloService: EloService
        ) {}

    @Query(returns => [Elo])
    public elos(): Promise<any> {
      return this.eloService.find();
    }

}
