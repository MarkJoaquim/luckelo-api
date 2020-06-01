import { Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { CharmService } from '../services/CharmService';
import { Charm } from '../types/Charm';

@Service()
@Resolver(of => Charm)
export class CharmResolver {

    constructor(
        private charmService: CharmService
        ) {}

    @Query(returns => [Charm])
    public charms(): Promise<any> {
      return this.charmService.find();
    }

}
