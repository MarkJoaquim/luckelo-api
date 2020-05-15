import { Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { DiceMatchService } from '../services/DiceMatchService';
import { DiceMatch } from '../types/DiceMatch';

@Service()
@Resolver(of => DiceMatch)
export class DiceMatchResolver {

    constructor(
        private diceMatchService: DiceMatchService
        ) {}

    @Query(returns => [DiceMatch])
    public Match(): Promise<any> {
      return this.diceMatchService.find();
    }

}
