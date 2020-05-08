import { Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { Room } from '../types/Room';
import { MatchService } from '../services/MatchService';

@Service()
@Resolver(of => Room)
export class RoomResolver {

    constructor(
        private matchService: MatchService
        ) {}

    @Query(returns => [Room])
    public room(): Promise<any> {
      return this.matchService.findRooms();
    }

}
