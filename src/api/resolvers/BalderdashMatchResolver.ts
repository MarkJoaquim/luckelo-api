import { Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { BalderdashMatchService } from '../services/BalderdashMatchService';
import { BalderdashMatch } from '../types/BalderdashMatch';

@Service()
@Resolver(of => BalderdashMatch)
export class BalderdashMatchResolver {

    constructor(
        private balderdashMatchService: BalderdashMatchService
        ) {}

    @Query(returns => [BalderdashMatch])
    public Match(): Promise<any> {
      return this.balderdashMatchService.find();
    }

}
