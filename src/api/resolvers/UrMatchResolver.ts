import { Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { UrMatchService } from '../services/UrMatchService';
import { UrMatch } from '../types/UrMatch';

@Service()
@Resolver(of => UrMatch)
export class UrMatchResolver {

    constructor(
        private urMatchService: UrMatchService
        ) {}

    @Query(returns => [UrMatch])
    public Match(): Promise<any> {
      return this.urMatchService.find();
    }

}
