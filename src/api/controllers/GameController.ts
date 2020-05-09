import { IsNotEmpty } from 'class-validator';
import { JsonController, Authorized, Get, Param } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { GameService } from '../services/GameService';
import { EloService } from '../services/EloService';
import { MatchService } from '../services/MatchService';
import { Game } from '../models/Game';
import { User } from '../models/User';
import { Elo } from '../models/Elo';
import { Match } from '../models/Match';

class BaseGame {
    @IsNotEmpty()
    public name: string;
}

class UserGame extends BaseGame {
    public elo: number;
}

@Authorized()
@JsonController('/game')
@OpenAPI({})
export class GameController {

    constructor(
        private gameService: GameService,
        private eloService: EloService,
        private matchService: MatchService
    ) { }

    // Make this faster by starting with Elos...
    @Get('/:username')
    @ResponseSchema(UserGame, { isArray: true })
    public async gamesForUser(@Param('username') username: string): Promise<UserGame[]> {
        const games: Game[] = await this.gameService.find();
        const user = new User();
        user.username = username;

        const userGames: UserGame[] = [];
        for (const game of games) {
            const userGame = new UserGame();
            const userElo = game.elos.find(elo => elo.username === username);

            userGame.name = game.name;
            userGame.elo = userElo ? userElo.elo : undefined;

            userGames.push(userGame);
        }

        return userGames;
    }

    @Get('/:game/leaderboard')
    @ResponseSchema(Elo, { isArray: true})
    public async leaderboardForGame(@Param('game') game: string): Promise<Elo[]> {
        return await this.eloService.findByGame(game);
    }

    @Get('/:game/match-history/:user')
    @ResponseSchema(Match, { isArray: true})
    public async diceMatchHistory(@Param('game') game: string, @Param('user') username: string): Promise<Match[]> {
        return await this.matchService.matchHistory(game, username);
    }

    @Get('/dice/match-history/:user/:opponent')
    @ResponseSchema(Match, { isArray: true})
    public async diceMatchHistoryWithOpponent(
        @Param('user') user: string,
        @Param('opponent') opponent: string): Promise<Match[]> {
        return await this.matchService.matchHistoryBetween('dice', user, opponent);
    }

    @Get('/dice/active')
    @ResponseSchema(Match, { isArray: true})
    public async diceActiveMatches(): Promise<Match[]> {
        return await this.matchService.findActive();
    }
}
