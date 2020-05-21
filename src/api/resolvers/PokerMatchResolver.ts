import { Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { PokerMatchService } from '../services/PokerMatchService';
import { PokerMatch } from '../types/PokerMatch';

@Service()
@Resolver(of => PokerMatch)
export class PokerMatchResolver {

    constructor(
        private pokerMatchService: PokerMatchService
        ) {}

    @Query(returns => [PokerMatch])
    public Match(): Promise<any> {
      return this.pokerMatchService.find();
    }

}
