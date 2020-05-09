import { Query, Resolver, FieldResolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { Game as GameModel } from '../models/Game';
import { EloService } from '../services/EloService';
import { GameService } from '../services/GameService';
import { Game } from '../types/Game';
import { Elo } from '../types/Elo';

@Service()
@Resolver(of => Game)
export class GameResolver {

    constructor(
        private gameService: GameService,
        private eloService: EloService
        ) {}

    @Query(returns => [Game])
    public games(): Promise<any> {
      return this.gameService.find();
    }

    @FieldResolver(type => [Elo])
    public async elos(@Root() game: GameModel): Promise<any> {
        return this.eloService.findByGame(game.name);
    }

}
